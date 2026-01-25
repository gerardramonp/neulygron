import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string("Name is required")
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(64, "Name cannot exceed 64 characters"),
  email: z.email("Email is required").trim().toLowerCase(),
  password: z
    .string("Password is required")
    .min(8, "Password must be at least 8 characters")
    .max(64, "Password cannot exceed 64 characters"),
});

export const loginSchema = registerSchema.pick({ email: true, password: true });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
