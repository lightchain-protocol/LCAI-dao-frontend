import { afterEach, describe, expect, it, vi } from "vitest";
import $dayjs from "@/lib/dayjs";
import {
  formatCompactTimeLeft,
  formatCompactTimeLeftFromUnix,
  formatProposalEndRelative,
} from "@/lib/utils";

describe("formatCompactTimeLeft", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

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

  it("aligns compact sidebar labels with proposal list fromNow rounding", () => {
    vi.setSystemTime(new Date("2026-07-18T12:00:00.000Z"));
    const endUnix = $dayjs().add(110, "minute").unix();

    expect(formatProposalEndRelative(endUnix)).toBe("in 2 hours");
    expect(formatCompactTimeLeftFromUnix(endUnix)).toBe("2h");
  });

  it("returns null for an already-ended timestamp", () => {
    vi.setSystemTime(new Date("2026-07-18T12:00:00.000Z"));
    const endUnix = $dayjs().subtract(1, "minute").unix();
    expect(formatCompactTimeLeftFromUnix(endUnix)).toBeNull();
  });
});
