import { ProposalState } from "@/lib/constents";
import type { Proposal } from "@/types";

export type PrioritySortVoteContext = {
  isConnected: boolean;
  address?: string | null;
  byProposalId?: Record<string, boolean> | null;
  voteBatchLoading: boolean;
};

export function sortProposalsByPriorityDesc(
  proposals: Proposal[],
  ctx: PrioritySortVoteContext,
): Proposal[] {
  if (
    ctx.isConnected &&
    ctx.address &&
    (ctx.voteBatchLoading || !ctx.byProposalId)
  ) {
    return [...proposals];
  }

  const byProposalId = ctx.byProposalId;

  const rows = proposals.map((p) => {
    const active = p.state === ProposalState.Active;
    const voted = !ctx.isConnected
      ? false
      : byProposalId![p.proposal_id] === true;
    const end = Number(p.end_time);
    let tier: number;
    if (!voted && active) tier = 0;
    else if (!voted) tier = 1;
    else tier = 2;
    return { proposal: p, tier, end };
  });

  rows.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    if (a.tier === 0) return a.end - b.end;
    return Number(b.proposal.created) - Number(a.proposal.created);
  });

  return rows.map((r) => r.proposal);
}
