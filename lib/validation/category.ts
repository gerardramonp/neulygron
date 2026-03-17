import { z } from "zod";

const nameSchema = z
  .string("The name is required")
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name cannot exceed 100 characters");

const descriptionSchema = z
  .string()
  .trim()
  .max(500, "Description cannot exceed 500 characters")
  .refine(
    (value) => value === "" || value.length >= 10,
    "Description must be at least 10 characters when provided",
  );

export const createCategorySchema = z.object({
  name: nameSchema,
  description: descriptionSchema.optional().transform((value) => value ?? ""),
});

export const updateCategorySchema = z
  .object({
    name: nameSchema.optional(),
    description: descriptionSchema.optional(),
  })
  .refine(
    (data) =>
      typeof data.name === "string" || typeof data.description === "string",
    {
      message: "Provide at least one field to update",
    },
  );

const conceptSchema = z
  .string()
  .trim()
  .min(1, "Concept cannot be empty")
  .max(400, "Concept cannot exceed 400 characters");

export const addConceptSchema = z.object({
  concept: conceptSchema,
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type AddConceptInput = z.infer<typeof addConceptSchema>;
