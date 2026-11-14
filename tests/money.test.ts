import { describe, expect, test } from "vitest";
import { add, fromCents, isAmount, percentOf, signedUsd, splitByBps, splitEven, sub, toCents, usd, usdFine } from "../lib/money";

describe("money", () => {
  test("negative amounts keep their fractional part", () => {
    expect(toCents("-1.06")).toBe(BigInt(-106));
    expect(sub("158.94", "160.00")).toBe("-1.06");
    expect(signedUsd("-1.06")).toBe("-$1.06");
    expect(usd("-0.94")).toBe("-$0.94");
  });

  test("round trips", () => {
    for (const v of ["0.00", "0.05", "12.10", "-12.10", "1234567.89"]) expect(fromCents(toCents(v))).toBe(v);
  });

  test("formats with separators and a sign", () => {
    expect(usd("1234.5")).toBe("$1,234.50");
    expect(signedUsd("12.10")).toBe("+$12.10");
  });

  test("percentOf rounds down to the cent", () => {
    expect(percentOf("800.00", 10)).toBe("80.00");
    expect(percentOf("800.00", 12)).toBe("96.00");
    expect(percentOf("33.33", 10)).toBe("3.33");
  });

  test("splitEven always re-adds to the total", () => {
    for (const parts of [1, 2, 3, 7, 8]) {
      const split = splitEven("80.00", parts);
      expect(split.reduce((a, c) => add(a, c), "0.00")).toBe("80.00");
    }
    expect(splitEven("80.00", 8)).toEqual(Array(8).fill("10.00"));
  });

  test("usdFine keeps sub-cent precision, and reads like usd() otherwise", () => {
    expect(usdFine("0.002")).toBe("$0.002");
    expect(usdFine("0.1")).toBe("$0.10");
    expect(usdFine("1")).toBe("$1.00");
    expect(usdFine("341.04318")).toBe("$341.04318");
    expect(usdFine("1234.5")).toBe("$1,234.50");
    expect(usd("0.002")).toBe("$0.00");
  });
});

describe("money (split and validate)", () => {
  test("splits by weights and always re-adds", () => {
    expect(splitByBps("10.00", [6000, 4000])).toEqual(["6.00", "4.00"]);
    const parts = splitByBps("10.00", [3333, 3333, 3334]);
    expect(parts.reduce((a, b) => add(a, b), "0.00")).toBe("10.00");
    expect(splitByBps("0.01", [5000, 5000])).toEqual(["0.01", "0.00"]);
    expect(splitByBps("10.00", [])).toEqual([]);
  });

  test("accepts dollars and cents only", () => {
    for (const ok of ["1", "12.5", "12.50", "0.01"]) expect(isAmount(ok)).toBe(true);
    for (const bad of ["", "0", "0.00", "-1", "1.234", "abc", "1e3", ".5"]) expect(isAmount(bad)).toBe(false);
  });
});
