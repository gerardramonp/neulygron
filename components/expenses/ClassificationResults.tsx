"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";

import { AssignCategoryButton } from "@/components/expenses/AssignCategoryButton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategoryRows } from "@/components/expenses/CategoryRows";
import { formatAmount } from "@/lib/utils";
import type { ClassifiedExpensesWithPositions } from "@/lib/validation/expenses";
import type { Category } from "@/app/(app)/config/types";

interface ClassificationResultsProps {
  data: ClassifiedExpensesWithPositions;
  categories: Category[];
  readOnly?: boolean;
  onAssign?: (expenseIndex: number, categoryName: string) => void;
  onReassign?: (
    fromCategoryName: string,
    expenseIndex: number,
    toCategoryName: string,
  ) => void;
}

export function ClassificationResults({
  data,
  categories,
  readOnly = false,
  onAssign = () => {},
  onReassign = () => {},
}: ClassificationResultsProps) {
  const t = useTranslations("ClassificationResults");

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );

  const toggleCategory = (name: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const grandTotal = useMemo(() => {
    const categorizedTotal = data.categories.reduce(
      (sum, cat) =>
        sum + cat.expenses.reduce((catSum, exp) => catSum + exp.amount, 0),
      0,
    );
    const uncategorizedTotal = data.uncategorized.reduce(
      (sum, exp) => sum + exp.amount,
      0,
    );
    return categorizedTotal + uncategorizedTotal;
  }, [data]);

  const uncategorizedTotal = useMemo(
    () => data.uncategorized.reduce((sum, exp) => sum + exp.amount, 0),
    [data.uncategorized],
  );

  const categorizedTotal = useMemo(
    () =>
      data.categories.reduce(
        (sum, cat) =>
          sum + cat.expenses.reduce((catSum, exp) => catSum + exp.amount, 0),
        0,
      ),
    [data.categories],
  );

  const hasUncategorized = !readOnly && data.uncategorized.length > 0;

  return (
    <div className="space-y-6 w-full">
      {/* Grand total banner */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
        <p className="text-sm text-muted-foreground">{t("grandTotal")}</p>
        <p className="text-2xl font-bold text-foreground">
          {formatAmount(grandTotal)}
        </p>
      </div>

      {/* Side-by-side layout on desktop */}
      <div
        className={`grid grid-cols-1 gap-6 ${hasUncategorized ? "lg:grid-cols-2" : ""}`}
      >
        {/* Uncategorized expenses table */}
        {hasUncategorized ? (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              {t("uncategorizedTitle")}
            </h2>
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("concept")}</TableHead>
                    <TableHead className="text-right">{t("amount")}</TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.uncategorized.map((expense, index) => (
                    <TableRow key={index}>
                      <TableCell>{expense.concept}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatAmount(expense.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <AssignCategoryButton
                          categories={categories}
                          onAssign={(categoryName) =>
                            onAssign(index, categoryName)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-semibold">
                      {t("subtotal")}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatAmount(uncategorizedTotal)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>
        ) : null}

        {/* Categories table with expandable rows */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            {t("categoriesTitle")}
          </h2>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>{t("category")}</TableHead>
                  <TableHead className="text-right">
                    {t("categoryTotal")}
                  </TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.categories.map((category) => {
                  const isExpanded = expandedCategories.has(category.name);
                  const categoryTotal = category.expenses.reduce(
                    (sum, exp) => sum + exp.amount,
                    0,
                  );

                  return (
                    <CategoryRows
                      key={category.name}
                      name={category.name}
                      expenses={category.expenses}
                      total={categoryTotal}
                      isExpanded={isExpanded}
                      onToggle={() => toggleCategory(category.name)}
                      expensesCount={t("expensesCount", {
                        count: category.expenses.length,
                      })}
                      categories={categories}
                      readOnly={readOnly}
                      onReassign={(expenseIndex, targetCategoryName) =>
                        onReassign(
                          category.name,
                          expenseIndex,
                          targetCategoryName,
                        )
                      }
                    />
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell />
                  <TableCell className="font-semibold">
                    {t("subtotal")}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatAmount(categorizedTotal)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
