import { generateText, Output } from "ai";

import {
  classifyExpensesSchema,
  extractExpensesResultSchema,
  type ClassifiedExpenses,
  type ExtractedExpenses,
  type ExtractExpensesFromTextResult,
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
): Promise<ExtractExpensesFromTextResult | null> {
  const { output } = await generateText({
    model: "openai/gpt-4o-mini",
    temperature: 0,
    output: Output.object({ schema: extractExpensesResultSchema }),
    prompt: `You are an expert financial document analyzer for NeuLygron. Users upload PDFs that are meant to be bank-issued documents listing spending (debits/charges) so expenses can be extracted.

STEP 1 - DOCUMENT TYPE (mandatory):
Decide whether the text is from a BANK OR CARD-ISSUER EXPENSE DOCUMENT suitable for this app.

Set result to "ok" ONLY when the document clearly is one of:
- A bank account statement (checking/savings) showing posted transactions or movements
- A credit or debit card statement from a bank or payment network showing card charges
- Another formal account activity listing from a financial institution that itemizes debits/charges in a statement-like way

Set result to "not_bank_expense_report" when the PDF is anything else, including but not limited to:
- Merchant invoices, receipts, delivery notes, or order confirmations (not issued as a bank statement)
- Payrolls, contracts, tax forms, letters, brochures, manuals, books, slides, or random text
- Brokerage-only statements with no bank-style transaction grid for card/account spending
- Blank, illegible, or unrelated content

When result is "not_bank_expense_report", set reason to one short clear sentence for the user (e.g. "This looks like an invoice, not a bank statement."). Do not use result "ok" for non-bank documents.

OUTPUT SHAPE (always return all four fields):
- When result is "ok": fill expenses and proposedYearMonth; set reason to exactly "" (empty string).
- When result is "not_bank_expense_report": set expenses to [] (empty array), proposedYearMonth to null, and reason to your explanation string.

STEP 2 - ONLY IF result is "ok":
Extract ALL spending line items (debits, charges, fees, purchases) the same way a user would track expenses from a statement.

INSTRUCTIONS (when result is "ok"):
- Extract EVERY single expense-like debit: purchases, payments, charges, fees, interest charges, subscriptions, taxes on charges, etc.
- Look in tables, transaction lists, and summaries. Use wording from the statement for each concept.
- Use the original amount as shown (do not convert currencies). Positive amounts only for expenses.
- If an item has multiple components (e.g. subtotal + tax), extract as separate lines when the statement shows them separately.
- Each distinct transaction line should appear only once.

STATEMENT PERIOD (proposedYearMonth, when result is "ok"):
- Set proposedYearMonth to YYYY-MM (e.g. 2025-03) from statement period, closing date, or billing cycle.
- If a range spans months, use the period end month.
- Set proposedYearMonth to null only when no usable date exists.

EXCLUDE from expenses (when result is "ok"):
- Credits to the account, incoming transfers, refunds counted as positive credits (not as expense lines)
- Running balances, subtotals that are not individual charges
- Pure metadata (do not invent expense rows from dates or account numbers alone)

CRITICAL when result is "ok": Missing statement charges is an error. Be thorough.

Document text:
${text}`,
  });

  if (!output) {
    return null;
  }

  if (output.result === "not_bank_expense_report") {
    const reason = output.reason.trim();
    return {
      ok: false,
      reason:
        reason ||
        "This document does not look like a bank or card statement with transactions.",
    };
  }

  return {
    ok: true,
    data: {
      expenses: output.expenses,
      proposedYearMonth: output.proposedYearMonth,
    },
  };
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
