"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useConnection } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, UserMinus, UserPlus, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DiscordMemberSearch } from "@/components/duna/discord-member-search";
import { membershipActionTitle } from "@/components/duna/duna-shared";
import dunaConfig, { isDunaConfigured, MembershipAction } from "@/config/duna";
import type { DiscordMember } from "@/graphqlApi/duna";
import {
  useDunaGovernor,
  useDunaGovernorParams,
  useDunaMemberStatus,
  useDunaVotingPower,
} from "@/hooks/useDunaGovernor";
import $dayjs from "@/lib/dayjs";
import { cn, formatNumber } from "@/lib/utils";

const ACTIONS = [
  {
    value: MembershipAction.Add,
    label: "Vote into the DUNA team",
    description: "Propose adding this member to the DUNA team.",
    icon: UserPlus,
    activeClass: "border-[#0FB46A] bg-[#0FB46A]/10 ring-2 ring-[#0FB46A]/30",
    iconClass: "text-[#0FB46A]",
  },
  {
    value: MembershipAction.Remove,
    label: "Vote out of the DUNA team",
    description: "Propose removing this member from the DUNA team.",
    icon: UserMinus,
    activeClass: "border-[#E93544] bg-[#E93544]/10 ring-2 ring-[#E93544]/30",
    iconClass: "text-[#E93544]",
  },
] as const;

function buildDescription(
  member: DiscordMember,
  action: MembershipAction,
  rationale: string,
  proposer: `0x${string}`,
) {
  const title = membershipActionTitle(action, member.username);
  const lines = [
    `# ${title}`,
    "",
    `**Discord member:** @${member.username}${member.globalName ? ` (${member.globalName})` : ""}`,
    `**Discord ID:** ${member.id}`,
    `**Action:** ${action === MembershipAction.Add ? "Vote IN to the DUNA team" : "Vote OUT of the DUNA team"}`,
  ];
  if (rationale.trim()) lines.push("", "## Rationale", "", rationale.trim());
  // Keeps the proposal ID unique if the same member is proposed again later.
  lines.push("", `<!-- duna-proposal:${Date.now()} -->`);
  // OpenZeppelin proposer restriction: only this address can submit this exact proposal,
  // so it can't be front-run. Must be the last thing in the description.
  return `${lines.join("\n")} #proposer=${proposer}`;
}

function Requirement({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      {ok ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#0FB46A]" />
      ) : (
        <XCircle className="mt-0.5 size-4 shrink-0 text-content-secondary" />
      )}
      <span className={ok ? "text-content-primary" : "text-content-secondary"}>{children}</span>
    </li>
  );
}

