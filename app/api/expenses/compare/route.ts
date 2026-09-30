import { NextResponse } from "next/server";
import { getServerSession, type Session } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import MonthlyExpenseReportModel from "@/lib/models/monthly-expense-report";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import { buildYearComparison } from "@/lib/year-comparison";

export async function GET() {
  let session: Session | null = null;
  try {
    session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const reports = await MonthlyExpenseReportModel.find({
      userId: session.user.id,
    })
      .select("yearMonth categories")
      .lean();

    const body = buildYearComparison(reports);

    return NextResponse.json({ comparison: body }, { status: 200 });
  } catch (error) {
    logger.error("Failed to load year expense comparison", error, {
      route: "/api/expenses/compare",
      method: "GET",
      userId: session?.user?.id,
    });
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
