"use client";

import { useMemo } from "react";
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

import type { YearComparisonResponseBody } from "@/lib/year-comparison";

type YearlyTotalsChartProps = {
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

export function YearlyTotalsChart({
  comparison,
  locale,
}: YearlyTotalsChartProps) {
  const t = useTranslations("ReportsPage");

  const amountFmt = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [locale],
  );

  const monthLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { month: "short" });
    return Array.from({ length: 12 }, (_, i) =>
      formatter.format(new Date(2000, i, 1)),
    );
  }, [locale]);

  const chartData: ChartRow[] = useMemo(
    () =>
      comparison.months.map((row) => {
        const entry: ChartRow = {
          monthLabel: monthLabels[row.month - 1] ?? String(row.month),
        };
        for (const year of comparison.years) {
          entry[String(year)] = row.byYear[String(year)] ?? null;
        }
        return entry;
      }),
    [comparison, monthLabels],
  );

  const ariaSummary = t("compareChartAriaSummary", {
    yearCount: comparison.years.length,
  });

  const tooltipContent = (props: TooltipContentProps) => {
    const { active, payload, label } = props;
    if (!active || !payload?.length) return null;

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
      </div>
    );
  };

  if (comparison.years.length === 0) {
    return (
      <section
        className="rounded-xl border border-border bg-card/40 p-6"
        aria-label={t("compareChartTitle")}
      >
        <h2 className="text-lg font-semibold text-foreground">
          {t("compareChartTitle")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("compareEmptyState")}
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
        {t("compareChartTitle")}
      </h2>
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
            {comparison.years.map((year, index) => (
              <Bar
                key={year}
                dataKey={String(year)}
                name={String(year)}
                fill={YEAR_COLORS[index % YEAR_COLORS.length]}
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
