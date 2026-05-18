const DUTCH_DAY = ["zo", "ma", "di", "wo", "do", "vr", "za"];
const DUTCH_MONTH = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

/** Format ISO date as "do 12 februari 2026" — stable across server/client. */
export function formatDutchDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // Use UTC to avoid SSR/CSR locale drift.
  return `${DUTCH_DAY[d.getUTCDay()]} ${d.getUTCDate()} ${DUTCH_MONTH[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
