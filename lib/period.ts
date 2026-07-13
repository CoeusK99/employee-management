export function monthlyPeriodKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Returns [start, end) as UTC dates for a MONTHLY ("2026-07") or QUARTERLY ("2026-Q3") period key. */
export function periodDateRange(
  periodType: "MONTHLY" | "QUARTERLY",
  periodKey: string
): { start: Date; end: Date } {
  if (periodType === "MONTHLY") {
    const [y, m] = periodKey.split("-").map(Number);
    const start = new Date(Date.UTC(y, m - 1, 1));
    const end = new Date(Date.UTC(y, m, 1));
    return { start, end };
  }
  const [y, q] = periodKey.split("-Q").map(Number);
  const startMonth = (q - 1) * 3;
  const start = new Date(Date.UTC(y, startMonth, 1));
  const end = new Date(Date.UTC(y, startMonth + 3, 1));
  return { start, end };
}
