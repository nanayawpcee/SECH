/**
 * Date helpers for the admin console. Everything works on local calendar days
 * as "YYYY-MM-DD" strings: bookings store the patient's chosen day that way,
 * and comparing strings avoids timezone drift from Date arithmetic at midnight.
 */

export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return dayKey(new Date());
}

export function addDays(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return dayKey(new Date(y, m - 1, d + n));
}

/** The calendar day of a WordPress timestamp like "2026-09-20T10:15:00". */
export function keyOfTimestamp(ts: string): string {
  return ts ? ts.slice(0, 10) : "";
}

/** Inclusive list of day keys from `start` to `end`. */
export function daysBetween(start: string, end: string): string[] {
  const out: string[] = [];
  for (let k = start; k <= end; k = addDays(k, 1)) out.push(k);
  return out;
}

export function diffDays(a: string, b: string): number {
  const [y1, m1, d1] = a.split("-").map(Number);
  const [y2, m2, d2] = b.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

export function formatDay(key: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) {
  if (!key) return "";
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", opts);
}

/** "Today", "Tomorrow", or a weekday + date. */
export function relativeDay(key: string): string {
  const diff = diffDays(todayKey(), key);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return formatDay(key, { weekday: "short", day: "numeric", month: "short" });
}

export function greeting(d = new Date()): string {
  const h = d.getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

/** "today", "tomorrow", "in 12 days", "3 days ago". */
export function fromNow(key: string): string {
  const diff = diffDays(todayKey(), key);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  return diff > 0 ? `in ${diff} days` : `${-diff} days ago`;
}
