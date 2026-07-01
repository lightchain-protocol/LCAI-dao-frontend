"use client";

import { useQuery } from "@tanstack/react-query";
import { formatUnits, parseUnits } from "viem";
import config from "@/config";
import nativeVotesAbi from "@/contracts/abi/nativeVotesAbi";
import useCurrentChain from "./useCurrentChain";
import useWeb3Clients from "./useWeb3Clients";

export type VotingPowerStats = {
  // On-chain votable sum (the quorum denominator).
  totalVotingPower: number;
  // Raw tracked supply on this chain (excludes consensus-locked validator stake).
  trackedSupply: number;
  // Worker stake, subtracted from voting power: trackedSupply - totalVotingPower.
  workerStakeExcluded: number;
  // Validator stake locked at the consensus layer: nominalSupply - trackedSupply.
  consensusLock: number;
};

const useVotingPowerStats = () => {
  const chain = useCurrentChain();
  const { publicClient } = useWeb3Clients();
  const { decimals, address: tokenAddress } = config.voteToken[chain.id];
  const nominalSupply = config.totalSupply[chain.id];

  return useQuery({
    queryKey: ["votingPowerStats", chain.id],
    enabled: !!tokenAddress,
    queryFn: async (): Promise<VotingPowerStats> => {
      // getTotalVotingPower / getPastTotalSupply revert for the current block,
      // so query the previous one.
      const block = await publicClient.getBlockNumber();
      const timepoint = block - 1n;

      const [totalVotingPower, trackedSupply] = await Promise.all([
        publicClient.readContract({
          address: tokenAddress,
          abi: nativeVotesAbi,
          functionName: "getTotalVotingPower",
          args: [timepoint],
        }) as Promise<bigint>,
        publicClient.readContract({
          address: tokenAddress,
          abi: nativeVotesAbi,
          functionName: "getPastTotalSupply",
          args: [timepoint],
        }) as Promise<bigint>,
      ]);

      const workerStake =
        trackedSupply > totalVotingPower ? trackedSupply - totalVotingPower : 0n;
      const nominalWei = parseUnits(nominalSupply.toString(), decimals);
      const consensusLock =
        nominalWei > trackedSupply ? nominalWei - trackedSupply : 0n;

      return {
        totalVotingPower: parseFloat(formatUnits(totalVotingPower, decimals)),
        trackedSupply: parseFloat(formatUnits(trackedSupply, decimals)),
        workerStakeExcluded: parseFloat(formatUnits(workerStake, decimals)),
        consensusLock: parseFloat(formatUnits(consensusLock, decimals)),
      };
    },
  });
};

export default useVotingPowerStats;
