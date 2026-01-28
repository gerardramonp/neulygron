import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string("The name is required")
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .refine(
      (value) => value === "" || value.length >= 10,
      "Description must be at least 10 characters when provided",
    )
    .optional()
    .transform((value) => value ?? ""),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
