import { z } from "zod";

export const feedbackSchema = z.object({
  message: z.string().min(10, "Pesan minimal 10 karakter").max(1000, "Pesan maksimal 1000 karakter"),
});

export type FeedbackFormInput = z.infer<typeof feedbackSchema>;
