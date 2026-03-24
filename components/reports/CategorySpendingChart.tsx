"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";

import { cn } from "@/lib/utils";

export type CategorySpendingRow = {
  name: string;
  amount: number;
};

type CategorySpendingChartProps = {
  rows: CategorySpendingRow[];
  locale: string;
};

type ChartDatum = CategorySpendingRow & { percent: number };

type ChartType = "bar" | "pie";

const SLICE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

function truncateCategoryLabel(name: string, maxLen: number): string {
  if (name.length <= maxLen) return name;
  return `${name.slice(0, maxLen - 1)}…`;
}

export function CategorySpendingChart({
  rows,
  locale,
}: CategorySpendingChartProps) {
  const t = useTranslations("ReportsPage");
  const [chartType, setChartType] = useState<ChartType>("bar");

  const amountFmt = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [locale],
  );

  const percentFmt = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "percent",
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
    [locale],
  );

  const grandTotal = useMemo(
    () => rows.reduce((s, r) => s + r.amount, 0),
    [rows],
  );

  const chartData: ChartDatum[] = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        percent: grandTotal > 0 ? r.amount / grandTotal : 0,
      })),
    [rows, grandTotal],
  );

  const barChartHeight = useMemo(
    () => Math.min(560, Math.max(220, 48 + chartData.length * 40)),
    [chartData.length],
  );

  const ariaSummary = t("chartAriaSummary", {
    count: chartData.length,
    total: amountFmt.format(grandTotal),
  });

  const tooltipContent = (props: TooltipContentProps) => {
    const { active, payload } = props;
    if (!active || !payload?.length) return null;
    const row = payload[0].payload as ChartDatum;
    return (
      <div className="rounded-md border border-border bg-popover px-3 py-2 text-sm shadow-md">
        <p className="font-medium text-popover-foreground">{row.name}</p>
        <p className="tabular-nums text-muted-foreground">
          {t("chartAmount")}: {amountFmt.format(row.amount)}
        </p>
        <p className="tabular-nums text-muted-foreground">
          {t("chartPercent")}: {percentFmt.format(row.percent)}
        </p>
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <section
        className="rounded-xl border border-border bg-card/40 p-6"
        aria-label={t("chartTitle")}
      >
        <h2 className="text-lg font-semibold text-foreground">
          {t("chartTitle")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("chartEmpty")}</p>
      </section>
    );
  }

  return (
    <section
      className="rounded-xl border border-border bg-card/40 p-6"
      aria-label={ariaSummary}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          {t("chartTitle")}
        </h2>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={t("chartViewGroup")}
        >
          <button
            type="button"
            onClick={() => setChartType("bar")}
            aria-pressed={chartType === "bar"}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
              chartType === "bar"
                ? "border-border bg-sidebar-accent text-sidebar-accent-foreground"
                : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted/60",
            )}
          >
            {t("chartViewBar")}
          </button>
          <button
            type="button"
            onClick={() => setChartType("pie")}
            aria-pressed={chartType === "pie"}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
              chartType === "pie"
                ? "border-border bg-sidebar-accent text-sidebar-accent-foreground"
                : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted/60",
            )}
          >
            {t("chartViewPie")}
          </button>
        </div>
      </div>

      <div
        className="w-full min-w-0"
        style={{
          height: chartType === "bar" ? barChartHeight : 380,
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "bar" ? (
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
              barCategoryGap={12}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                horizontal={false}
              />
              <XAxis
                type="number"
                tickFormatter={(v) => amountFmt.format(Number(v))}
                className="text-xs [&_text]:fill-muted-foreground"
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={132}
                tickFormatter={(name) =>
                  truncateCategoryLabel(String(name), 22)
                }
                className="text-xs [&_text]:fill-foreground"
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
              />
              <Tooltip content={tooltipContent} cursor={{ fill: "var(--muted)" }} />
              <Bar
                dataKey="amount"
                name={t("chartAmount")}
                radius={[0, 4, 4, 0]}
                maxBarSize={28}
              >
                {chartData.map((_, i) => (
                  <Cell
                    key={`bar-${i}`}
                    fill={SLICE_COLORS[i % SLICE_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Pie
                data={chartData}
                dataKey="amount"
                nameKey="name"
                cx="50%"
                cy="46%"
                outerRadius="72%"
                paddingAngle={2}
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`slice-${index}`}
                    fill={SLICE_COLORS[index % SLICE_COLORS.length]}
                    stroke="var(--card)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={tooltipContent} />
              <Legend
                verticalAlign="bottom"
                wrapperStyle={{ paddingTop: 8 }}
                formatter={(value) =>
                  truncateCategoryLabel(String(value), 28)
                }
                className="text-xs [&_text]:fill-foreground"
              />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </section>
  );
}
