import type { PendingDeposit, PendingSale, PendingView } from "./api";
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

export function saleLine(s: PendingSale): PendingLine {
  return { key: s.id, title: `Selling ${s.asset ?? "your stock"}`, detail: `About ${usd(s.amount_usd)} is settling. It lands in your balance when done.` };
}

export const pendingLines = (p: PendingView | null): PendingLine[] => (p ? [...p.deposits.map(depositLine), ...p.sales.map(saleLine)] : []);

/** The stocks with a sale still settling, so their Sell button can step aside. */
export const sellingKeys = (p: PendingView | null): Set<string> => new Set((p?.sales ?? []).map((s) => s.asset_key));

/** Dollars from sales that have not landed in the balance yet. */
export const proceedsComing = (p: PendingView | null): string => fromCents((p?.sales ?? []).reduce((sum, s) => sum + toCents(s.amount_usd), BigInt(0)));
