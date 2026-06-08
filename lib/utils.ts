import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const MAX_UINT256 = 2n ** 256n - 1n;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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

export function formatCompactTimeLeft(msRemaining: number): string | null {
  if (!Number.isFinite(msRemaining) || msRemaining <= 0) return null;
  const minutes = Math.floor(msRemaining / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return "<1m";
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
