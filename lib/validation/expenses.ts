import { z } from "zod";

import { yearMonthRegex } from "@/lib/validation/monthly-expense-report";

const expenseSchema = z.object({
  concept: z
    .string()
    .describe("A brief description of what the expense was for"),
  amount: z
    .number()
    .positive()
    .describe("The monetary amount of the expense in the document's currency"),
});

const extractedExpensesShape = z.object({
  expenses: z
    .array(expenseSchema)
    .describe(
      "All expenses found in the document. Each expense must have a concept and amount.",
    ),
  proposedYearMonth: z
    .string()
    .regex(yearMonthRegex, "must be YYYY-MM")
    .nullable()
    .describe(
      "Calendar month (YYYY-MM) this document should be filed under: prefer statement period end date, billing cycle month, or primary invoice date. Null only if no reliable date appears in the document.",
    ),
});

export type ExtractedExpenses = z.infer<typeof extractedExpensesShape>;

/**
 * Single root object (no z.union / discriminatedUnion) so JSON Schema for the
 * AI gateway stays a plain `type: "object"` — unions were producing invalid schema.
 */
export const extractExpensesResultSchema = z.object({
  result: z
    .enum(["ok", "not_bank_expense_report"])
    .describe(
      "ok only for bank/account or card-issuer statements that list debits or card charges. Otherwise not_bank_expense_report.",
    ),
  expenses: z
    .array(expenseSchema)
    .describe(
      "When result is ok: all spending lines. When not_bank_expense_report: must be an empty array.",
    ),
  proposedYearMonth: z
    .string()
    .regex(yearMonthRegex, "must be YYYY-MM")
    .nullable()
    .describe(
      "When result is ok: YYYY-MM for the statement month, or null if no reliable date. When not_bank_expense_report: null.",
    ),
  reason: z
    .string()
    .describe(
      "When not_bank_expense_report: one short user-facing sentence. When result is ok: empty string.",
    ),
});

export type ExtractExpensesModelResult = z.infer<
  typeof extractExpensesResultSchema
>;

/** Normalized extraction outcome for API and callers (after interpreting model output). */
export type ExtractExpensesFromTextResult =
  | { ok: true; data: ExtractedExpenses }
  | { ok: false; reason: string };

const categorySchema = z.object({
  name: z
    .string()
    .describe(
      "The category name that best describes this group of expenses (e.g., Groceries, Transportation, Utilities, Entertainment, Healthcare)",
    ),
  expenses: z
    .array(expenseSchema)
    .describe("List of expenses that belong to this category"),
});

export const classifyExpensesSchema = z.object({
  categories: z
    .array(categorySchema)
    .describe(
      "Expenses grouped by their category. Each category contains related expenses.",
    ),
  uncategorized: z
    .array(expenseSchema)
    .describe(
      "Expenses that could not be confidently assigned to any category",
    ),
});

export type ClassifiedExpenses = z.infer<typeof classifyExpensesSchema>;

/** Categories as shown after classify API attaches sort `position` (user order or sentinel). */
export type ClassifiedExpenseCategoryWithPosition =
  ClassifiedExpenses["categories"][number] & { position: number };

export type ClassifiedExpensesWithPositions = Omit<
  ClassifiedExpenses,
  "categories"
> & {
  categories: ClassifiedExpenseCategoryWithPosition[];
};
