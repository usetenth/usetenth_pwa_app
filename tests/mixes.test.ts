import { describe, expect, test } from "vitest";
import { cleanName, equalWeights, planName, planStocks, summarize } from "../lib/mixes";

describe("mixes", () => {
  test("equal weights always total exactly 10,000 basis points", () => {
    for (const n of [1, 2, 3, 7, 10, 13, 20]) {
      const w = equalWeights(n);
      expect(w).toHaveLength(n);
      expect(w.reduce((a, b) => a + b, 0)).toBe(10_000);
      expect(Math.max(...w) - Math.min(...w)).toBeLessThanOrEqual(1);
    }
    expect(equalWeights(0)).toEqual([]);
    expect(equalWeights(3)).toEqual([3334, 3333, 3333]);
  });

  test("summaries read naturally", () => {
    expect(summarize([])).toBe("No stocks yet");
    expect(summarize([{ name: "Apple" }])).toBe("Apple");
    expect(summarize([{ name: "Apple" }, { name: "Nvidia" }])).toBe("Apple and Nvidia");
    expect(summarize([{ name: "Apple" }, { name: "Nvidia" }, { name: "Meta" }, { name: "Visa" }])).toBe("Apple, Nvidia and 2 more");
  });

  test("issuer suffixes are trimmed from names", () => {
    expect(cleanName("Apple • Robinhood Token")).toBe("Apple");
    expect(cleanName("Apple (Coinbase Tokenized Stock)")).toBe("Apple");
    expect(cleanName("Apple")).toBe("Apple");
  });

  test("picks the right stocks and name for a plan", () => {
    const plans = [{ plan: "steady" as const, name: "Steady", blurb: "", stocks: [{ asset_key: "a", symbol: "A", name: "A", weight_bps: 10000 }] }];
    const mine = [{ asset_key: "b", symbol: "B", name: "B", weight_bps: 10000 }];
    expect(planStocks(plans, "steady", mine)).toEqual(plans[0]!.stocks);
    expect(planStocks(plans, "custom", mine)).toEqual(mine);
    expect(planStocks(plans, "growth", mine)).toEqual([]);
    expect(planName(plans, "custom")).toBe("Your picks");
    expect(planName(plans, "steady")).toBe("Steady");
  });
});
