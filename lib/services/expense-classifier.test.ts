import { describe, expect, it, vi } from "vitest";

import {
  classifyExpenses,
  ExpenseClassificationUnavailableError,
  type CategoryData,
  type JevEvaluator,
} from "@/lib/services/expense-classifier";

function mockJev(choices: string[]): JevEvaluator {
  return async () => ({
    answers: Object.fromEntries(
      choices.map((choice, index) => [
        `expense_${index}`,
        {
          type: "choice" as const,
          choice,
        },
      ]),
    ),
  });
}

describe("classifyExpenses", () => {
  it("groups each original expense exactly once from one Jev response", async () => {
    const expenses = [
      { concept: "COFFEE SHOP", amount: 5 },
      { concept: "CITY BUS", amount: 3 },
      { concept: "UNKNOWN CHARGE", amount: 9 },
      { concept: "COFFEE SHOP", amount: 5 },
    ];
    const categories: CategoryData[] = [
      {
        name: "Dining",
        description: "Restaurants, cafes, and prepared food",
        concepts: ["COFFEE SHOP"],
      },
      {
        name: "Transport",
        description: "Public transit and other travel",
        concepts: ["CITY BUS"],
      },
    ];

    const result = await classifyExpenses(
      expenses,
      categories,
      mockJev([
        "category_0",
        "category_1",
        "__uncategorized__",
        "category_0",
      ]),
    );

    expect(result).toEqual({
      categories: [
        {
          name: "Dining",
          expenses: [expenses[0], expenses[3]],
        },
        {
          name: "Transport",
          expenses: [expenses[1]],
        },
      ],
      uncategorized: [expenses[2]],
    });
  });

  it("bypasses Jev when the user has no categories", async () => {
    const evaluator = vi.fn(async () => {
      throw new Error("Jev should not be called");
    });
    const expenses = [{ concept: "ANY EXPENSE", amount: 12 }];

    const result = await classifyExpenses(expenses, [], evaluator);

    expect(evaluator).not.toHaveBeenCalled();
    expect(result).toEqual({ categories: [], uncategorized: expenses });
  });

  it("rejects more than 254 configured categories without calling Jev", async () => {
    const evaluator = vi.fn(async () => {
      throw new Error("Jev should not be called");
    });
    const categories = Array.from({ length: 255 }, (_, index) => ({
      name: `Category ${index}`,
    }));

    const result = await classifyExpenses(
      [{ concept: "ANY EXPENSE", amount: 12 }],
      categories,
      evaluator,
    );

    expect(evaluator).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it("maps exhausted upstream rate limits to a temporary-unavailable error", async () => {
    const evaluator = vi.fn(async () => {
      throw Object.assign(new Error("Upstream provider is busy"), {
        statusCode: 429,
      });
    });

    await expect(
      classifyExpenses(
        [{ concept: "COFFEE SHOP", amount: 5 }],
        [{ name: "Dining" }],
        evaluator,
      ),
    ).rejects.toBeInstanceOf(ExpenseClassificationUnavailableError);
  });
});
