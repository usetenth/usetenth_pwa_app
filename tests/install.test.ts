import { describe, expect, test } from "vitest";
import { authAllowed, installMode, isIos } from "../lib/install";

describe("installMode", () => {
  test("an installed app has nothing left to install", () => {
    expect(installMode({ standalone: true, ios: false, hasPrompt: true })).toBe("installed");
  });

  test("a browser that offered an install prompt uses it", () => {
    expect(installMode({ standalone: false, ios: false, hasPrompt: true })).toBe("prompt");
  });

  test("iPhones have no prompt, so they get the Add to Home Screen steps", () => {
    expect(installMode({ standalone: false, ios: true, hasPrompt: false })).toBe("ios");
  });

  test("anything else falls back to the browser-menu steps", () => {
    expect(installMode({ standalone: false, ios: false, hasPrompt: false })).toBe("manual");
  });
});

describe("isIos", () => {
  test("recognises iPhones and iPads, including iPads posing as Macs", () => {
    expect(isIos("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe(true);
    expect(isIos("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5)).toBe(true);
    expect(isIos("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0)).toBe(false);
    expect(isIos("Mozilla/5.0 (Linux; Android 14)")).toBe(false);
  });
});

describe("authAllowed", () => {
  const base = { standalone: false, telegram: false, browserOverride: false };

  test("a plain browser tab is not a place to sign up", () => {
    expect(authAllowed(base)).toBe(false);
  });

  test("the installed app, Telegram and the development override are", () => {
    expect(authAllowed({ ...base, standalone: true })).toBe(true);
    expect(authAllowed({ ...base, telegram: true })).toBe(true);
    expect(authAllowed({ ...base, browserOverride: true })).toBe(true);
  });
});
