import type { PlanView, Stock } from "./api";

export const PERCENTS = [5, 10, 20];

export function summarize(stocks: { name: string }[]): string {
  if (stocks.length === 0) return "No stocks yet";
  if (stocks.length <= 2) return stocks.map((s) => s.name).join(" and ");
  return `${stocks[0]!.name}, ${stocks[1]!.name} and ${stocks.length - 2} more`;
}

/** Equal weights in basis points that always add to exactly 10,000, extra points going to the first picks. */
export function equalWeights(count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(10_000 / count);
  const extra = 10_000 - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < extra ? 1 : 0));
}

export const cleanName = (n: string) =>
  n.replace(/\s*[•·]\s*Robinhood Token$/i, "").replace(/\s*\(Coinbase Tokenized Stock\)$/i, "");

export function planStocks(plans: PlanView[], planId: string, custom: Stock[]): Stock[] {
  return planId === "custom" ? custom : (plans.find((p) => p.plan === planId)?.stocks ?? []);
}

export const planName = (plans: PlanView[], planId: string) =>
  planId === "custom" ? "Your picks" : (plans.find((p) => p.plan === planId)?.name ?? "Your mix");
