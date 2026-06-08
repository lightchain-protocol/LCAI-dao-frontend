import { useGovernorHasVotedBatch } from "@/hooks/useGovernorHasVotedBatch";
import { useMemo } from "react";

export function useActiveProposalNotVotedForWallet(proposalIds: string[]) {
  const { byProposalId, isLoading } = useGovernorHasVotedBatch(proposalIds);

  return useMemo(() => {
    if (proposalIds.length === 0) {
      return { notVotedCount: null as number | null, isLoading: false };
    }
    if (!byProposalId) {
      return {
        notVotedCount: null as number | null,
        isLoading,
      };
    }
    let notVoted = 0;
    for (const id of proposalIds) {
      const v = byProposalId[id];
      if (typeof v !== "boolean") {
        return { notVotedCount: null as number | null, isLoading: false };
      }
      if (!v) notVoted += 1;
    }
    return { notVotedCount: notVoted, isLoading: false };
  }, [byProposalId, isLoading, proposalIds]);
}
