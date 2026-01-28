import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { connectToDatabase } from "@/lib/mongodb";
import CategoryModel from "@/lib/models/category";
import { createCategorySchema } from "@/lib/validation/category";
import { authOptions } from "@/lib/auth/options";

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
    console.error("Failed to create category", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
