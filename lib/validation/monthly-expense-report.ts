import { z } from "zod";

const expenseLineSchema = z.object({
  concept: z.string().trim().min(1).max(400),
  amount: z.number().positive(),
});

const categorySnapshotSchema = z.object({
  name: z.string().trim().min(1).max(100),
  position: z.number(),
  expenses: z.array(expenseLineSchema),
});

export const yearMonthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

export const saveMonthlyExpenseReportSchema = z
  .object({
    yearMonth: z
      .string()
      .trim()
      .regex(yearMonthRegex, "yearMonth must be YYYY-MM"),
    categories: z.array(categorySnapshotSchema),
  })
  .strict();

export type SaveMonthlyExpenseReportInput = z.infer<
  typeof saveMonthlyExpenseReportSchema
>;
