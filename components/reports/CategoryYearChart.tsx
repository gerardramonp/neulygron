"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";

import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import type { YearComparisonResponseBody } from "@/lib/year-comparison";

type CategoryYearChartProps = {
  comparison: YearComparisonResponseBody;
  locale: string;
};

const YEAR_COLORS = [
  "var(--category-1)",
  "var(--category-2)",
  "var(--category-3)",
  "var(--category-4)",
  "var(--category-5)",
  "var(--category-6)",
  "var(--category-7)",
  "var(--category-8)",
  "var(--category-9)",
  "var(--category-10)",
] as const;

type ChartRow = {
  monthLabel: string;
  [yearKey: string]: string | number | null;
};

function defaultYearPair(years: number[]): [number, number] {
  if (years.length === 0) return [0, 0];
  const latest = years[years.length - 1];
  const previous = years.length > 1 ? years[years.length - 2] : latest;
  return [previous, latest];
}

export function CategoryYearChart({
  comparison,
  locale,
}: CategoryYearChartProps) {
  const t = useTranslations("ReportsPage");
  const [initialYearA, initialYearB] = defaultYearPair(comparison.years);
  const [categoryName, setCategoryName] = useState(
    () => comparison.categories[0]?.name ?? "",
  );
  const [yearA, setYearA] = useState(initialYearA);
  const [yearB, setYearB] = useState(initialYearB);

  useEffect(() => {
    if (
      comparison.categories.length > 0 &&
      !comparison.categories.some((c) => c.name === categoryName)
    ) {
      setCategoryName(comparison.categories[0].name);
    }
    if (comparison.years.length > 0 && !comparison.years.includes(yearA)) {
      setYearA(defaultYearPair(comparison.years)[0]);
    }
    if (comparison.years.length > 0 && !comparison.years.includes(yearB)) {
      setYearB(defaultYearPair(comparison.years)[1]);
    }
  }, [categoryName, comparison, yearA, yearB]);

  const amountFmt = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [locale],
  );

  const signedFmt = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        signDisplay: "exceptZero",
      }),
    [locale],
  );

  const monthLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { month: "short" });
    return Array.from({ length: 12 }, (_, i) =>
      formatter.format(new Date(2000, i, 1)),
    );
  }, [locale]);

  const plottedYears = useMemo(() => {
    const selected = [yearA, yearB].filter((y) => comparison.years.includes(y));
    return [...new Set(selected)].sort((a, b) => a - b);
  }, [comparison.years, yearA, yearB]);

  const chartData: ChartRow[] = useMemo(
    () =>
      comparison.months.map((row) => {
        const entry: ChartRow = {
          monthLabel: monthLabels[row.month - 1] ?? String(row.month),
        };
        const amounts = row.byCategory[categoryName] ?? {};
        for (const year of plottedYears) {
          entry[String(year)] = amounts[String(year)] ?? null;
        }
        return entry;
      }),
    [categoryName, comparison.months, monthLabels, plottedYears],
  );

  const earlierYear = plottedYears[0];
  const laterYear = plottedYears[plottedYears.length - 1];

  const ariaSummary = t("compareCategoryAriaSummary", {
    category: categoryName,
    firstYear: yearA,
    secondYear: yearB,
  });

  const tooltipContent = (props: TooltipContentProps) => {
    const { active, payload, label } = props;
    if (!active || !payload?.length) return null;

    const valueByYear = new Map<number, number>();
    for (const item of payload) {
      if (typeof item.value === "number" && item.dataKey != null) {
        valueByYear.set(Number(item.dataKey), item.value);
      }
    }

    const earlier =
      earlierYear !== undefined ? valueByYear.get(earlierYear) : undefined;
    const later =
      laterYear !== undefined ? valueByYear.get(laterYear) : undefined;
    const showDifference =
      plottedYears.length === 2 &&
      earlier !== undefined &&
      later !== undefined;

    return (
      <div className="rounded-md border border-border bg-popover px-3 py-2 text-sm shadow-md">
        <p className="mb-1 font-medium text-popover-foreground">{label}</p>
        {payload.map((item) => {
          const value = item.value;
          if (value == null || typeof value !== "number") return null;
          return (
            <p
              key={String(item.dataKey)}
              className="tabular-nums text-muted-foreground"
            >
              {item.name}: {amountFmt.format(value)}
            </p>
          );
        })}
        {showDifference ? (
          <p className="mt-1 tabular-nums text-popover-foreground">
            {t("compareDifference")}: {signedFmt.format(later - earlier)}
          </p>
        ) : null}
      </div>
    );
  };

  if (comparison.categories.length === 0) {
    return (
      <section
        className="rounded-xl border border-border bg-card/40 p-6"
        aria-label={t("compareCategoryChartTitle")}
      >
        <h2 className="text-lg font-semibold text-foreground">
          {t("compareCategoryChartTitle")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("compareCategoryEmpty")}
        </p>
      </section>
    );
  }

  return (
    <section
      className="rounded-xl border border-border bg-card/40 p-6"
      aria-label={ariaSummary}
    >
      <h2 className="mb-4 text-lg font-semibold text-foreground">
        {t("compareCategoryChartTitle")}
      </h2>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="compare-category">{t("compareCategoryLabel")}</Label>
          <NativeSelect
            id="compare-category"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
          >
            {comparison.categories.map((cat) => (
              <option key={cat.name} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="compare-year-a">{t("compareFirstYear")}</Label>
          <NativeSelect
            id="compare-year-a"
            value={yearA}
            onChange={(e) => setYearA(Number(e.target.value))}
          >
            {comparison.years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="compare-year-b">{t("compareSecondYear")}</Label>
          <NativeSelect
            id="compare-year-b"
            value={yearB}
            onChange={(e) => setYearB(Number(e.target.value))}
          >
            {comparison.years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>
      <div className="w-full min-w-0" style={{ height: 360 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
            barCategoryGap="20%"
            barGap={4}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              vertical={false}
            />
            <XAxis
              dataKey="monthLabel"
              className="text-xs [&_text]:fill-muted-foreground"
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
            />
            <YAxis
              tickFormatter={(v) => amountFmt.format(Number(v))}
              width={72}
              className="text-xs [&_text]:fill-muted-foreground"
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
            />
            <Tooltip
              content={tooltipContent}
              cursor={{ fill: "var(--muted)" }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={10}
              wrapperStyle={{ paddingBottom: 12 }}
              className="text-xs [&_text]:fill-foreground"
            />
            {plottedYears.map((year) => {
              const colorIndex = Math.max(0, comparison.years.indexOf(year));
              return (
                <Bar
                  key={year}
                  dataKey={String(year)}
                  name={String(year)}
                  fill={YEAR_COLORS[colorIndex % YEAR_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
