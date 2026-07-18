import { describe, expect, it } from "vitest";
import { getEndsInUrgencyClass } from "@/lib/getEndsInUrgencyClass";

describe("getEndsInUrgencyClass", () => {
  it("returns default class when remaining time is unknown", () => {
    expect(getEndsInUrgencyClass(null)).toBe("text-content-default");
  });

  it("returns error class at or under six hours", () => {
    expect(getEndsInUrgencyClass(6 * 60 * 60 * 1000)).toBe(
      "text-content-error-light",
    );
    expect(getEndsInUrgencyClass(5 * 60 * 60 * 1000)).toBe(
      "text-content-error-light",
    );
  });

  it("returns warning class between six and twenty-four hours", () => {
    expect(getEndsInUrgencyClass(12 * 60 * 60 * 1000)).toBe(
      "text-content-warning-light",
    );
    expect(getEndsInUrgencyClass(23 * 60 * 60 * 1000)).toBe(
      "text-content-warning-light",
    );
  });

  it("returns default class at or above twenty-four hours", () => {
    expect(getEndsInUrgencyClass(24 * 60 * 60 * 1000)).toBe(
      "text-content-default",
    );
    expect(getEndsInUrgencyClass(3 * 24 * 60 * 60 * 1000)).toBe(
      "text-content-default",
    );
  });
});
