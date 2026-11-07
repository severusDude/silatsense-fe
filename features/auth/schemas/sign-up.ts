import { z } from "zod";

export const emailIdentifierSchema = z
  .string()
  .trim()
  .email("Masukkan alamat email yang valid")
  .max(254, "Email terlalu panjang");

export const signUpSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(3, "Nama minimal 3 karakter")
      .max(120, "Nama maksimal 120 karakter"),
    identifier: emailIdentifierSchema,
    password: z
      .string()
      .min(8, "Kata sandi minimal 8 karakter")
      .max(128, "Kata sandi maksimal 128 karakter"),
    confirmPassword: z.string(),
    terms: z.boolean().refine((v) => v === true, "Centang persetujuan untuk lanjut"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;

export const signUpPayloadSchema = z.object({
  fullName: z.string().trim().min(3).max(120),
  identifier: emailIdentifierSchema,
  password: z.string().min(8).max(128),
});

export type SignUpPayload = z.infer<typeof signUpPayloadSchema>;
