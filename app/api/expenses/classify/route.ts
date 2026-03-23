import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import { connectToDatabase } from "@/lib/mongodb";
import CategoryModel from "@/lib/models/category";
import { parsePdf } from "@/lib/pdf";
import {
  extractExpensesFromText,
  classifyExpenses,
  CategoryData,
} from "@/lib/services/expense-classifier";
import { validatePdfUpload } from "@/lib/validation/pdf";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const startMs = performance.now();
  console.log("cclog starting classify....");
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const validation = await validatePdfUpload(request);

  if (!validation.success) {
    return NextResponse.json(
      { message: validation.message },
      { status: validation.status },
    );
  }

  try {
    await connectToDatabase();

    const categories = await CategoryModel.find({ userId: session.user.id })
      .select("name description concepts position")
      .sort({ position: 1, createdAt: 1 })
      .lean();

    const orderByName = new Map(
      categories.map((c) => [
        c.name,
        c.position ?? Number.POSITIVE_INFINITY,
      ]),
    );

    const categoriesData: CategoryData[] = categories.map((c) => ({
      name: c.name,
      description: c.description,
      concepts: c.concepts ?? [],
    }));

    const { text } = await parsePdf(validation.file);

    if (!text) {
      return NextResponse.json(
        { message: "PDF contains no readable text." },
        { status: 422 },
      );
    }

    const extractedExpenses = await extractExpensesFromText(text);

    if (!extractedExpenses?.expenses?.length) {
      return NextResponse.json(
        { message: "No expenses found in the document." },
        { status: 422 },
      );
    }

    const classifiedExpenses = await classifyExpenses(
      extractedExpenses.expenses,
      categoriesData,
    );

    if (!classifiedExpenses) {
      return NextResponse.json(
        { message: "Unable to classify expenses." },
        { status: 422 },
      );
    }

    const categoriesOrdered = [...classifiedExpenses.categories].map(
      (cat) => ({
        ...cat,
        position:
          orderByName.get(cat.name) ?? Number.POSITIVE_INFINITY,
      }),
    );
    categoriesOrdered.sort((a, b) => {
      if (a.position !== b.position) return a.position - b.position;
      return a.name.localeCompare(b.name);
    });

    console.log(
      `[expenses/classify] total time: ${((performance.now() - startMs) / 1000).toFixed(2)}s`,
    );
    return NextResponse.json(
      {
        ...classifiedExpenses,
        categories: categoriesOrdered,
      },
      { status: 200 },
    );
  } catch (error) {
    console.log(
      `[expenses/classify] total time: ${((performance.now() - startMs) / 1000).toFixed(2)}s (error)`,
    );
    console.log(error);
    return NextResponse.json(
      { message: `Unable to process PDF contents., ${error}` },
      { status: 422 },
    );
  }
}
