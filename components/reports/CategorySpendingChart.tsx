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
import type { PieLabelRenderProps, TooltipContentProps } from "recharts";

import { cn } from "@/lib/utils";
import { MIXPANEL_EVENTS, trackEvent } from "@/lib/analytics/mixpanel";

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

/** Pie uses a separate palette so adjacent slices stay visually distinct (see globals.css). */
const PIE_SLICE_FILLS = [
  "var(--pie-slice-1)",
  "var(--pie-slice-2)",
  "var(--pie-slice-3)",
  "var(--pie-slice-4)",
  "var(--pie-slice-5)",
  "var(--pie-slice-6)",
  "var(--pie-slice-7)",
  "var(--pie-slice-8)",
  "var(--pie-slice-9)",
  "var(--pie-slice-10)",
] as const;

const PIE_LABEL_MIN_PERCENT = 0.036;

function PieSlicePercentLabel(props: PieLabelRenderProps) {
  const pct = props.percent ?? 0;
  if (pct < PIE_LABEL_MIN_PERCENT) return null;

  const cx = props.cx ?? 0;
  const cy = props.cy ?? 0;
  const innerR = Number(props.innerRadius ?? 0);
  const outerR = Number(props.outerRadius ?? 0);
  const midAngle =
    props.midAngle ??
    (Number(props.startAngle ?? 0) + Number(props.endAngle ?? 0)) / 2;

  const r = innerR + (outerR - innerR) * 0.52;
  const rad = (Math.PI / 180) * midAngle;
  const x = cx + Math.cos(-rad) * r;
  const y = cy + Math.sin(-rad) * r;

  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fill="white"
      style={{
        fontSize: 12,
        fontWeight: 700,
        paintOrder: "stroke fill",
        stroke: "rgba(0,0,0,0.32)",
        strokeWidth: 2.5,
        strokeLinejoin: "round",
      }}
    >
      {`${Math.round(pct * 100)}%`}
    </text>
  );
}

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

  const setChartTypeTracked = (next: ChartType) => {
    setChartType((prev) => {
      if (prev === next) return prev;
      trackEvent(MIXPANEL_EVENTS.CHART_TYPE_TOGGLED, { chartType: next });
      return next;
    });
  };

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
            onClick={() => setChartTypeTracked("bar")}
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
            onClick={() => setChartTypeTracked("pie")}
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
          height: chartType === "bar" ? barChartHeight : 400,
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
              <Tooltip
                content={tooltipContent}
                cursor={{ fill: "var(--muted)" }}
              />
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
            <PieChart margin={{ top: 12, right: 12, bottom: 4, left: 12 }}>
              <Pie
                data={chartData}
                dataKey="amount"
                nameKey="name"
                cx="50%"
                cy="48%"
                outerRadius="68%"
                paddingAngle={0}
                stroke="var(--card)"
                strokeWidth={1.5}
                label={PieSlicePercentLabel}
                labelLine={false}
                animationBegin={50}
                animationDuration={750}
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`slice-${index}`}
                    fill={PIE_SLICE_FILLS[index % PIE_SLICE_FILLS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={tooltipContent} />
              <Legend
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                iconSize={10}
                wrapperStyle={{ paddingTop: 18, width: "100%" }}
                formatter={(value) => truncateCategoryLabel(String(value), 28)}
                className="text-xs [&_.recharts-legend-item]:mr-3 [&_.recharts-legend-item]:inline-flex [&_.recharts-legend-item]:items-center [&_text]:fill-foreground"
              />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </section>
  );
}
