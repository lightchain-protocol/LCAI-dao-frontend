/* eslint-disable @typescript-eslint/no-explicit-any */
import { BASIC_CHOICES, ProposalState } from "@/lib/constents";
import {
  Delegate,
  Delegation,
  PaginationOpts,
  Proposal,
  ProposalSortOption,
  ProposalsFilter,
  RawTransaction,
  DecodedExecution,
  SimulationAction,
  SpaceStats,
  TreasuryTransaction,
  Vote,
  User,
} from "@/types";
import { ApiDelegate, ApiProposal } from "./types";
import type {
  OrderDirection,
  Proposal_OrderBy,
  TreasuryTransaction_OrderBy,
} from "./gql/graphql";
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import {
  DELEGATES_QUERY,
  DELEGATE_QUERY,
  LAST_INDEXED_BLOCK_QUERY,
  PROPOSAL_QUERY,
  PROPOSALS_QUERY,
  SPACE_QUERY,
  TREASURY_TRANSACTIONS_QUERY,
  USER_DELEGATION_QUERY,
  USER_QUERY,
  USER_VOTES_QUERY,
  VOTES_QUERY,
} from "./queries";
import { clone } from "@/lib/utils";
import { formatUnits } from "viem";

const getProposalState = (proposal: ApiProposal, current: number) => {
  const quorum = BigInt(proposal.quorum);
  const scoresFor = BigInt(proposal.scores_1);
  const scoresAgainst = BigInt(proposal.scores_2);
  const scoresAbstain = BigInt(proposal.scores_3);
  const currentQuorum = scoresFor + scoresAbstain;

  if (proposal.executed) return ProposalState.Executed;
  if (proposal.execution_ready) return ProposalState.Queued;

  if (proposal.end_time <= current) {
    if (currentQuorum < quorum) return ProposalState.Defeated;
    return scoresFor > scoresAgainst
      ? ProposalState.Succeeded
      : ProposalState.Defeated;
  }

  if (proposal.cancelled) return ProposalState.Canceled;

  if (proposal.start_time > current) return ProposalState.Pending;

  return ProposalState.Active;
};

function formatExecution(
  execution: string
): (RawTransaction | DecodedExecution)[] {
  if (execution === "") return [];

  try {
    const result = JSON.parse(execution);

    if (!Array.isArray(result)) return [];

    // Handle both old RawTransaction format and new DecodedExecution format
    return result.map((item) => {
      // New DecodedExecution format has 'target' instead of 'to'
      if ("target" in item) {
        return item as DecodedExecution;
      }
      // Old RawTransaction format has 'to'
      return item as RawTransaction;
    });
  } catch (error) {
    console.error("Failed to parse execution", error);
    return [];
  }
}

function formatSimulation(
  simulation: string | null | undefined
): SimulationAction[] {
  if (!simulation) return [];

  try {
    const result = JSON.parse(simulation);
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Failed to parse simulation", error);
    return [];
  }
}

function mapGraphQLUser(u: {
  id: string;
  proposal_count?: number;
  vote_count?: number;
  created?: number;
  updated?: number;
  display_name?: string | null;
  bio?: string | null;
  statement?: string | null;
  avatar_url?: string | null;
  twitter?: string | null;
  discord?: string | null;
  github?: string | null;
  website?: string | null;
}): User {
  return {
    id: u.id,
    created: u.created ?? 0,
    proposalCount: u.proposal_count ?? 0,
    voteCount: u.vote_count ?? 0,
    updated: u.updated ?? u.created ?? 0,
    displayName: u.display_name ?? null,
    bio: u.bio ?? null,
    statement: u.statement ?? null,
    avatarUrl: u.avatar_url ?? null,
    twitter: u.twitter ?? null,
    discord: u.discord ?? null,
    github: u.github ?? null,
    website: u.website ?? null,
  };
}

function formatProposal(proposal: ApiProposal, current: number): Proposal {
  const state = getProposalState(proposal, current);

  return {
    ...proposal,
    author: {
      id: proposal.author.id,
    },
    choices: proposal.metadata?.choices ?? BASIC_CHOICES,
    labels: proposal.metadata?.labels ?? [],
    scores: [
      proposal.scores_1_parsed,
      proposal.scores_2_parsed,
      proposal.scores_3_parsed,
    ],
    title: proposal.metadata?.title ?? `Proposal #${proposal.proposal_id}`,
    body: proposal.metadata?.body ?? "",
    discussion: proposal.metadata?.discussion ?? "",
    executions: formatExecution(proposal.metadata?.execution),
    simulations: formatSimulation(proposal.metadata?.simulation),
    state,
    quorum_parsed: +formatUnits(proposal.quorum, proposal.vp_decimals),
  };
}

