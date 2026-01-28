"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { StyledInput } from "@/components/ui/styled-input";
import type { Category } from "./types";
import { useTranslations } from "next-intl";

type FormErrors = {
  name?: string;
  description?: string;
  general?: string;
};

const EMPTY_FORM = {
  name: "",
  description: "",
};

type CreateCategoryDialogProps = {
  onCategoryCreated: (category: Category) => void;
};

export default function CreateCategoryDialog({
  onCategoryCreated,
}: CreateCategoryDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formValues, setFormValues] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = useTranslations("CreateCategoryDialog");

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);

    if (!open) {
      setFormValues(EMPTY_FORM);
      setFormErrors({});
    }
  };

  const handleCreateCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formValues),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (data?.errors) {
          setFormErrors({
            name: data.errors.name?.[0],
            description: data.errors.description?.[0],
          });
        } else {
          setFormErrors({
            general: data?.message ?? t("generalError"),
          });
        }
        return;
      }

      const normalized: Category = {
        id: data?.category?.id ?? crypto.randomUUID?.() ?? `${Date.now()}`,
        name: data?.category?.name ?? formValues.name,
        description:
          data?.category?.description ?? formValues.description ?? "",
        userId: data?.category?.userId,
      };

      onCategoryCreated(normalized);
      setFormValues(EMPTY_FORM);
      handleDialogOpenChange(false);
    } catch (error) {
      console.error("Failed to create category", error);
      setFormErrors({
        general: t("generalError"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full md:w-auto">{t("trigger")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleCreateCategory}>
          <StyledInput
            id="category-name"
            name="name"
            label={t("nameLabel")}
            value={formValues.name}
            onChange={(event) =>
              setFormValues((prev) => ({
                ...prev,
                name: event.target.value,
              }))
            }
            placeholder={t("namePlaceholder")}
            error={formErrors.name}
            required
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <label
                htmlFor="category-description"
                className="font-medium text-foreground"
              >
                {t("descriptionLabel")}
              </label>
              <span className="text-muted-foreground">
                {t("descriptionOptional")}
              </span>
            </div>
            <Textarea
              id="category-description"
              value={formValues.description}
              onChange={(event) =>
                setFormValues((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              placeholder={t("descriptionPlaceholder")}
            />
            <p className="text-xs text-muted-foreground">
              {t("descriptionHelper")}
            </p>
            {formErrors.description ? (
              <p className="text-sm text-destructive">
                {formErrors.description}
              </p>
            ) : null}
          </div>

          {formErrors.general ? (
            <p className="text-sm text-destructive">{formErrors.general}</p>
          ) : null}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("cancelButton")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("creating") : t("createButton")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
