import type { Category } from "@/app/config/types";
import type { ClassifiedExpensesWithPositions } from "@/lib/validation/expenses";

type CategoryWithPosition =
  ClassifiedExpensesWithPositions["categories"][number];

/**
 * Moves one expense from a source category to a target category (pure).
 * Returns null when nothing changes.
 */
export function reassignCategoryExpense(
  categories: CategoryWithPosition[],
  fromCategoryName: string,
  expenseIndex: number,
  toCategoryName: string,
  userCategories: Category[],
): CategoryWithPosition[] | null {
  if (fromCategoryName === toCategoryName) return null;

  const sourceIndex = categories.findIndex((c) => c.name === fromCategoryName);
  if (sourceIndex < 0) return null;
  const source = categories[sourceIndex];
  const exp = source.expenses[expenseIndex];
  if (!exp) return null;

  const nextSourceExpenses = source.expenses.filter(
    (_, i) => i !== expenseIndex,
  );
  const afterRemove = categories.map((cat, i) =>
    i === sourceIndex ? { ...cat, expenses: nextSourceExpenses } : cat,
  );

  const targetIndex = afterRemove.findIndex(
    (cat) => cat.name === toCategoryName,
  );
  if (targetIndex >= 0) {
    return afterRemove.map((cat, i) =>
      i === targetIndex ? { ...cat, expenses: [...cat.expenses, exp] } : cat,
    );
  }

  const matched = userCategories.find((c) => c.name === toCategoryName);
  if (!matched) return null;

  return [
    ...afterRemove,
    {
      name: toCategoryName,
      expenses: [exp],
      position: matched.position,
    },
  ];
}
