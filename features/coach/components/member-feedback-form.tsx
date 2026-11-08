"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { saveFeedbackDraftAction } from "@/features/coach/actions/save-feedback-draft";
import { publishReviewAction } from "@/features/coach/actions/publish-review";
import type { CoachMemberDetailViewModel } from "@/features/coach/types";

const feedbackFormSchema = z.object({
  decision: z.enum(["approved", "needs_revision"], {
    error: "Pilih keputusan evaluasi.",
  }),
  note: z
    .string()
    .trim()
    .min(10, "Catatan minimal 10 karakter")
    .max(5000, "Catatan maksimal 5000 karakter"),
});

type FeedbackFormData = z.infer<typeof feedbackFormSchema>;

export function MemberFeedbackForm({
  memberId,
  memberName,
  feedback,
}: {
  memberId: string;
  memberName: string;
  feedback: CoachMemberDetailViewModel["feedback"];
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentDraftVersion, setCurrentDraftVersion] = useState(feedback.draftVersion);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    getValues,
    formState: { errors, isDirty },
    reset,
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      decision: feedback.decision ?? "approved",
      note: feedback.note ?? "",
    },
  });

  const selectedDecision = useWatch({ control, name: "decision" });

  const onDraft = async () => {
    if (!feedback.sessionId) return;
    setIsSubmitting(true);
    try {
      const values = getValues();
      const res = await saveFeedbackDraftAction({
        sessionId: feedback.sessionId,
        memberId,
        expectedVersion: currentDraftVersion,
        decision: values.decision,
        note: values.note ? values.note.trim() : null,
      });

      if (!res.ok) {
        if (res.error.code === "CONFLICT") {
          toast.error("Ulasan telah berubah. Muat ulang lalu coba lagi.");
          router.refresh();
        } else {
          toast.error(res.error.message);
        }
        return;
      }

      setCurrentDraftVersion(res.data.version);
      reset(
        {
          decision: (res.data.decision as "approved" | "needs_revision") ?? values.decision,
          note: res.data.note ?? "",
        },
        { keepDirty: false },
      );
      toast.success("Draf ulasan berhasil disimpan.");
      router.refresh();
    } catch {
      toast.error("Gagal menyimpan draf ulasan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPublish = async (data: FeedbackFormData) => {
    if (!feedback.sessionId) return;
    setIsSubmitting(true);
    try {
      let draftVersion = currentDraftVersion;

      // Save draft first if form is dirty or draft hasn't been created yet
      if (isDirty || draftVersion < 1) {
        const draftRes = await saveFeedbackDraftAction({
          sessionId: feedback.sessionId,
          memberId,
          expectedVersion: currentDraftVersion,
          decision: data.decision,
          note: data.note,
        });

        if (!draftRes.ok) {
          if (draftRes.error.code === "CONFLICT") {
            toast.error("Ulasan telah berubah. Muat ulang lalu coba lagi.");
            router.refresh();
          } else {
            toast.error(draftRes.error.message);
          }
          return;
        }

        draftVersion = draftRes.data.version;
        setCurrentDraftVersion(draftVersion);
      }

      const idempotencyKey = crypto.randomUUID();
      const pubRes = await publishReviewAction({
        sessionId: feedback.sessionId,
        memberId,
        expectedRevision: feedback.reviewRevision,
        expectedDraftVersion: draftVersion,
        idempotencyKey,
      });

      if (!pubRes.ok) {
        if (pubRes.error.code === "CONFLICT") {
          toast.error("Ulasan telah berubah. Muat ulang lalu coba lagi.");
          router.refresh();
        } else {
          toast.error(pubRes.error.message);
        }
        return;
      }

      toast.success(`Ulasan berhasil dikirim ke atlet ${memberName}.`);
      router.refresh();
    } catch {
      toast.error("Gagal mempublikasikan ulasan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onPublish)} className="flex flex-col gap-(--card-spacing)">
      <CardContent className="flex flex-col gap-3">
        <Field data-invalid={errors.decision !== undefined}>
          <FieldLabel>Keputusan Evaluasi</FieldLabel>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={selectedDecision === "approved" ? "default" : "outline"}
              size="sm"
              onClick={() => setValue("decision", "approved", { shouldDirty: true, shouldValidate: true })}
              className="flex-1"
            >
              Disetujui
            </Button>
            <Button
              type="button"
              variant={selectedDecision === "needs_revision" ? "destructive" : "outline"}
              size="sm"
              onClick={() => setValue("decision", "needs_revision", { shouldDirty: true, shouldValidate: true })}
              className="flex-1"
            >
              Perlu Revisi
            </Button>
          </div>
          {errors.decision !== undefined && <FieldError errors={[errors.decision]} />}
        </Field>

        <Field data-invalid={errors.note !== undefined}>
          <FieldLabel htmlFor="coach-feedback-note">Catatan Koreksi</FieldLabel>
          <Textarea
            id="coach-feedback-note"
            {...register("note")}
            placeholder="Tulis arahan teknis atau instruksi khusus… (misal: kunci ketiak kanan pada saat dorong pukulan lurus)"
            aria-invalid={errors.note !== undefined}
            rows={4}
          />
          {errors.note !== undefined && <FieldError errors={[errors.note]} />}
        </Field>
      </CardContent>

      <CardFooter className="gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onDraft}
          disabled={isSubmitting}
          className="flex-1"
        >
          Simpan Draft
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          <Send data-icon="inline-start" /> Kirim ke Member
        </Button>
      </CardFooter>
    </form>
  );
}
