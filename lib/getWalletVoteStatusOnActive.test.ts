import { describe, expect, it } from "vitest";
import { ProposalState } from "@/lib/constents";
import { getWalletVoteStatusOnActive } from "@/lib/getWalletVoteStatusOnActive";

describe("getWalletVoteStatusOnActive", () => {
  it("returns undefined when proposal is not active", () => {
    expect(
      getWalletVoteStatusOnActive(
        ProposalState.Pending,
        true,
        "0xabc",
        false,
        { "1": false },
        "1",
      ),
    ).toBeUndefined();
  });

  it("returns undefined when wallet is disconnected", () => {
    expect(
      getWalletVoteStatusOnActive(
        ProposalState.Active,
        false,
        undefined,
        false,
        { "1": false },
        "1",
      ),
    ).toBeUndefined();
  });

  it("returns null while vote batch is loading", () => {
    expect(
      getWalletVoteStatusOnActive(
        ProposalState.Active,
        true,
        "0xabc",
        true,
        null,
        "1",
      ),
    ).toBeNull();
  });

  it("returns vote status from batch map", () => {
    expect(
      getWalletVoteStatusOnActive(
        ProposalState.Active,
        true,
        "0xabc",
        false,
        { "1": true, "2": false },
        "2",
      ),
    ).toBe(false);
  });
});
