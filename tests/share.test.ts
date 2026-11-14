import { describe, expect, test } from "vitest";
import { shareMessage, shortAddress } from "../lib/share";

describe("shortAddress", () => {
  test("keeps the start and end of a long address", () => {
    expect(shortAddress("3d683Hyicjun4QV789J9xKqde9GNukkCNTwevNTHYPWA")).toBe("3d683H…THYPWA");
  });

  test("leaves a short address alone", () => {
    expect(shortAddress("0xabc")).toBe("0xabc");
  });
});

describe("shareMessage", () => {
  test("names the asset, network and address and warns about mistakes", () => {
    const text = shareMessage("USDC", "Solana", "ADDR123");
    expect(text).toContain("Send USDC on Solana");
    expect(text).toContain("ADDR123");
    expect(text).toContain("Only send USDC on Solana");
  });
});
