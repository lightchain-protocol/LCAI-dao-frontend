"use client";

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useConnection } from "wagmi";
import { getConnection, getWalletClient, switchChain } from "@wagmi/core";
import { createPublicClient, decodeEventLog, formatUnits, http } from "viem";
import { wagmiConfig } from "@/config/wagmi";
import dunaConfig, { MembershipAction } from "@/config/duna";
import dunaGovernorAbi from "@/contracts/abi/dunaGovernorAbi";
import dunaMemberRegistryAbi from "@/contracts/abi/dunaMemberRegistryAbi";
import { ProposalState } from "@/lib/constents";

/**
 * On-chain access to the DUNA Members governor. Independent from
 * useGovernance/useContracts (main DAO): fixed to the DUNA chain regardless of
 * the wallet's current network, and switches the wallet only when writing.
 */

const publicClient = createPublicClient({
  chain: dunaConfig.chain,
  transport: http(),
});

const governorAddress = dunaConfig.governor;
const decimals = dunaConfig.voteToken.decimals;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}

async function getDunaWalletClient() {
  if (getConnection(wagmiConfig).chainId !== dunaConfig.chain.id) {
    await switchChain(wagmiConfig, { chainId: dunaConfig.chain.id });
  }
  return getWalletClient(wagmiConfig, { chainId: dunaConfig.chain.id });
}

async function readLatestTimepoint() {
  // Governor uses block numbers; past lookups require timepoint < current block.
  const block = await publicClient.getBlockNumber();
  return block - 1n;
}

export type DunaGovernorParams = {
  proposalThreshold: number;
  quorum: number;
  votingDelayBlocks: number;
  votingPeriodBlocks: number;
  quorumPercent: number;
  currentBlock: number;
};

export function useDunaGovernorParams() {
  return useQuery({
    queryKey: ["duna-governor-params", governorAddress],
    enabled: !!governorAddress,
    staleTime: 60_000,
    queryFn: async (): Promise<DunaGovernorParams> => {
      const address = governorAddress!;
      const timepoint = await readLatestTimepoint();
      const [threshold, quorum, delay, period, quorumNumerator] = await Promise.all([
        publicClient.readContract({ address, abi: dunaGovernorAbi, functionName: "proposalThreshold" }),
        publicClient.readContract({ address, abi: dunaGovernorAbi, functionName: "quorum", args: [timepoint] }),
        publicClient.readContract({ address, abi: dunaGovernorAbi, functionName: "votingDelay" }),
        publicClient.readContract({ address, abi: dunaGovernorAbi, functionName: "votingPeriod" }),
        publicClient.readContract({ address, abi: dunaGovernorAbi, functionName: "quorumNumerator" }),
      ]);
      return {
        proposalThreshold: Number(formatUnits(threshold, decimals)),
        quorum: Number(formatUnits(quorum, decimals)),
        votingDelayBlocks: Number(delay),
        votingPeriodBlocks: Number(period),
        quorumPercent: Number(quorumNumerator),
        currentBlock: Number(timepoint + 1n),
      };
    },
  });
}

/** Connected account's current DUNA voting power (native LCAI on the DUNA chain). */
export function useDunaVotingPower() {
  const { address } = useConnection();
  return useQuery({
    queryKey: ["duna-voting-power", governorAddress, address],
    enabled: !!governorAddress && !!address,
    queryFn: async () => {
      const timepoint = await readLatestTimepoint();
      const votes = await publicClient.readContract({
        address: governorAddress!,
        abi: dunaGovernorAbi,
        functionName: "getVotes",
        args: [address!, timepoint],
      });
      return Number(formatUnits(votes, decimals));
    },
  });
}

export type DunaProposalChainState = {
  state: ProposalState;
  snapshot: number;
  deadline: number;
  hasVoted: boolean;
  votingPower: number;
  currentBlock: number;
};

