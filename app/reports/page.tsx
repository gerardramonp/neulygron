"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { ClassificationResults } from "@/components/expenses/ClassificationResults";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ClassifiedExpensesWithPositions } from "@/lib/validation/expenses";
import type { YearlyReportResponseBody } from "@/lib/yearly-report";
import { buildYearRange, formatYearMonth, parseYearMonth } from "@/lib/year-month";
import { cn, formatAmount } from "@/lib/utils";

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

  const anchorYear = useMemo(() => new Date().getFullYear(), []);
  const yearOptions = useMemo(
    () => buildYearRange(anchorYear),
    [anchorYear],
  );

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
    } catch {
      setLoadErrorMonthly(t("loadError"));
    } finally {
      setIsLoadingMonthly(false);
    }
  }, [reportYear, reportMonth, t]);

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
            {updatedAtLabel ? (
              <p className="text-sm text-muted-foreground">
                {t("updatedAt", { date: updatedAtLabel })}
              </p>
            ) : null}
            <ClassificationResults
              readOnly
              data={viewData}
              categories={[]}
            />
          </div>
        ) : null}

        {reportView === "yearly" &&
        yearlyReport &&
        yearlyReport.categories.length > 0 ? (
          <div className="w-full min-w-0 overflow-x-auto rounded-xl border border-border">
            <Table className="min-w-max">
              <TableCaption className="mt-0 mb-2 text-left text-sm text-muted-foreground">
                {t("tableGrandTotal")}: {formatAmount(yearlyReport.grandTotal)}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 z-10 min-w-[8rem] bg-card">
                    {t("tableMonth")}
                  </TableHead>
                  {yearlyReport.categories.map((c) => (
                    <TableHead
                      key={c.name}
                      className="min-w-[6rem] text-right whitespace-normal"
                    >
                      {c.name}
                    </TableHead>
                  ))}
                  <TableHead className="min-w-[6rem] text-right font-semibold">
                    {t("tableRowTotal")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
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
                    <TableRow key={row.yearMonth}>
                      <TableCell className="sticky left-0 z-10 bg-card font-medium">
                        {monthLabel}
                      </TableCell>
                      {yearlyReport.categories.map((c) => {
                        const v = row.totals[c.name] ?? 0;
                        return (
                          <TableCell key={c.name} className="text-right tabular-nums">
                            {formatAmount(v)}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-right tabular-nums font-medium">
                        {formatAmount(row.rowTotal)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="sticky left-0 z-10 bg-muted/50 font-semibold">
                    {t("tableYearTotal")}
                  </TableCell>
                  {yearlyReport.categories.map((c) => {
                    const v = yearlyReport.yearTotals[c.name] ?? 0;
                    return (
                      <TableCell
                        key={c.name}
                        className="text-right tabular-nums font-semibold"
                      >
                        {formatAmount(v)}
                      </TableCell>
                    );
                  })}
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
