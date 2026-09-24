"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useConnection } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, ExternalLink, Info, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LoadingBlock from "@/components/loading-block";
import {
  DiscordIdentity,
  DunaResultsBar,
  DunaStatusBadge,
  MembershipActionBadge,
} from "@/components/duna/duna-shared";
import dunaConfig, { MembershipAction } from "@/config/duna";
import useDunaApi from "@/hooks/useDunaApi";
import { estimateBlockTime, useDunaGovernor, useDunaProposalChainState } from "@/hooks/useDunaGovernor";
import { ProposalState } from "@/lib/constents";
import { cn, formatNumber } from "@/lib/utils";
import $dayjs from "@/lib/dayjs";

const SUPPORT_OPTIONS = [
  { value: 1, label: "For", className: "border-[#0FB46A] bg-[#0FB46A]/10 ring-2 ring-[#0FB46A]/30" },
  { value: 0, label: "Against", className: "border-[#E93544] bg-[#E93544]/10 ring-2 ring-[#E93544]/30" },
  { value: 2, label: "Abstain", className: "border-[#98A2B3] bg-[#98A2B3]/10 ring-2 ring-[#98A2B3]/30" },
] as const;

const CHOICE_LABEL: Record<number, string> = { 1: "For", 2: "Against", 3: "Abstain" };
const CHOICE_COLOR: Record<number, string> = { 1: "text-[#0FB46A]", 2: "text-[#E93544]", 3: "text-content-secondary" };

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function explorerTx(tx: string) {
  return `${dunaConfig.chain.blockExplorers?.default.url}/tx/${tx}`;
}

function outcomeNote(state: ProposalState, action: MembershipAction | null) {
  if (action === null) return null;
  const isAdd = action === MembershipAction.Add;
  if (state === ProposalState.Succeeded)
    return {
      tone: "success",
      text: `Passed. Apply the result to ${isAdd ? "add this member to" : "remove this member from"} the on-chain DUNA member registry. Anyone can do this.`,
    };
  if (state === ProposalState.Executed)
    return {
      tone: "success",
      text: `Applied. This member was ${isAdd ? "added to" : "removed from"} the DUNA member registry. The DUNA team handles the off-chain side (legal records, roles, access).`,
    };
  if (state === ProposalState.Defeated)
    return { tone: "muted", text: "Did not pass (quorum not reached or more Against than For). No change will be made." };
  if (state === ProposalState.Canceled) return { tone: "muted", text: "This proposal was canceled." };
  if (state === ProposalState.Expired)
    return {
      tone: "muted",
      text: "Passed, but it was not applied within the execution window and has expired. No change will be made. A new proposal can be created.",
    };
  return null;
}

