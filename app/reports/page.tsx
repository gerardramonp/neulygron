"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { ClassificationResults } from "@/components/expenses/ClassificationResults";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import type { ClassifiedExpensesWithPositions } from "@/lib/validation/expenses";
import { buildYearRange, formatYearMonth } from "@/lib/year-month";

type LoadedReport = {
  id: string;
  yearMonth: string;
  categories: ClassifiedExpensesWithPositions["categories"];
  updatedAt: string | null;
};

export default function ReportsPage() {
  const t = useTranslations("ReportsPage");
  const locale = useLocale();

  const [reportYear, setReportYear] = useState(() => new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState(
    () => new Date().getMonth() + 1,
  );
  const [report, setReport] = useState<LoadedReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

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

  const fetchReport = useCallback(async () => {
    const yearMonth = formatYearMonth(reportYear, reportMonth);
    setIsLoading(true);
    setLoadError(null);
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
          typeof body?.message === "string" ? body.message : t("loadError");
        setLoadError(msg);
        return;
      }

      const r = body?.report;
      if (!r?.categories || typeof r.yearMonth !== "string") {
        setLoadError(t("loadError"));
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
      setLoadError(t("loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [reportYear, reportMonth, t]);

  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

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

  return (
    <main className="min-h-screen bg-background px-6 py-10 font-sans text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            {t("label")}
          </p>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </header>

        <section className="flex flex-col gap-4 rounded-xl border border-border bg-card/40 p-6">
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
            <div className="space-y-2">
              <Label htmlFor="reports-month">{t("monthLabel")}</Label>
              <NativeSelect
                id="reports-month"
                value={reportMonth}
                onChange={(e) => setReportMonth(Number(e.target.value))}
                disabled={isLoading}
              >
                {monthOptions.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>

          {loadError ? (
            <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {loadError}
            </p>
          ) : null}

          {notFound && !isLoading && !loadError ? (
            <p className="text-sm text-muted-foreground">{t("emptyState")}</p>
          ) : null}
        </section>

        {viewData && !notFound ? (
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
      </div>
    </main>
  );
}
