import { NextResponse } from "next/server";
import { getServerSession, type Session } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import MonthlyExpenseReportModel from "@/lib/models/monthly-expense-report";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import { formatYearMonth } from "@/lib/year-month";
import { buildYearlyReportFromMonthlyDocs } from "@/lib/yearly-report";
import { yearlyReportYearQuerySchema } from "@/lib/validation/yearly-expense-report";

export async function GET(request: Request) {
  let session: Session | null = null;
  try {
    session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const yearRaw = url.searchParams.get("year")?.trim() ?? "";

    const parsedYear = yearlyReportYearQuerySchema.safeParse(yearRaw);
    if (!parsedYear.success) {
      return NextResponse.json(
        { message: "year query must be a valid calendar year" },
        { status: 400 },
      );
    }

    const year = parsedYear.data;

    await connectToDatabase();

    const from = formatYearMonth(year, 1);
    const to = formatYearMonth(year, 12);

    const reports = await MonthlyExpenseReportModel.find({
      userId: session.user.id,
      yearMonth: { $gte: from, $lte: to },
    })
      .select("yearMonth categories")
      .lean();

    const body = buildYearlyReportFromMonthlyDocs(year, reports);

    return NextResponse.json({ report: body }, { status: 200 });
  } catch (error) {
    logger.error("Failed to load yearly expense report", error, {
      route: "/api/expenses/yearly-report",
      method: "GET",
      userId: session?.user?.id,
    });
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
