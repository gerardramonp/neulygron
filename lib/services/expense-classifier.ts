import { generateText, Output } from "ai";

import {
  classifyExpensesSchema,
  extractExpensesSchema,
  type ClassifiedExpenses,
  type ExtractedExpenses,
} from "@/lib/validation/expenses";

export interface CategoryData {
  name: string;
  description?: string | null | undefined;
  concepts?: string[];
}

export async function extractExpensesFromText(
  text: string,
): Promise<ExtractedExpenses | null> {
  const { output } = await generateText({
    model: "openai/gpt-4o-mini",
    temperature: 0,
    output: Output.object({ schema: extractExpensesSchema }),
    prompt: `You are an expert financial document analyzer. Your task is to extract ALL expenses from the following document.

INSTRUCTIONS:
- Extract EVERY single expense, purchase, payment, charge, fee, or cost mentioned in the document.
- Look for expenses in tables, lists, line items, summaries, and any other format.
- Include recurring charges, one-time payments, subscriptions, taxes, tips, and fees.
- For each expense, extract the concept (what it was for) and the exact amount.
- Use the original amount as shown in the document (do not convert currencies).
- If an item has multiple components (e.g., base price + tax), extract them as separate expenses.

EXCLUDE the following (these are NOT expenses):
- Income, deposits, refunds, or credits received
- Account balances or totals (unless they represent a specific charge)
- Dates, reference numbers, or account identifiers
- Headers, footers, or document metadata

Be thorough and do not miss any expense. When in doubt, include it.

Document text:
${text}`,
  });

  return output;
}

function countClassifiedExpenses(result: ClassifiedExpenses): number {
  const categoryExpenses = result.categories.reduce(
    (sum, cat) => sum + cat.expenses.length,
    0,
  );
  return categoryExpenses + result.uncategorized.length;
}

export async function classifyExpenses(
  expenses: ExtractedExpenses["expenses"],
  categories: CategoryData[],
): Promise<ClassifiedExpenses | null> {
  const hasPredefinedCategories = categories.length > 0;
  const categoryNames = categories.map((c) => c.name);

  // Format categories with description and example concepts (learned from user assignments)
  const categoryListText = hasPredefinedCategories
    ? categories
        .map((c) => {
          const desc = c.description ? ` - ${c.description}` : "";
          const concepts =
            (c.concepts?.length ?? 0) > 0
              ? `\n  Example concepts (assign similar expenses here): ${(c.concepts ?? []).join(", ")}`
              : "";
          return `• ${c.name}${desc}${concepts}`;
        })
        .join("\n")
    : "";

  const prompt = `You are an expert at categorizing expenses.

TASK: Distribute the ${expenses.length} expenses below across the appropriate categories.
Some expenses may not fit any category. Those MUST be returned under "uncategorized".

IMPORTANT:
Every expense MUST appear in the output exactly once. Missing or duplicated expenses are not allowed.

Use both the category name/description and the "Example concepts" (when present) to decide. Expenses whose concept is similar or identical to an example concept for a category should be placed in that category.

${
  hasPredefinedCategories
    ? `CATEGORIES TO USE (use these names EXACTLY, case sensitive):
${categoryNames.map((n) => `- ${n}`).join("\n")}

CATEGORY DEFINITIONS AND EXAMPLE CONCEPTS:
${categoryListText}`
    : `No predefined categories provided. Create logical category names like "Groceries", "Transportation", "Entertainment", "Utilities", "Dining", etc.`
}

RULES (CRITICAL):
1. Every expense MUST appear exactly once in the output
2. Each expense must be placed EITHER:
    - inside exactly one category
    - OR in the "uncategorized" section if it doesn't fit any category
3. "uncategorized" is NOT a category, but it DOES count toward the total
4. Total expenses across all categories PLUS uncategorized must equal exactly ${expenses.length}
5. Never drop or duplicate expenses
6. Copy concept and amount exactly as provided

FINAL VERIFICATION (MANDATORY):
Before responding:

Count expenses in all categories

Count expenses in uncategorized

If total is not ${expenses.length}, fix the output before returning

EXPENSES TO CATEGORIZE:
${JSON.stringify(expenses, null, 2)}
`;

  const { output } = await generateText({
    model: "openai/gpt-5-nano",
    temperature: 0,
    output: Output.object({ schema: classifyExpensesSchema }),
    prompt,
  });

  // Validate that no expenses were dropped
  if (output) {
    const outputCount = countClassifiedExpenses(output);
    if (outputCount !== expenses.length) {
      console.warn(
        `Classification mismatch: input had ${expenses.length} expenses, output has ${outputCount}`,
      );
    }
  }

  return output;
}
