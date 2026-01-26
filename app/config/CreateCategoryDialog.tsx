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
            general: data?.message ?? "Unable to create the category",
          });
        }
        return;
      }

      const normalized: Category = {
        id: data?.category?.id ?? crypto.randomUUID?.() ?? `${Date.now()}`,
        name: data?.category?.name ?? formValues.name,
        description:
          data?.category?.description ?? formValues.description ?? "",
      };

      onCategoryCreated(normalized);
      setFormValues(EMPTY_FORM);
      handleDialogOpenChange(false);
    } catch (error) {
      console.error("Failed to create category", error);
      setFormErrors({
        general: "Unable to create the category. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full md:w-auto">Create category</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new category</DialogTitle>
          <DialogDescription>
            Give the category a clear name. Add a description so the AI knows
            when to surface it.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleCreateCategory}>
          <StyledInput
            id="category-name"
            name="name"
            label="Name"
            value={formValues.name}
            onChange={(event) =>
              setFormValues((prev) => ({
                ...prev,
                name: event.target.value,
              }))
            }
            placeholder="e.g. Product pillars"
            error={formErrors.name}
            required
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <label
                htmlFor="category-description"
                className="font-medium text-foreground"
              >
                Description
              </label>
              <span className="text-muted-foreground">Optional</span>
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
              placeholder="Explain when this category appears and the tone you expect."
            />
            <p className="text-xs text-muted-foreground">
              Leave blank or write at least 10 characters to guide the AI.
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
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
