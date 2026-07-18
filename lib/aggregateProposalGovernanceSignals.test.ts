import { describe, expect, it } from "vitest";
import { EMPTY_PROPOSAL_GOVERNANCE_SIGNALS } from "@/hooks/useProposalGovernanceSignals";
import { aggregateProposalGovernanceSignals } from "@/lib/aggregateProposalGovernanceSignals";
import { ProposalState } from "@/lib/constents";
import { buildMockGovernanceProposals } from "@/lib/testFixtures/governanceProposals";

describe("aggregateProposalGovernanceSignals", () => {
  it("returns empty signals when there are no active or pending proposals", () => {
    expect(aggregateProposalGovernanceSignals([], [])).toEqual(
      EMPTY_PROPOSAL_GOVERNANCE_SIGNALS,
    );
  });

  it("aggregates active and pending counts from fixture proposals", () => {
    const active = buildMockGovernanceProposals();
    const activeOnly = active.filter(
      (proposal) => proposal.state === ProposalState.Active,
    );
    const pending = [
      {
        proposal_id: "pending-1",
        state: ProposalState.Pending,
        end_time: 1_700_100_000,
      },
      {
        proposal_id: "pending-2",
        state: ProposalState.Active,
        end_time: 1_700_200_000,
      },
    ];

    const result = aggregateProposalGovernanceSignals(active, pending);

    expect(result.activeCount).toBe(4);
    expect(result.pendingCount).toBe(1);
    expect(result.activeProposalIds).toHaveLength(4);
    expect(result.nextEndTime).toBe(
      Math.min(...activeOnly.map((proposal) => Number(proposal.end_time))),
    );
  });

  it("ignores non-active rows in the active feed and non-pending rows in the pending feed", () => {
    const active = [
      {
        proposal_id: "active-1",
        state: ProposalState.Active,
        end_time: 1_700_050_000,
      },
      {
        proposal_id: "pending-in-active-feed",
        state: ProposalState.Pending,
        end_time: 1_700_060_000,
      },
    ];
    const pending = [
      {
        proposal_id: "pending-1",
        state: ProposalState.Pending,
        end_time: 1_700_070_000,
      },
      {
        proposal_id: "active-in-pending-feed",
        state: ProposalState.Active,
        end_time: 1_700_080_000,
      },
    ];

    expect(aggregateProposalGovernanceSignals(active, pending)).toEqual({
      activeCount: 1,
      pendingCount: 1,
      nextEndTime: 1_700_050_000,
      activeProposalIds: ["active-1"],
    });
  });
});
