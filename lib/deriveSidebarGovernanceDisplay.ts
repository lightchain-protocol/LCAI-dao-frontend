import type { ProposalGovernanceSignals } from "@/hooks/useProposalGovernanceSignals";

export type SidebarGovernanceDisplayInput = {
  activeCount: number;
  activeProposalIds: string[];
  isConnected: boolean;
  /** Local mock mode treats voting status as visible without a wallet. */
  showVotingStatusWhenDisconnected?: boolean;
  governanceSignalsFromServer: ProposalGovernanceSignals | null;
  endsInCompact: string | null;
  walletNotVoted: number | null;
  walletNotVotedLoading: boolean;
};

export type SidebarGovernanceDisplay = {
  activeNotVotedCount: number | null | undefined;
  showActiveNotVotedParenthetical: boolean;
  showActiveAllVotedLine: boolean;
  showActiveEndsIn: boolean;
};

export function deriveSidebarGovernanceDisplay({
  activeCount,
  activeProposalIds,
  isConnected,
  showVotingStatusWhenDisconnected = false,
  governanceSignalsFromServer,
  endsInCompact,
  walletNotVoted,
  walletNotVotedLoading,
}: SidebarGovernanceDisplayInput): SidebarGovernanceDisplay {
  const showActiveVotingStatus =
    activeCount > 0 && (isConnected || showVotingStatusWhenDisconnected);

  let activeNotVotedCount: number | null | undefined = null;
  if (showActiveVotingStatus) {
    if (!isConnected || activeProposalIds.length === 0) {
      activeNotVotedCount = null;
    } else if (walletNotVotedLoading || walletNotVoted === null) {
      activeNotVotedCount = undefined;
    } else {
      activeNotVotedCount = walletNotVoted;
    }
  }

  const showActiveNotVotedParenthetical =
    typeof activeNotVotedCount === "number" && activeNotVotedCount > 0;
  const showActiveAllVotedLine =
    typeof activeNotVotedCount === "number" && activeNotVotedCount === 0;
  const showActiveEndsIn =
    governanceSignalsFromServer != null &&
    governanceSignalsFromServer.activeCount > 0 &&
    endsInCompact != null &&
    !showActiveAllVotedLine;

  return {
    activeNotVotedCount,
    showActiveNotVotedParenthetical,
    showActiveAllVotedLine,
    showActiveEndsIn,
  };
}
