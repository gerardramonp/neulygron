"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ChangeEvent,
  type DragEvent,
  useRef,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { ClassificationProgress } from "@/components/expenses/ClassificationProgress";
import { ClassificationResults } from "@/components/expenses/ClassificationResults";
import type { ClassifiedExpensesWithPositions } from "@/lib/validation/expenses";
import type { Category } from "@/app/(app)/config/types";
import {
  buildYearRange,
  formatYearMonth,
  parseYearMonth,
} from "@/lib/year-month";
import { reassignCategoryExpense } from "@/lib/expenses/reassign-category-expense";
import {
  trackEvent,
  incrementPeople,
  MIXPANEL_EVENTS,
} from "@/lib/analytics/mixpanel";
import { postCategoryConcept } from "@/lib/analytics/post-category-concept";

export default function Home() {
  const t = useTranslations("HomePage");
  const locale = useLocale();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [classificationResult, setClassificationResult] =
    useState<ClassifiedExpensesWithPositions | null>(null);
  const [classificationError, setClassificationError] = useState<string | null>(
    null,
  );
  const [isClassifying, setIsClassifying] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reportYear, setReportYear] = useState(() => new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState(
    () => new Date().getMonth() + 1,
  );
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [saveReportError, setSaveReportError] = useState<string | null>(null);
  const [saveReportSuccess, setSaveReportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const anchorYear = useMemo(() => new Date().getFullYear(), []);
  const yearOptions = useMemo(() => {
    const base = buildYearRange(anchorYear);
    if (base.includes(reportYear)) return base;
    return [...base, reportYear].sort((a, b) => a - b);
  }, [anchorYear, reportYear]);

  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const label = new Intl.DateTimeFormat(locale, { month: "long" }).format(
        new Date(2000, month - 1, 1),
      );
      return { value: month, label };
    });
  }, [locale]);

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

  useEffect(() => {
    setSaveReportSuccess(false);
  }, [reportYear, reportMonth]);

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
          const matched = categories.find((c) => c.name === categoryName);
          if (!matched) return state;
          nextCategories = [
            ...state.categories,
            {
              name: categoryName,
              expenses: [exp],
              position: matched.position,
            },
          ];
        }
        return {
          categories: nextCategories,
          uncategorized: nextUncategorized,
        };
      });

      // Persist concept on category so the model improves over time (only for existing user categories)
      if (expense?.concept?.trim() && category?.id) {
        postCategoryConcept(
          category.id,
          expense.concept.trim(),
          categoryName,
        );
      }

      trackEvent(MIXPANEL_EVENTS.EXPENSE_ASSIGNED, {
        fromState: "uncategorized",
        toCategory: categoryName,
        expenseConcept: expense?.concept ?? "",
        expenseAmount: expense?.amount ?? 0,
      });
    },
    [classificationResult, categories],
  );

  const handleReassignExpense = useCallback(
    (
      fromCategoryName: string,
      expenseIndex: number,
      toCategoryName: string,
    ) => {
      const prev = classificationResult;
      const sourceCat = prev?.categories.find(
        (c) => c.name === fromCategoryName,
      );
      const expense = sourceCat?.expenses[expenseIndex];
      const targetCategory = categories.find((c) => c.name === toCategoryName);

      setClassificationResult((state) => {
        if (!state) return state;
        const nextCategories = reassignCategoryExpense(
          state.categories,
          fromCategoryName,
          expenseIndex,
          toCategoryName,
          categories,
        );
        if (!nextCategories) return state;
        return { ...state, categories: nextCategories };
      });

      if (expense?.concept?.trim() && targetCategory?.id) {
        postCategoryConcept(
          targetCategory.id,
          expense.concept.trim(),
          toCategoryName,
        );
      }

      trackEvent(MIXPANEL_EVENTS.EXPENSE_REASSIGNED, {
        fromCategory: fromCategoryName,
        toCategory: toCategoryName,
        expenseConcept: expense?.concept ?? "",
        expenseAmount: expense?.amount ?? 0,
      });
    },
    [classificationResult, categories],
  );

  const resetClassificationFeedback = () => {
    setClassificationResult(null);
    setClassificationError(null);
    setSaveReportError(null);
    setSaveReportSuccess(false);
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
    trackEvent(MIXPANEL_EVENTS.PDF_SELECTED, {
      fileSizeMB: Math.round((file.size / (1024 * 1024)) * 1000) / 1000,
    });
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
    setSaveReportError(null);
    setSaveReportSuccess(false);

    trackEvent(MIXPANEL_EVENTS.CLASSIFICATION_STARTED);
    const startedAt = performance.now();

    const classifyErrorType = (
      response: Response,
      message: { code?: string; message?: unknown },
    ): string => {
      if (response.status === 401) return "unauthorized";
      if (message.code === "NOT_BANK_EXPENSE_REPORT") {
        return "not_bank_statement";
      }
      if (response.status === 415 || response.status === 400) {
        return "invalid_upload";
      }
      if (response.status === 422) {
        const m =
          typeof message.message === "string" ? message.message : "";
        if (m.toLowerCase().includes("no readable text")) return "empty_pdf";
        if (m.includes("No expenses found")) return "no_expenses";
        if (m.includes("Unable to extract")) return "extraction_failed";
        if (m.includes("Unable to classify")) return "classification_failed";
        return "unprocessable";
      }
      if (response.status >= 500) return "server_error";
      return "unknown";
    };

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("/api/expenses/classify", {
        method: "POST",
        body: formData,
      });

      const message = (await response.json()) as Record<string, unknown> & {
        code?: string;
        categories?: ClassifiedExpensesWithPositions["categories"];
        uncategorized?: ClassifiedExpensesWithPositions["uncategorized"];
        proposedYearMonth?: string | null;
      };

      if (!response.ok) {
        trackEvent(MIXPANEL_EVENTS.CLASSIFICATION_FAILED, {
          errorType: classifyErrorType(response, message),
        });
        if (message.code === "NOT_BANK_EXPENSE_REPORT") {
          setClassificationError(t("errors.notBankExpenseReport"));
          return;
        }
        setClassificationError(
          typeof message?.message === "string"
            ? message.message
            : t("errors.uploadFailed"),
        );
        return;
      }

      const positionByName = new Map(
        categories.map((c) => [c.name, c.position]),
      );

      const sortedResult: ClassifiedExpensesWithPositions = {
        categories: [...(message.categories ?? [])].sort((a, b) => {
          const oa = positionByName.get(a.name) ?? a.position;
          const ob = positionByName.get(b.name) ?? b.position;
          if (oa !== ob) return oa - ob;
          return a.name.localeCompare(b.name);
        }),
        uncategorized: message.uncategorized ?? [],
      };
      setClassificationResult(sortedResult);

      const categorizedCount = sortedResult.categories.reduce(
        (sum, cat) => sum + cat.expenses.length,
        0,
      );
      const uncategorizedCount = sortedResult.uncategorized.length;
      const totalExpenses = categorizedCount + uncategorizedCount;

      trackEvent(MIXPANEL_EVENTS.CLASSIFICATION_COMPLETED, {
        totalExpenses,
        categorizedCount,
        uncategorizedCount,
        categoryCount: sortedResult.categories.length,
        durationMs: Math.round(performance.now() - startedAt),
        proposedYearMonth:
          typeof message.proposedYearMonth === "string"
            ? message.proposedYearMonth
            : null,
      });
      incrementPeople("totalExpensesClassified", totalExpenses);

      const proposed =
        typeof message.proposedYearMonth === "string"
          ? parseYearMonth(message.proposedYearMonth)
          : null;
      if (proposed) {
        setReportYear(proposed.year);
        setReportMonth(proposed.month);
      }
    } catch {
      trackEvent(MIXPANEL_EVENTS.CLASSIFICATION_FAILED, {
        errorType: "network_error",
      });
      setClassificationError(t("errors.uploadFailed"));
    } finally {
      setIsClassifying(false);
    }
  };

  const handleSaveMonthlyReport = async () => {
    if (
      !classificationResult ||
      classificationResult.uncategorized.length > 0
    ) {
      return;
    }

    setIsSavingReport(true);
    setSaveReportError(null);
    setSaveReportSuccess(false);

    const yearMonth = formatYearMonth(reportYear, reportMonth);
    const categoriesPayload = classificationResult.categories
      .filter((cat) => cat.expenses.length > 0)
      .map((cat) => ({
        name: cat.name,
        position: cat.position,
        expenses: cat.expenses.map((e) => ({
          concept: e.concept,
          amount: e.amount,
        })),
      }));

    let isUpdate = false;
    try {
      const existingRes = await fetch(
        `/api/expenses/monthly-report?yearMonth=${encodeURIComponent(yearMonth)}`,
      );
      if (existingRes.ok) {
        const existingBody = (await existingRes.json().catch(() => null)) as {
          report?: { id?: string };
        } | null;
        isUpdate = Boolean(existingBody?.report);
      }
    } catch {
      // ignore — treat as new save
    }

    const totalExpenses = categoriesPayload.reduce(
      (n, cat) => n + cat.expenses.length,
      0,
    );
    const totalAmount = categoriesPayload.reduce(
      (sum, cat) =>
        sum + cat.expenses.reduce((s, e) => s + e.amount, 0),
      0,
    );

    try {
      const response = await fetch("/api/expenses/monthly-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yearMonth, categories: categoriesPayload }),
      });

      const body = await response.json().catch(() => ({}));

      if (response.status === 401) {
        setSaveReportError(t("saveReportUnauthorized"));
        return;
      }

      if (!response.ok) {
        const msg =
          typeof body?.message === "string"
            ? body.message
            : t("saveReportError");
        setSaveReportError(msg);
        return;
      }

      trackEvent(MIXPANEL_EVENTS.MONTHLY_REPORT_SAVED, {
        yearMonth,
        categoryCount: categoriesPayload.length,
        totalExpenses,
        totalAmount,
        isUpdate,
      });
      incrementPeople("totalReportsSaved", 1);

      setSaveReportSuccess(true);
    } catch {
      setSaveReportError(t("saveReportError"));
    } finally {
      setIsSavingReport(false);
    }
  };

  const canSaveReport =
    classificationResult !== null &&
    classificationResult.uncategorized.length === 0;

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
              <>
                <ClassificationResults
                  data={classificationResult}
                  categories={categories}
                  onAssign={handleAssignExpense}
                  onReassign={handleReassignExpense}
                />
                {canSaveReport ? (
                  <section className="space-y-4 rounded-xl border border-border bg-card/40 p-6">
                    <h2 className="text-lg font-semibold text-foreground">
                      {t("saveSectionTitle")}
                    </h2>
                    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
                      <div className="space-y-2">
                        <Label htmlFor="save-report-year">
                          {t("saveYearLabel")}
                        </Label>
                        <NativeSelect
                          id="save-report-year"
                          value={reportYear}
                          onChange={(e) =>
                            setReportYear(Number(e.target.value))
                          }
                          disabled={isSavingReport}
                        >
                          {yearOptions.map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </NativeSelect>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="save-report-month">
                          {t("saveMonthLabel")}
                        </Label>
                        <NativeSelect
                          id="save-report-month"
                          value={reportMonth}
                          onChange={(e) =>
                            setReportMonth(Number(e.target.value))
                          }
                          disabled={isSavingReport}
                        >
                          {monthOptions.map(({ value, label }) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </NativeSelect>
                      </div>
                      <Button
                        type="button"
                        onClick={handleSaveMonthlyReport}
                        disabled={isSavingReport}
                        aria-busy={isSavingReport}
                      >
                        {isSavingReport
                          ? t("savingReportButton")
                          : t("saveReportButton")}
                      </Button>
                    </div>
                    {saveReportError ? (
                      <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {saveReportError}
                      </p>
                    ) : null}
                    {saveReportSuccess ? (
                      <p className="text-sm text-muted-foreground">
                        {t("saveReportSuccess", {
                          yearMonth: formatYearMonth(reportYear, reportMonth),
                        })}
                      </p>
                    ) : null}
                  </section>
                ) : null}
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}
