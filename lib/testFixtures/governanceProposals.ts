import raw from "@/data/mock/proposals.json";
import { ProposalState } from "@/lib/constents";
import type { Proposal } from "@/types";

export type MockProposalSeed = {
  id: string;
  title: string;
  status: "active" | "ended";
  timeLeft: string;
};

/** Fixed unix anchor so tests stay deterministic. */
export const MOCK_GOVERNANCE_NOW_UNIX = 1_700_000_000;

const seeds = raw as MockProposalSeed[];

function statusToState(status: MockProposalSeed["status"]): number {
  return status === "active" ? ProposalState.Active : ProposalState.Defeated;
}

function timeLeftToEndUnix(
  timeLeft: string,
  now: number,
  sixDayOffsetHours: number,
): number {
  if (timeLeft.includes("ago")) {
    return now - 86_400;
  }
  const daysMatch = timeLeft.match(/(\d+)d/);
  if (!daysMatch) return now + 86_400;
  const days = Number(daysMatch[1]);
  return now + days * 86_400 + sixDayOffsetHours * 3_600;
}

export function buildMockGovernanceProposals(): Proposal[] {
  let sixDayIndex = 0;

  return seeds.map((seed, index) => {
    const isSixDay = seed.timeLeft.includes("6d");
    const sixDayOffset = isSixDay ? sixDayIndex++ : 0;

    return {
      proposal_id: seed.id,
      title: seed.title,
      state: statusToState(seed.status),
      end_time: timeLeftToEndUnix(
        seed.timeLeft,
        MOCK_GOVERNANCE_NOW_UNIX,
        sixDayOffset,
      ),
      created: MOCK_GOVERNANCE_NOW_UNIX - (seeds.length - index) * 3_600,
    } as Proposal;
  });
}

export function mockProposalIds(): string[] {
  return seeds.map((seed) => seed.id);
}
