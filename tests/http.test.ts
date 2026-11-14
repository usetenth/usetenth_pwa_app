import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ApiError, isUnreachable, request, UNREACHABLE_MESSAGE } from "../lib/http";
import { clearSession, getSession, resetSessionCache, setSession } from "../lib/session";

const store = new Map<string, string>();

type Call = { url: string; method: string; auth: string | null; body: unknown };
let calls: Call[];
let handler: (call: Call) => { status: number; body: unknown };

beforeEach(() => {
  store.clear();
  calls = [];
  resetSessionCache();
  vi.stubGlobal("window", {});
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    const headers = (init.headers ?? {}) as Record<string, string>;
    const call = { url, method: init.method ?? "GET", auth: headers.authorization ?? null, body: init.body ? JSON.parse(init.body as string) : undefined };
    calls.push(call);
    const { status, body } = handler(call);
    return new Response(JSON.stringify(body), { status });
  });
  setSession({ access: "old-access", refresh: "old-refresh", via: "email" });
});

afterEach(() => vi.unstubAllGlobals());

const ok = (data: unknown) => ({ status: 200, body: { success: true, message: "ok", data } });
const tokens = (n: string) => ({ access_token: `access-${n}`, refresh_token: `refresh-${n}`, token_type: "Bearer", expires_in: 900 });

describe("api client", () => {
  test("sends the access token and unwraps the envelope", async () => {
    handler = () => ok({ hello: "world" });
    expect(await request("/v1/thing")).toEqual({ hello: "world" });
    expect(calls[0]).toMatchObject({ url: "/api/v1/thing", auth: "Bearer old-access" });
  });

  test("errors carry the server's message and status", async () => {
    handler = () => ({ status: 409, body: { success: false, message: "Finish setting up your account first", data: null } });
    const error = await request("/v1/portfolio").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ message: "Finish setting up your account first", status: 409 });
  });

  test("an expired token is refreshed once and the request retried with the new one", async () => {
    handler = (c) => {
      if (c.url.endsWith("/auth/refresh")) return ok(tokens("1"));
      return c.auth === "Bearer access-1" ? ok({ done: true }) : { status: 401, body: { success: false, message: "Unauthorized", data: null } };
    };
    expect(await request("/v1/portfolio")).toEqual({ done: true });
    expect(calls.map((c) => c.url)).toEqual(["/api/v1/portfolio", "/api/auth/refresh", "/api/v1/portfolio"]);
    expect(calls[1]!.body).toEqual({ refresh_token: "old-refresh" });
    expect(getSession()).toEqual({ access: "access-1", refresh: "refresh-1", via: "email" });
  });

  test("many requests hitting an expired token share one refresh", async () => {
    handler = (c) => {
      if (c.url.endsWith("/auth/refresh")) return ok(tokens("1"));
      return c.auth === "Bearer access-1" ? ok({}) : { status: 401, body: { success: false, message: "Unauthorized", data: null } };
    };
    await Promise.all([request("/v1/a"), request("/v1/b"), request("/v1/c")]);
    expect(calls.filter((c) => c.url.endsWith("/auth/refresh"))).toHaveLength(1);
  });

  test("a refresh that fails signs the user out and reports the original error", async () => {
    handler = () => ({ status: 401, body: { success: false, message: "Unauthorized", data: null } });
    await expect(request("/v1/portfolio")).rejects.toMatchObject({ status: 401 });
    expect(getSession()).toBeNull();
  });

  test("sign-in calls never try to refresh and send no token", async () => {
    handler = () => ({ status: 401, body: { success: false, message: "Invalid email or password", data: null } });
    await expect(request("/auth/login", { method: "POST", body: { email: "a", password: "b" }, auth: false })).rejects.toMatchObject({ message: "Invalid email or password" });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.auth).toBeNull();
  });

  test("with no session there is nothing to refresh", async () => {
    clearSession();
    handler = () => ({ status: 401, body: { success: false, message: "Unauthorized", data: null } });
    await expect(request("/v1/portfolio")).rejects.toMatchObject({ status: 401 });
    expect(calls).toHaveLength(1);
  });
});

describe("when the server cannot be reached", () => {
  test("a failed connection becomes the friendly offline message", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new TypeError("Failed to fetch");
    });
    const error = await request("/v1/portfolio").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toBe(UNREACHABLE_MESSAGE);
    expect(isUnreachable((error as ApiError).message)).toBe(true);
  });

  test("a bare server error from the proxy is treated the same way", async () => {
    vi.stubGlobal("fetch", async () => new Response("Internal Server Error", { status: 500 }));
    const error = await request("/v1/portfolio").catch((e: unknown) => e);
    expect((error as ApiError).message).toBe(UNREACHABLE_MESSAGE);
  });

  test("a real error from the API keeps its own message", async () => {
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify({ success: false, message: "Internal Server Error", data: null }), { status: 500 }));
    const error = await request("/v1/portfolio").catch((e: unknown) => e);
    expect((error as ApiError).message).toBe("Internal Server Error");
    expect(isUnreachable((error as ApiError).message)).toBe(false);
  });
});
