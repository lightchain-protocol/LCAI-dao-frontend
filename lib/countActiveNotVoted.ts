export type CountActiveNotVotedResult = {
  notVotedCount: number | null;
  isLoading: boolean;
};

export function countActiveNotVoted(
  proposalIds: string[],
  byProposalId: Record<string, boolean> | null,
  isLoading: boolean,
): CountActiveNotVotedResult {
  if (proposalIds.length === 0) {
    return { notVotedCount: null, isLoading: false };
  }
  if (!byProposalId) {
    return { notVotedCount: null, isLoading };
  }

  let notVoted = 0;
  for (const id of proposalIds) {
    const voted = byProposalId[id];
    if (typeof voted !== "boolean") {
      return { notVotedCount: null, isLoading: false };
    }
    if (!voted) notVoted += 1;
  }

  return { notVotedCount: notVoted, isLoading: false };
}
