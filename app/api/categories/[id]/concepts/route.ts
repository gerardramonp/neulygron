import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Types, QueryFilter } from "mongoose";

import { connectToDatabase } from "@/lib/mongodb";
import CategoryModel, { type Category } from "@/lib/models/category";
import { addConceptSchema } from "@/lib/validation/category";
import { authOptions } from "@/lib/auth/options";
import { logger } from "@/lib/logger";

const buildCategoryFilter = (
  categoryId: string,
  userId: string,
): QueryFilter<Category> => ({
  _id: new Types.ObjectId(categoryId),
  userId: new Types.ObjectId(userId),
});

/**
 * Adds an expense concept to a category if not already present.
 * Used when the user manually assigns an uncategorized expense to a category,
 * so the model can learn and improve classification over time.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let session;
  try {
    const { id: categoryId } = await params;
    session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!categoryId || !Types.ObjectId.isValid(categoryId)) {
      return NextResponse.json(
        { message: "Invalid category id" },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = addConceptSchema.safeParse(body ?? {});

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const concept = parsed.data.concept.trim();

    await connectToDatabase();

    const filter = buildCategoryFilter(categoryId, session.user.id);

    const updatedCategory = await CategoryModel.findOneAndUpdate(
      filter,
      { $addToSet: { concepts: concept } },
      { new: true },
    ).lean();

    if (!updatedCategory) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Concept added",
      concepts: updatedCategory.concepts ?? [],
    });
  } catch (error) {
    logger.error("Failed to add concept to category", error, {
      route: "/api/categories/[id]/concepts",
      method: "POST",
      userId: session?.user?.id,
    });
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
