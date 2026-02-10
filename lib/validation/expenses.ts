import { z } from "zod";

const expenseSchema = z.object({
  concept: z
    .string()
    .describe("A brief description of what the expense was for"),
  amount: z
    .number()
    .positive()
    .describe("The monetary amount of the expense in the document's currency"),
});

export const extractExpensesSchema = z.object({
  expenses: z
    .array(expenseSchema)
    .describe(
      "All expenses found in the document. Each expense must have a concept and amount.",
    ),
});

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

export type ExtractedExpenses = z.infer<typeof extractExpensesSchema>;
export type ClassifiedExpenses = z.infer<typeof classifyExpensesSchema>;
