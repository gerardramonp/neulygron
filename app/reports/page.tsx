"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import type { Category } from "@/app/config/types";
import { ClassificationResults } from "@/components/expenses/ClassificationResults";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategorySpendingChart } from "@/components/reports/CategorySpendingChart";
import type { ClassifiedExpensesWithPositions } from "@/lib/validation/expenses";
import type { YearlyReportResponseBody } from "@/lib/yearly-report";
import { reassignCategoryExpense } from "@/lib/expenses/reassign-category-expense";
import { buildYearRange, formatYearMonth, parseYearMonth } from "@/lib/year-month";
import { cn, formatAmount } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { MIXPANEL_EVENTS, trackEvent } from "@/lib/analytics/mixpanel";
import { postCategoryConcept } from "@/lib/analytics/post-category-concept";

type LoadedReport = {
  id: string;
  yearMonth: string;
  categories: ClassifiedExpensesWithPositions["categories"];
  updatedAt: string | null;
};

type ReportView = "monthly" | "yearly";

export default function ReportsPage() {
  const t = useTranslations("ReportsPage");
  const locale = useLocale();

  const [reportView, setReportView] = useState<ReportView>("monthly");

  const [reportYear, setReportYear] = useState(() => new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState(
    () => new Date().getMonth() + 1,
  );
  const [report, setReport] = useState<LoadedReport | null>(null);
  const [isLoadingMonthly, setIsLoadingMonthly] = useState(false);
  const [loadErrorMonthly, setLoadErrorMonthly] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [yearlyReport, setYearlyReport] =
    useState<YearlyReportResponseBody | null>(null);
  const [isLoadingYearly, setIsLoadingYearly] = useState(false);
  const [loadErrorYearly, setLoadErrorYearly] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [isSavingReportEdit, setIsSavingReportEdit] = useState(false);
  const [reportEditSaveError, setReportEditSaveError] = useState<string | null>(
    null,
  );
  const reportRef = useRef<LoadedReport | null>(null);

  const anchorYear = useMemo(() => new Date().getFullYear(), []);
  const yearOptions = useMemo(() => {
    const base = buildYearRange(anchorYear);
    if (base.includes(reportYear)) return base;
    return [...base, reportYear].sort((a, b) => a - b);
  }, [anchorYear, reportYear]);

  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const label = new Intl.DateTimeFormat(locale, { month: "long" }).format(
        new Date(2000, month - 1, 1),
      );
      return { value: month, label };
    });
  }, [locale]);

  const monthLabelByYearMonth = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { month: "long" });
    const map = new Map<string, string>();
    for (let m = 1; m <= 12; m++) {
      const ym = formatYearMonth(reportYear, m);
      map.set(ym, formatter.format(new Date(2000, m - 1, 1)));
    }
    return map;
  }, [locale, reportYear]);

  useEffect(() => {
    reportRef.current = report;
  }, [report]);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.categories) {
          setCategories(data.categories);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setReportEditSaveError(null);
  }, [reportYear, reportMonth]);

  const goToAdjacentMonth = useCallback(
    (delta: -1 | 1) => {
      let month = reportMonth + delta;
      let year = reportYear;
      if (month < 1) {
        month = 12;
        year -= 1;
      } else if (month > 12) {
        month = 1;
        year += 1;
      }
      setReportYear(year);
      setReportMonth(month);
    },
    [reportMonth, reportYear],
  );

  const fetchReport = useCallback(async () => {
    const yearMonth = formatYearMonth(reportYear, reportMonth);
    setIsLoadingMonthly(true);
    setLoadErrorMonthly(null);
    setNotFound(false);
    setReport(null);

    try {
      const response = await fetch(
        `/api/expenses/monthly-report?yearMonth=${encodeURIComponent(yearMonth)}`,
      );
      const body = await response.json().catch(() => ({}));

      if (response.status === 404) {
        setNotFound(true);
        return;
      }

      if (!response.ok) {
        const msg =
          typeof body?.message === "string"
            ? body.message
            : t("loadError");
        setLoadErrorMonthly(msg);
        return;
      }

      const r = body?.report;
      if (!r?.categories || typeof r.yearMonth !== "string") {
        setLoadErrorMonthly(t("loadError"));
        return;
      }

      setReport({
        id: String(r.id),
        yearMonth: r.yearMonth,
        categories: r.categories,
        updatedAt:
          typeof r.updatedAt === "string" || r.updatedAt === null
            ? r.updatedAt
            : null,
      });
      trackEvent(MIXPANEL_EVENTS.MONTHLY_REPORT_VIEWED, {
        yearMonth: r.yearMonth,
      });
    } catch {
      setLoadErrorMonthly(t("loadError"));
    } finally {
      setIsLoadingMonthly(false);
    }
  }, [reportYear, reportMonth, t]);

  const handleReassignReportExpense = useCallback(
    async (
      fromCategoryName: string,
      expenseIndex: number,
      toCategoryName: string,
    ) => {
      const prev = reportRef.current;
      if (!prev) return;

      const sourceCat = prev.categories.find(
        (c) => c.name === fromCategoryName,
      );
      const expense = sourceCat?.expenses[expenseIndex];
      const targetCategory = categories.find((c) => c.name === toCategoryName);

      const nextCategories = reassignCategoryExpense(
        prev.categories,
        fromCategoryName,
        expenseIndex,
        toCategoryName,
        categories,
      );
      if (!nextCategories) return;

      trackEvent(MIXPANEL_EVENTS.EXPENSE_REASSIGNED, {
        fromCategory: fromCategoryName,
        toCategory: toCategoryName,
        expenseConcept: expense?.concept ?? "",
        expenseAmount: expense?.amount ?? 0,
      });

      setReport({ ...prev, categories: nextCategories });
      reportRef.current = { ...prev, categories: nextCategories };

      if (expense?.concept?.trim() && targetCategory?.id) {
        postCategoryConcept(
          targetCategory.id,
          expense.concept.trim(),
          toCategoryName,
        );
      }

      setReportEditSaveError(null);
      setIsSavingReportEdit(true);
      try {
        const categoriesPayload = nextCategories
          .filter((cat) => cat.expenses.length > 0)
          .map((cat) => ({
            name: cat.name,
            position: cat.position,
            expenses: cat.expenses.map((e) => ({
              concept: e.concept,
              amount: e.amount,
            })),
          }));

        const response = await fetch("/api/expenses/monthly-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            yearMonth: prev.yearMonth,
            categories: categoriesPayload,
          }),
        });

        const body = await response.json().catch(() => ({}));

        if (!response.ok) {
          setReportEditSaveError(t("reportEditSaveError"));
          await fetchReport();
          return;
        }

        trackEvent(MIXPANEL_EVENTS.REPORT_EXPENSE_REASSIGNED, {
          yearMonth: prev.yearMonth,
          fromCategory: fromCategoryName,
          toCategory: toCategoryName,
        });

        const r = body?.report;
        if (
          r &&
          (typeof r.updatedAt === "string" || r.updatedAt === null)
        ) {
          setReport((current) =>
            current &&
            current.yearMonth === prev.yearMonth &&
            current.id === prev.id
              ? {
                  ...current,
                  updatedAt:
                    typeof r.updatedAt === "string" ? r.updatedAt : null,
                }
              : current,
          );
        }
      } catch {
        setReportEditSaveError(t("reportEditSaveError"));
        await fetchReport();
      } finally {
        setIsSavingReportEdit(false);
      }
    },
    [categories, fetchReport, t],
  );

  const fetchYearlyReport = useCallback(async () => {
    setIsLoadingYearly(true);
    setLoadErrorYearly(null);
    setYearlyReport(null);

    try {
      const response = await fetch(
        `/api/expenses/yearly-report?year=${encodeURIComponent(String(reportYear))}`,
      );
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        const msg =
          typeof body?.message === "string"
            ? body.message
            : t("yearlyLoadError");
        setLoadErrorYearly(msg);
        return;
      }

      const r = body?.report;
      if (
        !r ||
        typeof r.year !== "number" ||
        !Array.isArray(r.months) ||
        !Array.isArray(r.categories) ||
        typeof r.yearTotals !== "object" ||
        r.yearTotals === null ||
        typeof r.grandTotal !== "number"
      ) {
        setLoadErrorYearly(t("yearlyLoadError"));
        return;
      }

      setYearlyReport(r as YearlyReportResponseBody);
      trackEvent(MIXPANEL_EVENTS.YEARLY_REPORT_VIEWED, { year: reportYear });
    } catch {
      setLoadErrorYearly(t("yearlyLoadError"));
    } finally {
      setIsLoadingYearly(false);
    }
  }, [reportYear, t]);

  useEffect(() => {
    if (reportView !== "monthly") return;
    void fetchReport();
  }, [fetchReport, reportView]);

  useEffect(() => {
    if (reportView !== "yearly") return;
    void fetchYearlyReport();
  }, [fetchYearlyReport, reportView]);

  const viewData: ClassifiedExpensesWithPositions | null = useMemo(() => {
    if (!report) return null;
    return {
      uncategorized: [],
      categories: [...report.categories].sort((a, b) => {
        if (a.position !== b.position) return a.position - b.position;
        return a.name.localeCompare(b.name);
      }),
    };
  }, [report]);

  const categoryChartRows = useMemo(() => {
    if (!report) return [];
    return report.categories
      .map((cat) => ({
        name: cat.name,
        amount: cat.expenses.reduce((s, exp) => s + exp.amount, 0),
      }))
      .filter((r) => r.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [report]);

  const updatedAtLabel = useMemo(() => {
    if (!report?.updatedAt) return null;
    try {
      return new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(report.updatedAt));
    } catch {
      return null;
    }
  }, [report?.updatedAt, locale]);

  const yearlyEmpty =
    reportView === "yearly" &&
    !isLoadingYearly &&
    !loadErrorYearly &&
    yearlyReport &&
    yearlyReport.categories.length === 0;

  const isLoading =
    reportView === "monthly" ? isLoadingMonthly : isLoadingYearly;
  const loadError =
    reportView === "monthly" ? loadErrorMonthly : loadErrorYearly;

  return (
    <main className="min-h-screen bg-background px-6 py-10 font-sans text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            {t("label")}
          </p>
          <h1 className="text-3xl font-bold">
            {reportView === "monthly" ? t("title") : t("titleYearly")}
          </h1>
          <p className="text-muted-foreground">
            {reportView === "monthly"
              ? t("description")
              : t("descriptionYearly")}
          </p>
        </header>

        <section className="flex flex-col gap-4 rounded-xl border border-border bg-card/40 p-6">
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={t("label")}
          >
            <button
              type="button"
              onClick={() => setReportView("monthly")}
              disabled={isLoadingMonthly && reportView === "monthly"}
              aria-pressed={reportView === "monthly"}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                reportView === "monthly"
                  ? "border-border bg-sidebar-accent text-sidebar-accent-foreground"
                  : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted/60",
              )}
            >
              {t("viewMonthly")}
            </button>
            <button
              type="button"
              onClick={() => setReportView("yearly")}
              disabled={isLoadingYearly && reportView === "yearly"}
              aria-pressed={reportView === "yearly"}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                reportView === "yearly"
                  ? "border-border bg-sidebar-accent text-sidebar-accent-foreground"
                  : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted/60",
              )}
            >
              {t("viewYearly")}
            </button>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="reports-year">{t("yearLabel")}</Label>
              <NativeSelect
                id="reports-year"
                value={reportYear}
                onChange={(e) => setReportYear(Number(e.target.value))}
                disabled={isLoading}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </NativeSelect>
            </div>
            {reportView === "monthly" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="reports-month">{t("monthLabel")}</Label>
                  <NativeSelect
                    id="reports-month"
                    value={reportMonth}
                    onChange={(e) => setReportMonth(Number(e.target.value))}
                    disabled={isLoadingMonthly}
                  >
                    {monthOptions.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    onClick={() => goToAdjacentMonth(-1)}
                    disabled={isLoadingMonthly}
                    aria-label={t("previousMonth")}
                  >
                    <ChevronLeft className="size-4" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    onClick={() => goToAdjacentMonth(1)}
                    disabled={isLoadingMonthly}
                    aria-label={t("nextMonth")}
                  >
                    <ChevronRight className="size-4" aria-hidden />
                  </Button>
                </div>
              </>
            ) : null}
          </div>

          {loadError ? (
            <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {loadError}
            </p>
          ) : null}

          {reportView === "monthly" &&
          notFound &&
          !isLoadingMonthly &&
          !loadErrorMonthly ? (
            <p className="text-sm text-muted-foreground">{t("emptyState")}</p>
          ) : null}

          {yearlyEmpty ? (
            <p className="text-sm text-muted-foreground">
              {t("yearlyEmptyState")}
            </p>
          ) : null}
        </section>

        {reportView === "monthly" && viewData && !notFound ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {updatedAtLabel ? (
                <p>{t("updatedAt", { date: updatedAtLabel })}</p>
              ) : null}
              {isSavingReportEdit ? (
                <p aria-live="polite">{t("savingReportChanges")}</p>
              ) : null}
            </div>
            {reportEditSaveError ? (
              <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {reportEditSaveError}
              </p>
            ) : null}
            <ClassificationResults
              data={viewData}
              categories={categories}
              onReassign={handleReassignReportExpense}
            />
            <CategorySpendingChart rows={categoryChartRows} locale={locale} />
          </div>
        ) : null}

        {reportView === "yearly" &&
        yearlyReport &&
        yearlyReport.categories.length > 0 ? (
          <div className="w-full min-w-0 overflow-x-auto rounded-xl border border-border">
            <Table className="min-w-max">
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 z-10 min-w-[8rem] bg-card">
                    {t("tableCategory")}
                  </TableHead>
                  {yearlyReport.months.map((row) => {
                    const parsed = parseYearMonth(row.yearMonth);
                    const monthLabel =
                      monthLabelByYearMonth.get(row.yearMonth) ??
                      (parsed
                        ? new Intl.DateTimeFormat(locale, {
                            month: "long",
                          }).format(new Date(2000, parsed.month - 1, 1))
                        : row.yearMonth);
                    return (
                      <TableHead
                        key={row.yearMonth}
                        className="min-w-[5.5rem] text-right whitespace-normal"
                      >
                        {monthLabel}
                      </TableHead>
                    );
                  })}
                  <TableHead className="min-w-[6rem] text-right font-semibold">
                    {t("tableYearTotal")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {yearlyReport.categories.map((c) => (
                  <TableRow key={c.name}>
                    <TableCell className="sticky left-0 z-10 bg-card font-medium whitespace-normal">
                      {c.name}
                    </TableCell>
                    {yearlyReport.months.map((row) => {
                      const v = row.totals[c.name] ?? 0;
                      return (
                        <TableCell
                          key={row.yearMonth}
                          className="text-right tabular-nums"
                        >
                          {formatAmount(v)}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatAmount(yearlyReport.yearTotals[c.name] ?? 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="sticky left-0 z-10 bg-muted/50 font-semibold">
                    {t("tableMonthTotal")}
                  </TableCell>
                  {yearlyReport.months.map((row) => (
                    <TableCell
                      key={row.yearMonth}
                      className="text-right tabular-nums font-semibold"
                    >
                      {formatAmount(row.rowTotal)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right tabular-nums font-bold">
                    {formatAmount(yearlyReport.grandTotal)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        ) : null}
      </div>
    </main>
  );
}
