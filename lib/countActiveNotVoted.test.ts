import { describe, expect, it } from "vitest";
import { countActiveNotVoted } from "@/lib/countActiveNotVoted";

describe("countActiveNotVoted", () => {
  it("returns null with no loading when there are no active proposal ids", () => {
    expect(countActiveNotVoted([], { a: false }, false)).toEqual({
      notVotedCount: null,
      isLoading: false,
    });
  });

  it("returns loading state when vote batch is not ready", () => {
    expect(countActiveNotVoted(["a", "b"], null, true)).toEqual({
      notVotedCount: null,
      isLoading: true,
    });
  });

  it("counts proposals the wallet has not voted on", () => {
    expect(
      countActiveNotVoted(["a", "b", "c"], { a: false, b: true, c: false }, false),
    ).toEqual({
      notVotedCount: 2,
      isLoading: false,
    });
  });

  it("returns null when any vote lookup is missing", () => {
    expect(countActiveNotVoted(["a", "b"], { a: true }, false)).toEqual({
      notVotedCount: null,
      isLoading: false,
    });
  });

  it("returns zero when the wallet voted on every active proposal", () => {
    expect(countActiveNotVoted(["a", "b"], { a: true, b: true }, false)).toEqual({
      notVotedCount: 0,
      isLoading: false,
    });
  });
});
