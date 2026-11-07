"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ClipboardCheck, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { acknowledgeSessionAction } from "@/features/member/actions/acknowledge-session";
import { formatDateTimeId } from "@/features/member/data/format";
import type { EvaluationViewModel } from "@/features/member/types";

export function EvaluasiActions({
  evaluation,
}: {
  evaluation: EvaluationViewModel;
}) {
  const router = useRouter();
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const acknowledged = evaluation.acknowledged || savedAt !== null;
  const acknowledgedLabel =
    evaluation.acknowledgedAtLabel !== "—"
      ? evaluation.acknowledgedAtLabel
      : savedAt;

  const acknowledgeMutation = useMutation({
    mutationFn: () =>
      acknowledgeSessionAction({ sessionId: evaluation.sessionId }),
    onSuccess: (result) => {
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setSavedAt(formatDateTimeId(result.data.acknowledgedAt));
      toast.success("Evaluasi ditandai selesai.");
      router.refresh();
    },
    onError: () => {
      setError("Gagal menyimpan. Coba lagi.");
    },
  });

  return (
    <section aria-label="Tindak lanjut evaluasi" className="flex flex-col gap-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold">
            Siap Memperbaiki Gerakan?
          </CardTitle>
          <CardDescription>
            Rekam ulang gerakan yang sama untuk membandingkan skor kemiripan
            berikutnya.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex-col items-stretch gap-2">
          {error ? (
            <p role="alert" className="text-[11px] leading-relaxed text-destructive">
              {error}
            </p>
          ) : null}

          {acknowledged ? (
            <p
              role="status"
              className="rounded-xl bg-secondary/50 p-3 text-center text-[11px] leading-relaxed text-muted-foreground"
            >
              Evaluasi sudah ditandai selesai
              {acknowledgedLabel ? ` pada ${acknowledgedLabel}` : ""}.
            </p>
          ) : (
            <Button
              type="button"
              size="lg"
              className="w-full rounded-full"
              disabled={acknowledgeMutation.isPending}
              onClick={() => {
                setError(null);
                acknowledgeMutation.mutate();
              }}
            >
              <ClipboardCheck data-icon="inline-start" />
              {acknowledgeMutation.isPending
                ? "Menyimpan…"
                : "Selesai dan Simpan"}
            </Button>
          )}

          <Link
            href={`/latihan/${evaluation.slug}/rekam`}
            className={buttonVariants({
              size: "lg",
              className: "w-full rounded-full",
            })}
          >
            <RotateCcw data-icon="inline-start" /> Latihan Ulang
          </Link>
          <Link
            href={`/latihan/${evaluation.slug}/sesi/${evaluation.sessionId}`}
            className={buttonVariants({
              variant: "outline",
              size: "lg",
              className: "w-full rounded-full",
            })}
          >
            <ArrowLeft data-icon="inline-start" /> Kembali ke Sesi
          </Link>
        </CardFooter>
      </Card>
    </section>
  );
}
