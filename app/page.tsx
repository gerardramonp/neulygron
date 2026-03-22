"use client";

import {
  useState,
  useEffect,
  useCallback,
  type ChangeEvent,
  type DragEvent,
  useRef,
} from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { ClassificationProgress } from "@/components/expenses/ClassificationProgress";
import { ClassificationResults } from "@/components/expenses/ClassificationResults";
import { ClassifiedExpenses } from "@/lib/validation/expenses";
import type { Category } from "@/app/config/types";

export default function Home() {
  const t = useTranslations("HomePage");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [classificationResult, setClassificationResult] =
    useState<ClassifiedExpenses | null>(null);
  const [classificationError, setClassificationError] = useState<string | null>(
    null,
  );
  const [isClassifying, setIsClassifying] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.categories) {
          setCategories(data.categories);
        }
      })
      .catch(() => {
        // Silently ignore — categories will just be empty
      });
  }, []);

  const handleAssignExpense = useCallback(
    (expenseIndex: number, categoryName: string) => {
      const prev = classificationResult;
      const expense = prev?.uncategorized[expenseIndex];
      const category = categories.find((c) => c.name === categoryName);

      setClassificationResult((state) => {
        if (!state) return state;
        const exp = state.uncategorized[expenseIndex];
        if (!exp) return state;

        const nextUncategorized = state.uncategorized.filter(
          (_, i) => i !== expenseIndex,
        );
        const existingCategoryIndex = state.categories.findIndex(
          (cat) => cat.name === categoryName,
        );
        let nextCategories;
        if (existingCategoryIndex >= 0) {
          nextCategories = state.categories.map((cat, i) =>
            i === existingCategoryIndex
              ? { ...cat, expenses: [...cat.expenses, exp] }
              : cat,
          );
        } else {
          nextCategories = [
            ...state.categories,
            { name: categoryName, expenses: [exp] },
          ];
        }
        return {
          categories: nextCategories,
          uncategorized: nextUncategorized,
        };
      });

      // Persist concept on category so the model improves over time (only for existing user categories)
      if (expense?.concept?.trim() && category?.id) {
        fetch(`/api/categories/${category.id}/concepts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ concept: expense.concept.trim() }),
        }).catch(() => {
          // Silently ignore; UI already updated
        });
      }
    },
    [classificationResult, categories],
  );

  const handleReassignExpense = useCallback(
    (
      fromCategoryName: string,
      expenseIndex: number,
      toCategoryName: string,
    ) => {
      let movedExpense: { concept: string; amount: number } | undefined;

      setClassificationResult((state) => {
        if (!state) return state;

        const fromCategory = state.categories.find(
          (cat) => cat.name === fromCategoryName,
        );
        if (!fromCategory) return state;

        const exp = fromCategory.expenses[expenseIndex];
        if (!exp) return state;
        movedExpense = exp;

        const nextFromExpenses = fromCategory.expenses.filter(
          (_, i) => i !== expenseIndex,
        );

        let nextCategories = state.categories
          .map((cat) =>
            cat.name === fromCategoryName
              ? { ...cat, expenses: nextFromExpenses }
              : cat,
          )
          .filter((cat) => cat.expenses.length > 0);

        const existingTargetIndex = nextCategories.findIndex(
          (cat) => cat.name === toCategoryName,
        );
        if (existingTargetIndex >= 0) {
          nextCategories = nextCategories.map((cat, i) =>
            i === existingTargetIndex
              ? { ...cat, expenses: [...cat.expenses, exp] }
              : cat,
          );
        } else {
          nextCategories = [
            ...nextCategories,
            { name: toCategoryName, expenses: [exp] },
          ];
        }

        return { ...state, categories: nextCategories };
      });

      // Persist concept on target category so the model improves over time
      const targetCategory = categories.find((c) => c.name === toCategoryName);
      if (movedExpense?.concept?.trim() && targetCategory?.id) {
        fetch(`/api/categories/${targetCategory.id}/concepts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ concept: movedExpense.concept.trim() }),
        }).catch(() => {
          // Silently ignore; UI already updated
        });
      }
    },
    [categories],
  );

  const resetClassificationFeedback = () => {
    setClassificationResult(null);
    setClassificationError(null);
  };

  const processFile = (file: File | null) => {
    resetClassificationFeedback();

    if (!file) {
      setSelectedFile(null);
      setFileError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    if (file.type !== "application/pdf") {
      setSelectedFile(null);
      setFileError(t("errors.invalidType"));
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setSelectedFile(file);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    processFile(file);
  };

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const nextTarget = event.relatedTarget;
    if (nextTarget && event.currentTarget.contains(nextTarget as Node)) {
      return;
    }
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0] ?? null;
    processFile(file);
  };

  const handleClassifyExpenses = async () => {
    if (!selectedFile) {
      return;
    }

    setIsClassifying(true);
    setClassificationResult(null);
    setClassificationError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("/api/expenses/classify", {
        method: "POST",
        body: formData,
      });

      const message = await response.json();

      if (!response.ok) {
        setClassificationError(message?.message ?? t("errors.uploadFailed"));
        return;
      }

      const sortedResult = {
        ...message,
        categories: [...(message.categories ?? [])].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      };
      setClassificationResult(sortedResult);
    } catch {
      setClassificationError(t("errors.uploadFailed"));
    } finally {
      setIsClassifying(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-6 py-10 font-sans text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            {t("label")}
          </p>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </header>

        <section className="rounded-xl border border-dashed border-border/70 bg-card/40 p-6">
          <label
            htmlFor="expenses-file"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-dashed bg-background/60 px-6 py-10 text-center transition hover:border-primary hover:bg-background ${isDragging ? "border-primary bg-primary/5" : "border-primary/50"}`}
          >
            <div className="space-y-2">
              <p className="text-base font-medium text-foreground">
                {t("uploadLabel")}
              </p>
              <p className="text-sm text-muted-foreground">{t("uploadHint")}</p>
            </div>
            <span className="text-sm font-semibold text-primary">
              {t("uploadCta")}
            </span>
            <input
              id="expenses-file"
              type="file"
              accept="application/pdf"
              className="sr-only"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </label>
          <p className="mt-3 text-xs text-muted-foreground">
            {t("uploadHelper")}
          </p>

          {fileError ? (
            <p className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {fileError}
            </p>
          ) : null}

          {selectedFile ? (
            <div className="mt-4 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
              <p className="font-medium text-foreground">
                {t("selectedFileLabel")}
              </p>
              <p className="break-all text-muted-foreground">
                {selectedFile.name}
              </p>
            </div>
          ) : null}
        </section>

        {selectedFile ? (
          <div className="w-full self-start space-y-10">
            <Button
              className="w-full md:w-auto"
              onClick={handleClassifyExpenses}
              disabled={isClassifying}
              aria-busy={isClassifying}
            >
              {isClassifying ? t("classifyingButton") : t("classifyButton")}
            </Button>

            {isClassifying ? <ClassificationProgress /> : null}

            {classificationError ? (
              <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {classificationError}
              </p>
            ) : null}

            {classificationResult ? (
              <ClassificationResults
                data={classificationResult}
                categories={categories}
                onAssign={handleAssignExpense}
                onReassign={handleReassignExpense}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}
