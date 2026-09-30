import { describe, expect, it } from "vitest";

import { buildYearComparison } from "@/lib/year-comparison";

describe("buildYearComparison", () => {
  it("returns empty years and null months when there are no reports", () => {
    const result = buildYearComparison([]);
    expect(result.years).toEqual([]);
    expect(result.months).toHaveLength(12);
    for (const row of result.months) {
      expect(row.byYear).toEqual({});
    }
  });

  it("sums category expenses per month and leaves missing months as null", () => {
    const result = buildYearComparison([
      {
        yearMonth: "2024-01",
        categories: [
          {
            name: "Food",
            position: 0,
            expenses: [{ amount: 10 }, { amount: 5 }],
          },
          {
            name: "Rent",
            position: 1,
            expenses: [{ amount: 100 }],
          },
        ],
      },
      {
        yearMonth: "2025-01",
        categories: [
          {
            name: "Food",
            position: 0,
            expenses: [{ amount: 20 }],
          },
        ],
      },
      {
        yearMonth: "2025-03",
        categories: [
          {
            name: "Food",
            position: 0,
            expenses: [],
          },
        ],
      },
    ]);

    expect(result.years).toEqual([2024, 2025]);

    const january = result.months[0];
    expect(january.month).toBe(1);
    expect(january.byYear["2024"]).toBe(115);
    expect(january.byYear["2025"]).toBe(20);

    const february = result.months[1];
    expect(february.byYear["2024"]).toBeNull();
    expect(february.byYear["2025"]).toBeNull();

    const march = result.months[2];
    expect(march.byYear["2024"]).toBeNull();
    expect(march.byYear["2025"]).toBe(0);
  });
});
