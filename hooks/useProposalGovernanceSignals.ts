import useCurrentChain from "@/hooks/useCurrentChain";
import useGraphqlApi from "@/hooks/useGraphqlApi";
import { aggregateProposalGovernanceSignals } from "@/lib/aggregateProposalGovernanceSignals";
import { useQuery } from "@tanstack/react-query";

const GOVERNANCE_SIGNALS_INTERVAL_MS = 30_000;
const PROPOSAL_PAGE_SIZE = 200;

export type ProposalGovernanceSignals = {
  activeCount: number;
  pendingCount: number;
  nextEndTime: number | null;
  activeProposalIds: string[];
};

export const EMPTY_PROPOSAL_GOVERNANCE_SIGNALS: ProposalGovernanceSignals = {
  activeCount: 0,
  pendingCount: 0,
  nextEndTime: null,
  activeProposalIds: [],
};

export function useProposalGovernanceSignals() {
  const api = useGraphqlApi();
  const chain = useCurrentChain();

  return useQuery({
    queryKey: ["proposalGovernanceSignals", chain.id],
    queryFn: async (): Promise<ProposalGovernanceSignals> => {
      const now = Math.floor(Date.now() / 1000);
      const [activeRaw, pendingRaw] = await Promise.all([
        api.loadProposals({ limit: PROPOSAL_PAGE_SIZE, skip: 0 }, now, {
          state: "active",
        }),
        api.loadProposals({ limit: PROPOSAL_PAGE_SIZE, skip: 0 }, now, {
          state: "pending",
        }),
      ]);

      return aggregateProposalGovernanceSignals(activeRaw, pendingRaw);
    },
    refetchInterval: GOVERNANCE_SIGNALS_INTERVAL_MS,
  });
}
