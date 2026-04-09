import { ApiProposal, ApiVote } from "@/graphqlApi/types";
import { AbiFunction } from "viem";

export type Token = {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
};

export type AbiObjectType = {
  type: string;
  stateMutability: string;
  name: string;
  inputs: {
    internalType: "address" | "uint256" | "string" | "bytes";
    type: string;
    name: string;
  }[];
  outputs: {
    internalType: "address" | "uint256" | "string" | "bytes";
    type: string;
    name: string;
  }[];
};

export type AbiType = AbiObjectType[];

export type Address = `0x${string}`;

export type ReadContractItemTypeAbi = AbiObjectType & {
  type: "function";
  stateMutability: "view";
};

export type WriteContractItemTypeAbi = AbiObjectType & {
  type: "function";
  stateMutability: "payable" | "nonpayable";
};

export type ContractItemType = {
  id: string;
  name: string;
  chainId: number;
  address: Address;
  abi: AbiType;
};

export type ContractAction = {
  id: string;
  type: "send" | "contract";
  target: `0x${string}`;
  abiOption?: string;
  abi?: AbiFunction[];
  method?: string;
  value?: string;
  args?: Record<string, string>;
};

export type BaseTransaction = {
  to: `0x${string}`;
  calldata: `0x${string}`;
  value: string;
  salt: string;
};

export type RawTransaction = BaseTransaction & {
  _type: "raw";
};

export type PaginationOpts = { limit: number; skip?: number };

export type ProposalSortOption =
  | "priority-desc"
  | "created-desc"
  | "created-asc"
  | "vote_count-desc"
  | "vote_count-asc"
  | "scores_total-desc"
  | "scores_total-asc";

export type ProposalsFilter = {
  state?: "any" | "active" | "pending" | "closed";
  labels?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} & Record<string, any>;

export type SimulationAction = {
  action_index: number;
  target: string;
  function_selector: string | null; // Full signature like "approve(address,uint256)" from indexer
  status: "passed" | "failed";
  tenderly_simulation_id: string | null;
  tenderly_sandbox_url: string | null;
  error_message: string | null;
  simulated_at: number;
};

export type DecodedParameter = {
  name: string;
  type: string;
  value: string;
};

export type DecodedCalldata = {
  signature: string;
  parameters: DecodedParameter[];
};

export type DecodedExecution = {
  value: string;
  target: `0x${string}`;
  calldata: `0x${string}`;
  signature: string | null;
  type: "custom" | "transfer";
  decodedCalldata: DecodedCalldata | null;
  offchaindata: unknown | null;
};

export type Proposal = ApiProposal & {
  author: {
    id: string;
  };
  choices: string[];
  labels: string[];
  scores: [number, number, number];
  title: string;
  body: string;
  discussion: string;
  executions: (RawTransaction | DecodedExecution)[];
  simulations: SimulationAction[];
  state: number;
  quorum_parsed: number;
};

export type ProposalMetadataItem = {
  id: string;
  title: string;
  body: string;
  discussion: string;
  execution: string;
  choices: string[];
  labels: string[];
};

export type Vote = ApiVote;

export type Leaderboard = {
  id: string;
  user: User;
  proposal_count: number;
  vote_count: number;
};

export type User = {
  id: string;
  created: number;
  proposalCount?: number;
  voteCount?: number;
  updated?: number;
  displayName?: string | null;
  bio?: string | null;
  statement?: string | null;
  avatarUrl?: string | null;
  twitter?: string | null;
  discord?: string | null;
  github?: string | null;
  website?: string | null;
};

export type UserActivity = {
  id: string;
  name?: string;
  proposal_count: number;
  vote_count: number;
};

export type Delegate = {
  id: string;
  address: string;
  votingPower: string;
  votingPowerParsed: number;
  delegatorCount: number;
  created: number;
  updated: number;
  user: User | null;
};

export type Delegation = {
  id: string;
  delegator: string;
  delegate: string;
  created: number;
  tx: string;
};

export type TreasuryTransaction = {
  id: string;
  type: string;
  token: string;
  tokenSymbol: string;
  tokenDecimals: number;
  amount: string;
  amountParsed: number;
  fromAddress: string;
  toAddress: string;
  created: number;
  tx: string;
};

export type SpaceStats = {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  token: string | null;
  proposalCount: number;
  voteCount: number;
  proposerCount: number;
  voterCount: number;
  delegateCount: number;
  quorum: string;
  proposalThreshold: string;
  votingDelay: number;
  timelockDelay: string;
  created: number;
};
