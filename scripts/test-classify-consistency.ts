import "dotenv/config";
import * as fs from "fs";
import * as path from "path";

interface Expense {
  concept: string;
  amount: number;
}

interface Category {
  name: string;
  expenses: Expense[];
}

interface ClassifiedExpenses {
  categories: Category[];
  uncategorized: Expense[];
}

function assertValidClassification(
  value: unknown,
): asserts value is ClassifiedExpenses {
  if (!value || typeof value !== "object") {
    throw new Error("Classification response must be an object");
  }

  const result = value as Partial<ClassifiedExpenses>;
  if (!Array.isArray(result.categories)) {
    throw new Error("Classification response is missing categories");
  }
  if (!Array.isArray(result.uncategorized)) {
    throw new Error(
      "Classification response must include the uncategorized fallback bucket",
    );
  }

  const allExpenses = [
    ...result.categories.flatMap((category) => category.expenses),
    ...result.uncategorized,
  ];
  if (
    allExpenses.some(
      (expense) =>
        typeof expense?.concept !== "string" ||
        typeof expense?.amount !== "number",
    )
  ) {
    throw new Error("Classification response contains an invalid expense");
  }
}

interface ComparisonResult {
  totalExpenseCount: { values: number[]; consistent: boolean };
  totalAmount: { values: number[]; consistent: boolean; tolerance: number };
  categoryNames: {
    values: string[][];
    expected: string[];
    consistent: boolean;
  };
  expenseAmounts: { values: number[][]; consistent: boolean };
  overallConsistent: boolean;
}

const API_URL = process.env.TEST_API_URL || "http://localhost:3000";
const PDF_PATH =
  process.env.TEST_PDF_PATH || "scripts/test-fixtures/sample.pdf";
const NUM_RUNS = Number(process.env.TEST_NUM_RUNS) || 5;
const AMOUNT_TOLERANCE = 0.01; // Allow tiny floating point differences

let sessionCookie: string | null = null;

async function login(): Promise<string> {
  const email = "test@test.com";
  const password = "test1234";

  if (!email || !password) {
    throw new Error(
      "TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables are required",
    );
  }

  // Get CSRF token first
  const csrfResponse = await fetch(`${API_URL}/api/auth/csrf`);
  const { csrfToken } = await csrfResponse.json();
  const csrfCookies = csrfResponse.headers.get("set-cookie") || "";

  // Perform credentials login
  const loginResponse = await fetch(
    `${API_URL}/api/auth/callback/credentials`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: csrfCookies,
      },
      body: new URLSearchParams({
        csrfToken,
        email,
        password,
      }),
      redirect: "manual",
    },
  );

  const setCookie = loginResponse.headers.get("set-cookie");
  if (!setCookie) {
    throw new Error("Login failed: no session cookie returned");
  }

  // Extract session token cookie
  const sessionMatch = setCookie.match(/next-auth\.session-token=([^;]+)/);
  if (!sessionMatch) {
    throw new Error("Login failed: session token not found in cookies");
  }

  return `next-auth.session-token=${sessionMatch[1]}`;
}

async function callClassifyEndpoint(
  pdfPath: string,
): Promise<ClassifiedExpenses> {
  if (!sessionCookie) {
    sessionCookie = await login();
    console.log("  ✓ Logged in successfully\n");
  }

  const pdfBuffer = fs.readFileSync(pdfPath);
  const formData = new FormData();
  formData.append(
    "file",
    new Blob([pdfBuffer], { type: "application/pdf" }),
    path.basename(pdfPath),
  );

  const response = await fetch(`${API_URL}/api/expenses/classify`, {
    method: "POST",
    body: formData,
    headers: {
      Cookie: sessionCookie,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API call failed (${response.status}): ${text}`);
  }

  const result: unknown = await response.json();
  assertValidClassification(result);
  return result;
}

async function getConfiguredCategoryNames(): Promise<string[]> {
  if (!sessionCookie) {
    sessionCookie = await login();
  }

  const response = await fetch(`${API_URL}/api/categories`, {
    headers: { Cookie: sessionCookie },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Categories call failed (${response.status}): ${text}`);
  }

  const body = (await response.json()) as {
    categories: Array<{ name: string }>;
  };
  return body.categories.map((category) => category.name);
}

function getAllExpenses(result: ClassifiedExpenses): Expense[] {
  const fromCategories = result.categories.flatMap((c) => c.expenses);
  return [...fromCategories, ...result.uncategorized];
}

function getTotalAmount(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, i) => val === sortedB[i]);
}