/** Authoritative proposal state + the connected account's vote status. */
export function useDunaProposalChainState(proposalId: string | undefined) {
  const { address } = useConnection();
  return useQuery({
    queryKey: ["duna-proposal-chain-state", governorAddress, proposalId, address],
    enabled: !!governorAddress && !!proposalId,
    refetchInterval: 15_000,
    queryFn: async (): Promise<DunaProposalChainState> => {
      const id = BigInt(proposalId!);
      const common = { address: governorAddress!, abi: dunaGovernorAbi } as const;
      const [state, snapshot, deadline, currentBlock] = await Promise.all([
        publicClient.readContract({ ...common, functionName: "state", args: [id] }),
        publicClient.readContract({ ...common, functionName: "proposalSnapshot", args: [id] }),
        publicClient.readContract({ ...common, functionName: "proposalDeadline", args: [id] }),
        publicClient.getBlockNumber(),
      ]);

      let hasVoted = false;
      let votingPower = 0;
      if (address) {
        hasVoted = await publicClient.readContract({
          ...common,
          functionName: "hasVoted",
          args: [id, address],
        });
        if (snapshot < currentBlock) {
          const vp = await publicClient.readContract({
            ...common,
            functionName: "getVotes",
            args: [address, snapshot],
          });
          votingPower = Number(formatUnits(vp, decimals));
        }
      }

      return {
        state: Number(state) as ProposalState,
        snapshot: Number(snapshot),
        deadline: Number(deadline),
        hasVoted,
        votingPower,
        currentBlock: Number(currentBlock),
      };
    },
  });
}

async function readRegistryAddress() {
  return publicClient.readContract({
    address: governorAddress!,
    abi: dunaGovernorAbi,
    functionName: "memberRegistry",
  });
}

export type DunaMember = {
  discordId: string;
  username: string;
  /** Unix timestamp the member was added */
  since: number;
};

/** Current DUNA members from the on-chain registry (source of truth). */
export function useDunaMembers() {
  return useQuery({
    queryKey: ["duna-members", governorAddress],
    enabled: !!governorAddress,
    refetchInterval: 60_000,
    queryFn: async (): Promise<DunaMember[]> => {
      const registry = await readRegistryAddress();
      const members = await publicClient.readContract({
        address: registry,
        abi: dunaMemberRegistryAbi,
        functionName: "getMembers",
      });
      return members
        .map((m) => ({ discordId: m.discordId.toString(), username: m.username, since: Number(m.since) }))
        .sort((a, b) => a.since - b.since);
    },
  });
}

export type DunaMemberStatus = {
  isMember: boolean;
  since: number | null;
  /** Latest membership proposal for this user, if still open (pending/active/passed-not-applied). */
  openProposalId: string | null;
  openProposalState: ProposalState | null;
};

const OPEN_STATES: ProposalState[] = [ProposalState.Pending, ProposalState.Active, ProposalState.Succeeded];

/** Registry membership + any open proposal for a Discord user — mirrors the contract's propose checks. */
export function useDunaMemberStatus(discordId: string | null | undefined) {
  return useQuery({
    queryKey: ["duna-member-status", governorAddress, discordId],
    enabled: !!governorAddress && !!discordId,
    queryFn: async (): Promise<DunaMemberStatus> => {
      const id = BigInt(discordId!);
      const registry = await readRegistryAddress();
      const [member, latest] = await Promise.all([
        publicClient.readContract({ address: registry, abi: dunaMemberRegistryAbi, functionName: "getMember", args: [id] }),
        publicClient.readContract({
          address: governorAddress!,
          abi: dunaGovernorAbi,
          functionName: "latestMembershipProposal",
          args: [id],
        }),
      ]);

      let openProposalId: string | null = null;
      let openProposalState: ProposalState | null = null;
      if (latest !== 0n) {
        const state = Number(
          await publicClient.readContract({
            address: governorAddress!,
            abi: dunaGovernorAbi,
            functionName: "state",
            args: [latest],
          }),
        ) as ProposalState;
        if (OPEN_STATES.includes(state)) {
          openProposalId = latest.toString();
          openProposalState = state;
        }
      }

      const isMember = member.discordId !== 0n;
      return { isMember, since: isMember ? Number(member.since) : null, openProposalId, openProposalState };
    },
  });
}

