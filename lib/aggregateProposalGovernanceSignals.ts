import type { ProposalGovernanceSignals } from "@/hooks/useProposalGovernanceSignals";
import { ProposalState } from "@/lib/constents";

type GovernanceProposalSlice = {
  proposal_id: string;
  state: number;
  end_time: number | string;
};

export function aggregateProposalGovernanceSignals(
  activeRaw: GovernanceProposalSlice[],
  pendingRaw: GovernanceProposalSlice[],
): ProposalGovernanceSignals {
  const active = activeRaw.filter((p) => p.state === ProposalState.Active);
  const pending = pendingRaw.filter((p) => p.state === ProposalState.Pending);

  const nextEndTime =
    active.length > 0
      ? Math.min(...active.map((p) => Number(p.end_time)))
      : null;

  return {
    activeCount: active.length,
    pendingCount: pending.length,
    nextEndTime: Number.isFinite(nextEndTime) ? nextEndTime : null,
    activeProposalIds: active.map((p) => p.proposal_id),
  };
}
