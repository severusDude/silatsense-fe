import { CircleStop, RotateCcw, Upload, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes, formatClock } from "@/features/member/data/format";
import type { RecordedClip, RecorderPhase } from "@/features/member/types";

export function RecordingControls({
  phase,
  countdownRemaining,
  elapsedSec,
  progress,
  error,
  result,
  canStart,
  canUpload,
  maxDurationSec,
  uploadLimitLabel,
  onStart,
  onCancel,
  onStop,
  onDiscard,
  onUpload,
}: {
  phase: RecorderPhase;
  countdownRemaining: number;
  elapsedSec: number;
  progress: number;
  error: string | null;
  result: RecordedClip | null;
  canStart: boolean;
  canUpload: boolean;
  maxDurationSec: number;
  uploadLimitLabel: string;
  onStart: () => void;
  onCancel: () => void;
  onStop: () => void;
  onDiscard: () => void;
  onUpload: () => void;
}) {
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

      {phase === "idle" ? (
        <>
          <Button
            type="button"
            size="lg"
            className="w-full rounded-full"
            onClick={onStart}
            disabled={!canStart}
          >
            <Video data-icon="inline-start" /> Mulai Rekam
          </Button>
          <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
            {canStart
              ? `Rekaman berhenti otomatis di ${formatClock(maxDurationSec)}.`
              : "Pindai dan pilih kamera untuk mengaktifkan tombol rekam."}
          </p>
        </>
      ) : null}

      {phase === "countdown" ? (
        <>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="w-full rounded-full"
            onClick={onCancel}
          >
            Batal
          </Button>
          <p
            role="status"
            className="text-center text-[11px] text-muted-foreground"
          >
            Perekaman dimulai dalam {countdownRemaining} detik.
          </p>
        </>
      ) : null}

      {phase === "recording" ? (
        <>
          <Button
            type="button"
            size="lg"
            variant="destructive"
            className="w-full rounded-full"
            onClick={onStop}
          >
            <CircleStop data-icon="inline-start" /> Selesai
          </Button>
          <p className="text-center text-[11px] tabular-nums text-muted-foreground">
            Merekam {formatClock(elapsedSec)} · berhenti otomatis di{" "}
            {formatClock(maxDurationSec)}.
          </p>
        </>
      ) : null}

      {phase === "recorded" ? (
        <>
          {result ? (
            <p className="rounded-xl bg-secondary/50 p-2.5 text-center text-[11px] text-muted-foreground">
              Durasi {formatClock(result.durationSec)} ·{" "}
              {formatBytes(result.byteSize)} · batas unggahan{" "}
              {uploadLimitLabel}
            </p>
          ) : null}
          <Button
            type="button"
            size="lg"
            className="w-full rounded-full"
            onClick={onUpload}
            disabled={!canUpload}
          >
            <Upload data-icon="inline-start" /> Gunakan Rekaman
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="w-full rounded-full"
            onClick={onDiscard}
          >
            <RotateCcw data-icon="inline-start" /> Rekam Ulang
          </Button>
        </>
      ) : null}

      {phase === "uploading" ? (
        <div className="flex flex-col gap-1.5" role="status">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Mengunggah rekaman…</span>
            <span className="tabular-nums">{progress}%</span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-secondary"
            role="progressbar"
            aria-label="Progres unggahan"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Jangan tutup halaman ini sampai rekaman diterima.
          </p>
        </div>
      ) : null}

      {phase === "failed" ? (
        <>
          <Button
            type="button"
            size="lg"
            className="w-full rounded-full"
            onClick={onUpload}
            disabled={!canUpload}
          >
            <Upload data-icon="inline-start" /> Coba Lagi
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="w-full rounded-full"
            onClick={onDiscard}
          >
            <RotateCcw data-icon="inline-start" /> Rekam Ulang
          </Button>
        </>
      ) : null}
    </div>
  );
}