function numbersEqual(a: number, b: number, tolerance: number): boolean {
  return Math.abs(a - b) <= tolerance;
}

function compareResults(
  results: ClassifiedExpenses[],
  configuredCategoryNames: string[],
): ComparisonResult {
  const expenseCounts = results.map((r) => getAllExpenses(r).length);
  const totalAmounts = results.map((r) => getTotalAmount(getAllExpenses(r)));
  const categoryNames = results.map((r) =>
    r.categories.map((c) => c.name).sort(),
  );
  const expenseAmounts = results.map((r) =>
    getAllExpenses(r)
      .map((e) => e.amount)
      .sort((a, b) => a - b),
  );

  const countConsistent = expenseCounts.every((c) => c === expenseCounts[0]);

  const amountConsistent = totalAmounts.every((a) =>
    numbersEqual(a, totalAmounts[0], AMOUNT_TOLERANCE),
  );

  const expectedCategoryNames = [...configuredCategoryNames].sort();
  const categoryConsistent = categoryNames.every((names) =>
    arraysEqual(names, expectedCategoryNames),
  );

  const amountsConsistent = expenseAmounts.every((amounts) =>
    arraysEqual(amounts, expenseAmounts[0]),
  );

  return {
    totalExpenseCount: {
      values: expenseCounts,
      consistent: countConsistent,
    },
    totalAmount: {
      values: totalAmounts,
      consistent: amountConsistent,
      tolerance: AMOUNT_TOLERANCE,
    },
    categoryNames: {
      values: categoryNames,
      expected: expectedCategoryNames,
      consistent: categoryConsistent,
    },
    expenseAmounts: {
      values: expenseAmounts,
      consistent: amountsConsistent,
    },
    overallConsistent:
      countConsistent &&
      amountConsistent &&
      categoryConsistent &&
      amountsConsistent,
  };
}

async function runConsistencyTest(): Promise<void> {
  console.log(`\n🧪 Running consistency test with ${NUM_RUNS} calls...\n`);
  console.log(`📄 PDF: ${PDF_PATH}`);
  console.log(`🌐 API: ${API_URL}\n`);

  const results: ClassifiedExpenses[] = [];
  const configuredCategoryNames = await getConfiguredCategoryNames();

  console.log(
    `🏷️  Configured categories: [${configuredCategoryNames.join(", ")}]\n`,
  );

  for (let i = 0; i < NUM_RUNS; i++) {
    console.log(`  Run ${i + 1}/${NUM_RUNS}...`);
    try {
      const result = await callClassifyEndpoint(PDF_PATH);
      results.push(result);
      console.log(
        `    ✓ Got ${getAllExpenses(result).length} expenses in ${result.categories.length} categories`,
      );
    } catch (error) {
      console.error(`    ✗ Failed:`, error);
      process.exit(1);
    }
  }

  console.log(`\n📊 Comparison Results:\n`);

  const comparison = compareResults(results, configuredCategoryNames);

  console.log(
    `  Expense Count: ${comparison.totalExpenseCount.consistent ? "✓" : "✗"} ${comparison.totalExpenseCount.values.join(" vs ")}`,
  );
  console.log(
    `  Total Amount:  ${comparison.totalAmount.consistent ? "✓" : "✗"} ${comparison.totalAmount.values.map((v) => v.toFixed(2)).join(" vs ")}`,
  );
  console.log(
    `  Categories:    ${comparison.categoryNames.consistent ? "✓" : "✗"} expected [${comparison.categoryNames.expected.join(", ")}], got ${comparison.categoryNames.values.map((v) => `[${v.join(", ")}]`).join(" vs ")}`,
  );
  console.log(
    `  Amounts Match: ${comparison.expenseAmounts.consistent ? "✓" : "✗"}`,
  );

  console.log(
    `\n${comparison.overallConsistent ? "✅ All runs produced consistent results!" : "❌ Results were inconsistent across runs."}\n`,
  );

  if (!comparison.overallConsistent) {
    console.log("Detailed results saved to: consistency-test-results.json\n");
    fs.writeFileSync(
      "consistency-test-results.json",
      JSON.stringify({ results, comparison }, null, 2),
    );
    process.exit(1);
  }
}

runConsistencyTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