export default function CreateDunaProposalPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { open } = useAppKit();
  const { isConnected, address } = useConnection();
  const { proposeMembership } = useDunaGovernor();
  const { data: params } = useDunaGovernorParams();
  const { data: votingPower } = useDunaVotingPower();

  const [member, setMember] = useState<DiscordMember | null>(null);
  const [action, setAction] = useState<MembershipAction | null>(null);
  const [rationale, setRationale] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: memberStatus, isFetching: loadingStatus } = useDunaMemberStatus(member?.id);

  // Only the valid action is available: IN for non-members, OUT for current members.
  const allowedAction: MembershipAction | null = memberStatus
    ? memberStatus.isMember
      ? MembershipAction.Remove
      : MembershipAction.Add
    : null;
  useEffect(() => {
    setAction(allowedAction);
  }, [allowedAction]);

  const hasPower = !!params && votingPower !== undefined && votingPower >= params.proposalThreshold;
  const noOpenProposal = !!memberStatus && !memberStatus.openProposalId;
  const canSubmit =
    isDunaConfigured &&
    isConnected &&
    hasPower &&
    !!member &&
    action !== null &&
    action === allowedAction &&
    noOpenProposal &&
    !submitting;

  const handleSubmit = async () => {
    if (!member || action === null || !address) return;
    setSubmitting(true);
    try {
      const { proposalId } = await proposeMembership({
        discordId: member.id,
        discordUsername: member.username,
        action,
        description: buildDescription(member, action, rationale, address),
      });
      toast.success("Proposal created");
      queryClient.invalidateQueries({ queryKey: ["duna-proposals"] });
      router.push(`/duna/proposal/${proposalId}`);
    } catch (e) {
      const err = e as { shortMessage?: string; message?: string };
      toast.error(err.shortMessage || err.message || "Failed to create proposal");
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-10">
      <Link
        href="/?tab=duna"
        className="mb-6 inline-flex items-center gap-2 text-sm text-content-secondary hover:text-content-primary"
      >
        <ArrowLeft className="size-4" />
        Back to DUNA Members
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-content-primary">New DUNA membership proposal</h1>
            <p className="mt-1 text-content-secondary">
              Pick a Discord member and choose whether LCAI holders should vote them into or out of the DUNA team.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">1. Discord member</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DiscordMemberSearch value={member} onChange={setMember} />
              {member && (loadingStatus || !memberStatus) && (
                <p className="flex items-center gap-2 text-sm text-content-secondary">
                  <Loader2 className="size-4 animate-spin" /> Checking DUNA membership…
                </p>
              )}
              {member && memberStatus && !loadingStatus && (
                <p className="text-sm text-content-secondary">
                  {memberStatus.isMember ? (
                    <>
                      <span className="font-medium text-content-primary">Current DUNA member</span>
                      {memberStatus.since && ` since ${$dayjs.unix(memberStatus.since).format("MMM D, YYYY")}`}
                    </>
                  ) : (
                    <span className="font-medium text-content-primary">Not a DUNA member</span>
                  )}
                </p>
              )}
              {memberStatus?.openProposalId && (
                <div className="flex items-start gap-2 rounded-lg bg-[#FCEACF] p-3 text-sm text-[#B93815] dark:bg-[#511C10] dark:text-[#EC9B59]">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <span>
                    There is already an open proposal for this member.{" "}
                    <Link href={`/duna/proposal/${memberStatus.openProposalId}`} className="font-medium underline">
                      View it
                    </Link>
                    . A new one can be created after it is defeated, canceled, or applied.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">2. Proposal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
                {ACTIONS.map((a) => {
                  const selected = action === a.value;
                  const disabled = allowedAction !== null && a.value !== allowedAction;
                  const Icon = a.icon;
                  return (
                    <button
                      key={a.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={disabled}
                      title={
                        disabled
                          ? a.value === MembershipAction.Add
                            ? "Already a DUNA member"
                            : "Not a DUNA member"
                          : undefined
                      }
                      onClick={() => setAction(a.value)}
                      className={cn(
                        "flex flex-col items-start gap-2 rounded-xl border border-border-default p-5 text-left transition-all hover:bg-surface-soft",
                        "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
                        selected && a.activeClass,
                      )}
                    >
                      <Icon className={cn("size-6", a.iconClass)} />
                      <span className="text-base font-bold uppercase tracking-wide text-content-primary">
                        {a.label}
                      </span>
                      <span className="text-sm text-content-secondary">{a.description}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">3. Rationale (optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="rationale" className="sr-only">
                Rationale
              </Label>
              <Textarea
                id="rationale"
                rows={6}
                maxLength={5000}
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="Why should the DUNA team vote on this? Markdown is supported."
              />
              <p className="text-right text-xs text-content-secondary">{rationale.length} / 5000</p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            <Card className="gap-4">
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="rounded-lg bg-surface-soft p-4 font-medium text-content-primary">
                  {member && action !== null
                    ? membershipActionTitle(action, member.username)
                    : "Select a member and an action"}
                </div>

                <ul className="space-y-2">
                  <Requirement ok={isConnected}>Wallet connected</Requirement>
                  <Requirement ok={hasPower}>
                    {params
                      ? `At least ${formatNumber(params.proposalThreshold)} LCAI voting power`
                      : "Proposal threshold"}
                    {isConnected && votingPower !== undefined && (
                      <span className="block text-xs text-content-secondary">
                        You have {formatNumber(votingPower)} LCAI on {dunaConfig.chain.name}
                      </span>
                    )}
                  </Requirement>
                  <Requirement ok={!!member}>Discord member selected</Requirement>
                  <Requirement ok={action !== null}>Action selected</Requirement>
                  <Requirement ok={noOpenProposal}>No open proposal for this member</Requirement>
                </ul>

                {params && (
                  <p className="text-xs text-content-secondary">
                    Voting opens ~
                    {((params.votingDelayBlocks * dunaConfig.blockTimeSeconds) / 3600).toFixed(1)} h after creation
                    and runs for ~
                    {((params.votingPeriodBlocks * dunaConfig.blockTimeSeconds) / 86400).toFixed(1)} days. Your wallet
                    will switch to {dunaConfig.chain.name} if needed.
                  </p>
                )}

                {isConnected ? (
                  <Button
                    className="w-full bg-[image:var(--gradient-primary)] text-white hover:opacity-90"
                    disabled={!canSubmit}
                    onClick={handleSubmit}
                  >
                    {submitting && <Loader2 className="size-4 animate-spin" />}
                    {submitting ? "Submitting…" : "Create proposal"}
                  </Button>
                ) : (
                  <Button className="w-full" onClick={() => open()}>
                    Connect wallet
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
