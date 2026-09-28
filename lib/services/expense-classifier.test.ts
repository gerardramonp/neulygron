import { Experimental_EvaluationMockModelV4 as MockEvaluationModel } from "ai/test";
import { describe, expect, it, vi } from "vitest";

import {
  classifyExpenses,
  type CategoryData,
} from "@/lib/services/expense-classifier";

type EvaluationResult = Awaited<ReturnType<MockEvaluationModel["doEvaluate"]>>;

function mockJev(choices: string[]) {
  return new MockEvaluationModel({
    doEvaluate: async () => ({
      answers: Object.fromEntries(
        choices.map((choice, index) => [
          `expense_${index}`,
          {
            type: "choice" as const,
            choice,
            probabilities: {
              category_0: choice === "category_0" ? 1 : 0,
              category_1: choice === "category_1" ? 1 : 0,
              __uncategorized__: choice === "__uncategorized__" ? 1 : 0,
            },
          },
        ]),
      ) as EvaluationResult["answers"],
      warnings: [],
    }),
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
    const doEvaluate = vi.fn(async () => {
      throw new Error("Jev should not be called");
    });
    const model = new MockEvaluationModel({ doEvaluate });
    const expenses = [{ concept: "ANY EXPENSE", amount: 12 }];

    const result = await classifyExpenses(expenses, [], model);

    expect(doEvaluate).not.toHaveBeenCalled();
    expect(result).toEqual({ categories: [], uncategorized: expenses });
  });

  it("rejects more than 254 configured categories without calling Jev", async () => {
    const doEvaluate = vi.fn(async () => {
      throw new Error("Jev should not be called");
    });
    const model = new MockEvaluationModel({ doEvaluate });
    const categories = Array.from({ length: 255 }, (_, index) => ({
      name: `Category ${index}`,
    }));

    const result = await classifyExpenses(
      [{ concept: "ANY EXPENSE", amount: 12 }],
      categories,
      model,
    );

    expect(doEvaluate).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