export default function DunaProposalPage() {
  const { id } = useParams<{ id: string }>();
  const api = useDunaApi();
  const queryClient = useQueryClient();
  const { open } = useAppKit();
  const { isConnected } = useConnection();
  const { castVote, executeMembership } = useDunaGovernor();

  const { data: proposal, isLoading } = useQuery({
    queryKey: ["duna-proposal", id],
    queryFn: () => api.loadProposal(id),
    refetchInterval: 20_000,
  });
  const { data: votes = [] } = useQuery({
    queryKey: ["duna-votes", id],
    queryFn: () => api.loadVotes(id),
    refetchInterval: 20_000,
  });
  const { data: chainState } = useDunaProposalChainState(id);

  const [voteOpen, setVoteOpen] = useState(false);
  const [support, setSupport] = useState<0 | 1 | 2 | null>(null);
  const [reason, setReason] = useState("");
  const [voting, setVoting] = useState(false);
  const [applying, setApplying] = useState(false);

  if (isLoading) return <LoadingBlock />;

  if (!proposal) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="mb-2 text-2xl font-bold">Proposal not found</h1>
        <p className="mb-6 text-content-secondary">It may still be indexing. Try again in a few seconds.</p>
        <Button asChild>
          <Link href="/?tab=duna">Back to DUNA Members</Link>
        </Button>
      </div>
    );
  }

  // On-chain state is authoritative; indexed state is the fallback while it loads.
  const state = chainState?.state ?? proposal.state;
  const isActive = state === ProposalState.Active;
  const startTs = chainState ? estimateBlockTime(chainState.snapshot, chainState.currentBlock) : proposal.startTime;
  const endTs = chainState ? estimateBlockTime(chainState.deadline, chainState.currentBlock) : proposal.endTime;
  const note = outcomeNote(state, proposal.action);

  const handleVote = async () => {
    if (support === null) return;
    setVoting(true);
    try {
      await castVote(proposal.proposalId, support, reason.trim() || undefined);
      toast.success("Vote cast");
      setVoteOpen(false);
      setReason("");
      setSupport(null);
      queryClient.invalidateQueries({ queryKey: ["duna-proposal-chain-state"] });
      queryClient.invalidateQueries({ queryKey: ["duna-proposal", id] });
      queryClient.invalidateQueries({ queryKey: ["duna-votes", id] });
    } catch (e) {
      const err = e as { shortMessage?: string; message?: string };
      toast.error(err.shortMessage || err.message || "Failed to cast vote");
    } finally {
      setVoting(false);
    }
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      await executeMembership(proposal.proposalId);
      toast.success("Result applied to the DUNA member registry");
      queryClient.invalidateQueries({ queryKey: ["duna-proposal-chain-state"] });
      queryClient.invalidateQueries({ queryKey: ["duna-proposal", id] });
      queryClient.invalidateQueries({ queryKey: ["duna-members"] });
      queryClient.invalidateQueries({ queryKey: ["duna-member-status"] });
      queryClient.invalidateQueries({ queryKey: ["duna-proposal-states"] });
    } catch (e) {
      const err = e as { shortMessage?: string; message?: string };
      toast.error(err.shortMessage || err.message || "Failed to apply result");
    } finally {
      setApplying(false);
    }
  };

  const bodyWithoutMarker = proposal.body
    .replace(/\s*#proposer=0x[0-9a-fA-F]{40}\s*$/, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();
  const rationale = bodyWithoutMarker.split(/^## Rationale\s*$/m)[1]?.trim();

  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-10">
      <Link
        href="/?tab=duna"
        className="mb-6 inline-flex items-center gap-2 text-sm text-content-secondary hover:text-content-primary"
      >
        <ArrowLeft className="size-4" />
        Back to DUNA Members
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_355px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <DunaStatusBadge state={state} />
                <MembershipActionBadge action={proposal.action} />
              </div>

              {proposal.discordId ? (
                <DiscordIdentity
                  discordId={proposal.discordId}
                  fallbackUsername={proposal.discordUsername}
                  size="lg"
                  showId
                  warnOnMismatch
                />
              ) : null}

              <h1 className="text-2xl sm:text-3xl font-semibold text-content-primary">{proposal.title}</h1>

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-content-secondary">
                <span>
                  Proposed by <span className="font-mono text-content-primary">{short(proposal.author)}</span>
                </span>
                <a
                  href={explorerTx(proposal.tx)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-content-primary"
                >
                  Transaction <ExternalLink className="size-3.5" />
                </a>
              </div>

              {note && (
                <div
                  className={cn(
                    "flex items-start gap-3 rounded-lg p-4 text-sm",
                    note.tone === "success"
                      ? "bg-[#0FB46A]/10 text-content-primary"
                      : "bg-surface-soft text-content-secondary",
                  )}
                >
                  {note.tone === "success" ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#0FB46A]" />
                  ) : (
                    <Info className="mt-0.5 size-4 shrink-0" />
                  )}
                  {note.text}
                </div>
              )}

              {rationale && (
                <div>
                  <h2 className="mb-2 text-lg font-semibold text-content-primary">Rationale</h2>
                  <p className="whitespace-pre-wrap text-content-primary">{rationale}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Votes ({votes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {votes.length === 0 ? (
                <p className="py-4 text-center text-content-secondary">No votes yet.</p>
              ) : (
                <ul className="divide-y divide-border-default">
                  {votes.map((v) => (
                    <li key={v.id} className="flex flex-col gap-1 py-3">
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-mono text-sm text-content-primary">{short(v.voter)}</span>
                        <span className="text-sm">
                          <span className={cn("font-semibold", CHOICE_COLOR[v.choice])}>{CHOICE_LABEL[v.choice]}</span>
                          <span className="text-content-secondary"> · {formatNumber(v.vp)} LCAI</span>
                        </span>
                      </div>
                      {v.reason && <p className="text-sm text-content-secondary">“{v.reason}”</p>}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="gap-4">
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <DunaResultsBar scores={proposal.scores} quorum={proposal.quorum} />

              {state === ProposalState.Succeeded &&
                proposal.action !== null &&
                (isConnected ? (
                  <Button
                    className="w-full bg-[image:var(--gradient-primary)] text-white hover:opacity-90"
                    disabled={applying}
                    onClick={handleApply}
                  >
                    {applying && <Loader2 className="size-4 animate-spin" />}
                    {applying
                      ? "Applying…"
                      : proposal.action === MembershipAction.Add
                        ? "Apply: add member"
                        : "Apply: remove member"}
                  </Button>
                ) : (
                  <Button className="w-full" onClick={() => open()}>
                    Connect wallet to apply
                  </Button>
                ))}

              {isActive &&
                (isConnected ? (
                  chainState?.hasVoted ? (
                    <div className="flex items-center justify-center gap-2 rounded-lg bg-surface-soft p-3 text-sm">
                      <CheckCircle2 className="size-4 text-[#0FB46A]" /> You have voted
                    </div>
                  ) : chainState && chainState.votingPower === 0 ? (
                    <p className="rounded-lg bg-surface-soft p-3 text-center text-sm text-content-secondary">
                      You had no LCAI voting power on {dunaConfig.chain.name} when voting opened.
                    </p>
                  ) : (
                    <Button
                      className="w-full bg-[image:var(--gradient-primary)] text-white hover:opacity-90"
                      onClick={() => setVoteOpen(true)}
                    >
                      Vote
                    </Button>
                  )
                ) : (
                  <Button className="w-full" onClick={() => open()}>
                    Connect wallet to vote
                  </Button>
                ))}
            </CardContent>
          </Card>

          <Card className="gap-4">
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm">
                {[
                  ["Created", proposal.created],
                  [state === ProposalState.Pending ? "Voting starts" : "Voting started", startTs],
                  [endTs > Date.now() / 1000 ? "Voting ends" : "Voting ended", endTs],
                ].map(([label, ts]) => (
                  <li key={label as string} className="flex justify-between gap-4">
                    <span className="text-content-secondary">{label}</span>
                    <span className="text-right text-content-primary" title={$dayjs.unix(ts as number).format("MMM D, YYYY HH:mm")}>
                      {$dayjs.unix(ts as number).format("MMM D, HH:mm")}
                      <span className="block text-xs text-content-secondary">
                        {$dayjs.unix(ts as number).fromNow()}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-xs text-content-secondary">
                Times are estimated from block numbers (~{dunaConfig.blockTimeSeconds}s per block).
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={voteOpen} onOpenChange={(o) => !voting && setVoteOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cast your vote</DialogTitle>
            <DialogDescription>{proposal.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {SUPPORT_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setSupport(o.value)}
                  className={cn(
                    "rounded-lg border border-border-default py-3 font-semibold transition-all hover:bg-surface-soft",
                    support === o.value && o.className,
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <Textarea
              rows={3}
              maxLength={1000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (optional)"
            />
            {chainState && (
              <p className="text-sm text-content-secondary">
                Voting power: <span className="font-medium text-content-primary">{formatNumber(chainState.votingPower)} LCAI</span>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              className="w-full bg-[image:var(--gradient-primary)] text-white hover:opacity-90"
              disabled={support === null || voting}
              onClick={handleVote}
            >
              {voting && <Loader2 className="size-4 animate-spin" />}
              {voting ? "Confirm in wallet…" : "Submit vote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
