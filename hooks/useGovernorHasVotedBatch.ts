import governorAbi from "@/contracts/abi/governorAbi";
import config from "@/config";
import useCurrentChain from "@/hooks/useCurrentChain";
import { useConnection, useReadContracts } from "wagmi";
import { useMemo } from "react";

export function useGovernorHasVotedBatch(proposalIds: string[]) {
  const chain = useCurrentChain();
  const { address } = useConnection();
  const governorAddress = config.governor[chain.id];

  const sortedIds = useMemo(
    () => [...new Set(proposalIds)].sort(),
    [proposalIds],
  );

  const enabled = !!address && !!governorAddress && sortedIds.length > 0;

  const contracts = useMemo(
    () =>
      enabled
        ? sortedIds.map((id) => ({
            address: governorAddress as `0x${string}`,
            abi: governorAbi,
            functionName: "hasVoted" as const,
            args: [BigInt(id), address!] as const,
          }))
        : [],
    [enabled, governorAddress, sortedIds, address],
  );

  const { data, isPending, isFetching } = useReadContracts({
    contracts,
    query: { enabled },
  });

  return useMemo(() => {
    if (!enabled) {
      return {
        byProposalId: null as Record<string, boolean> | null,
        isLoading: false,
      };
    }
    if (isPending || isFetching) {
      return {
        byProposalId: null as Record<string, boolean> | null,
        isLoading: true,
      };
    }
    if (!data || data.length !== sortedIds.length) {
      return {
        byProposalId: null as Record<string, boolean> | null,
        isLoading: false,
      };
    }
    const byProposalId: Record<string, boolean> = {};
    for (let i = 0; i < sortedIds.length; i++) {
      const row = data[i];
      if (row?.status !== "success" || typeof row.result !== "boolean") {
        return {
          byProposalId: null as Record<string, boolean> | null,
          isLoading: false,
        };
      }
      byProposalId[sortedIds[i]] = row.result;
    }
    return { byProposalId, isLoading: false };
  }, [data, enabled, isFetching, isPending, sortedIds]);
}
