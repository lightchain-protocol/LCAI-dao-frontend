const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export function getEndsInUrgencyClass(msRemaining: number | null): string {
  if (msRemaining == null) return "text-content-default";
  if (msRemaining <= SIX_HOURS_MS) return "text-content-error-light";
  if (msRemaining < TWENTY_FOUR_HOURS_MS) return "text-content-warning-light";
  return "text-content-default";
}
