import { yearMonthRegex } from "@/lib/validation/monthly-expense-report";

/** Parse a YYYY-MM string into year and month, or null if invalid. */
export function parseYearMonth(value: string): {
  year: number;
  month: number;
} | null {
  const trimmed = value.trim();
  if (!yearMonthRegex.test(trimmed)) return null;
  const [y, m] = trimmed.split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m)) return null;
  return { year: y, month: m };
}

/** Inclusive range of calendar years for report pickers (past … future). */
export function buildYearRange(
  centerYear: number,
  past = 5,
  future = 1,
): number[] {
  const years: number[] = [];
  for (let y = centerYear - past; y <= centerYear + future; y++) {
    years.push(y);
  }
  return years;
}

export function formatYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}
