const HUNDRED = BigInt(100);
const ZERO = BigInt(0);

export function toCents(value: string): bigint {
  const clean = value.replace(/[$,\s]/g, "");
  const negative = clean.startsWith("-");
  const [whole = "0", frac = ""] = (negative ? clean.slice(1) : clean).split(".");
  const cents = BigInt(whole || "0") * HUNDRED + BigInt((frac + "00").slice(0, 2));
  return negative ? -cents : cents;
}

export function fromCents(cents: bigint): string {
  const negative = cents < ZERO;
  const abs = negative ? -cents : cents;
  return `${negative ? "-" : ""}${abs / HUNDRED}.${(abs % HUNDRED).toString().padStart(2, "0")}`;
}

export function usd(value: string): string {
  const cents = toCents(value);
  const abs = cents < ZERO ? -cents : cents;
  const whole = (abs / HUNDRED).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${cents < ZERO ? "-" : ""}$${whole}.${(abs % HUNDRED).toString().padStart(2, "0")}`;
}

export function signedUsd(value: string): string {
  return toCents(value) < ZERO ? usd(value) : `+${usd(value)}`;
}

export const add = (a: string, b: string) => fromCents(toCents(a) + toCents(b));
export const sub = (a: string, b: string) => fromCents(toCents(a) - toCents(b));
export const isNegative = (v: string) => toCents(v) < ZERO;
export const gt = (a: string, b: string) => toCents(a) > toCents(b);

export function percentOf(amount: string, percent: number): string {
  return fromCents((toCents(amount) * BigInt(Math.round(percent * 100))) / BigInt(10000));
}

/** Even split that always re-adds to the total, extra cents going to the first names. */
export function splitEven(amount: string, parts: number): string[] {
  if (parts <= 0) return [];
  const total = toCents(amount);
  const base = total / BigInt(parts);
  const extra = Number(total - base * BigInt(parts));
  return Array.from({ length: parts }, (_, i) => fromCents(base + BigInt(i < extra ? 1 : 0)));
}

/** Like usd(), but keeps sub-cent precision (a $0.002 fee must not read as $0.00). */
export function usdFine(value: string): string {
  const [whole = "0", frac = ""] = value.replace(/[$,\s]/g, "").split(".");
  const trimmed = frac.replace(/0+$/, "");
  const decimals = trimmed.length <= 2 ? (trimmed + "00").slice(0, 2) : trimmed.slice(0, 6);
  return `$${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${decimals}`;
}

/** Splits an amount by basis-point weights; the cents that do not divide evenly go to the first names, so it always re-adds. */
export function splitByBps(amount: string, weights: number[]): string[] {
  const total = toCents(amount);
  const sum = weights.reduce((a, b) => a + b, 0);
  if (weights.length === 0 || sum <= 0) return [];
  const parts = weights.map((w) => (total * BigInt(w)) / BigInt(sum));
  let rest = total - parts.reduce((a, b) => a + b, BigInt(0));
  return parts.map((p) => {
    const extra = rest > BigInt(0) ? BigInt(1) : BigInt(0);
    rest -= extra;
    return fromCents(p + extra);
  });
}

/** True for a plain amount with at most two decimals, e.g. "12" or "12.50". */
export const isAmount = (v: string) => /^\d+(\.\d{1,2})?$/.test(v) && toCents(v) > BigInt(0);
