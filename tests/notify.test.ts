import { describe, expect, test } from "vitest";
import { ago, arrivedSince } from "../lib/notify";

const n = (id: string, read = false) => ({ id, read });

describe("arrivedSince", () => {
  test("returns unread notices not seen before, oldest first", () => {
    const items = [n("c"), n("b"), n("a")];
    expect(arrivedSince(items, new Set(["a"])).map((x) => x.id)).toEqual(["b", "c"]);
  });

  test("ignores read notices and anything already seen", () => {
    expect(arrivedSince([n("a", true), n("b")], new Set(["b"]))).toEqual([]);
  });
});

describe("ago", () => {
  const now = Date.parse("2026-11-14T12:00:00Z");
  test("reads as plain words", () => {
    expect(ago("2026-11-14T11:59:40Z", now)).toBe("Just now");
    expect(ago("2026-11-14T11:55:00Z", now)).toBe("5 min ago");
    expect(ago("2026-11-14T09:00:00Z", now)).toBe("3 h ago");
  });
});
