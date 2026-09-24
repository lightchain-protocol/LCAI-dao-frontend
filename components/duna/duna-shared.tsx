"use client";

import { Badge } from "@/components/ui/badge";
import ProposalStatusBadge from "@/components/proposal/proposal-status-badge";
import { MembershipAction } from "@/config/duna";
import { useDiscordMember } from "@/hooks/useDunaApi";
import { ProposalState, ProposalStateLabel } from "@/lib/constents";
import { cn, compactNumber } from "@/lib/utils";
import { AlertTriangle, UserMinus, UserPlus } from "lucide-react";

type BadgeVariant = NonNullable<React.ComponentProps<typeof Badge>["variant"]>;

export function DunaStatusBadge({ state, className }: { state: number; className?: string }) {
  const label = ProposalStateLabel[state] ?? "Unknown";
  // Executing a DUNA proposal applies it to the member registry.
  const text = state === ProposalState.Executed ? "Applied" : label;
  return (
    <Badge variant={label.toLowerCase() as BadgeVariant} className={cn("text-xs md:text-sm", className)}>
      <ProposalStatusBadge status={state} className="mr-0 text-xs md:text-sm" />
      {text}
    </Badge>
  );
}

export function MembershipActionBadge({
  action,
  className,
}: {
  action: MembershipAction | null;
  className?: string;
}) {
  if (action === null) {
    return (
      <Badge variant="outline" className={className}>
        Governance
      </Badge>
    );
  }
  const isAdd = action === MembershipAction.Add;
  return (
    <Badge
      variant={isAdd ? "active" : "defeated"}
      className={cn("uppercase tracking-wide font-semibold", className)}
    >
      {isAdd ? <UserPlus /> : <UserMinus />}
      {isAdd ? "Vote in" : "Vote out"}
    </Badge>
  );
}

export function membershipActionTitle(action: MembershipAction, username: string) {
  return action === MembershipAction.Add
    ? `Vote @${username} into the DUNA team`
    : `Vote @${username} out of the DUNA team`;
}

function defaultAvatar(discordId: string) {
  try {
    return `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(discordId) >> 22n) % 6n)}.png`;
  } catch {
    return "https://cdn.discordapp.com/embed/avatars/0.png";
  }
}

/** Avatar + names for a Discord member, resolved live from the API with a stored-username fallback. */
export function DiscordIdentity({
  discordId,
  fallbackUsername,
  size = "md",
  showId = false,
  warnOnMismatch = false,
}: {
  discordId: string | null;
  fallbackUsername: string | null;
  size?: "sm" | "md" | "lg";
  showId?: boolean;
  /** Flag when the on-chain username doesn't match the live Discord account for this ID. */
  warnOnMismatch?: boolean;
}) {
  const { data: member, isSuccess } = useDiscordMember(discordId);
  // The username is free text chosen by the proposer; the Discord ID is what counts.
  const mismatch =
    warnOnMismatch && isSuccess && !!fallbackUsername
      ? member === null
        ? `This Discord ID is not in the Lightchain server (proposal says @${fallbackUsername}).`
        : member.username !== fallbackUsername
          ? `Proposal says @${fallbackUsername}, but this Discord ID is currently @${member.username}.`
          : null
      : null;
  const username = member?.username ?? fallbackUsername ?? "unknown";
  const displayName = member?.nick || member?.globalName || null;
  const avatar = member?.avatarUrl ?? (discordId ? defaultAvatar(discordId) : undefined);
  const sizeClass = { sm: "size-8", md: "size-11", lg: "size-16" }[size];

  return (
    <div className="flex items-center gap-3 min-w-0">
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt="" className={cn(sizeClass, "rounded-full shrink-0 bg-surface-soft")} />
      ) : (
        <div className={cn(sizeClass, "rounded-full shrink-0 bg-surface-soft")} />
      )}
      <div className="min-w-0">
        <div className={cn("font-semibold text-content-primary truncate", size === "lg" && "text-xl")}>
          {displayName ?? `@${username}`}
        </div>
        <div className="text-sm text-content-secondary truncate">
          {displayName && `@${username}`}
          {displayName && showId && discordId && " · "}
          {showId && discordId && <span className="font-mono text-xs">{discordId}</span>}
        </div>
        {mismatch && (
          <div className="mt-1 flex items-start gap-1.5 text-xs text-[#B93815] dark:text-[#EC9B59]">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            <span>{mismatch}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function DunaResultsBar({
  scores,
  quorum,
  compact = false,
}: {
  scores: { for: number; against: number; abstain: number; total: number };
  quorum: number;
  compact?: boolean;
}) {
  const total = scores.total || 0;
  const pct = (v: number) => (total > 0 ? (v / total) * 100 : 0);
  const quorumProgress = quorum > 0 ? Math.min(100, ((scores.for + scores.abstain) / quorum) * 100) : 100;

  const rows = [
    { label: "For", value: scores.for, color: "bg-[#0FB46A]" },
    { label: "Against", value: scores.against, color: "bg-[#E93544]" },
    { label: "Abstain", value: scores.abstain, color: "bg-[#98A2B3]" },
  ];

  if (compact) {
    return (
      <div className="space-y-1.5">
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-soft">
          {rows.map((r) => (
            <div key={r.label} className={r.color} style={{ width: `${pct(r.value)}%` }} />
          ))}
        </div>
        <div className="flex justify-between text-xs text-content-secondary">
          <span>For {compactNumber(scores.for)}</span>
          <span>Against {compactNumber(scores.against)}</span>
          <span>Quorum {Math.round(quorumProgress)}%</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <div key={r.label} className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-content-primary">{r.label}</span>
            <span className="text-content-secondary">
              {compactNumber(r.value)} LCAI · {pct(r.value).toFixed(1)}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-soft">
            <div className={cn("h-full", r.color)} style={{ width: `${pct(r.value)}%` }} />
          </div>
        </div>
      ))}
      <div className="space-y-1.5 pt-2 border-t border-border-default">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-content-primary">Quorum (For + Abstain)</span>
          <span className="text-content-secondary">
            {compactNumber(scores.for + scores.abstain)} / {compactNumber(quorum)} LCAI
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-soft">
          <div
            className={cn("h-full", quorumProgress >= 100 ? "bg-[#0FB46A]" : "bg-[image:var(--gradient-primary)]")}
            style={{ width: `${quorumProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
