"use client";

import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";
import config from "@/config";
import voteTokenAbi from "@/contracts/abi/voteTokenAbi";
import useCurrentChain from "./useCurrentChain";
import useWeb3Clients from "./useWeb3Clients";
import type { Delegate } from "@/types";

type ExplorerAddress = {
  hash: `0x${string}`;
  is_contract: boolean;
};

// The participants list is the true voting-power distribution: every token
// holder is auto-delegated, so their balance already counts as voting power
// unless they delegated it elsewhere. The delegate-event indexer misses these
// holders, so we source the address universe from the explorer and read the
// real voting power (getVotes) on-chain, which is correct for every case.
async function fetchTopHolders(
  apiBase: string,
  limit: number,
): Promise<ExplorerAddress[]> {
  const res = await fetch(`${apiBase}/api/v2/addresses?sort=balance&order=desc`);
  if (!res.ok) {
    throw new Error(`Explorer holder request failed: ${res.status}`);
  }
  const data = (await res.json()) as { items?: ExplorerAddress[] };
  return (data.items ?? []).slice(0, limit);
}

function toParticipant(
  holder: ExplorerAddress,
  votingPower: bigint,
  decimals: number,
  label: string | undefined,
): Delegate {
  return {
    id: holder.hash,
    address: holder.hash,
    votingPower: votingPower.toString(),
    votingPowerParsed: parseFloat(formatUnits(votingPower, decimals)),
    delegatorCount: 0,
    created: 0,
    updated: 0,
    user: null,
    isContract: holder.is_contract,
    label,
  };
}

const useParticipants = (limit = 50) => {
  const chain = useCurrentChain();
  const { publicClient } = useWeb3Clients();
  const { decimals, address: tokenAddress } = config.voteToken[chain.id];
  const apiBase = config.explorerApiUrl[chain.id];
  const labels = config.addressLabels[chain.id] ?? {};

  return useQuery({
    queryKey: ["participants", chain.id, limit],
    enabled: !!apiBase && !!tokenAddress,
    queryFn: async (): Promise<Delegate[]> => {
      const holders = await fetchTopHolders(apiBase, limit);

      const votingPowers = await Promise.all(
        holders.map(
          (holder) =>
            publicClient.readContract({
              address: tokenAddress,
              abi: voteTokenAbi,
              functionName: "getVotes",
              args: [holder.hash],
            }) as Promise<bigint>,
        ),
      );

      return holders
        .map((holder, index) =>
          toParticipant(
            holder,
            votingPowers[index],
            decimals,
            labels[holder.hash.toLowerCase()],
          ),
        )
        .filter((participant) => participant.votingPowerParsed > 0)
        .sort((a, b) => b.votingPowerParsed - a.votingPowerParsed);
    },
  });
};

export default useParticipants;