export function createApi(uri: string) {
  const httpLink = new HttpLink({ uri });

  const apollo = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(),
  });

  return {
    apiUrl: uri,
    loadProposalVotes: async (
      proposal: Proposal,
      { limit, skip = 0 }: PaginationOpts,
      filter: "any" | "for" | "against" | "abstain" = "any",
      sortBy: "vp-desc" | "vp-asc" | "created-desc" | "created-asc" = "vp-desc"
    ): Promise<Vote[]> => {
      const filters: Record<string, any> = {};
      if (filter === "for") {
        filters.choice = 1;
      } else if (filter === "against") {
        filters.choice = 2;
      } else if (filter === "abstain") {
        filters.choice = 3;
      }

      const [orderBy, orderDirection] = sortBy.split("-") as [
        "vp" | "created",
        "desc" | "asc"
      ];

      const { data } = await apollo.query({
        query: VOTES_QUERY,
        fetchPolicy: "network-only",
        variables: {
          indexer: "mainnet",
          first: limit,
          skip,
          orderBy,
          orderDirection,
          where: {
            proposal: proposal.proposal_id,
            ...filters,
          },
        },
      });

      return data?.votes || [];
    },
    loadUserVotes: async (
      voter: string,
      { limit, skip = 0 }: PaginationOpts
    ): Promise<{ [key: string]: Vote }> => {
      const { data } = await apollo.query({
        query: USER_VOTES_QUERY,
        fetchPolicy: "network-only",
        variables: {
          indexer: "mainnet",
          voter: voter.toLowerCase(),
          first: limit,
          skip,
        },
      });

      return Object.fromEntries(
        data?.votes?.map((vote) => [vote.proposal, vote]) || []
      );
    },
    loadProposals: async (
      { limit, skip = 0 }: PaginationOpts,
      current: number,
      filters?: ProposalsFilter,
      searchQuery = "",
      sortBy: ProposalSortOption = "created-desc"
    ): Promise<Proposal[]> => {
      const _filters: ProposalsFilter = clone(filters || {});

      const metadataFilters: Record<string, any> = {};
      if (searchQuery) metadataFilters.title_contains_nocase = searchQuery;

      const state = _filters.state;

      if (state === "active") {
        _filters.start_time_lte = current;
        _filters.end_time_gte = current;
      } else if (state === "pending") {
        _filters.start_time_gt = current;
      } else if (state === "closed") {
        _filters.end_time_lt = current;
      }

      delete _filters.state;

      if (_filters.labels?.length) {
        metadataFilters.labels_contains = _filters.labels;
      }

      delete _filters.labels;

      // Parse sort option into orderBy + orderDirection
      const [orderBy, orderDirection] = sortBy.split("-") as [
        Proposal_OrderBy,
        OrderDirection
      ];

      const cancelledFilter =
        "cancelled" in _filters ? _filters.cancelled : false;
      delete _filters.cancelled;

      if (cancelledFilter) delete _filters.end_time_lt;

      const { data } = await apollo.query({
        query: PROPOSALS_QUERY,
        fetchPolicy: "network-only",
        variables: {
          first: limit,
          skip,
          orderBy,
          orderDirection,
          where: {
            cancelled: cancelledFilter,
            metadata_: Object.keys(metadataFilters).length
              ? metadataFilters
              : undefined,
            ..._filters,
          },
        },
      });

      return (
        data?.proposals?.map((proposal) => formatProposal(proposal, current)) ??
        []
      );
    },
    loadProposal: async (
      proposalId: string,
      current: number
    ): Promise<Proposal | null> => {
      const [{ data }] = await Promise.all([
        apollo.query({
          query: PROPOSAL_QUERY,
          fetchPolicy: "network-only",
          variables: { id: proposalId.toLowerCase() },
        }),
      ]);

      if (!data?.proposal) return null;

      return formatProposal(data.proposal, current);
    },
    loadUser: async (id: string): Promise<User | null> => {
      const result = await apollo.query({
        query: USER_QUERY as import("@apollo/client").DocumentNode,
        fetchPolicy: "network-only",
        variables: { indexer: "mainnet", id: id.toLowerCase() },
      });
      const data = result.data as
        | { user?: Parameters<typeof mapGraphQLUser>[0] }
        | null
        | undefined;
      if (!data?.user) return null;
      return mapGraphQLUser(data.user);
    },
    async loadLastIndexedBlock(): Promise<number | null> {
      const { data } = await apollo.query({
        query: LAST_INDEXED_BLOCK_QUERY,
        fetchPolicy: "network-only",
        variables: { indexer: "mainnet" },
      });
      return data?._metadata?.value ? Number(data._metadata.value) : null;
    },
    loadDelegates: async (
      spaceId: string,
      { limit, skip = 0 }: PaginationOpts,
      sortBy:
        | "voting_power-desc"
        | "voting_power-asc"
        | "delegator_count-desc"
        | "delegator_count-asc"
        | "created-desc"
        | "created-asc" = "voting_power-desc"
    ): Promise<Delegate[]> => {
      const [orderBy, orderDirection] = sortBy.split("-") as [
        "voting_power" | "delegator_count" | "created",
        "desc" | "asc"
      ];

      const { data } = await apollo.query({
        query: DELEGATES_QUERY,
        fetchPolicy: "network-only",
        variables: {
          indexer: "mainnet",
          first: limit,
          skip,
          orderBy,
          orderDirection,
          where: {
            space: spaceId.toLowerCase(),
          },
        },
      });

      return (
        data?.delegates?.map((delegate: ApiDelegate) => ({
          id: delegate.id,
          address: delegate.user?.id ?? "",
          votingPower: delegate.voting_power,
          votingPowerParsed: delegate.voting_power_parsed,
          delegatorCount: delegate.delegator_count,
          created: delegate.created,
          updated: delegate.updated,
          user: delegate.user
            ? mapGraphQLUser(
                delegate.user as Parameters<typeof mapGraphQLUser>[0]
              )
            : null,
        })) || []
      );
    },
    loadDelegate: async (
      spaceId: string,
      delegateAddress: string
    ): Promise<Delegate | null> => {
      const delegateId = `${spaceId}/${delegateAddress}`.toLowerCase();
      const { data } = await apollo.query({
        query: DELEGATE_QUERY,
        fetchPolicy: "network-only",
        variables: { indexer: "mainnet", id: delegateId },
      });

      if (!data?.delegate) return null;

      const d = data.delegate;
      return {
        id: d.id,
        address: d.user?.id ?? "",
        votingPower: d.voting_power,
        votingPowerParsed: d.voting_power_parsed,
        delegatorCount: d.delegator_count,
        created: d.created,
        updated: d.updated,
        user: d.user
          ? mapGraphQLUser(d.user as Parameters<typeof mapGraphQLUser>[0])
          : null,
      };
    },
    loadUserDelegation: async (
      spaceId: string,
      userAddress: string
    ): Promise<Delegation | null> => {
      const delegationId = `${spaceId}/${userAddress}`.toLowerCase();
      const { data } = await apollo.query({
        query: USER_DELEGATION_QUERY,
        fetchPolicy: "network-only",
        variables: { indexer: "mainnet", id: delegationId },
      });

      if (!data?.delegation) return null;

      const delegation = data.delegation;
      return {
        id: delegation.id,
        delegator: delegation.delegator.id,
        delegate: delegation.delegate,
        created: delegation.created,
        tx: delegation.tx,
      };
    },
    loadTreasuryTransactions: async (
      { limit, skip = 0 }: PaginationOpts,
      sortBy: "created-desc" | "created-asc" = "created-desc"
    ): Promise<TreasuryTransaction[]> => {
      const [orderBy, orderDirection] = sortBy.split("-") as [
        TreasuryTransaction_OrderBy,
        OrderDirection
      ];

      const { data } = await apollo.query({
        query: TREASURY_TRANSACTIONS_QUERY,
        fetchPolicy: "network-only",
        variables: {
          first: limit,
          skip,
          orderBy,
          orderDirection,
        },
      });

      return (
        data?.treasurytransactions?.map((tx) => ({
          id: tx.id,
          type: tx.type,
          token: tx.token,
          tokenSymbol: tx.token_symbol,
          tokenDecimals: tx.token_decimals,
          amount: tx.amount,
          amountParsed: tx.amount_parsed,
          fromAddress: tx.from_address,
          toAddress: tx.to_address,
          created: tx.created,
          tx: tx.tx,
        })) || []
      );
    },
    loadSpaceStats: async (spaceId: string): Promise<SpaceStats | null> => {
      const { data } = await apollo.query({
        query: SPACE_QUERY,
        fetchPolicy: "network-only",
        variables: { indexer: "mainnet", id: spaceId.toLowerCase() },
      });

      if (!data?.space) return null;

      const space = data.space;
      return {
        id: space.id,
        name: space.name,
        symbol: space.symbol,
        decimals: space.decimals,
        token: space.token,
        proposalCount: space.proposal_count,
        voteCount: space.vote_count,
        proposerCount: space.proposer_count,
        voterCount: space.voter_count,
        delegateCount: space.delegate_count,
        quorum: space.quorum,
        proposalThreshold: space.proposal_threshold,
        votingDelay: space.voting_delay,
        timelockDelay: space.timelock_delay,
        created: space.created,
      };
    },
  };
}
