import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import $dayjs from "@/lib/dayjs";

export const MAX_UINT256 = 2n ** 256n - 1n;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isArchivedProposal(proposal: { indexer: string }) {
  return proposal.indexer === "mainnet";
}

export function rmMarkdown(text: string) {
  // #
  // **
  // *
  // ```
  // `
  // __
  // _
  // ~~~
  return text
    .replace(/\n/g, "")
    .replace(/\#|\*\*|\*|\`\`|\`|\_\_|\_|\~\~/g, "");
}

export function formatNumber(num?: string | number, fractionDigits?: number) {
  if (!num) return 0;

  return Number(num).toLocaleString("en-US", {
    maximumFractionDigits: fractionDigits || 2,
  });
}

export function compactNumber(num?: string | number) {
  if (!num) return 0;

  return Number(num).toLocaleString(undefined, {
    maximumFractionDigits: 2,
    notation: "compact",
  });
}

/** Matches dayjs `fromNow(true)` strings to compact sidebar labels (e.g. "2 hours" → "2h"). */
function compactFromDayjsRelative(relative: string): string {
  if (relative.includes("second")) return "<1m";
  if (relative === "a minute") return "1m";
  const minutes = relative.match(/^(\d+) minutes$/);
  if (minutes) return `${minutes[1]}m`;
  if (relative === "an hour" || relative === "a hour") return "1h";
  const hours = relative.match(/^(\d+) hours$/);
  if (hours) return `${hours[1]}h`;
  if (relative === "a day") return "1d";
  const days = relative.match(/^(\d+) days$/);
  if (days) return `${days[1]}d`;
  if (relative === "a month") return "1mo";
  const months = relative.match(/^(\d+) months$/);
  if (months) return `${months[1]}mo`;
  if (relative === "a year") return "1y";
  const years = relative.match(/^(\d+) years$/);
  if (years) return `${years[1]}y`;
  return relative;
}

/** Relative end time for proposal rows — same rounding as dayjs `fromNow()`. */
export function formatProposalEndRelative(endUnix: number): string {
  return $dayjs.unix(endUnix).fromNow();
}

/** Compact countdown from an end unix timestamp; aligned with `formatProposalEndRelative`. */
export function formatCompactTimeLeftFromUnix(endUnix: number): string | null {
  const end = $dayjs.unix(endUnix);
  if (!end.isAfter($dayjs())) return null;
  return compactFromDayjsRelative(end.fromNow(true));
}

export function formatCompactTimeLeft(msRemaining: number): string | null {
  if (!Number.isFinite(msRemaining) || msRemaining <= 0) return null;
  const endUnix = Math.floor((Date.now() + msRemaining) / 1000);
  return formatCompactTimeLeftFromUnix(endUnix);
}

/**
 * Convert Governor bravo choice value to common format.
 * Governor Bravo: 0=against, 1=for, 2=abstain
 * Common format uses 0 for For, 1 for Against, 2 for Abstain.
 * @param choise common format choice value
 * @returns Governor Bravo choice value
 */
export function convertChoice(choise: number) {
  if (choise === 0) return 1;
  if (choise === 1) return 0;

  return choise;
}

export function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function truncateAddress(address: string) {
  return address.slice(0, 6) + "..." + address.slice(-4);
}

export function secondsToTime(seconds: bigint | number): string {
  const totalSeconds = Number(seconds);
  if (totalSeconds < 120) return `~${totalSeconds} seconds`;
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 120) return `~${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `~${hours} hours`;
  const days = Math.floor(hours / 24);
  return `~${days} days`;
}

export function formatBps(bps: bigint | number): string {
  const percent = Number(bps) / 100;
  return `${percent}% (${bps.toString()} bps)`;
}
