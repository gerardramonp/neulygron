import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Types, QueryFilter } from "mongoose";

import { connectToDatabase } from "@/lib/mongodb";
import CategoryModel, { type Category } from "@/lib/models/category";
import { updateCategorySchema } from "@/lib/validation/category";
import { authOptions } from "@/lib/auth/options";

const buildCategoryFilter = (
  categoryId: string,
  userId: string,
): QueryFilter<Category> => ({
  _id: new Types.ObjectId(categoryId),
  userId: new Types.ObjectId(userId),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: categoryId } = await params;
    const session = await getServerSession(authOptions);

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
    const parsed = updateCategorySchema.safeParse(body ?? {});

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const fieldsToUpdate: Record<string, string> = {};

    if (typeof parsed.data.name === "string") {
      fieldsToUpdate.name = parsed.data.name;
    }

    if (typeof parsed.data.description === "string") {
      fieldsToUpdate.description = parsed.data.description;
    }

    await connectToDatabase();

    const filter = buildCategoryFilter(categoryId, session.user.id);

    const updatedCategory = await CategoryModel.findOneAndUpdate(
      filter,
      { $set: fieldsToUpdate },
      { new: true },
    ).lean();

    if (!updatedCategory) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Category updated",
      category: {
        id: updatedCategory._id.toString(),
        name: updatedCategory.name,
        description: updatedCategory.description ?? "",
        userId: updatedCategory.userId.toString(),
      },
    });
  } catch (error) {
    console.error("Failed to update category", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: categoryId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!categoryId || !Types.ObjectId.isValid(categoryId)) {
      return NextResponse.json(
        { message: "Invalid category id" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const filter = buildCategoryFilter(categoryId, session.user.id);

    const deletedCategory = await CategoryModel.findOneAndDelete(filter).lean();

    if (!deletedCategory) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Category deleted" });
  } catch (error) {
    console.error("Failed to delete category", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
