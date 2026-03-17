"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, GripVertical, Loader2, Trash2 } from "lucide-react";

import type { Category } from "./types";

type CategoryCardProps = {
  category: Category;
  onFieldChange: (field: "name" | "description", value: string) => void;
  onDelete: () => void;
  onError: (message: string | null) => void;
};

export default function CategoryCard({
  category,
  onFieldChange,
  onDelete,
  onError,
}: CategoryCardProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isBusy = isSaving || isDeleting;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleNameClick = () => {
    setIsEditingName(true);
  };

  const handleNameBlur = () => {
    setIsEditingName(false);
  };

  const handleDeleteClick = () => {
    if (isBusy) {
      return;
    }

    setIsEditingName(false);
    void deleteCategory();
  };

  const handleSaveClick = () => {
    if (isBusy) {
      return;
    }

    setIsEditingName(false);
    void saveCategory();
  };

  const saveCategory = async () => {
    if (!category.id) {
      onError?.("Missing category identifier.");
      return;
    }

    setIsSaving(true);
    onError(null);

    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: category.name,
          description: category.description,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        category?: Category;
        message?: string;
      } | null;

      if (!response.ok) {
        const message = payload?.message ?? "Unable to update category.";
        console.error(message);
        onError?.(message);
        return;
      }

      if (payload?.category) {
        if (typeof payload.category.name === "string") {
          onFieldChange("name", payload.category.name);
        }
        if (typeof payload.category.description === "string") {
          onFieldChange("description", payload.category.description);
        }
      }
    } catch (error) {
      console.error("Failed to update category", error);
      onError?.("Unable to update category. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCategory = async () => {
    if (!category.id) {
      onError?.("Missing category identifier.");
      return;
    }

    setIsDeleting(true);
    onError(null);

    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: "DELETE",
      });

      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        const message = payload?.message ?? "Unable to delete category.";
        console.error(message);
        onError?.(message);
        return;
      }

      onDelete();
    } catch (error) {
      console.error("Failed to delete category", error);
      onError?.("Unable to delete category. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border border-border bg-card/60 p-4 text-card-foreground shadow-sm sm:p-6 ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-col md:flex-row md:items-start md:gap-6">
        <button
          type="button"
          className="hidden cursor-grab touch-none text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex md:items-center md:self-stretch"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" aria-hidden />
          <span className="sr-only">Drag to reorder {category.name}</span>
        </button>
        <div className="space-y-2 md:w-[220px]">
          {isEditingName ? (
            <Input
              value={category.name}
              autoFocus
              onChange={(event) => onFieldChange("name", event.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  event.currentTarget.blur();
                }
              }}
            />
          ) : (
            <button
              type="button"
              onClick={handleNameClick}
              className="w-full rounded-md border border-transparent bg-muted/40 px-3 py-2 text-left text-sm font-semibold text-foreground transition hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {category.name}
            </button>
          )}
        </div>

        <div className="space-y-2 md:flex-1">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground md:hidden">
            Description
          </p>
          <Textarea
            value={category.description}
            onChange={(event) =>
              onFieldChange("description", event.target.value)
            }
            className="min-h-[110px] bg-background text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        <div className="flex items-start justify-end gap-2 md:justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={handleDeleteClick}
            disabled={isBusy}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Trash2 className="h-4 w-4" aria-hidden />
            )}
            <span className="sr-only">Delete {category.name}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSaveClick}
            disabled={isBusy}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Check className="h-4 w-4" aria-hidden />
            )}
            <span className="sr-only">Save {category.name}</span>
          </Button>
        </div>
      </div>
    </article>
  );
}
