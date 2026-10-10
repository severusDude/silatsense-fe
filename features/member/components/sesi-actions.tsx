"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { RotateCcw, TriangleAlert, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import type { SesiUploadState } from "@/features/member/types";

export function SesiActions({ slug }: { slug: string }) {
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

  return (
    <div className="flex flex-col gap-2.5">
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

      {status !== "idle" ? (
        <div className="flex flex-col gap-2 rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold">
              {status === "success"
                ? "Unggahan selesai"
                : status === "failed"
                  ? "Unggahan gagal"
                  : "Mengunggah rekaman"}
            </p>
            <p className="text-xs font-bold tabular-nums">{progress}%</p>
          </div>
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Kemajuan unggahan"
            className="flex h-2 w-full overflow-hidden rounded-full bg-secondary"
          >
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${progress}%` }}
            />
          </div>

          {status === "failed" ? (
            <div className="flex flex-col gap-2">
              <p className="flex items-center gap-2 text-xs font-medium text-destructive">
                <TriangleAlert className="size-4" aria-hidden="true" />
                Unggah gagal — Coba lagi
              </p>
              <Button
                type="button"
                size="lg"
                onClick={() => runAttempt(true)}
                className="w-full rounded-full"
              >
                Coba lagi
              </Button>
            </div>
          ) : null}

          {status === "success" ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="success">Terunggah</Badge>
              </div>
              {/* TODO → /evaluasi when the results route lands */}
              <span
                aria-disabled="true"
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                  className: "w-full rounded-full opacity-60",
                })}
              >
                Lihat Evaluasi
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      <Link
        href={`/latihan/${slug}/rekam`}
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
