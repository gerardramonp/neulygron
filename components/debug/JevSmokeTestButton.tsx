"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function JevSmokeTestButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const runTest = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/debug/jev", { method: "POST" });
      const body: unknown = await response.json();
      setResult(JSON.stringify(body, null, 2));
    } catch (error) {
      setResult(
        JSON.stringify({
          message: error instanceof Error ? error.message : "Request failed",
        }),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={runTest}
          disabled={isLoading}
        >
          {isLoading ? "Testing Jev…" : "Test Jev"}
        </Button>
        <span className="text-xs text-muted-foreground">
          Temporary evaluation smoke test
        </span>
      </div>
      {result ? (
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs">
          {result}
        </pre>
      ) : null}
    </section>
  );
}
