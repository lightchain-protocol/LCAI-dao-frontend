import { describe, expect, it } from "vitest";
import { ProposalState } from "@/lib/constents";
import { sortProposalsByPriorityDesc } from "@/lib/sortProposalsByPriorityDesc";
import type { Proposal } from "@/types";

function mockProposal(
  id: string,
  state: number,
  endTime: number,
  created: number,
): Proposal {
  return {
    proposal_id: id,
    state,
    end_time: endTime,
    created,
  } as Proposal;
}

describe("sortProposalsByPriorityDesc", () => {
  it("returns a copy unchanged while vote batch is loading", () => {
    const proposals = [
      mockProposal("1", ProposalState.Active, 200, 10),
      mockProposal("2", ProposalState.Active, 100, 20),
    ];
    const input = [...proposals];

    const result = sortProposalsByPriorityDesc(input, {
      isConnected: true,
      address: "0xabc",
      byProposalId: null,
      voteBatchLoading: true,
    });

    expect(result).toEqual(input);
    expect(result).not.toBe(input);
  });

  it("sorts active not-voted first by soonest end, then other not-voted, then voted", () => {
    const proposals = [
      mockProposal("voted-active", ProposalState.Active, 50, 1),
      mockProposal("active-late", ProposalState.Active, 300, 2),
      mockProposal("active-soon", ProposalState.Active, 100, 3),
      mockProposal("pending", ProposalState.Pending, 400, 4),
      mockProposal("voted-pending", ProposalState.Pending, 500, 5),
    ];

    const result = sortProposalsByPriorityDesc(proposals, {
      isConnected: true,
      address: "0xabc",
      voteBatchLoading: false,
      byProposalId: {
        "voted-active": true,
        "active-late": false,
        "active-soon": false,
        "pending": false,
        "voted-pending": true,
      },
    });

    expect(result.map((p) => p.proposal_id)).toEqual([
      "active-soon",
      "active-late",
      "pending",
      "voted-pending",
      "voted-active",
    ]);
  });

  it("treats disconnected wallets as not voted for tiering", () => {
    const proposals = [
      mockProposal("active", ProposalState.Active, 100, 1),
      mockProposal("pending", ProposalState.Pending, 200, 2),
    ];

    const result = sortProposalsByPriorityDesc(proposals, {
      isConnected: false,
      voteBatchLoading: false,
      byProposalId: { active: true, pending: true },
    });

    expect(result.map((p) => p.proposal_id)).toEqual(["active", "pending"]);
  });

  it("sorts voted proposals by created desc within tier 2", () => {
    const proposals = [
      mockProposal("old", ProposalState.Active, 100, 10),
      mockProposal("new", ProposalState.Active, 100, 50),
    ];

    const result = sortProposalsByPriorityDesc(proposals, {
      isConnected: true,
      address: "0xabc",
      voteBatchLoading: false,
      byProposalId: { old: true, new: true },
    });

    expect(result.map((p) => p.proposal_id)).toEqual(["new", "old"]);
  });
});
