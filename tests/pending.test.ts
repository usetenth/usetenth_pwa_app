import { describe, expect, test } from "vitest";
import type { PendingView } from "../lib/api";
import { depositLine, pendingLines, proceedsComing, saleLine, sellingKeys } from "../lib/pending";

const view: PendingView = {
  deposits: [
    { id: "0xabc", stage: "confirming", asset: "USDC", amount_usd: "5.00", since: "2026-11-17T10:00:00Z" },
    { id: "i1", stage: "investing", asset: "USDC", amount_usd: "20.00", invest_usd: "4.00", since: "2026-11-17T10:01:00Z" },
  ],
  sales: [
    { id: "o1", asset_key: "nvda", asset: "NVDAC", qty: "0.5", amount_usd: "9.10", since: "2026-11-17T10:02:00Z" },
    { id: "o2", asset_key: "aapl", asset: null, qty: "1", amount_usd: "0.95", since: "2026-11-17T10:03:00Z" },
  ],
};

describe("pending work", () => {
  test("a payment is shown as arriving, then as being invested, in plain words", () => {
    expect(depositLine(view.deposits[0])).toMatchObject({ title: "Payment arriving" });
    expect(depositLine(view.deposits[0]).detail).toContain("$5.00 USDC");
    expect(depositLine(view.deposits[1])).toMatchObject({ title: "Investing your tenth", detail: "$4.00 of your $20.00 payment" });
  });

  test("an arriving payment with no known amount still says something useful", () => {
    const line = depositLine({ ...view.deposits[0], amount_usd: null });
    expect(line.detail).toContain("on its way");
  });

  test("a sale names the stock and what it is worth, and copes with a missing name", () => {
    expect(saleLine(view.sales[0]).title).toBe("Selling NVDAC");
    expect(saleLine(view.sales[1]).title).toBe("Selling your stock");
  });

  test("nothing pending gives nothing to show", () => {
    expect(pendingLines(null)).toEqual([]);
    expect(pendingLines({ deposits: [], sales: [] })).toEqual([]);
    expect(pendingLines(view)).toHaveLength(4);
  });

  test("stocks being sold and the proceeds on their way are worked out exactly", () => {
    expect([...sellingKeys(view)].sort()).toEqual(["aapl", "nvda"]);
    expect(proceedsComing(view)).toBe("10.05");
    expect(proceedsComing(null)).toBe("0.00");
  });
});
