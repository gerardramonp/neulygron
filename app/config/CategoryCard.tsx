"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, Trash2 } from "lucide-react";

import type { Category } from "./types";

type CategoryCardProps = {
  category: Category;
  onFieldChange: (field: "name" | "description", value: string) => void;
  onDelete: () => void;
  onSave: () => void;
};

export default function CategoryCard({
  category,
  onFieldChange,
  onDelete,
  onSave,
}: CategoryCardProps) {
  const [isEditingName, setIsEditingName] = useState(false);

  const handleNameClick = () => {
    setIsEditingName(true);
  };

  const handleNameBlur = () => {
    setIsEditingName(false);
  };

  const handleDeleteClick = () => {
    setIsEditingName(false);
    onDelete();
  };

  const handleSaveClick = () => {
    setIsEditingName(false);
    onSave();
  };

  return (
    <article className="rounded-2xl border border-border bg-card/60 p-4 text-card-foreground shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-col md:flex-row md:items-start md:gap-6">
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
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            <span className="sr-only">Delete {category.name}</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSaveClick}>
            <Check className="h-4 w-4" aria-hidden />
            <span className="sr-only">Save {category.name}</span>
          </Button>
        </div>
      </div>
    </article>
  );
}
