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

export type YearComparisonCategory = {
  name: string;
  minPosition: number;
};

export type YearComparisonMonthRow = {
  month: number;
  byYear: Record<string, number | null>;
  /** Category name → year → amount. Null when that month was never saved; 0 when the month was saved without this category. */
  byCategory: Record<string, Record<string, number | null>>;
};

export type YearComparisonResponseBody = {
  years: number[];
  categories: YearComparisonCategory[];
  months: YearComparisonMonthRow[];
};

function sumReportTotal(report: LeanMonthlyReport): number {
  return report.categories.reduce(
    (sum, cat) =>
      sum + cat.expenses.reduce((s, e) => s + e.amount, 0),
    0,
  );
}

function sumCategoryExpenses(cat: CategorySnapshot): number {
  return cat.expenses.reduce((s, e) => s + e.amount, 0);
}

/**
 * Build a 12-month × years matrix of totals from all saved monthly reports.
 * Missing months are null (never saved); a saved empty report is 0.
 * Category amounts follow the same rule: null when the month was never saved,
 * otherwise the category sum, or 0 when that snapshot omitted the category.
 */
export function buildYearComparison(
  reports: LeanMonthlyReport[],
): YearComparisonResponseBody {
  const totalByYearMonth = new Map<string, number>();
  const categoryTotalsByYearMonth = new Map<string, Map<string, number>>();
  const yearSet = new Set<number>();
  const minPositionByName = new Map<string, number>();

  for (const report of reports) {
    const parsed = parseYearMonth(report.yearMonth);
    if (!parsed) continue;
    yearSet.add(parsed.year);

    const byName = new Map<string, number>();
    for (const cat of report.categories) {
      const amount = sumCategoryExpenses(cat);
      byName.set(cat.name, (byName.get(cat.name) ?? 0) + amount);
      const prev = minPositionByName.get(cat.name);
      if (prev === undefined || cat.position < prev) {
        minPositionByName.set(cat.name, cat.position);
      }
    }

    totalByYearMonth.set(report.yearMonth, sumReportTotal(report));
    categoryTotalsByYearMonth.set(report.yearMonth, byName);
  }

  const years = [...yearSet].sort((a, b) => a - b);

  const categories = [...minPositionByName.keys()]
    .sort((a, b) => {
      const pa = minPositionByName.get(a) ?? 0;
      const pb = minPositionByName.get(b) ?? 0;
      if (pa !== pb) return pa - pb;
      return a.localeCompare(b);
    })
    .map((name) => ({
      name,
      minPosition: minPositionByName.get(name) ?? 0,
    }));

  const months: YearComparisonMonthRow[] = [];
  for (let month = 1; month <= 12; month++) {
    const byYear: Record<string, number | null> = {};
    const byCategory: Record<string, Record<string, number | null>> = {};
    for (const cat of categories) {
      byCategory[cat.name] = {};
    }

    for (const year of years) {
      const key = `${year}-${String(month).padStart(2, "0")}`;
      const saved = totalByYearMonth.has(key);
      byYear[String(year)] = saved
        ? (totalByYearMonth.get(key) as number)
        : null;
      const catMap = categoryTotalsByYearMonth.get(key);
      for (const cat of categories) {
        byCategory[cat.name][String(year)] = saved
          ? (catMap?.get(cat.name) ?? 0)
          : null;
      }
    }

    months.push({ month, byYear, byCategory });
  }

  return { years, categories, months };
}
