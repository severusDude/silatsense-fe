import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100, "Nama maksimal 100 karakter"),
  nim: z.string().regex(/^\d+$/, "NIM hanya berisi angka"),
  email: z.email("Email tidak valid"),
  cameraDeviceId: z.string().min(1, "Pilih perangkat kamera"),
});

export type UpdateProfileInput = z.infer<typeof profileSchema>;
