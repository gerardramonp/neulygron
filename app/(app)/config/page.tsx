"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { Separator } from "@/components/ui/separator";
import CategoryCard from "./CategoryCard";
import CreateCategoryDialog from "./CreateCategoryDialog";
import type { Category } from "./types";

import { MIXPANEL_EVENTS, trackEvent } from "@/lib/analytics/mixpanel";

export default function ConfigPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const t = useTranslations("ConfigPage");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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
      } catch {
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
  }, [t]);

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

  const handleRevertFields = (
    id: string,
    name: string,
    description: string,
  ) => {
    setCategories((prev) =>
      prev.map((category) =>
        category.id === id ? { ...category, name, description } : category,
      ),
    );
  };

  const handleDelete = (id: string) => {
    setCategories((prev) => prev.filter((category) => category.id !== id));
    setFetchError(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);

    const reordered = arrayMove(categories, oldIndex, newIndex).map(
      (category, index) => ({
        ...category,
        position: index,
      }),
    );

    setCategories(reordered);

    try {
      const response = await fetch("/api/categories/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positions: reordered.map((c) => ({ id: c.id, position: c.position })),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setFetchError(payload?.message ?? "Unable to reorder categories.");
        return;
      }

      trackEvent(MIXPANEL_EVENTS.CATEGORIES_REORDERED, {
        categoryCount: reordered.length,
      });
    } catch {
      setFetchError("Unable to reorder categories. Please try again.");
    }
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={categories.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {categories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onFieldChange={(field, value) =>
                      handleFieldChange(category.id, field, value)
                    }
                    onRevertFields={(name, description) =>
                      handleRevertFields(category.id, name, description)
                    }
                    onDelete={() => handleDelete(category.id)}
                    onError={setFetchError}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </main>
  );
}
