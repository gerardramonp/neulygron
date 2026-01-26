import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import CategoryModel from "@/lib/models/category";
import { createCategorySchema } from "@/lib/validation/category";

export async function POST(request: Request) {
  try {
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
    });

    return NextResponse.json(
      {
        message: "Category created",
        category: {
          id: createdCategory._id.toString(),
          name: createdCategory.name,
          description: createdCategory.description,
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
