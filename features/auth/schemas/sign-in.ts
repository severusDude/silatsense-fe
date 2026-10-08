import { z } from "zod";

export const identifierSchema = z.union([
  z.string().regex(/^\d{8,12}$/, "NPM harus 8–12 digit"),
  z.string().email("Masukkan NPM atau email yang valid"),
]);

export const signInSchema = z.object({
  identifier: identifierSchema,
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
  rememberMe: z.boolean().default(false),
});

export type SignInInput = z.infer<typeof signInSchema>;
