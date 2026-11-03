import { z } from "zod";

export const identifierSchema = z
  .string()
  .trim()
  .min(1, "NPM atau email harus diisi")
  .max(254, "NPM atau email terlalu panjang")
  .refine(
    (value) => /^\d{8,12}$/.test(value) || z.string().email().safeParse(value).success,
    "Masukkan NPM atau email yang valid"
  );

export const signInSchema = z.object({
  identifier: identifierSchema,
  password: z
    .string()
    .min(8, "Kata sandi minimal 8 karakter")
    .max(128, "Kata sandi maksimal 128 karakter"),
  rememberMe: z.boolean().default(false),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const signInPayloadSchema = z.object({
  identifier: identifierSchema,
  password: z.string().min(8).max(128),
  rememberMe: z.boolean().default(false),
  next: z.string().optional(),
});

export type SignInPayload = z.infer<typeof signInPayloadSchema>;
