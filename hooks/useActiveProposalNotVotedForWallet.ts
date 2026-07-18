import { useGovernorHasVotedBatch } from "@/hooks/useGovernorHasVotedBatch";
import { countActiveNotVoted } from "@/lib/countActiveNotVoted";
import { useMemo } from "react";

export function useActiveProposalNotVotedForWallet(proposalIds: string[]) {
  const { byProposalId, isLoading } = useGovernorHasVotedBatch(proposalIds);

  return useMemo(
    () => countActiveNotVoted(proposalIds, byProposalId, isLoading),
    [byProposalId, isLoading, proposalIds],
  );
}
