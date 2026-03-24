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
