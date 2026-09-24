/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApolloClient, HttpLink, InMemoryCache, gql } from "@apollo/client";
import { ProposalState } from "@/lib/constents";
import dunaConfig, { MembershipAction } from "@/config/duna";

/**
 * Data access for DUNA Members governance. Deliberately separate from the main
 * DAO api (`createApi`): it always queries the `duna` indexer and selects the
 * membership fields that only exist on DUNA proposals.
 */

const DUNA_PROPOSAL_FIELDS = `
  id
  proposal_id
  author { id }
  quorum
  metadata { title body }
  start_time
  start_block_number
  end_time
  end_block_number
  snapshot
  vp_decimals
  scores_1
  scores_2
  scores_3
  scores_1_parsed
  scores_2_parsed
  scores_3_parsed
  scores_total_parsed
  created
  tx
  vote_count
  executed
  cancelled
  membership_discord_id
  membership_discord_username
  membership_action
`;

const DUNA_PROPOSALS_QUERY = gql`
  query DunaProposals($indexer: String!, $first: Int!, $skip: Int!, $where: Proposal_filter) {
    proposals(
      indexer: $indexer
      first: $first
      skip: $skip
      where: $where
      orderBy: created
      orderDirection: desc
    ) {
      ${DUNA_PROPOSAL_FIELDS}
    }
  }
`;

const DUNA_PROPOSAL_QUERY = gql`
  query DunaProposal($indexer: String!, $id: String!) {
    proposal(indexer: $indexer, id: $id) {
      ${DUNA_PROPOSAL_FIELDS}
    }
  }
`;

const DUNA_VOTES_QUERY = gql`
  query DunaVotes($indexer: String!, $first: Int!, $skip: Int!, $where: Vote_filter) {
    votes(
      indexer: $indexer
      first: $first
      skip: $skip
      where: $where
      orderBy: vp
      orderDirection: desc
    ) {
      id
      voter { id }
      metadata { reason }
      vp_parsed
      choice
      created
      tx
    }
  }
`;

export type DunaProposal = {
  id: string;
  proposalId: string;
  governor: string;
  author: string;
  title: string;
  body: string;
  discordId: string | null;
  discordUsername: string | null;
  action: MembershipAction | null;
  quorum: number;
  scores: { for: number; against: number; abstain: number; total: number };
  startTime: number;
  endTime: number;
  startBlock: number;
  endBlock: number;
  created: number;
  tx: string;
  voteCount: number;
  cancelled: boolean;
  executed: boolean;
  /** Estimated from indexed timestamps — use on-chain `state()` where exact status matters. */
  state: ProposalState;
};

export type DunaVote = {
  id: string;
  voter: string;
  /** Indexer format: 1 = for, 2 = against, 3 = abstain */
  choice: number;
  vp: number;
  reason: string;
  created: number;
  tx: string;
};

export type DiscordMember = {
  id: string;
  username: string;
  globalName: string | null;
  nick: string | null;
  avatarUrl: string;
};

function estimateState(p: any, now: number): ProposalState {
  const quorum = BigInt(p.quorum);
  const scoresFor = BigInt(p.scores_1);
  const scoresAgainst = BigInt(p.scores_2);
  const scoresAbstain = BigInt(p.scores_3);

  if (p.executed) return ProposalState.Executed;
  if (p.cancelled) return ProposalState.Canceled;
  if (p.start_time > now) return ProposalState.Pending;
  if (p.end_time > now) return ProposalState.Active;
  if (scoresFor + scoresAbstain < quorum) return ProposalState.Defeated;
  return scoresFor > scoresAgainst ? ProposalState.Succeeded : ProposalState.Defeated;
}

