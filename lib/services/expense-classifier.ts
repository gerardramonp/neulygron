import { generateText, Output } from "ai";

import {
  classifyExpensesSchema,
  extractExpensesSchema,
  type ClassifiedExpenses,
  type ExtractedExpenses,
} from "@/lib/validation/expenses";

/** Number of expenses per classification batch. Smaller = faster per call, more parallel calls. */
const CLASSIFY_BATCH_SIZE = 20;

/** Max retries for a batch when the model returns wrong expense count. */
const CLASSIFY_BATCH_RETRIES = 2;

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
    prompt: `You are an expert financial document analyzer. Your task is to extract ALL expenses from the following document and infer which calendar month the document belongs to.

INSTRUCTIONS:
- Extract EVERY single expense, purchase, payment, charge, fee, or cost mentioned in the document.
- Look for expenses in tables, lists, line items, summaries, and any other format.
- Include recurring charges, one-time payments, subscriptions, taxes, tips, and fees.
- For each expense, extract the concept (what it was for) and the exact amount.
- Use the original amount as shown in the document (do not convert currencies).
- If an item has multiple components (e.g., base price + tax), extract them as separate expenses.
- Before finishing, count the expenses you extracted and scan the document again to ensure none are missing. The total of all amounts must match the sum of all charges in the document (excluding income/refunds).
- Each distinct line item or charge should appear only once. Do not duplicate the same expense.

STATEMENT PERIOD (proposedYearMonth):
- Set proposedYearMonth to a single string in strict form YYYY-MM (e.g. 2025-03).
- Use headers, footers, "statement period", billing dates, or invoice date. If a range spans months, use the month of the period end (or closing date).
- If multiple unrelated dates appear and one clear statement month exists, use that month.
- Set proposedYearMonth to null only when no usable date exists in the text.

EXCLUDE the following (these are NOT expenses):
- Income, deposits, refunds, or credits received
- Account balances or totals (unless they represent a specific charge)
- Dates, reference numbers, or account identifiers (still use those dates only for proposedYearMonth above, not as expense lines)
- Headers, footers, or document metadata as expense rows

CRITICAL: Missing even one expense is an error. Be thorough and do not miss any. When in doubt, include it.

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

/** Merges multiple batch classification results into one, preserving category order. */
function mergeBatchResults(
  batchResults: (ClassifiedExpenses | null)[],
  predefinedCategoryOrder: string[] | null,
): ClassifiedExpenses {
  const categoryToExpenses = new Map<string, ExtractedExpenses["expenses"]>();
  const categoryOrder: string[] = [];
  const uncategorizedArrays: ExtractedExpenses["expenses"][] = [];

  for (const result of batchResults) {
    if (!result) continue;
    for (const cat of result.categories) {
      if (!categoryToExpenses.has(cat.name)) {
        categoryOrder.push(cat.name);
        categoryToExpenses.set(cat.name, []);
      }
      categoryToExpenses.get(cat.name)!.push(...cat.expenses);
    }
    uncategorizedArrays.push(result.uncategorized);
  }

  const uncategorized = uncategorizedArrays.flat();

  const order =
    predefinedCategoryOrder && predefinedCategoryOrder.length > 0
      ? predefinedCategoryOrder
      : categoryOrder;

  const categories = order.map((name) => ({
    name,
    expenses: categoryToExpenses.get(name) ?? [],
  }));

  return { categories, uncategorized };
}

type Expense = ExtractedExpenses["expenses"][number];

function expenseKey(exp: Expense): string {
  return `${exp.concept}\n${exp.amount}`;
}

/** Count how many times each (concept, amount) appears in the input. */
function countByKey(expenses: Expense[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const exp of expenses) {
    const k = expenseKey(exp);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return map;
}

/** Ensures all predefined category names appear in the result, with empty expenses if missing. */
function ensureAllPredefinedCategories(
  result: ClassifiedExpenses,
  categoryNames: string[],
): ClassifiedExpenses {
  if (categoryNames.length === 0) return result;
  const byName = new Map(result.categories.map((c) => [c.name, c.expenses]));
  const categories = categoryNames.map((name) => ({
    name,
    expenses: byName.get(name) ?? [],
  }));
  return { categories, uncategorized: result.uncategorized };
}

/** Cap each (concept, amount) in result to at most how often it appeared in input. Removes model duplicates. */
function capDuplicates(
  result: ClassifiedExpenses,
  inputExpenses: Expense[],
): ClassifiedExpenses {
  const maxAllowed = countByKey(inputExpenses);

  const takeUpTo = (list: Expense[]): Expense[] => {
    const used = new Map<string, number>();
    return list.filter((exp) => {
      const k = expenseKey(exp);
      const limit = maxAllowed.get(k) ?? 0;
      const count = used.get(k) ?? 0;
      if (count >= limit) return false;
      used.set(k, count + 1);
      return true;
    });
  };

  return {
    categories: result.categories.map((cat) => ({
      name: cat.name,
      expenses: takeUpTo(cat.expenses),
    })),
    uncategorized: takeUpTo(result.uncategorized),
  };
}

/** Classifies a single batch of expenses (same model and rules, used for parallel batching). Retries when output count does not match input. */
async function classifyExpensesBatch(
  batchExpenses: ExtractedExpenses["expenses"],
  categories: CategoryData[],
  promptParts: {
    categoryNames: string[];
    categoryListText: string;
    hasPredefined: boolean;
  },
): Promise<ClassifiedExpenses | null> {
  const { categoryNames, categoryListText, hasPredefined } = promptParts;
  const n = batchExpenses.length;

  const prompt = `You are an expert at categorizing expenses.

