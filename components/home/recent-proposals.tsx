"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useConnection } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/common/Button";
import { ProposalListItem } from "@/components/proposal/proposal-list-item";
import { useGovernorHasVotedBatch } from "@/hooks/useGovernorHasVotedBatch";
import { getWalletVoteStatusOnActive } from "@/lib/getWalletVoteStatusOnActive";
import { sortProposalsByPriorityDesc } from "@/lib/sortProposalsByPriorityDesc";
import { ArrowRight } from "lucide-react";
import type { Proposal } from "@/types";

interface RecentProposalsProps {
  proposals: Proposal[];
  isLoading?: boolean;
  onViewAll?: () => void;
}

export function RecentProposals({
  proposals,
  isLoading,
  onViewAll,
}: RecentProposalsProps) {
  const { address, isConnected } = useConnection();

  const proposalIdsForVoteLookup = useMemo(
    () => proposals.map((p) => p.proposal_id),
    [proposals],
  );

  const { byProposalId, isLoading: voteBatchLoading } =
    useGovernorHasVotedBatch(proposalIdsForVoteLookup);

  const recentProposals = useMemo(() => {
    const sorted = sortProposalsByPriorityDesc(proposals, {
      isConnected,
      address,
      byProposalId,
      voteBatchLoading,
    });
    return sorted.slice(0, 3);
  }, [proposals, isConnected, address, byProposalId, voteBatchLoading]);

  return (
    <Card className="gap-0 py-0 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-border-default">
        <CardTitle>Recent Proposals</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={onViewAll}
          className="text-content-secondary hover:text-content-primary"
        >
          View all
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : recentProposals.length > 0 ? (
          <div className="divide-y divide-border-default">
            {recentProposals.map((proposal) => (
              <ProposalListItem
                key={proposal.id}
                proposal={proposal}
                isStatusBadge={false}
                walletHasVotedOnActive={getWalletVoteStatusOnActive(
                  proposal.state,
                  isConnected,
                  address,
                  voteBatchLoading,
                  byProposalId,
                  proposal.proposal_id,
                )}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-content-secondary">No proposals yet</p>
            <Link
              href="/proposal/create"
              className="mt-2 text-sm text-primary hover:underline"
            >
              Create the first proposal
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
