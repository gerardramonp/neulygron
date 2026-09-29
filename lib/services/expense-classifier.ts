import {
  generateText,
  Output,
} from "ai";

import {
  extractExpensesResultSchema,
  type ClassifiedExpenses,
  type ExtractedExpenses,
  type ExtractExpensesFromTextResult,
} from "@/lib/validation/expenses";
import { getJevClient } from "@/lib/services/jev";

const UNCATEGORIZED_OPTION = "__uncategorized__";
const MAX_CONFIGURED_CATEGORIES = 254;

export interface CategoryData {
  name: string;
  description?: string | null | undefined;
  concepts?: string[];
}

export async function extractExpensesFromText(
  text: string,
): Promise<ExtractExpensesFromTextResult | null> {
  const { output } = await generateText({
    model: "openai/gpt-6-luna-fast",
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

type Expense = ExtractedExpenses["expenses"][number];

type JevChoiceQuestion = {
  type: "choice";
  instructions: {
    question: string;
    guidance: string;
  };
  criteria: Record<string, null>;
};

type JevEvaluationRequest = {
  state: {
    expenses: Expense[];
    categoryDefinitions: Record<
      string,
      {
        categoryName: string;
        description: string;
        exampleConcepts: string[];
      }
    >;
  };
  questions: Record<string, JevChoiceQuestion>;
};

type JevEvaluationResult = {
  answers: Record<
    string,
    {
      type: "choice";
      choice: string;
    }
  >;
};

export type JevEvaluator = (
  request: JevEvaluationRequest,
) => Promise<JevEvaluationResult>;

const evaluateWithJev: JevEvaluator = async (request) => {
  const result = await getJevClient().systemOne(request);
  return { answers: result.answers };
};

type ErrorWithRateLimitDetails = {
  statusCode?: unknown;
  lastError?: unknown;
  cause?: unknown;
  errors?: unknown;
};

function isRateLimitError(error: unknown, seen = new Set<unknown>()): boolean {
  if (!error || seen.has(error)) return false;
  seen.add(error);

  if (typeof error === "object") {
    const details = error as ErrorWithRateLimitDetails;
    if (details.statusCode === 429) return true;
    if (isRateLimitError(details.lastError, seen)) return true;
    if (isRateLimitError(details.cause, seen)) return true;
    if (
      Array.isArray(details.errors) &&
      details.errors.some((item) => isRateLimitError(item, seen))
    ) {
      return true;
    }
  }

  return (
    error instanceof Error &&
    (error.name.includes("RateLimit") ||
      error.message.includes("rate_limit_exceeded"))
  );
}

export class ExpenseClassificationUnavailableError extends Error {
  constructor(cause: unknown) {
    super("Expense classification is temporarily unavailable.", { cause });
    this.name = "ExpenseClassificationUnavailableError";
  }
}

export async function classifyExpenses(
  expenses: ExtractedExpenses["expenses"],
  categories: CategoryData[],
  evaluator: JevEvaluator = evaluateWithJev,
): Promise<ClassifiedExpenses | null> {
  if (categories.length === 0) {
    return { categories: [], uncategorized: [...expenses] };
  }

  if (categories.length > MAX_CONFIGURED_CATEGORIES) {
    console.warn(
      `Jev classification supports at most ${MAX_CONFIGURED_CATEGORIES} configured categories when the uncategorized fallback is included.`,
    );
    return null;
  }

  if (expenses.length === 0) {
    return {
      categories: categories.map(({ name }) => ({ name, expenses: [] })),
      uncategorized: [],
    };
  }

  const optionToCategoryIndex = new Map<string, number>();
  const categoryDefinitions: Record<
    string,
    {
      categoryName: string;
      description: string;
      exampleConcepts: string[];
    }
  > = {};
  const criteria: Record<string, null> = {};

  categories.forEach((category, index) => {
    const option = `category_${index}`;
    optionToCategoryIndex.set(option, index);
    categoryDefinitions[option] = {
      categoryName: category.name,
      description:
        category.description?.trim() || "No description was provided.",
      exampleConcepts: category.concepts ?? [],
    };
    criteria[option] = null;
  });
  categoryDefinitions[UNCATEGORIZED_OPTION] = {
    categoryName: "Uncategorized",
    description:
      "Use only when none of the configured categories accurately fits the expense.",
    exampleConcepts: [],
  };
  criteria[UNCATEGORIZED_OPTION] = null;

  const questions = Object.fromEntries(
    expenses.map((_, index) => [
      `expense_${index}`,
      {
        type: "choice" as const,
        instructions: {
          question: `Which option in categoryDefinitions best matches expenses[${index}]?`,
          guidance:
            "Use the category name, description, and example concepts. Similar example concepts are strong evidence. Select __uncategorized__ only when no configured category accurately fits.",
        },
        criteria,
      },
    ]),
  );

  let result;
  try {
    result = await evaluator({
      state: { expenses, categoryDefinitions },
      questions,
    });
  } catch (error) {
    if (isRateLimitError(error)) {
      throw new ExpenseClassificationUnavailableError(error);
    }
    throw error;
  }

  const categoryExpenses: Expense[][] = categories.map(() => []);
  const uncategorized: Expense[] = [];

  expenses.forEach((expense, index) => {
    const answer = result.answers[`expense_${index}`];
    const categoryIndex =
      answer?.type === "choice"
        ? optionToCategoryIndex.get(answer.choice)
        : undefined;

    if (categoryIndex === undefined) {
      uncategorized.push(expense);
      return;
    }

    categoryExpenses[categoryIndex].push(expense);
  });

  return {
    categories: categories.map((category, index) => ({
      name: category.name,
      expenses: categoryExpenses[index],
    })),
    uncategorized,
  };
}
