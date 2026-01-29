"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Separator } from "@/components/ui/separator";
import CategoryCard from "./CategoryCard";
import CreateCategoryDialog from "./CreateCategoryDialog";
import type { Category } from "./types";

export default function ConfigPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const t = useTranslations("ConfigPage");

  useEffect(() => {
    let isActive = true;

    const loadCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        const payload = (await response.json().catch(() => null)) as {
          categories?: Category[];
          message?: string;
        } | null;

        if (!response.ok) {
          if (isActive) {
            setFetchError(payload?.message ?? t("errors.unableToLoad"));
          }
          return;
        }

        if (isActive) {
          setFetchError(null);
          setCategories(
            Array.isArray(payload?.categories) ? payload.categories : [],
          );
        }
      } catch (error) {
        if (isActive) {
          setFetchError(t("errors.retry"));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadCategories();

    return () => {
      isActive = false;
    };
  }, []);

  const handleCategoryCreated = (category: Category) => {
    setCategories((prev) => [...prev, category]);
    setFetchError(null);
  };

  const handleFieldChange = (
    id: string,
    field: "name" | "description",
    value: string,
  ) => {
    setCategories((prev) =>
      prev.map((category) =>
        category.id === id ? { ...category, [field]: value } : category,
      ),
    );
  };

  const handleDelete = (id: string) => {
    setCategories((prev) => prev.filter((category) => category.id !== id));
    setFetchError(null);
  };

  return (
    <main className="min-h-screen bg-background px-6 py-10 font-sans text-foreground">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <section className="space-y-3">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
              {t("label")}
            </p>
            <h1 className="text-3xl font-bold">{t("title")}</h1>
            <p className="text-muted-foreground">{t("description")}</p>
          </section>

          <CreateCategoryDialog onCategoryCreated={handleCategoryCreated} />
        </div>

        <Separator className="opacity-60" />

        {fetchError ? (
          <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {fetchError}
          </p>
        ) : null}

        <div className="grid gap-4 md:gap-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{t("loading")}</p>
          ) : categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("emptyState")}</p>
          ) : (
            categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onFieldChange={(field, value) =>
                  handleFieldChange(category.id, field, value)
                }
                onDelete={() => handleDelete(category.id)}
                onError={setFetchError}
              />
            ))
          )}
        </div>
      </div>
    </main>
  );
}
