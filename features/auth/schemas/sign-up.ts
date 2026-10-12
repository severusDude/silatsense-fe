import { z } from "zod";
import { identifierSchema } from "@/features/auth/schemas/sign-in";

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(3, "Nama minimal 3 karakter"),
    identifier: identifierSchema,
    password: z.string().min(8, "Kata sandi minimal 8 karakter"),
    confirmPassword: z.string(),
    terms: z.boolean().refine((v) => v === true, "Centang persetujuan untuk lanjut"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;
