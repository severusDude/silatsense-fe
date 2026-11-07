"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { acknowledgeSessionAction } from "@/features/member/actions/acknowledge-session";
import { retrySessionAction } from "@/features/member/actions/retry-session";
import { formatDateTimeId } from "@/features/member/data/format";
import { retryRecordingHref } from "@/features/member/retry";
import type { SessionDetailViewModel } from "@/features/member/types";

export function SessionDetailActions({
  session,
}: {
  session: SessionDetailViewModel;
}) {
  const router = useRouter();
  const [acknowledgedAt, setAcknowledgedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const retryKeyRef = useRef<string | null>(null);

  const isAcknowledged = session.session.acknowledged || acknowledgedAt !== null;
  const acknowledgedLabel =
    session.session.acknowledgedAtLabel !== "—"
      ? session.session.acknowledgedAtLabel
      : acknowledgedAt;

  function nextRetryKey(): string {
    if (!retryKeyRef.current) {
      retryKeyRef.current = crypto.randomUUID();
    }
    return retryKeyRef.current;
  }

  const acknowledgeMutation = useMutation({
    mutationFn: () =>
      acknowledgeSessionAction({ sessionId: session.id }),
    onSuccess: (result) => {
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setAcknowledgedAt(formatDateTimeId(result.data.acknowledgedAt));
      toast.success("Arahan pelatih ditandai telah dibaca.");
      router.refresh();
    },
    onError: () => {
      setError("Gagal mengonfirmasi arahan pelatih. Coba lagi.");
    },
  });

  const retryMutation = useMutation({
    mutationFn: () =>
      retrySessionAction({
        sessionId: session.id,
        idempotencyKey: nextRetryKey(),
      }),
    onSuccess: (result) => {
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      toast.success("Siap merekam ulang.");
      router.push(retryRecordingHref(session.slug, result.data));
    },
    onError: () => {
      setError("Gagal menyiapkan rekaman ulang. Coba lagi.");
    },
  });

  return (
    <section aria-label="Tindak lanjut evaluasi pelatih" className="flex flex-col gap-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold">
            Siap Melakukan Latihan Ulang?
          </CardTitle>
          <CardDescription>
            Konfirmasi telah membaca arahan, lalu mulai rekam ulang jurus untuk perbaikan.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex-col items-stretch gap-2">
          {error ? (
            <p role="alert" className="text-[11px] leading-relaxed text-destructive">
              {error}
            </p>
          ) : null}

          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={isAcknowledged || acknowledgeMutation.isPending}
            onClick={() => acknowledgeMutation.mutate()}
            className="w-full rounded-full"
          >
            <CheckCheck data-icon="inline-start" />
            {isAcknowledged
              ? `Telah Dikonfirmasi${acknowledgedLabel ? ` • ${acknowledgedLabel}` : ""}`
              : "Konfirmasi Telah Membaca"}
          </Button>

          <Button
            type="button"
            size="lg"
            disabled={retryMutation.isPending}
            onClick={() => retryMutation.mutate()}
            className="w-full rounded-full"
          >
            Mulai Latihan Ulang {session.techniqueName}
            <ArrowRight data-icon="inline-end" />
          </Button>
        </CardFooter>
      </Card>
    </section>
  );
}
