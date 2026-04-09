"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Clock, Users } from "lucide-react";
import { cn, compactNumber } from "@/lib/utils";
import $dayjs from "@/lib/dayjs";
import ProposalStatusBadge from "@/components/proposal/proposal-status-badge";
import { ProposalState, ProposalStateLabel } from "@/lib/constents";
import type { Proposal } from "@/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";

interface ProposalListItemProps {
  proposal: Proposal;
  isStatusBadge?: boolean;
  walletHasVotedOnActive?: boolean | null;
}

type BadgeVariant = NonNullable<React.ComponentProps<typeof Badge>["variant"]>;


export function ProposalListItem({
  proposal,
  isStatusBadge = true,
  walletHasVotedOnActive,
}: ProposalListItemProps) {
  const votingPower = Number(proposal.scores_total_parsed ?? 0);
  const proposalStateLabel = ProposalStateLabel[proposal.state];
  const proposalBadgeVariant = ((proposalStateLabel as BadgeVariant) ?? "default").toLowerCase();

  const voteParticipationBadge =
    proposal.state === ProposalState.Active &&
    (walletHasVotedOnActive === true || walletHasVotedOnActive === false)
      ? { voted: walletHasVotedOnActive }
      : null;

  const isPriorityTierZeroRow =
    !!voteParticipationBadge && !voteParticipationBadge.voted;

  return (
    <Link
      href={`/proposal/${proposal.id}`}
      className={cn(
        "sm:py-8 py-5 px-6 block border-l-2 border-l-transparent transition-all duration-300",
        isPriorityTierZeroRow
          ? "border-l-content-warning-light/50 bg-content-warning-light/[0.045] hover:bg-content-warning-light/[0.08] hover:border-surface-soft/20"
          : "hover:bg-surface-soft hover:border-surface-soft/20",
      )}
    >
      <h3 className="text-content-primary flex gap-3 flex-col md:flex-row items-baseline justify-between font-semibold leading-[1.2] tracking-[-0.24px] sm:text-xl text-lg capitalize">
        <span>
          <ProposalStatusBadge status={proposal.state} />
          {proposal.metadata?.title}
        </span>
        {
          isStatusBadge && (
            <Badge
              variant={proposalBadgeVariant as BadgeVariant}
              className="text-xs md:text-sm"
            >
              <ProposalStatusBadge status={proposal.state} className="mr-0 text-xs md:text-sm" />
              {proposalStateLabel}
            </Badge>
          )}
      </h3>

      <div className="flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-2 mt-4">
        <div className="flex items-center gap-3">
          <span className="sm:text-base text-sm">
            #{proposal.proposal_id.toString().slice(0, 6)}...
          </span>
        </div>
        <span className="hidden sm:block">
          <FontAwesomeIcon icon={faWandMagicSparkles} className="size-3.5" />
        </span>
        <div className="flex items-center gap-1">
          <span className="text-content-primary sm:text-base text-sm">by</span>
          <span className="font-medium sm:text-base text-sm">
            {proposal.author.id.slice(0, 6)}...
            {proposal.author.id.slice(-4)}
          </span>
          <Badge variant="outline" className="text-xs">
            author
          </Badge>
        </div>
        <span className="hidden sm:block">
          <FontAwesomeIcon icon={faWandMagicSparkles} className="size-3.5" />
        </span>
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 sm:text-base text-sm" />
          <span className="whitespace-nowrap sm:text-base text-sm">
            {compactNumber(proposal.vote_count)} voters (
            {compactNumber(votingPower)})
          </span>
        </div>
        {(proposal.state === ProposalState.Pending ||
          proposal.state === ProposalState.Active) && (
            <>
              <span className="hidden sm:block">
                <FontAwesomeIcon icon={faWandMagicSparkles} className="size-3.5" />
              </span>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 sm:text-base text-sm" />
                {proposal.state === ProposalState.Pending ? (
                  <span className="whitespace-nowrap sm:text-base text-sm">
                    Start {$dayjs.unix(Number(proposal.start_time)).fromNow()}
                  </span>
                ) : (
                  proposal.state === ProposalState.Active && (
                    <span className="whitespace-nowrap sm:text-base text-sm">
                      {$dayjs.unix(Number(proposal.end_time)).fromNow()}
                    </span>
                  )
                )}
              </div>
            </>
          )}
        {voteParticipationBadge && (
          <span className="inline-flex items-center gap-x-2 animate-in fade-in-0 duration-300 motion-reduce:animate-none motion-reduce:opacity-100">
            <span className="hidden sm:block">
              <FontAwesomeIcon icon={faWandMagicSparkles} className="size-3.5" />
            </span>
            {voteParticipationBadge.voted ? (
              <Badge
                variant="outline"
                className="text-xs sm:text-sm font-normal border-border-default text-content-success-light"
              >
                ✓ Voted
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium border-content-warning-light/50 bg-transparent text-content-warning-light"
              >
                <span
                  className="size-1.5 shrink-0 rounded-full bg-content-warning-light shadow-[0_0_0_1px_rgba(0,0,0,0.15)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.12)]"
                  aria-hidden
                />
                Not voted
              </Badge>
            )}
          </span>
        )}
      </div>
    </Link>
  );
}
