import { ProposalState } from "@/lib/constents";

/** Wallet vote status for an active proposal row badge. */
export function getWalletVoteStatusOnActive(
  proposalState: number,
  isConnected: boolean,
  address: string | undefined,
  voteBatchLoading: boolean,
  byProposalId: Record<string, boolean> | null | undefined,
  proposalId: string,
): boolean | null | undefined {
  if (proposalState !== ProposalState.Active) return undefined;
  if (!isConnected || !address) return undefined;
  if (voteBatchLoading || !byProposalId) return null;
  return byProposalId[proposalId] ?? null;
}
