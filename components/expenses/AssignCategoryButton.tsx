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
import type { Category } from "@/app/config/types";

interface AssignCategoryButtonProps {
  categories: Category[];
  onAssign: (categoryName: string) => void;
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
}: AssignCategoryButtonProps) {
  const t = useTranslations("ClassificationResults");
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const handleSelect = (categoryName: string) => {
    onAssign(categoryName);
    setOpen(false);
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button variant="outline" size="sm">
            {t("actionButton")}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t("assignTitle")}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            <CategoryList categories={categories} onSelect={handleSelect} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          {t("actionButton")}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 p-2">
        <p className="mb-1 px-3 py-1 text-xs font-medium text-muted-foreground">
          {t("assignTitle")}
        </p>
        <CategoryList categories={categories} onSelect={handleSelect} />
      </PopoverContent>
    </Popover>
  );
}
