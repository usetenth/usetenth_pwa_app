import { describe, expect, test } from "vitest";
import type { PendingView } from "../lib/api";
import { buyLine, depositLine, pendingLines, proceedsComing, saleLine, sellState } from "../lib/pending";

const view: PendingView = {
  deposits: [
    { id: "0xabc", stage: "confirming", asset: "USDC", amount_usd: "5.00", since: "2026-11-17T10:00:00Z" },
    { id: "i1", stage: "investing", asset: "USDC", amount_usd: "20.00", invest_usd: "4.00", since: "2026-11-17T10:01:00Z" },
  ],
  sales: [
    { id: "o1", asset_key: "nvda", asset: "NVDAC", qty: "0.5", amount_usd: "9.10", since: "2026-11-17T10:02:00Z", done: false },
    { id: "o2", asset_key: "aapl", asset: null, qty: "1", amount_usd: "0.95", since: "2026-11-17T10:03:00Z", done: true },
  ],
  buys: [
    { id: "b1", asset_key: "tsla", asset: "TSLAC", qty: null, amount_usd: "3.00", since: "2026-11-17T10:04:00Z", done: false },
    { id: "b2", asset_key: "amd", asset: "AMDC", qty: null, amount_usd: "2.00", since: "2026-11-17T10:05:00Z", done: true },
  ],
};

describe("pending work", () => {
  test("a payment is shown as arriving, then as being invested, in plain words", () => {
    expect(depositLine(view.deposits[0])).toMatchObject({ title: "Payment arriving" });
    expect(depositLine(view.deposits[0]).detail).toContain("$5.00 USDC");
    expect(depositLine(view.deposits[1])).toMatchObject({ title: "Investing your tenth", detail: "$4.00 of your $20.00 payment" });
  });

  test("an arriving payment with no known amount still says something useful", () => {
    expect(depositLine({ ...view.deposits[0], amount_usd: null }).detail).toContain("on its way");
  });

  test("a sale and a buy name the stock and what it is worth", () => {
    expect(saleLine(view.sales[0]).title).toBe("Selling NVDAC");
    expect(saleLine({ ...view.sales[1], done: false }).title).toBe("Selling your stock");
    expect(buyLine(view.buys[0])).toMatchObject({ title: "Buying TSLAC" });
    expect(buyLine(view.buys[1])).toMatchObject({ title: "Bought AMDC", detail: "Adding it to your holdings." });
  });

  test("nothing pending gives nothing to show", () => {
    expect(pendingLines(null)).toEqual([]);
    expect(pendingLines({ deposits: [], sales: [], buys: [] })).toEqual([]);
  });

  test("a finished sale has no line, and a finished buy goes once the stock is held", () => {
    const titles = (held: string[]) => pendingLines(view, new Set(held)).map((l) => l.title);
    expect(titles([])).toEqual(["Payment arriving", "Investing your tenth", "Selling NVDAC", "Buying TSLAC", "Bought AMDC"]);
    expect(titles(["amd"])).toEqual(["Payment arriving", "Investing your tenth", "Selling NVDAC", "Buying TSLAC"]);
  });

  test("a stock stays marked as being sold until it leaves the holdings, and never flips back early", () => {
    const state = sellState(view);
    expect(state.get("nvda")).toBe("selling");
    expect(state.get("aapl")).toBe("updating");
    expect(state.get("tsla")).toBeUndefined();
    expect(sellState(null).size).toBe(0);
  });

  test("only sales still settling count as proceeds on their way", () => {
    expect(proceedsComing(view)).toBe("9.10");
    expect(proceedsComing(null)).toBe("0.00");
  });
});
