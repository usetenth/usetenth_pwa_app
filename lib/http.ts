import { API_URL } from "./config";
import { clearSession, getSession, setSession, type Session } from "./session";

/** What people see when the server cannot be reached at all; screens recognise it to show the offline card. */
export const UNREACHABLE_MESSAGE = "We can't reach usetenth right now.";
export const isUnreachable = (message: string | null | undefined) => message === UNREACHABLE_MESSAGE;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface Envelope<T> {
  success: boolean;
  message: string;
  data: T | null;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface Options {
  method?: string;
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
}

async function send(path: string, { method = "GET", body, auth = true, signal }: Options, token?: string): Promise<Response> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (auth && token) headers.authorization = `Bearer ${token}`;
  return fetch(`${API_URL}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal });
}

// One refresh at a time, however many requests hit an expired token together.
let refreshing: Promise<boolean> | null = null;

export function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    const session = getSession();
    if (!session) return false;
    try {
      const res = await send("/auth/refresh", { method: "POST", body: { refresh_token: session.refresh }, auth: false });
      const json = (await res.json().catch(() => null)) as Envelope<TokenPair> | null;
      if (!res.ok || !json?.data) {
        clearSession();
        return false;
      }
      setSession({ access: json.data.access_token, refresh: json.data.refresh_token, via: session.via });
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export async function request<T>(path: string, options: Options = {}): Promise<T> {
  const authed = options.auth !== false;
  const attempt = async () => {
    try {
      return await send(path, options, getSession()?.access);
    } catch (error) {
      if ((error as Error).name === "AbortError") throw error;
      throw new ApiError(UNREACHABLE_MESSAGE, 0);
    }
  };
  let res = await attempt();
  if (res.status === 401 && authed && getSession() && (await refreshSession())) {
    res = await attempt();
  }
  const json = (await res.json().catch(() => null)) as Envelope<T> | null;
  // A server error with no JSON body came from the proxy or a gateway, meaning the API itself did not answer.
  if (!res.ok && json === null && res.status >= 500) throw new ApiError(UNREACHABLE_MESSAGE, res.status);
  if (!res.ok) throw new ApiError(json?.message ?? "Something went wrong. Please try again.", res.status);
  return json?.data as T;
}

export const toSession = (tokens: TokenPair, via: Session["via"]): Session => ({
  access: tokens.access_token,
  refresh: tokens.refresh_token,
  via,
});
