import {
  DelegateFieldsFragment,
  ProposalFieldsFragment,
  VoteFieldsFragment,
} from "./gql/graphql";

export type ApiVote = VoteFieldsFragment;

export type ApiProposal = ProposalFieldsFragment;

export type ApiDelegate = DelegateFieldsFragment;
