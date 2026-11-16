import { beforeEach, describe, expect, test, vi } from "vitest";
import { clearWithdrawDraft, readWithdrawDraft, saveWithdrawDraft } from "../lib/draft";

const store = new Map<string, string>();
const draft = {
  addressId: "a",
  assetKey: "k",
  amount: "5.00",
  attempt: "x",
  method: { method: "telegram_code" as const, expires_in: 300, challenge_id: "c1" },
};

beforeEach(() => {
  store.clear();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
});

describe("the withdrawal draft", () => {
  test("survives for ten minutes", () => {
    saveWithdrawDraft(draft, 1_000);
    expect(readWithdrawDraft(1_000 + 9 * 60_000)?.method.challenge_id).toBe("c1");
  });

  test("is dropped once it is older than that", () => {
    saveWithdrawDraft(draft, 1_000);
    expect(readWithdrawDraft(1_000 + 11 * 60_000)).toBeNull();
    expect(store.size).toBe(0);
  });

  test("can be cleared and never throws on bad data", () => {
    saveWithdrawDraft(draft);
    clearWithdrawDraft();
    expect(readWithdrawDraft()).toBeNull();
    store.set("usetenth:withdraw-draft", "not json");
    expect(readWithdrawDraft()).toBeNull();
  });
});