TASK: Distribute the ${n} expenses below across the appropriate categories.
Some expenses may not fit any category. Those MUST be returned under "uncategorized".

IMPORTANT:
Every expense MUST appear in the output exactly once. Missing or duplicated expenses are not allowed.

Use both the category name/description and the "Example concepts" (when present) to decide. Expenses whose concept is similar or identical to an example concept for a category should be placed in that category.

${
  hasPredefined
    ? `CATEGORIES TO USE (use these names EXACTLY, case sensitive):
${categoryNames.map((name) => `- ${name}`).join("\n")}

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
4. Total expenses across all categories PLUS uncategorized must equal exactly ${n}
5. Never drop or duplicate expenses
6. Copy concept and amount exactly as provided

FINAL VERIFICATION (MANDATORY):
Before responding:

Count expenses in all categories

Count expenses in uncategorized

If total is not ${n}, fix the output before returning

EXPENSES TO CATEGORIZE:
${JSON.stringify(batchExpenses, null, 2)}
`;

  let lastOutput: ClassifiedExpenses | null = null;
  for (let attempt = 0; attempt <= CLASSIFY_BATCH_RETRIES; attempt++) {
    const { output } = await generateText({
      model: "openai/gpt-5-nano",
      temperature: 0,
      output: Output.object({ schema: classifyExpensesSchema }),
      prompt,
    });
    lastOutput = output;

    if (output) {
      const outputCount = countClassifiedExpenses(output);
      if (outputCount === n) return output;
      console.warn(
        `Classification batch mismatch (attempt ${attempt + 1}/${CLASSIFY_BATCH_RETRIES + 1}): input had ${n} expenses, output has ${outputCount}`,
      );
    }
  }

  return lastOutput;
}

export async function classifyExpenses(
  expenses: ExtractedExpenses["expenses"],
  categories: CategoryData[],
): Promise<ClassifiedExpenses | null> {
  const hasPredefinedCategories = categories.length > 0;
  const categoryNames = categories.map((c) => c.name);

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

  const promptParts = {
    categoryNames,
    categoryListText,
    hasPredefined: hasPredefinedCategories,
  };

  if (expenses.length <= CLASSIFY_BATCH_SIZE) {
    const result = await classifyExpensesBatch(
      expenses,
      categories,
      promptParts,
    );
    if (!result) return null;
    const withAllCategories = hasPredefinedCategories
      ? ensureAllPredefinedCategories(result, categoryNames)
      : result;
    return capDuplicates(withAllCategories, expenses);
  }

  const batches: ExtractedExpenses["expenses"][] = [];
  for (let i = 0; i < expenses.length; i += CLASSIFY_BATCH_SIZE) {
    batches.push(expenses.slice(i, i + CLASSIFY_BATCH_SIZE));
  }

  const runBatches = async () =>
    Promise.all(
      batches.map((batch) =>
        classifyExpensesBatch(batch, categories, promptParts),
      ),
    );

  let batchResults = await runBatches();
  let merged = mergeBatchResults(
    batchResults,
    hasPredefinedCategories ? categoryNames : null,
  );
  let totalMerged = countClassifiedExpenses(merged);

  if (totalMerged !== expenses.length) {
    console.warn(
      `Classification mismatch after merge: input had ${expenses.length} expenses, merged has ${totalMerged}. Retrying all batches once.`,
    );
    batchResults = await runBatches();
    merged = mergeBatchResults(
      batchResults,
      hasPredefinedCategories ? categoryNames : null,
    );
    totalMerged = countClassifiedExpenses(merged);
    if (totalMerged !== expenses.length) {
      console.warn(
        `Classification still mismatched after retry: input ${expenses.length}, merged ${totalMerged}`,
      );
    }
  }

  return capDuplicates(merged, expenses);
}
