import { describe, expect, it } from "vitest";
import { formatCompactTimeLeft } from "@/lib/utils";

describe("formatCompactTimeLeft", () => {
  it("returns null for non-positive or invalid input", () => {
    expect(formatCompactTimeLeft(0)).toBeNull();
    expect(formatCompactTimeLeft(-1)).toBeNull();
    expect(formatCompactTimeLeft(Number.NaN)).toBeNull();
  });

  it("formats sub-minute remaining as <1m", () => {
    expect(formatCompactTimeLeft(30_000)).toBe("<1m");
  });

  it("formats minutes, hours, and days", () => {
    expect(formatCompactTimeLeft(5 * 60_000)).toBe("5m");
    expect(formatCompactTimeLeft(3 * 60 * 60_000)).toBe("3h");
    expect(formatCompactTimeLeft(2 * 24 * 60 * 60_000)).toBe("2d");
  });

  it("matches mock proposal time-left labels from data/mock/proposals.json", () => {
    expect(formatCompactTimeLeft(6 * 24 * 60 * 60_000)).toBe("6d");
    expect(formatCompactTimeLeft(14 * 24 * 60 * 60_000)).toBe("14d");
  });
});
