"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useConnection } from "wagmi";
import { Clock, Plus, ShieldCheck, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import dunaConfig, { isDunaConfigured } from "@/config/duna";
import useDunaApi from "@/hooks/useDunaApi";
import {
  useDunaGovernorParams,
  useDunaMembers,
  useDunaProposalStates,
  useDunaVotingPower,
} from "@/hooks/useDunaGovernor";
import { DunaMembersList } from "./duna-members-list";
import type { DunaProposal } from "@/graphqlApi/duna";
import { ProposalState } from "@/lib/constents";
import { cn, compactNumber, formatNumber } from "@/lib/utils";
import $dayjs from "@/lib/dayjs";
import {
  DiscordIdentity,
  DunaResultsBar,
  DunaStatusBadge,
  MembershipActionBadge,
} from "./duna-shared";

type Filter = "all" | "active" | "to apply" | "closed";
type View = "proposals" | "members";

function DunaProposalCard({ proposal }: { proposal: DunaProposal }) {
  const isOpen =
    proposal.state === ProposalState.Pending ||
    proposal.state === ProposalState.Active;
  return (
    <Link
      href={`/duna/proposal/${proposal.proposalId}`}
      className="block px-6 py-5 transition-colors hover:bg-surface-soft"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          {proposal.discordId ? (
            <DiscordIdentity
              discordId={proposal.discordId}
              fallbackUsername={proposal.discordUsername}
              warnOnMismatch
            />
          ) : (
            <div className="font-semibold text-content-primary truncate">
              {proposal.title}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <MembershipActionBadge action={proposal.action} />
          <DunaStatusBadge state={proposal.state} />
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <DunaResultsBar
          scores={proposal.scores}
          quorum={proposal.quorum}
          compact
        />
        <div className="flex items-center gap-4 text-sm text-content-secondary md:justify-end">
          <span className="inline-flex items-center gap-1">
            <Users className="size-4" />
            {proposal.voteCount} voters
          </span>
          {isOpen && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-4" />
              {proposal.state === ProposalState.Pending
                ? `Starts ${$dayjs.unix(proposal.startTime).fromNow()}`
                : `Ends ${$dayjs.unix(proposal.endTime).fromNow()}`}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function DunaSidebar() {
  const { isConnected } = useConnection();
  const { data: params, isLoading } = useDunaGovernorParams();
  const { data: votingPower } = useDunaVotingPower();
  const { data: members } = useDunaMembers();
  const canPropose =
    params &&
    votingPower !== undefined &&
    votingPower >= params.proposalThreshold;

  const periodDays = params
    ? (params.votingPeriodBlocks * dunaConfig.blockTimeSeconds) / 86400
    : 0;
  const delayHours = params
    ? (params.votingDelayBlocks * dunaConfig.blockTimeSeconds) / 3600
    : 0;

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-5" />
          DUNA Members
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="text-content-secondary">
          LCAI holders vote DUNA team members in or out. Once a vote passes,
          anyone can apply it to the on-chain member registry, and the DUNA team
          handles the off-chain side.
        </p>
        <Separator />
        {isLoading || !params ? (
          <div className="flex justify-center py-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <dl className="space-y-2.5">
            {[
              [
                "Proposal threshold",
                `${formatNumber(params.proposalThreshold)} LCAI`,
              ],
              [
                "Quorum",
                `${params.quorumPercent}% · ${compactNumber(params.quorum)} LCAI`,
              ],
              [
                "Voting delay",
                `~${delayHours.toFixed(1)} h (${formatNumber(params.votingDelayBlocks)} blocks)`,
              ],
              [
                "Voting period",
                `~${periodDays.toFixed(1)} days (${formatNumber(params.votingPeriodBlocks)} blocks)`,
              ],
              ["Current members", members ? String(members.length) : "…"],
              ["Network", dunaConfig.chain.name],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-content-secondary">{k}</dt>
                <dd className="font-medium text-content-primary text-right">
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        )}
        {isConnected && params && (
          <>
            <Separator />
            <div className="flex justify-between gap-4">
              <span className="text-content-secondary">Your voting power</span>
              <span className="font-semibold text-content-primary">
                {votingPower === undefined
                  ? "…"
                  : `${formatNumber(votingPower)} LCAI`}
              </span>
            </div>
            {votingPower !== undefined && !canPropose && (
              <p className="text-xs text-content-secondary">
                You need {formatNumber(params.proposalThreshold)} LCAI on{" "}
                {dunaConfig.chain.name} to open a proposal. You can still vote.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function DunaMembersTab() {
  const api = useDunaApi();
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<View>("proposals");

  // Deep link: /?tab=duna&view=members
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("view") === "members") setView("members");
  }, []);

  const {
    data: indexedProposals = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["duna-proposals", dunaConfig.governor],
    enabled: isDunaConfigured,
    refetchInterval: 30_000,
    queryFn: () => api.loadProposals({ limit: 100 }),
  });

  // Indexed state is a time-based estimate; prefer the governor's on-chain state.
  const { data: chainStates } = useDunaProposalStates(
    indexedProposals.map((p) => p.proposalId),
  );
  const proposals = useMemo(
    () =>
      indexedProposals.map((p) => ({
        ...p,
        state: chainStates?.[p.proposalId] ?? p.state,
      })),
    [indexedProposals, chainStates],
  );

  const filtered = useMemo(() => {
    if (filter === "all") return proposals;
    const voting = (p: DunaProposal) =>
      p.state === ProposalState.Pending || p.state === ProposalState.Active;
    const toApply = (p: DunaProposal) => p.state === ProposalState.Succeeded;
    if (filter === "active") return proposals.filter(voting);
    if (filter === "to apply") return proposals.filter(toApply);
    return proposals.filter((p) => !voting(p) && !toApply(p));
  }, [proposals, filter]);

  if (!isDunaConfigured) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-content-secondary">
          DUNA Members governance is not configured. Set{" "}
          <code>NEXT_PUBLIC_DUNA_GOVERNOR_ADDRESS</code>.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card className="gap-0 py-0 overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-border-default px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-1 rounded-lg bg-surface-soft p-1">
              {(
                [
                  ["proposals", "Proposals"],
                  ["members", "Members"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                    view === v
                      ? "bg-background text-content-primary shadow-sm"
                      : "text-content-secondary hover:text-content-primary",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <Button
              asChild
              className="bg-[image:var(--gradient-primary)] text-white hover:opacity-90"
            >
              <Link href="/duna/create">
                <Plus className="size-4" />
                New proposal
              </Link>
            </Button>
          </div>

          {view === "members" ? (
            <DunaMembersList proposals={proposals} />
          ) : (
            <>
              <div className="flex gap-1 px-6 pt-4">
                {(["all", "active", "to apply", "closed"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "rounded-full px-3 py-1 text-sm capitalize transition-colors",
                      filter === f
                        ? "bg-[image:var(--gradient-primary)] text-white"
                        : "text-content-secondary hover:bg-surface-soft",
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="divide-y divide-border-default">
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : error ? (
                  <div className="px-6 py-10 text-center text-sm text-[#E93544]">
                    Failed to load proposals: {(error as Error).message}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="px-6 py-12 text-center text-content-secondary">
                    {proposals.length === 0
                      ? "No membership proposals yet."
                      : `No ${filter} proposals.`}
                  </div>
                ) : (
                  filtered.map((p) => (
                    <DunaProposalCard key={p.id} proposal={p} />
                  ))
                )}
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="lg:col-span-1">
        <div className="sticky top-6">
          <DunaSidebar />
        </div>
      </div>
    </div>
  );
}
