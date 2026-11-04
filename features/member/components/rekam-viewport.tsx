"use client";

import { useEffect, useRef } from "react";
import { Camera, RefreshCw, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImagePlaceholder } from "@/features/member/components/shared/image-placeholder";
import { formatClock } from "@/features/member/data/format";
import type {
  CameraDevice,
  CameraStatus,
  RecorderPhase,
} from "@/features/member/types";

export function RekamViewport({
  trainingName,
  targetDurationSec,
  maxDurationSec,
  stream,
  previewUrl,
  qualityBadge,
  phase,
  countdownRemaining,
  elapsedSec,
  cameras,
  selectedCameraId,
  cameraStatus,
  cameraError,
  onSelectCamera,
  onScanCamera,
}: {
  trainingName: string;
  targetDurationSec: number;
  maxDurationSec: number;
  stream: MediaStream | null;
  previewUrl: string | null;
  qualityBadge: string | null;
  phase: RecorderPhase;
  countdownRemaining: number;
  elapsedSec: number;
  cameras: CameraDevice[];
  selectedCameraId: string;
  cameraStatus: CameraStatus;
  cameraError: string | null;
  onSelectCamera: (deviceId: string) => void;
  onScanCamera: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recording = phase === "recording";
  const busy =
    recording || phase === "countdown" || phase === "uploading";
  const scanning = cameraStatus === "scanning";

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // The live and preview branches share one DOM node, so a stale srcObject
    // would keep playing the stopped stream instead of the recorded blob.
    video.srcObject = previewUrl ? null : stream;
  }, [previewUrl, stream]);

  return (
    <section
      aria-label="Rekaman latihan"
      className="grid aspect-[3/4] overflow-hidden rounded-2xl border bg-card shadow-sm"
    >
      {previewUrl ? (
        <video
          ref={videoRef}
          src={previewUrl}
          controls
          playsInline
          aria-label={`${trainingName} — pratinjau rekaman`}
          className="col-start-1 row-start-1 h-full w-full bg-black object-cover"
        />
      ) : stream ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          aria-label={`${trainingName} — pratinjau langsung`}
          className="col-start-1 row-start-1 h-full w-full bg-black object-cover"
        />
      ) : (
        <ImagePlaceholder
          label={trainingName}
          className="col-start-1 row-start-1 h-full rounded-none border-0"
        />
      )}

      <div className="pointer-events-none col-start-1 row-start-1 z-10 flex flex-col justify-between gap-2 p-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-4 shrink-0 rounded-tl-md border-l-2 border-t-2 border-foreground/40"
          />
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
            {recording ? (
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="size-1.5 animate-pulse rounded-full bg-destructive motion-reduce:animate-none"
                />
                REC
              </span>
            ) : (
              (qualityBadge ?? "Siaga")
            )}
          </Badge>
          {recording ? (
            <Badge
              variant="outline"
              className="gap-1 bg-background/80 tabular-nums backdrop-blur-sm"
            >
              <Timer aria-hidden="true" />
              {formatClock(elapsedSec)}
            </Badge>
          ) : (
            <span className="flex-1" />
          )}
          {recording ? (
            <span className="flex-1" />
          ) : (
            <Badge
              variant="outline"
              className="bg-background/80 backdrop-blur-sm"
            >
              Target {formatClock(targetDurationSec)} · Maks{" "}
              {formatClock(maxDurationSec)}
            </Badge>
          )}
          <span
            aria-hidden="true"
            className="size-4 shrink-0 rounded-tr-md border-r-2 border-t-2 border-foreground/40"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          {cameraError ? (
            <p
              role="status"
              className="w-fit max-w-full rounded-md bg-background/80 px-2 py-1 text-[11px] text-muted-foreground backdrop-blur-sm"
            >
              {cameraError}
            </p>
          ) : null}

          {previewUrl ? (
            <Badge variant="success" className="w-fit">
              Rekaman siap
            </Badge>
          ) : null}

          <div
            className={
              previewUrl
                ? "flex items-end gap-2"
                : "pointer-events-auto flex items-end gap-2"
            }
          >
            <span
              aria-hidden="true"
              className="size-4 shrink-0 rounded-bl-md border-b-2 border-l-2 border-foreground/40"
            />
            {!previewUrl && cameras.length > 0 ? (
              <>
                <Select
                  items={cameras.map((camera) => ({
                    label: camera.label,
                    value: camera.id,
                  }))}
                  value={selectedCameraId}
                  onValueChange={(next) => {
                    if (typeof next === "string") onSelectCamera(next);
                  }}
                >
                  <SelectTrigger
                    aria-label="Pilih kamera"
                    disabled={busy || scanning}
                    className="h-7 border-0 bg-background/80 text-xs backdrop-blur-sm"
                  >
                    <Camera className="size-3.5" aria-hidden="true" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {cameras.map((camera) => (
                        <SelectItem key={camera.id} value={camera.id}>
                          {camera.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  onClick={onScanCamera}
                  disabled={busy || scanning}
                  aria-label="Pindai ulang kamera"
                  className={buttonVariants({
                    variant: "secondary",
                    size: "icon-xs",
                    className: "bg-background/80 backdrop-blur-sm",
                  })}
                >
                  <RefreshCw className="size-3.5" aria-hidden="true" />
                </button>
              </>
            ) : null}

            {!previewUrl && cameras.length === 0 ? (
              <button
                type="button"
                onClick={onScanCamera}
                disabled={busy || scanning}
                className={buttonVariants({
                  variant: "secondary",
                  size: "xs",
                  className: "bg-background/80 backdrop-blur-sm",
                })}
              >
                <RefreshCw className="size-3" aria-hidden="true" />
                {scanning ? "Memindai…" : "Pindai Kamera"}
              </button>
            ) : null}

            <span className="flex-1" />
            <span
              aria-hidden="true"
              className="size-4 shrink-0 rounded-br-md border-b-2 border-r-2 border-foreground/40"
            />
          </div>
        </div>
      </div>

      {phase === "countdown" ? (
        <div
          role="status"
          aria-live="assertive"
          className="col-start-1 row-start-1 z-20 grid place-items-center bg-foreground/50 backdrop-blur-[2px]"
        >
          <div className="flex flex-col items-center gap-2 text-background">
            <span className="text-6xl font-black tabular-nums">
              {countdownRemaining}
            </span>
            <span className="text-xs font-bold tracking-wide">
              Bersiap merekam…
            </span>
          </div>
        </div>
      ) : null}
    </section>
  );
}
