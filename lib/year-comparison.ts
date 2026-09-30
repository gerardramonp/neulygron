import { parseYearMonth } from "@/lib/year-month";

type CategorySnapshot = {
  name: string;
  position: number;
  expenses: { amount: number }[];
};

type LeanMonthlyReport = {
  yearMonth: string;
  categories: CategorySnapshot[];
};

export type YearComparisonMonthRow = {
  month: number;
  byYear: Record<string, number | null>;
};

export type YearComparisonResponseBody = {
  years: number[];
  months: YearComparisonMonthRow[];
};

function sumReportTotal(report: LeanMonthlyReport): number {
  return report.categories.reduce(
    (sum, cat) =>
      sum + cat.expenses.reduce((s, e) => s + e.amount, 0),
    0,
  );
}

/**
 * Build a 12-month × years matrix of totals from all saved monthly reports.
 * Missing months are null (never saved); a saved empty report is 0.
 */
export function buildYearComparison(
  reports: LeanMonthlyReport[],
): YearComparisonResponseBody {
  const totalByYearMonth = new Map<string, number>();
  const yearSet = new Set<number>();

  for (const report of reports) {
    const parsed = parseYearMonth(report.yearMonth);
    if (!parsed) continue;
    yearSet.add(parsed.year);
    totalByYearMonth.set(report.yearMonth, sumReportTotal(report));
  }

  const years = [...yearSet].sort((a, b) => a - b);

  const months: YearComparisonMonthRow[] = [];
  for (let month = 1; month <= 12; month++) {
    const byYear: Record<string, number | null> = {};
    for (const year of years) {
      const key = `${year}-${String(month).padStart(2, "0")}`;
      byYear[String(year)] = totalByYearMonth.has(key)
        ? (totalByYearMonth.get(key) as number)
        : null;
    }
    months.push({ month, byYear });
  }

  return { years, months };
}
