import { z } from "zod";

export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Nama minimal 2 karakter")
      .max(120, "Nama maksimal 120 karakter")
      .optional(),
    fullName: z
      .string()
      .trim()
      .min(2, "Nama minimal 2 karakter")
      .max(120, "Nama maksimal 120 karakter")
      .optional(),
    division: z.string().max(120).optional().nullable(),
    nim: z.string().optional(),
    email: z.string().optional(),
    cameraDeviceId: z.string().optional(),
  })
  .refine(
    (data) =>
      Boolean((data.name && data.name.trim().length >= 2) ||
      (data.fullName && data.fullName.trim().length >= 2)),
    {
      message: "Nama lengkap minimal 2 karakter",
      path: ["name"],
    }
  );

export const profileSchema = updateProfileSchema;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const passwordChangeFormSchema = z
  .object({
    currentPassword: z
      .string()
      .min(8, "Kata sandi saat ini minimal 8 karakter")
      .max(128, "Kata sandi maksimal 128 karakter"),
    newPassword: z
      .string()
      .min(8, "Kata sandi baru minimal 8 karakter")
      .max(128, "Kata sandi maksimal 128 karakter"),
    confirmPassword: z
      .string()
      .min(8, "Konfirmasi kata sandi minimal 8 karakter")
      .max(128, "Kata sandi maksimal 128 karakter"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Kata sandi baru harus berbeda dari kata sandi saat ini",
    path: ["newPassword"],
  });

export type PasswordChangeFormInput = z.infer<typeof passwordChangeFormSchema>;
