const KEY = "usetenth:withdraw-draft";
const MAX_AGE_MS = 10 * 60_000;

export interface WithdrawDraft {
  at: number;
  addressId: string;
  assetKey: string;
  amount: string;
  attempt: string;
  method: { method: "password" | "telegram_code"; expires_in: number | null; challenge_id: string | null };
}

/** Kept in local storage, not session storage, because the phone may close the installed app while someone approves in Telegram. */
export function saveWithdrawDraft(draft: Omit<WithdrawDraft, "at">, now = Date.now()) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...draft, at: now }));
  } catch {}
}

export function readWithdrawDraft(now = Date.now()): WithdrawDraft | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as WithdrawDraft;
    if (now - draft.at > MAX_AGE_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

export function clearWithdrawDraft() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
