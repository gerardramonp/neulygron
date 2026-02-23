import { extractText } from "unpdf";

export interface ParsedPdf {
  text: string;
  totalPages: number;
}

export async function parsePdf(file: Blob): Promise<ParsedPdf> {
  const arrayBuffer = await file.arrayBuffer();
  const { text, totalPages } = await extractText(arrayBuffer);

  return {
    text: text?.join("\n").trim() ?? "",
    totalPages,
  };
}