/** Batched on-chain `state()` for a list of proposals (keyed by proposal ID). */
export function useDunaProposalStates(proposalIds: string[]) {
  return useQuery({
    queryKey: ["duna-proposal-states", governorAddress, proposalIds],
    enabled: !!governorAddress && proposalIds.length > 0,
    refetchInterval: 30_000,
    queryFn: async () => {
      // LCAI chains have no Multicall3, so these are parallel single reads.
      const results = await Promise.allSettled(
        proposalIds.map((id) =>
          publicClient.readContract({
            address: governorAddress!,
            abi: dunaGovernorAbi,
            functionName: "state",
            args: [BigInt(id)],
          }),
        ),
      );
      const states: Record<string, ProposalState> = {};
      results.forEach((r, i) => {
        if (r.status === "fulfilled") states[proposalIds[i]] = Number(r.value) as ProposalState;
      });
      return states;
    },
  });
}

export function useDunaGovernor() {
  const { address } = useConnection();

  const proposeMembership = useCallback(
    async (params: {
      discordId: string;
      discordUsername: string;
      action: MembershipAction;
      description: string;
    }) => {
      if (!governorAddress) throw new Error("DUNA governor is not configured");
      if (!address) throw new Error("Wallet not connected");

      const args = [
        BigInt(params.discordId),
        params.discordUsername,
        params.action,
        params.description,
      ] as const;

      const { request } = await publicClient.simulateContract({
        address: governorAddress,
        abi: dunaGovernorAbi,
        functionName: "proposeMembership",
        args,
        account: address,
      });

      const walletClient = await getDunaWalletClient();
      const hash = await withTimeout(
        walletClient.writeContract(request),
        60_000,
        "Wallet did not respond in time. Please check your wallet app and try again.",
      );
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("Transaction reverted");

      for (const log of receipt.logs) {
        if (log.address.toLowerCase() !== governorAddress.toLowerCase()) continue;
        try {
          const event = decodeEventLog({ abi: dunaGovernorAbi, data: log.data, topics: log.topics });
          if (event.eventName === "MembershipProposalCreated") {
            return { proposalId: event.args.proposalId.toString(), hash };
          }
        } catch {
          // not a DUNA governor event we care about
        }
      }
      throw new Error("Proposal created but its ID could not be read from the receipt");
    },
    [address],
  );

  const castVote = useCallback(
    async (proposalId: string, support: 0 | 1 | 2, reason?: string) => {
      if (!governorAddress) throw new Error("DUNA governor is not configured");
      if (!address) throw new Error("Wallet not connected");

      const common = { address: governorAddress, abi: dunaGovernorAbi, account: address } as const;
      const walletClient = await getDunaWalletClient();

      let write: Promise<`0x${string}`>;
      if (reason) {
        const { request } = await publicClient.simulateContract({
          ...common,
          functionName: "castVoteWithReason",
          args: [BigInt(proposalId), support, reason],
        });
        write = walletClient.writeContract(request);
      } else {
        const { request } = await publicClient.simulateContract({
          ...common,
          functionName: "castVote",
          args: [BigInt(proposalId), support],
        });
        write = walletClient.writeContract(request);
      }

      const hash = await withTimeout(
        write,
        60_000,
        "Wallet did not respond in time. Please check your wallet app and try again.",
      );
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("Transaction reverted");
      return receipt;
    },
    [address],
  );

  /** Applies a passed membership proposal to the registry. Anyone can call it. */
  const executeMembership = useCallback(
    async (proposalId: string) => {
      if (!governorAddress) throw new Error("DUNA governor is not configured");
      if (!address) throw new Error("Wallet not connected");

      const { request } = await publicClient.simulateContract({
        address: governorAddress,
        abi: dunaGovernorAbi,
        functionName: "executeMembership",
        args: [BigInt(proposalId)],
        account: address,
      });
      const walletClient = await getDunaWalletClient();
      const hash = await withTimeout(
        walletClient.writeContract(request),
        60_000,
        "Wallet did not respond in time. Please check your wallet app and try again.",
      );
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("Transaction reverted");
      return receipt;
    },
    [address],
  );

  return { proposeMembership, castVote, executeMembership };
}

export function estimateBlockTime(block: number, currentBlock: number) {
  return Math.floor(Date.now() / 1000) + (block - currentBlock) * dunaConfig.blockTimeSeconds;
}
