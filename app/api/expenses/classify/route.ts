import { extractText } from "unpdf";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);

  if (!formData) {
    return NextResponse.json(
      { message: "Invalid form data payload." },
      { status: 400 },
    );
  }

  const file = formData.get("file");

  if (!(file instanceof Blob)) {
    return NextResponse.json(
      { message: "Missing PDF file upload." },
      { status: 400 },
    );
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json(
      { message: "Only PDF files are supported." },
      { status: 415 },
    );
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const { text, totalPages } = await extractText(arrayBuffer);

    return NextResponse.json(
      {
        message: "PDF parsed successfully.",
        text: text?.join("\n").trim() ?? "",
        metadata: {
          totalPages,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Unable to read PDF contents." },
      { status: 422 },
    );
  }
}
