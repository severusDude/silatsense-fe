"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { feedbackSchema, type FeedbackFormInput } from "@/features/coach/schemas";
import type { FeedbackResult } from "@/features/coach/types";

export function MemberFeedbackForm({ memberId, memberName }: { memberId: string; memberName: string }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState } = useForm<FeedbackFormInput>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { message: "" },
  });
  const mutation = useMutation<FeedbackResult, Error, FeedbackFormInput>({
    // TODO: connect backend via lib/api-client.ts (POST /coach/feedback) — stub for now
    mutationFn: async (values) => ({ memberId, status: "sent" as const, echo: values.message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-detail", memberId] });
      reset();
    },
  });

  const onDraft = () =>
    toast("Draf tersimpan di perangkat ini (stub)", { description: `Untuk ${memberName}. TODO: POST /coach/feedback.` });
  const onSend = (values: FeedbackFormInput) =>
    toast.promise(mutation.mutateAsync(values), {
      loading: "Mengirim feedback…",
      success: "Feedback terkirim (stub)",
      error: (e) => (e instanceof Error ? e.message : "Gagal mengirim"),
    });

  return (
    <form onSubmit={handleSubmit(onSend)} className="flex flex-col gap-(--card-spacing)">
      <CardContent>
        <Field data-invalid={formState.errors.message !== undefined}>
          <FieldLabel htmlFor="coach-feedback-message">Pesan koreksi</FieldLabel>
          <Textarea
            id="coach-feedback-message"
            {...register("message")}
            placeholder="Tulis arahan teknis atau instruksi khusus… (misal: kunci ketiak kanan pada saat dorong pukulan lurus)"
            aria-invalid={formState.errors.message !== undefined}
          />
          {formState.errors.message !== undefined && <FieldError errors={[formState.errors.message]} />}
        </Field>
      </CardContent>
      <CardFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onDraft} className="flex-1">
          Simpan Draft
        </Button>
        <Button type="submit" disabled={mutation.isPending} className="flex-1">
          <Send data-icon="inline-start" /> Kirim ke Member
        </Button>
      </CardFooter>
    </form>
  );
}
