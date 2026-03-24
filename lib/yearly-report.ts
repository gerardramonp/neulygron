import { formatYearMonth } from "@/lib/year-month";

type CategorySnapshot = {
  name: string;
  position: number;
  expenses: { amount: number }[];
};

type LeanMonthlyReport = {
  yearMonth: string;
  categories: CategorySnapshot[];
};

export type YearlyReportMonthRow = {
  yearMonth: string;
  totals: Record<string, number>;
  rowTotal: number;
};

export type YearlyReportResponseBody = {
  year: number;
  categories: { name: string; minPosition: number }[];
  months: YearlyReportMonthRow[];
  yearTotals: Record<string, number>;
  grandTotal: number;
};

function sumCategoryExpenses(cat: CategorySnapshot): number {
  return cat.expenses.reduce((s, e) => s + e.amount, 0);
}

/**
 * Build yearly matrix from monthly report documents for a single calendar year.
 */
export function buildYearlyReportFromMonthlyDocs(
  year: number,
  reports: LeanMonthlyReport[],
): YearlyReportResponseBody {
  const byMonth = new Map<string, LeanMonthlyReport>();
  for (const r of reports) {
    byMonth.set(r.yearMonth, r);
  }

  const minPositionByName = new Map<string, number>();

  for (const r of reports) {
    for (const cat of r.categories) {
      const prev = minPositionByName.get(cat.name);
      if (prev === undefined || cat.position < prev) {
        minPositionByName.set(cat.name, cat.position);
      }
    }
  }

  const categoryNames = [...minPositionByName.keys()].sort((a, b) => {
    const pa = minPositionByName.get(a) ?? 0;
    const pb = minPositionByName.get(b) ?? 0;
    if (pa !== pb) return pa - pb;
    return a.localeCompare(b);
  });

  const categories = categoryNames.map((name) => ({
    name,
    minPosition: minPositionByName.get(name) ?? 0,
  }));

  const yearTotals: Record<string, number> = Object.fromEntries(
    categoryNames.map((n) => [n, 0]),
  );

  const months: YearlyReportMonthRow[] = [];

  for (let m = 1; m <= 12; m++) {
    const yearMonth = formatYearMonth(year, m);
    const report = byMonth.get(yearMonth);
    const totals: Record<string, number> = Object.fromEntries(
      categoryNames.map((n) => [n, 0]),
    );

    if (report) {
      for (const cat of report.categories) {
        if (totals[cat.name] !== undefined) {
          totals[cat.name] += sumCategoryExpenses(cat);
        }
      }
    }

    let rowTotal = 0;
    for (const name of categoryNames) {
      const v = totals[name] ?? 0;
      rowTotal += v;
      yearTotals[name] = (yearTotals[name] ?? 0) + v;
    }

    months.push({ yearMonth, totals, rowTotal });
  }

  const grandTotal = categoryNames.reduce(
    (s, n) => s + (yearTotals[n] ?? 0),
    0,
  );

  return {
    year,
    categories,
    months,
    yearTotals,
    grandTotal,
  };
}
