import { z } from "zod";

const MIN_YEAR = 2000;

function maxAllowedYear(): number {
  return new Date().getFullYear() + 1;
}

/** Validates `year` query string for GET /api/expenses/yearly-report */
export const yearlyReportYearQuerySchema = z
  .string()
  .trim()
  .regex(/^\d{4}$/, "year must be YYYY")
  .transform((s) => Number(s))
  .pipe(
    z
      .number()
      .int()
      .min(MIN_YEAR, `year must be at least ${MIN_YEAR}`)
      .max(maxAllowedYear(), `year must be at most ${maxAllowedYear()}`),
  );

export type YearlyReportYear = z.infer<typeof yearlyReportYearQuerySchema>;