function formatProposal(p: any, now: number): DunaProposal {
  const decimals = p.vp_decimals ?? 18;
  const action =
    p.membership_action === null || p.membership_action === undefined
      ? null
      : (Number(p.membership_action) as MembershipAction);

  return {
    id: p.id,
    proposalId: String(p.proposal_id),
    governor: p.id.split("/")[0],
    author: p.author.id,
    title: p.metadata?.title ?? `Proposal #${String(p.proposal_id).slice(0, 8)}`,
    body: p.metadata?.body ?? "",
    discordId: p.membership_discord_id ?? null,
    discordUsername: p.membership_discord_username ?? null,
    action,
    quorum: Number(BigInt(p.quorum) / 10n ** BigInt(decimals)),
    scores: {
      for: Number(p.scores_1_parsed ?? 0),
      against: Number(p.scores_2_parsed ?? 0),
      abstain: Number(p.scores_3_parsed ?? 0),
      total: Number(p.scores_total_parsed ?? 0),
    },
    startTime: Number(p.start_time),
    endTime: Number(p.end_time),
    startBlock: Number(p.start_block_number ?? p.snapshot ?? 0),
    endBlock: Number(p.end_block_number ?? 0),
    created: Number(p.created),
    tx: p.tx,
    voteCount: Number(p.vote_count ?? 0),
    cancelled: !!p.cancelled,
    executed: !!p.executed,
    state: estimateState(p, now),
  };
}

/** @param apiUrl lcai-dao-api base URL (GraphQL at `/graphql`, REST at `/api`) */
export function createDunaApi(apiUrl: string) {
  const apollo = new ApolloClient({
    link: new HttpLink({ uri: `${apiUrl}/graphql` }),
    cache: new InMemoryCache(),
  });
  const indexer = dunaConfig.indexer;
  const governor = dunaConfig.governor?.toLowerCase();

  return {
    loadProposals: async ({ limit = 50, skip = 0 } = {}): Promise<DunaProposal[]> => {
      if (!governor) return [];
      const { data } = await apollo.query<any>({
        query: DUNA_PROPOSALS_QUERY,
        fetchPolicy: "network-only",
        variables: { indexer, first: limit, skip, where: { space: governor } },
      });
      const now = Math.floor(Date.now() / 1000);
      return (data?.proposals ?? []).map((p: any) => formatProposal(p, now));
    },

    loadProposal: async (proposalId: string): Promise<DunaProposal | null> => {
      if (!governor) return null;
      const { data } = await apollo.query<any>({
        query: DUNA_PROPOSAL_QUERY,
        fetchPolicy: "network-only",
        variables: { indexer, id: `${governor}/${proposalId}` },
      });
      if (!data?.proposal) return null;
      return formatProposal(data.proposal, Math.floor(Date.now() / 1000));
    },

    loadVotes: async (proposalId: string, { limit = 100, skip = 0 } = {}): Promise<DunaVote[]> => {
      const { data } = await apollo.query<any>({
        query: DUNA_VOTES_QUERY,
        fetchPolicy: "network-only",
        variables: { indexer, first: limit, skip, where: { proposal: proposalId } },
      });
      return (data?.votes ?? []).map((v: any) => ({
        id: v.id,
        voter: v.voter.id,
        choice: Number(v.choice),
        vp: Number(v.vp_parsed ?? 0),
        reason: v.metadata?.reason ?? "",
        created: Number(v.created),
        tx: v.tx,
      }));
    },

    searchDiscordMembers: async (query: string, signal?: AbortSignal): Promise<DiscordMember[]> => {
      const res = await fetch(
        `${apiUrl}/api/discord/members/search?q=${encodeURIComponent(query)}&limit=10`,
        { signal },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Discord search failed (${res.status})`);
      return body.members ?? [];
    },

    loadDiscordMember: async (id: string): Promise<DiscordMember | null> => {
      const res = await fetch(`${apiUrl}/api/discord/members/${id}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Discord lookup failed (${res.status})`);
      const body = await res.json();
      return body.member ?? body ?? null;
    },
  };
}

export type DunaApi = ReturnType<typeof createDunaApi>;
