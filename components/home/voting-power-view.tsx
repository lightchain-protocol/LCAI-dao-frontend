"use client";

import { useMemo, useState } from "react";
import { Landmark, Search, Users, Vault, Vote } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DelegateListItem } from "@/components/delegation/delegate-list-item";
import { StatsCard } from "@/components/home/stats-card";
import config from "@/config";
import useParticipants from "@/hooks/useParticipants";
import useVotingPowerStats from "@/hooks/useVotingPowerStats";
import { compactNumber } from "@/lib/utils";
import type { Delegate } from "@/types";

// Home-style stat backgrounds (gradient + wave lines), one accent per card.
const WAVE_PURPLE =
  "bg-[rgba(204,206,239,0.02)] bg-[linear-gradient(143deg,rgba(255,255,255,0.04)_61.49%,rgba(112,100,233,0.20)_106.01%),url('/images/bg/bg-wave-lines.png')] bg-cover bg-center bg-no-repeat";
const WAVE_AMBER =
  "bg-[rgba(204,206,239,0.02)] bg-[linear-gradient(147deg,rgba(255,255,255,0.04)_56.39%,rgba(255,166,13,0.22)_106.26%),url('/images/bg/bg-wave-lines.png')] bg-cover bg-center bg-no-repeat";
const WAVE_GREEN =
  "bg-[rgba(204,206,239,0.02)] bg-[linear-gradient(143deg,rgba(255,255,255,0.04)_61.49%,rgba(34,197,94,0.18)_106.01%),url('/images/bg/bg-wave-lines.png')] bg-cover bg-center bg-no-repeat";
const WAVE_PINK =
  "bg-[rgba(204,206,239,0.02)] bg-[linear-gradient(143deg,rgba(255,255,255,0.04)_61.49%,rgba(221,0,172,0.16)_106.01%),url('/images/bg/bg-wave-lines.png')] bg-cover bg-center bg-no-repeat";

function formatLcai(value: number | undefined): string {
  return value === undefined ? "-" : `${compactNumber(value)} LCAI`;
}

type Category = "all" | "community" | "protocol";

const CATEGORIES: { key: Category; label: string }[] = [
  { key: "all", label: "All" },
  { key: "community", label: "Community" },
  { key: "protocol", label: "Protocol" },
];

function isReserve(participant: Delegate): boolean {
  return participant.label === config.reserveLabel;
}

// Protocol = contracts (treasury, bridge, system) plus the operational reserve.
// Community = everyone else, i.e. independent wallets that can vote.
function matchesCategory(participant: Delegate, category: Category): boolean {
  if (category === "community")
    return !participant.isContract && !isReserve(participant);
  if (category === "protocol")
    return !!participant.isContract || isReserve(participant);
  return true;
}

function HoldersSection() {
  const { data: participants = [], isLoading } = useParticipants(50);
  const [category, setCategory] = useState<Category>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      participants
        .filter((participant) => matchesCategory(participant, category))
        .filter(
          (participant) =>
            !search ||
            participant.address.toLowerCase().includes(search.toLowerCase()),
        ),
    [participants, category, search],
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-secondary" />
        <Input
          placeholder="Search by address..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex gap-1 border-b border-border-default">
        {CATEGORIES.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setCategory(key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm transition-colors ${
              category === key
                ? "border-primary text-content-primary"
                : "border-transparent text-content-secondary hover:text-content-primary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="divide-y divide-border-default rounded-lg border border-border-default bg-base-subtle">
          {filtered.map((participant, index) => (
            <DelegateListItem
              key={participant.id}
              delegate={participant}
              rank={index + 1}
            />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-content-secondary">
          No wallets match this filter
        </div>
      )}
    </div>
  );
}

export function VotingPowerView() {
  const { data: participants = [] } = useParticipants(50);
  const { data: stats } = useVotingPowerStats();

  const rawContractHeld = participants
    .filter((participant) => participant.isContract)
    .reduce((sum, participant) => sum + participant.votingPowerParsed, 0);

  // Worker stake sits in the WorkerRegistry (a contract) but getTotalVotingPower
  // already removed it, so it is not votable contract power. Subtract it so the
  // buckets partition the votable sum without double-counting it.
  const contractHeld = Math.max(
    0,
    rawContractHeld - (stats?.workerStakeExcluded ?? 0),
  );

  const reserveHeld = participants
    .filter(isReserve)
    .reduce((sum, participant) => sum + participant.votingPowerParsed, 0);

  const independentCommunity =
    stats === undefined
      ? undefined
      : Math.max(0, stats.totalVotingPower - contractHeld - reserveHeld);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total voting power"
          value={formatLcai(stats?.totalVotingPower)}
          icon={<Vote className="h-6 w-6 text-content-primary" />}
          info="On-chain votable sum, the quorum denominator."
          className={WAVE_PURPLE}
        />
        <StatsCard
          title="Held by contracts"
          value={formatLcai(contractHeld)}
          icon={<Landmark className="h-6 w-6 text-content-primary" />}
          info="Treasury, bridge, and system contracts. Counted in quorum but cannot vote. Excludes worker stake in the WorkerRegistry, which is not votable."
          className={WAVE_AMBER}
        />
        <StatsCard
          title="Operational reserve"
          value={formatLcai(reserveHeld)}
          icon={<Vault className="h-6 w-6 text-content-primary" />}
          info="Operational reserve wallet, a team-controlled EOA. It can vote, but is shown separately from independent community power."
          className={WAVE_PINK}
        />
        <StatsCard
          title="Community power"
          value={formatLcai(independentCommunity)}
          icon={<Users className="h-6 w-6 text-content-primary" />}
          info="Independent community voting power, excludes contracts and the operational reserve."
          className={WAVE_GREEN}
        />
      </div>

      <HoldersSection />
    </div>
  );
}
