import { TypeSafeClient } from "@typesafe-ai/sdk";

let client: TypeSafeClient | null = null;

export function getJevClient(): TypeSafeClient {
  if (client) return client;

  const apiKey = process.env.JEV_API_KEY;
  if (!apiKey) {
    throw new Error("JEV_API_KEY is required");
  }

  client = new TypeSafeClient({ apiKey });
  return client;
}
