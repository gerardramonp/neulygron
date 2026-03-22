"use client";

import { ChevronRight, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

import { TableCell, TableRow } from "@/components/ui/table";
import { AssignCategoryButton } from "@/components/expenses/AssignCategoryButton";
import { formatAmount } from "@/lib/utils";
import type { Category } from "@/app/config/types";

interface CategoryRowsProps {
  name: string;
  expenses: { concept: string; amount: number }[];
  total: number;
  isExpanded: boolean;
  onToggle: () => void;
  expensesCount: string;
  categories?: Category[];
  onReassign?: (expenseIndex: number, newCategoryName: string) => void;
}

export function CategoryRows({
  name,
  expenses,
  total,
  isExpanded,
  onToggle,
  expensesCount,
  categories,
  onReassign,
}: CategoryRowsProps) {
  const t = useTranslations("ClassificationResults");
  const Chevron = isExpanded ? ChevronDown : ChevronRight;

  const otherCategories = categories?.filter((c) => c.name !== name) ?? [];
  const showReassign = !!onReassign && categories !== undefined;

  return (
    <>
      {/* Summary row */}
      <TableRow
        className="cursor-pointer select-none"
        onClick={onToggle}
        role="button"
        aria-expanded={isExpanded}
      >
        <TableCell className="w-8 px-2">
          <Chevron className="h-4 w-4 text-muted-foreground" />
        </TableCell>
        <TableCell>
          <span className="font-medium">{name}</span>
          <span className="ml-2 text-xs text-muted-foreground">
            {expensesCount}
          </span>
        </TableCell>
        <TableCell className="text-right font-medium tabular-nums">
          {formatAmount(total)}
        </TableCell>
        {showReassign ? <TableCell /> : null}
      </TableRow>

      {/* Expanded expense rows */}
      {isExpanded
        ? expenses.map((expense, index) => (
            <TableRow key={index} className="bg-muted/30">
              <TableCell />
              <TableCell className="pl-8 text-muted-foreground">
                {expense.concept}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {formatAmount(expense.amount)}
              </TableCell>
              {showReassign ? (
                <TableCell className="text-right">
                  <AssignCategoryButton
                    categories={otherCategories}
                    onAssign={(newCategoryName) =>
                      onReassign!(index, newCategoryName)
                    }
                    buttonLabel={t("reassignButton")}
                    popoverTitle={t("reassignTitle")}
                  />
                </TableCell>
              ) : null}
            </TableRow>
          ))
        : null}
    </>
  );
}
