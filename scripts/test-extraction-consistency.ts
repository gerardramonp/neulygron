import "dotenv/config";
import * as fs from "fs";
import { extractExpensesFromText } from "../lib/services/expense-classifier";
import { parsePdf } from "../lib/pdf";
import type { ExtractedExpenses } from "../lib/validation/expenses";

type Expense = ExtractedExpenses["expenses"][number];

interface ComparisonResult {
  expenseCount: { values: number[]; consistent: boolean };
  totalAmount: { values: number[]; consistent: boolean };
  amounts: { values: number[][]; consistent: boolean };
  concepts: { values: string[][]; consistent: boolean };
  overallConsistent: boolean;
}

const PDF_PATH =
  process.env.TEST_PDF_PATH || "scripts/test-fixtures/sample.pdf";
const NUM_RUNS = Number(process.env.TEST_NUM_RUNS) || 10;

function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, i) => val === sortedB[i]);
}

function getTotalAmount(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

function compareResults(results: ExtractedExpenses[]): ComparisonResult {
  const expenseCounts = results.map((r) => r.expenses.length);
  const totalAmounts = results.map((r) => getTotalAmount(r.expenses));
  const amounts = results.map((r) =>
    r.expenses.map((e) => e.amount).sort((a, b) => a - b),
  );
  const concepts = results.map((r) =>
    r.expenses.map((e) => e.concept.toLowerCase().trim()).sort(),
  );

  const countConsistent = expenseCounts.every((c) => c === expenseCounts[0]);
  const amountConsistent = totalAmounts.every(
    (a) => Math.abs(a - totalAmounts[0]) < 0.01,
  );
  const amountsConsistent = amounts.every((a) => arraysEqual(a, amounts[0]));
  const conceptsConsistent = concepts.every((c) => arraysEqual(c, concepts[0]));

  return {
    expenseCount: { values: expenseCounts, consistent: countConsistent },
    totalAmount: { values: totalAmounts, consistent: amountConsistent },
    amounts: { values: amounts, consistent: amountsConsistent },
    concepts: { values: concepts, consistent: conceptsConsistent },
    overallConsistent:
      countConsistent &&
      amountConsistent &&
      amountsConsistent &&
      conceptsConsistent,
  };
}

async function runExtractionConsistencyTest(): Promise<void> {
  console.log(
    `\n🧪 Testing extractExpensesFromText consistency with ${NUM_RUNS} runs...\n`,
  );
  console.log(`📄 PDF: ${PDF_PATH}\n`);

  // Read and parse PDF once
  if (!fs.existsSync(PDF_PATH)) {
    console.error(`❌ PDF file not found: ${PDF_PATH}`);
    process.exit(1);
  }

  const pdfBuffer = fs.readFileSync(PDF_PATH);
  const { text } = await parsePdf(
    new Blob([pdfBuffer], { type: "application/pdf" }),
  );

  if (!text) {
    console.error("❌ Could not extract text from PDF");
    process.exit(1);
  }

  console.log(`📝 Extracted ${text.length} characters from PDF\n`);

  const results: ExtractedExpenses[] = [];

  for (let i = 0; i < NUM_RUNS; i++) {
    process.stdout.write(`  Run ${i + 1}/${NUM_RUNS}... `);
    try {
      const result = await extractExpensesFromText(text);
      if (!result) {
        console.log("✗ No result");
        process.exit(1);
      }
      results.push(result);
      console.log(`✓ Found ${result.expenses.length} expenses`);
    } catch (error) {
      console.log(`✗ Failed: ${error}`);
      process.exit(1);
    }
  }

  console.log(`\n📊 Comparison Results:\n`);

  const comparison = compareResults(results);

  console.log(
    `  Expense Count:  ${comparison.expenseCount.consistent ? "✓" : "✗"} [${comparison.expenseCount.values.join(", ")}]`,
  );
  console.log(
    `  Total Amount:   ${comparison.totalAmount.consistent ? "✓" : "✗"} [${comparison.totalAmount.values.map((v) => v.toFixed(2)).join(", ")}]`,
  );
  console.log(`  Amounts Match:  ${comparison.amounts.consistent ? "✓" : "✗"}`);
  console.log(
    `  Concepts Match: ${comparison.concepts.consistent ? "✓" : "✗"}`,
  );

  const periods = results.map((r) => r.proposedYearMonth ?? "(null)");
  const periodConsistent = periods.every((p) => p === periods[0]);
  console.log(
    `  Proposed YYYY-MM: ${periodConsistent ? "✓" : "✗"} [${periods.join(", ")}]`,
  );
  if (!periodConsistent) {
    console.log(
      "    (Period can legitimately vary when the model is uncertain; expense checks above are the strict gate.)\n",
    );
  }

  if (!comparison.amounts.consistent) {
    console.log(`\n  Amount differences:`);
    comparison.amounts.values.forEach((amounts, i) => {
      console.log(
        `    Run ${i + 1}: [${amounts.slice(0, 5).join(", ")}${amounts.length > 5 ? "..." : ""}]`,
      );
    });
  }

  if (!comparison.concepts.consistent) {
    console.log(`\n  Concept differences (first 5):`);
    comparison.concepts.values.forEach((concepts, i) => {
      console.log(
        `    Run ${i + 1}: [${concepts.slice(0, 5).join(", ")}${concepts.length > 5 ? "..." : ""}]`,
      );
    });
  }

  console.log(
    `\n${comparison.overallConsistent ? "✅ All runs produced identical results!" : "❌ Results varied across runs."}\n`,
  );

  // Save detailed results
  const outputPath = "extraction-test-results.json";
  fs.writeFileSync(
    outputPath,
    JSON.stringify({ results, comparison }, null, 2),
  );
  console.log(`📁 Detailed results saved to: ${outputPath}\n`);

  if (!comparison.overallConsistent) {
    process.exit(1);
  }
}

runExtractionConsistencyTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
