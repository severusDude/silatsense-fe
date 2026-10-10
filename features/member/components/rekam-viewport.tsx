"use client";

import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImagePlaceholder } from "@/features/member/components/shared/image-placeholder";
import { qualityLabel } from "@/features/member/camera-format";
import type { CameraDevice } from "@/features/member/types";

// TODO: bind timer + Selesai to a recording control when the capture move lands.
// Evaluated candidate (2026-10-10): `react-media-recorder`
// `useReactMediaRecorder({ video: { deviceId }, audio: false, askPermissionOnMount: false,
// onStop: (blobUrl, blob) => hand to sesi store, stopStreamsOnStop: true })` —
// `previewStream` feeds this viewport, `status` drives the timer/REC dot, `mediaBlobUrl`
// feeds sesi playback. Caveats: must live in a dynamically imported (`ssr: false`)
// client island (Worker/Blob SSR crash); pin >=1.7.1 (StrictMode encoder bug on 1.6.6).
// Alternative: hand-rolled native MediaRecorder hook (repo already owns half the probing).

type ProbeStatus = "dummy" | "scanning" | "live" | "denied";

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function formatElapsed(totalSec: number): string {
  const minutes = Math.floor(totalSec / 60).toString().padStart(2, "0");
  const seconds = (totalSec % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function RekamViewport({
  label,
  cameras: fallbackCameras,
  defaultCameraId,
}: {
  label: string;
  cameras: CameraDevice[];
  defaultCameraId: string;
}) {
  const [cameras, setCameras] = useState<CameraDevice[]>(fallbackCameras);
  const [selectedId, setSelectedId] = useState<string>(defaultCameraId);
  const [status, setStatus] = useState<ProbeStatus>("dummy");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [live, setLive] = useState<{
    width: number;
    height: number;
    fps: number;
  } | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.srcObject = stream;
  }, [stream]);

  useEffect(() => {
    // Stub simplification — counts from mount; binds to recorder status when the control lands.
    const timer = window.setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => {
      window.clearInterval(timer);
      stopStream(streamRef.current);
    };
  }, []);

  async function openDevice(deviceId: string): Promise<void> {
    stopStream(streamRef.current);
    const next = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } },
      audio: false,
    });
    const settings = next.getVideoTracks()[0]?.getSettings();
    setStream(next);
    if (settings?.width && settings?.height) {
      setLive({
        width: settings.width,
        height: settings.height,
        fps: settings.frameRate ?? 30,
      });
    } else {
      setLive(null);
    }
  }

  async function handleScan() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      setStatus("denied");
      return;
    }
    setStatus("scanning");
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices.filter((device) => device.kind === "videoinput");
      const found: CameraDevice[] = [];
      let kept: {
        stream: MediaStream;
        width: number;
        height: number;
        fps: number;
      } | null = null;
      let index = 0;
      for (const input of inputs) {
        index += 1;
        try {
          const probe = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: input.deviceId } },
            audio: false,
          });
          const settings = probe.getVideoTracks()[0]?.getSettings();
          // Keep the first probe stream open as the live preview; close the rest.
          if (!kept && settings?.width && settings?.height) {
            kept = {
              stream: probe,
              width: settings.width,
              height: settings.height,
              fps: settings.frameRate ?? 30,
            };
          } else {
            stopStream(probe);
          }
          found.push({
            id: input.deviceId,
            label: input.label || `Kamera ${index}`,
            resolution:
              settings?.width && settings?.height
                ? `${settings.width}×${settings.height}`
                : "—",
            fps: settings?.frameRate ?? 30,
            latencyMs: null,
          });
        } catch {
          // Skip devices that refuse a probe stream; keep the rest.
        }
      }
      if (found.length === 0) {
        setStatus("denied");
        return;
      }
      stopStream(streamRef.current);
      setCameras(found);
      const first = found[0];
      if (first) setSelectedId(first.id);
      if (kept) {
        setStream(kept.stream);
        setLive({ width: kept.width, height: kept.height, fps: kept.fps });
      }
      setStatus("live");
    } catch {
      setStatus("denied");
    }
  }

  async function handleSelect(nextId: string) {
    setSelectedId(nextId);
    // Lazy probe on first explicit interaction — never on mount.
    if (status === "dummy") {
      await handleScan();
      return;
    }
    if (status !== "live") return;
    try {
      await openDevice(nextId);
    } catch {
      setStatus("denied");
    }
  }

  const badge = live
    ? qualityLabel(live.width, live.height, live.fps)
    : null;

  return (
    <section
      aria-label="Rekaman latihan"
      className="grid aspect-[3/4] overflow-hidden rounded-2xl border bg-card shadow-sm"
    >
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          aria-label={`${label} — pratinjau langsung`}
          className="col-start-1 row-start-1 h-full w-full bg-black object-cover"
        />
      ) : (
        <ImagePlaceholder
          label={label}
          className="col-start-1 row-start-1 h-full rounded-none border-0"
        />
      )}
      <div className="col-start-1 row-start-1 flex flex-col justify-between gap-2 p-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-4 shrink-0 rounded-tl-md border-l-2 border-t-2 border-foreground/40"
          />
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
            {badge ?? "Siaga"}
          </Badge>
          <span className="flex-1" />
          <Badge variant="destructive" className="bg-background/80 backdrop-blur-sm">
            <span
              aria-hidden="true"
              className="size-1.5 animate-pulse rounded-full bg-destructive"
            />
            REC {formatElapsed(elapsedSec)}
          </Badge>
          <span
            aria-hidden="true"
            className="size-4 shrink-0 rounded-tr-md border-r-2 border-t-2 border-foreground/40"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          {status === "denied" ? (
            <p
              role="status"
              className="w-fit rounded-md bg-background/80 px-2 py-1 text-[11px] text-muted-foreground backdrop-blur-sm"
            >
              Tidak dapat mengakses kamera — menampilkan daftar contoh.
            </p>
          ) : null}
          <div className="flex items-end gap-2">
            <span
              aria-hidden="true"
              className="size-4 shrink-0 rounded-bl-md border-b-2 border-l-2 border-foreground/40"
            />
            <Select
              items={cameras.map((camera) => ({
                label: camera.label,
                value: camera.id,
              }))}
              value={selectedId}
              onValueChange={(next) => {
                if (typeof next === "string") void handleSelect(next);
              }}
            >
              <SelectTrigger
                aria-label="Pilih kamera"
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
            <span className="flex-1" />
            <span
              aria-hidden="true"
              className="size-4 shrink-0 rounded-br-md border-b-2 border-r-2 border-foreground/40"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
