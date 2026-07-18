import { describe, expect, it } from "vitest";
import { EMPTY_PROPOSAL_GOVERNANCE_SIGNALS } from "@/hooks/useProposalGovernanceSignals";
import { deriveSidebarGovernanceDisplay } from "@/lib/deriveSidebarGovernanceDisplay";

const serverSignals = {
  ...EMPTY_PROPOSAL_GOVERNANCE_SIGNALS,
  activeCount: 3,
  nextEndTime: 1_700_010_000,
};

describe("deriveSidebarGovernanceDisplay", () => {
  it("hides wallet cues when disconnected and mock mode is off", () => {
    expect(
      deriveSidebarGovernanceDisplay({
        activeCount: 3,
        activeProposalIds: ["a", "b"],
        isConnected: false,
        governanceSignalsFromServer: serverSignals,
        endsInCompact: "2h",
        walletNotVoted: 2,
        walletNotVotedLoading: false,
      }),
    ).toEqual({
      activeNotVotedCount: null,
      showActiveNotVotedParenthetical: false,
      showActiveAllVotedLine: false,
      showActiveEndsIn: true,
    });
  });

  it("shows not-voted parenthetical for a connected wallet", () => {
    expect(
      deriveSidebarGovernanceDisplay({
        activeCount: 3,
        activeProposalIds: ["a", "b", "c"],
        isConnected: true,
        governanceSignalsFromServer: serverSignals,
        endsInCompact: "2h",
        walletNotVoted: 2,
        walletNotVotedLoading: false,
      }),
    ).toEqual({
      activeNotVotedCount: 2,
      showActiveNotVotedParenthetical: true,
      showActiveAllVotedLine: false,
      showActiveEndsIn: true,
    });
  });

  it("shows all-voted line and hides ends-in urgency", () => {
    expect(
      deriveSidebarGovernanceDisplay({
        activeCount: 2,
        activeProposalIds: ["a", "b"],
        isConnected: true,
        governanceSignalsFromServer: { ...serverSignals, activeCount: 2 },
        endsInCompact: "2h",
        walletNotVoted: 0,
        walletNotVotedLoading: false,
      }),
    ).toEqual({
      activeNotVotedCount: 0,
      showActiveNotVotedParenthetical: false,
      showActiveAllVotedLine: true,
      showActiveEndsIn: false,
    });
  });

  it("keeps vote cues indeterminate while the batch is loading", () => {
    expect(
      deriveSidebarGovernanceDisplay({
        activeCount: 2,
        activeProposalIds: ["a", "b"],
        isConnected: true,
        governanceSignalsFromServer: serverSignals,
        endsInCompact: "2h",
        walletNotVoted: null,
        walletNotVotedLoading: true,
      }),
    ).toEqual({
      activeNotVotedCount: undefined,
      showActiveNotVotedParenthetical: false,
      showActiveAllVotedLine: false,
      showActiveEndsIn: true,
    });
  });

  it("shows not-voted count in mock mode without a wallet", () => {
    expect(
      deriveSidebarGovernanceDisplay({
        activeCount: 2,
        activeProposalIds: ["a", "b"],
        isConnected: false,
        showVotingStatusWhenDisconnected: true,
        governanceSignalsFromServer: serverSignals,
        endsInCompact: "2h",
        walletNotVoted: 2,
        walletNotVotedLoading: false,
      }),
    ).toEqual({
      activeNotVotedCount: 2,
      showActiveNotVotedParenthetical: true,
      showActiveAllVotedLine: false,
      showActiveEndsIn: true,
    });
  });
});
