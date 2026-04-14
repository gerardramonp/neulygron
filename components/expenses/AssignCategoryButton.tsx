"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { Category } from "@/app/(app)/config/types";

interface AssignCategoryButtonProps {
  categories: Category[];
  onAssign: (categoryName: string) => void;
  excludeCategoryNames?: string[];
  mode?: "assign" | "reassign";
}

function CategoryList({
  categories,
  onSelect,
}: {
  categories: Category[];
  onSelect: (name: string) => void;
}) {
  const t = useTranslations("ClassificationResults");

  if (categories.length === 0) {
    return (
      <p className="px-1 py-2 text-sm text-muted-foreground">
        {t("assignEmpty")}
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onSelect(category.name)}
          className="rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}

export function AssignCategoryButton({
  categories,
  onAssign,
  excludeCategoryNames = [],
  mode = "assign",
}: AssignCategoryButtonProps) {
  const t = useTranslations("ClassificationResults");
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const exclude = new Set(excludeCategoryNames);
  const selectableCategories = categories
    .filter((c) => !exclude.has(c.name))
    .sort((a, b) => {
      if (a.position !== b.position) return a.position - b.position;
      return a.name.localeCompare(b.name);
    });

  const handleSelect = (categoryName: string) => {
    onAssign(categoryName);
    setOpen(false);
  };

  const actionLabel =
    mode === "reassign" ? t("reassignButton") : t("actionButton");
  const pickerTitle =
    mode === "reassign" ? t("reassignTitle") : t("assignTitle");

  const triggerClassName =
    mode === "reassign"
      ? cn(
          "border border-border/40 bg-muted/60 text-muted-foreground shadow-none",
          "hover:border-border hover:bg-background hover:text-foreground hover:shadow-sm",
        )
      : undefined;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button
            variant={mode === "reassign" ? "ghost" : "outline"}
            size="sm"
            className={triggerClassName}
          >
            {actionLabel}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{pickerTitle}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            <CategoryList
              categories={selectableCategories}
              onSelect={handleSelect}
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={mode === "reassign" ? "ghost" : "outline"}
          size="sm"
          className={triggerClassName}
        >
          {actionLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 p-2">
        <p className="mb-1 px-3 py-1 text-xs font-medium text-muted-foreground">
          {pickerTitle}
        </p>
        <CategoryList
          categories={selectableCategories}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  );
}
