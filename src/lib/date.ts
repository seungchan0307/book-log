const KST_TIME_ZONE = "Asia/Seoul";

// Regardless of the server process's own timezone (Vercel runs UTC), "today"
// for this app always means the calendar date in Seoul, so the day rolls
// over at KST midnight rather than at UTC midnight (9am KST).
const kstFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: KST_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function toDateString(date: Date): string {
  return kstFormatter.format(date);
}

export function todayDateString(): string {
  return toDateString(new Date());
}

export function shiftDateString(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const ms = Date.UTC(y, m - 1, d) + days * 86400000;
  return toDateString(new Date(ms));
}
