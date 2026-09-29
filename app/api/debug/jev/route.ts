import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import { getJevClient } from "@/lib/services/jev";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await getJevClient().systemOne({
      state: "The support agent issued a full refund to the customer.",
      questions: {
        refunded: {
          type: "noul",
          instructions: "Was a refund issued?",
        },
      },
    });

    return NextResponse.json({
      answer: result.answers.refunded,
      model: result.model,
      usage: result.usage,
    });
  } catch (error) {
    console.error("[debug/jev] Evaluation failed", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Jev evaluation failed",
      },
      { status: 502 },
    );
  }
}
