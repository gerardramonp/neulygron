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

  // Format categories as a clear list
  const categoryListText = hasPredefinedCategories
    ? categories
        .map((c) => `• ${c.name}${c.description ? ` - ${c.description}` : ""}`)
        .join("\n")
    : "";

  const prompt = `You are an expert at categorizing expenses into multiple categories.

TASK: Distribute the ${expenses.length} expenses below across the appropriate categories.

${
  hasPredefinedCategories
    ? `CATEGORIES TO USE (you MUST use these exact names):
${categoryListText}

Category names available: [${categoryNames.map((n) => `"${n}"`).join(", ")}]`
    : `No predefined categories provided. Create logical category names like "Groceries", "Transportation", "Entertainment", "Utilities", "Dining", etc.`
}

RULES:
1. EVERY expense must appear in your output exactly once (total: ${expenses.length})
2. Distribute expenses across MULTIPLE categories - do not put everything in one category
3. Match each expense to the most appropriate category based on the merchant/concept
4. If no category fits, put the expense in "uncategorized"
5. Copy concept and amount exactly as shown

EXPENSES TO CATEGORIZE:
${JSON.stringify(expenses, null, 2)}

Remember: Output exactly ${expenses.length} expenses across multiple categories.`;

  console.log("cclog prompt", prompt);

  const { output } = await generateText({
    model: "openai/gpt-4o-mini",
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
