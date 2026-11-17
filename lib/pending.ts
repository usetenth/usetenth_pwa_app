import type { PendingDeposit, PendingTrade, PendingView } from "./api";
import { fromCents, toCents, usd } from "./money";

export interface PendingLine {
  key: string;
  title: string;
  detail: string;
}

export function depositLine(d: PendingDeposit): PendingLine {
  if (d.stage === "investing") {
    const detail = d.invest_usd ? `${usd(d.invest_usd)} of your ${d.amount_usd ? usd(d.amount_usd) : "latest"} payment` : "Your tenth is being placed";
    return { key: d.id, title: "Investing your tenth", detail };
  }
  const detail = d.amount_usd ? `${usd(d.amount_usd)} ${d.asset} is on its way. Confirming, usually a few minutes.` : "A payment is on its way. Confirming, usually a few minutes.";
  return { key: d.id, title: "Payment arriving", detail };
}

export function saleLine(s: PendingTrade): PendingLine {
  return { key: s.id, title: `Selling ${s.asset ?? "your stock"}`, detail: `About ${usd(s.amount_usd)} is settling. It lands in your balance when done.` };
}

export function buyLine(b: PendingTrade): PendingLine {
  const name = b.asset ?? "your stock";
  return b.done
    ? { key: b.id, title: `Bought ${name}`, detail: "Adding it to your holdings." }
    : { key: b.id, title: `Buying ${name}`, detail: `About ${usd(b.amount_usd)} is settling. It shows in your holdings when done.` };
}

/** Everything still in motion. A finished buy is shown only until the stock appears in the holdings. */
export function pendingLines(p: PendingView | null, held: Set<string> = new Set()): PendingLine[] {
  if (!p) return [];
  return [
    ...p.deposits.map(depositLine),
    ...p.sales.filter((s) => !s.done).map(saleLine),
    ...p.buys.filter((b) => !b.done || !held.has(b.asset_key)).map(buyLine),
  ];
}

/** Stocks with a sale under way ("selling") or just finished but still held while balances catch up ("updating"). */
export function sellState(p: PendingView | null): Map<string, "selling" | "updating"> {
  const state = new Map<string, "selling" | "updating">();
  for (const s of p?.sales ?? []) {
    if (!s.done) state.set(s.asset_key, "selling");
    else if (!state.has(s.asset_key)) state.set(s.asset_key, "updating");
  }
  return state;
}

/** Dollars from sales still settling that have not landed in the balance yet. */
export const proceedsComing = (p: PendingView | null): string =>
  fromCents((p?.sales ?? []).filter((s) => !s.done).reduce((sum, s) => sum + toCents(s.amount_usd), BigInt(0)));
