const fmt = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
const fmtShort = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

/** 'YYYY-MM-DD' → 'August 9, 2026' (dates are calendar dates; format in UTC to avoid drift). */
export function longDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  return isNaN(d.getTime()) ? "" : fmt.format(d);
}
export function shortDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  return isNaN(d.getTime()) ? "" : fmtShort.format(d);
}
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
export function plusDaysIso(days: number): string {
  return new Date(Date.now() + days * 86400_000).toISOString().slice(0, 10);
}
