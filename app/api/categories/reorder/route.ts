import { NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import { z } from "zod";

import { connectToDatabase } from "@/lib/mongodb";
import CategoryModel from "@/lib/models/category";
import { authOptions } from "@/lib/auth/options";
import { logger } from "@/lib/logger";

const reorderSchema = z.object({
  positions: z.array(
    z.object({
      id: z.string().min(1),
      position: z.number().int().min(0),
    }),
  ),
});

export async function PATCH(request: Request) {
  let session: Session | null = null;
  try {
    session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = reorderSchema.safeParse(body);

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

    const bulkOps = parsed.data.positions.map(({ id, position }) => ({
      updateOne: {
        filter: { _id: id, userId: session?.user?.id || "" },
        update: { $set: { position } },
      },
    }));

    await CategoryModel.bulkWrite(bulkOps);

    const categories = await CategoryModel.find({ userId: session.user.id })
      .select("name description userId position")
      .sort({ position: 1 })
      .lean();

    return NextResponse.json({
      categories: categories.map((category) => ({
        id: category._id.toString(),
        name: category.name,
        description: category.description ?? "",
        userId: category.userId.toString(),
        position: category.position,
      })),
    });
  } catch (error) {
    logger.error("Failed to reorder categories", error, {
      route: "/api/categories/reorder",
      method: "PATCH",
      userId: session?.user?.id || "",
    });
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
