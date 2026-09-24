"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { MembershipAction } from "@/config/duna";
import type { DunaProposal } from "@/graphqlApi/duna";
import { useDunaMembers } from "@/hooks/useDunaGovernor";
import { ProposalState } from "@/lib/constents";
import $dayjs from "@/lib/dayjs";
import { DiscordIdentity, DunaStatusBadge, MembershipActionBadge } from "./duna-shared";

/**
 * Current DUNA members, read from the on-chain registry. Each row links to the
 * vote that added the member and flags any open proposal about them.
 */
export function DunaMembersList({ proposals }: { proposals: DunaProposal[] }) {
  const { data: members = [], isLoading, error } = useDunaMembers();

  const byMember = useMemo(() => {
    const map = new Map<string, { joinedVia?: DunaProposal; open?: DunaProposal }>();
    // proposals are newest-first
    for (const p of proposals) {
      if (!p.discordId) continue;
      const entry = map.get(p.discordId) ?? {};
      if (!entry.joinedVia && p.action === MembershipAction.Add && p.state === ProposalState.Executed) {
        entry.joinedVia = p;
      }
      if (
        !entry.open &&
        (p.state === ProposalState.Pending || p.state === ProposalState.Active || p.state === ProposalState.Succeeded)
      ) {
        entry.open = p;
      }
      map.set(p.discordId, entry);
    }
    return map;
  }, [proposals]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-10 text-center text-sm text-[#E93544]">
        Failed to load members: {(error as Error).message}
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-content-secondary">
        No DUNA members yet. Members are added when an IN proposal passes and is applied.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border-default">
      {members.map((m) => {
        const info = byMember.get(m.discordId);
        return (
          <li key={m.discordId} className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <DiscordIdentity discordId={m.discordId} fallbackUsername={m.username} />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-content-secondary md:justify-end">
              <span title={$dayjs.unix(m.since).format("MMM D, YYYY HH:mm")}>Member since {$dayjs.unix(m.since).format("MMM D, YYYY")}</span>
              {info?.joinedVia ? (
                <Link
                  href={`/duna/proposal/${info.joinedVia.proposalId}`}
                  className="inline-flex items-center gap-1 hover:text-content-primary"
                >
                  Joined by vote <ExternalLink className="size-3.5" />
                </Link>
              ) : (
                <span>Founding member</span>
              )}
              {info?.open && (
                <Link href={`/duna/proposal/${info.open.proposalId}`} className="inline-flex items-center gap-2">
                  <MembershipActionBadge action={info.open.action} />
                  <DunaStatusBadge state={info.open.state} />
                </Link>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
