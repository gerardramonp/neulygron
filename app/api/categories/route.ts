import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { connectToDatabase } from "@/lib/mongodb";
import CategoryModel from "@/lib/models/category";
import { createCategorySchema } from "@/lib/validation/category";
import { authOptions } from "@/lib/auth/options";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const categories = await CategoryModel.find({ userId: session.user.id })
      .select("name description userId")
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({
      categories: categories.map((category) => ({
        id: category._id.toString(),
        name: category.name,
        description: category.description ?? "",
        userId: category.userId.toString(),
      })),
    });
  } catch (error) {
    logger.error("Failed to fetch categories", error, {
      route: "/api/categories",
      method: "GET",
      userId: session?.user?.id,
    });
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const existingCategory = await CategoryModel.findOne({
      name: parsed.data.name,
      userId: session.user.id,
    }).lean();

    if (existingCategory) {
      return NextResponse.json(
        { message: "Category name already exists" },
        { status: 409 },
      );
    }

    const createdCategory = await CategoryModel.create({
      name: parsed.data.name,
      description: parsed.data.description ?? "",
      userId: session.user.id,
    });

    return NextResponse.json(
      {
        message: "Category created",
        category: {
          id: createdCategory._id.toString(),
          name: createdCategory.name,
          description: createdCategory.description,
          userId: createdCategory.userId.toString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error("Failed to create category", error, {
      route: "/api/categories",
      method: "POST",
      userId: session?.user?.id,
    });
    return NextResponse.json(
      { message: `Something went wrong ${error}` },
      { status: 500 },
    );
  }
}
