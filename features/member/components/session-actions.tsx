"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ClipboardCheck, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteSessionAction } from "@/features/member/actions/delete-session";
import { retrySessionAction } from "@/features/member/actions/retry-session";
import { retryRecordingHref } from "@/features/member/retry";
import type { SessionViewModel } from "@/features/member/types";

export function SessionActions({ session }: { session: SessionViewModel }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const retryKeyRef = useRef<string | null>(null);

  const processing =
    session.processingStatus === "queued" ||
    session.processingStatus === "processing";

  function nextRetryKey(): string {
    if (!retryKeyRef.current) {
      retryKeyRef.current = crypto.randomUUID();
    }
    return retryKeyRef.current;
  }

  const deleteMutation = useMutation({
    mutationFn: () => deleteSessionAction({ sessionId: session.id }),
    onSuccess: (result) => {
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setConfirmOpen(false);
      toast.success("Sesi dihapus.");
      router.replace(`/latihan/${session.slug}`);
      router.refresh();
    },
    onError: () => {
      setError("Gagal menghapus sesi. Coba lagi.");
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
    <div className="flex flex-col gap-2.5">
      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-[11px] leading-relaxed text-destructive"
        >
          {error}
        </p>
      ) : null}

      {session.canViewEvaluation ? (
        <Link
          href={`/latihan/${session.slug}/evaluasi/${session.id}`}
          className={buttonVariants({
            size: "lg",
            className: "w-full rounded-full",
          })}
        >
          <ClipboardCheck data-icon="inline-start" /> Lihat Evaluasi
        </Link>
      ) : null}

      {processing ? (
        <p className="rounded-xl bg-secondary/50 p-3 text-center text-[11px] leading-relaxed text-muted-foreground">
          Analisis sedang berjalan. Halaman ini diperbarui otomatis saat hasilnya
          siap.
        </p>
      ) : null}

      {session.acknowledged ? (
        <p
          role="status"
          className="rounded-xl bg-secondary/50 p-3 text-center text-[11px] leading-relaxed text-muted-foreground"
        >
          Evaluasi sudah ditandai selesai
          {session.acknowledgedAtLabel !== "—"
            ? ` pada ${session.acknowledgedAtLabel}`
            : ""}
          .
        </p>
      ) : null}

      {session.canRetryAnalysis ? (
        <Button
          type="button"
          size="lg"
          className="w-full rounded-full"
          disabled={retryMutation.isPending}
          onClick={() => {
            setError(null);
            retryMutation.mutate();
          }}
        >
          <RotateCcw data-icon="inline-start" />
          {retryMutation.isPending ? "Menyiapkan…" : "Rekam Ulang"}
        </Button>
      ) : (
        <Link
          href={`/latihan/${session.slug}/rekam`}
          className={buttonVariants({
            variant: "outline",
            size: "lg",
            className: "w-full rounded-full",
          })}
        >
          <RotateCcw data-icon="inline-start" /> Latihan Ulang
        </Link>
      )}

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full rounded-full text-destructive"
        onClick={() => {
          setError(null);
          setConfirmOpen(true);
        }}
      >
        <Trash2 data-icon="inline-start" /> Hapus Sesi
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus sesi ini?</DialogTitle>
            <DialogDescription>
              Rekaman dan evaluasi sesi ini akan dihapus permanen. Tindakan ini
              tidak bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={deleteMutation.isPending}
              onClick={() => setConfirmOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                setError(null);
                deleteMutation.mutate();
              }}
            >
              {deleteMutation.isPending ? "Menghapus…" : "Hapus Sesi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
