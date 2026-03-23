import { NextResponse } from "next/server";
import { getServerSession, type Session } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import MonthlyExpenseReportModel from "@/lib/models/monthly-expense-report";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import { saveMonthlyExpenseReportSchema } from "@/lib/validation/monthly-expense-report";

export async function POST(request: Request) {
  let session: Session | null = null;
  try {
    session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = saveMonthlyExpenseReportSchema.safeParse(body);

    if (!parsed.success) {
      const flat = parsed.error.flatten();
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: flat.fieldErrors,
          formErrors: flat.formErrors,
        },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const { yearMonth, categories } = parsed.data;

    const categoriesForDb = categories.map((cat) => ({
      name: cat.name,
      position: cat.position,
      expenses: cat.expenses.map((e) => ({
        concept: e.concept,
        amount: e.amount,
      })),
    }));

    const report = await MonthlyExpenseReportModel.findOneAndUpdate(
      { userId: session.user.id, yearMonth },
      {
        $set: { categories: categoriesForDb },
        $setOnInsert: { userId: session.user.id, yearMonth },
      },
      { upsert: true, new: true, runValidators: true },
    ).lean();

    if (!report) {
      return NextResponse.json(
        { message: "Unable to save monthly report" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: "Monthly expense report saved",
        report: {
          id: report._id.toString(),
          yearMonth: report.yearMonth,
          categories: report.categories,
          updatedAt: report.updatedAt?.toISOString() ?? null,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error("Failed to save monthly expense report", error, {
      route: "/api/expenses/monthly-report",
      method: "POST",
      userId: session?.user?.id,
    });
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
