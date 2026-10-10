"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FileVideo, RotateCcw, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Attachment,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import { Button, buttonVariants } from "@/components/ui/button";
import type {
  SesiUploadState,
  TrainingSession,
} from "@/features/member/types";

export function SesiActions({ session }: { session: TrainingSession }) {
  const [status, setStatus] = useState<SesiUploadState>("idle");
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  function clearTimer() {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function runAttempt(isRetry: boolean) {
    clearTimer();
    setStatus("uploading");
    setProgress(0);
    // TODO: replace simulated timer with XHR upload via lib/api-client.ts (POST /member/sessions) reporting real progress
    let current = 0;
    timerRef.current = window.setInterval(() => {
      current += 8;
      if (!isRetry && current >= 72) {
        current = 72;
        setProgress(current);
        clearTimer();
        setStatus("failed");
        toast.error("Unggah gagal — coba lagi");
        return;
      }
      if (current >= 100) {
        current = 100;
        setProgress(current);
        clearTimer();
        setStatus("success");
        toast.success("Rekaman terunggah");
        return;
      }
      setProgress(current);
    }, 120);
  }

  const uploading = status === "uploading";
  const attachmentState =
    status === "uploading"
      ? "uploading"
      : status === "failed"
        ? "error"
        : status === "success"
          ? "done"
          : "idle";
  const fileName = `${session.slug}.mp4`;
  const description =
    status === "uploading"
      ? `Mengunggah… ${progress}%`
      : status === "failed"
        ? "Unggah gagal — coba lagi"
        : status === "success"
          ? `MP4 · ${session.fileSizeLabel} · Terunggah`
          : `MP4 · ${session.fileSizeLabel} · Siap diunggah`;

  return (
    <div className="flex flex-col gap-2.5">
      <Attachment state={attachmentState} className="w-full">
        <AttachmentMedia>
          <FileVideo className="size-5" aria-hidden="true" />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>{fileName}</AttachmentTitle>
          <AttachmentDescription>{description}</AttachmentDescription>
        </AttachmentContent>
        {status === "success" ? (
          <AttachmentActions>
            <Badge variant="success">Terunggah</Badge>
          </AttachmentActions>
        ) : null}
        {status === "uploading" ? (
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Kemajuan unggahan"
            className="flex h-1.5 w-full basis-full overflow-hidden rounded-full bg-secondary"
          >
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : null}
      </Attachment>

      {status === "idle" ? (
        <Button
          type="button"
          variant="destructive"
          size="lg"
          onClick={() => runAttempt(false)}
          className="w-full rounded-full"
        >
          <Upload data-icon="inline-start" /> Unggah Rekaman
        </Button>
      ) : null}

      {status === "failed" ? (
        <Button
          type="button"
          size="lg"
          onClick={() => runAttempt(true)}
          className="w-full rounded-full"
        >
          Coba lagi
        </Button>
      ) : null}

      {status === "success" ? (
        /* TODO → /evaluasi when the results route lands */
        <span
          aria-disabled="true"
          className={buttonVariants({ size: "lg", className: "w-full rounded-full" })}
        >
          Lihat Evaluasi
        </span>
      ) : null}

      <Link
        href={`/latihan/${session.slug}/rekam`}
        aria-disabled={uploading}
        onClick={(event) => {
          if (uploading) event.preventDefault();
        }}
        className={buttonVariants({
          variant: "outline",
          size: "lg",
          className: "w-full rounded-full text-destructive",
        })}
      >
        <RotateCcw data-icon="inline-start" /> Hapus & Latihan Ulang
      </Link>
    </div>
  );
}
