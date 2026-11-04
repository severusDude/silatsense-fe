"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, RefreshCw } from "lucide-react";
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
import { qualityLabel } from "@/features/member/camera-format";
import { formatClock } from "@/features/member/data/format";
import type { CameraDevice, RekamViewModel } from "@/features/member/types";

// TODO: bind countdown, recording, and auto-stop to a MediaRecorder control in
// the recorder move. Camera probing stays on this client island.
type ProbeStatus = "idle" | "scanning" | "live" | "denied";

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function RekamViewport({ detail }: { detail: RekamViewModel }) {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [status, setStatus] = useState<ProbeStatus>("idle");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [live, setLive] = useState<{
    width: number;
    height: number;
    fps: number;
  } | null>(null);
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
    return () => {
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
      let index = 0;
      for (const input of inputs) {
        index += 1;
        try {
          const probe = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: input.deviceId } },
            audio: false,
          });
          const settings = probe.getVideoTracks()[0]?.getSettings();
          stopStream(probe);
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
      const first = found[0];
      setCameras(found);
      if (!first) {
        setStatus("denied");
        return;
      }
      setSelectedId(first.id);
      await openDevice(first.id);
      setStatus("live");
    } catch {
      setStatus("denied");
    }
  }

  async function handleSelect(nextId: string) {
    setSelectedId(nextId);
    if (status !== "live") return;
    try {
      await openDevice(nextId);
    } catch {
      setStatus("denied");
    }
  }

  const badge = live ? qualityLabel(live.width, live.height, live.fps) : null;

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
          aria-label={`${detail.trainingName} — pratinjau langsung`}
          className="col-start-1 row-start-1 h-full w-full bg-black object-cover"
        />
      ) : (
        <ImagePlaceholder
          label={detail.trainingName}
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
          <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
            Target {formatClock(detail.targetDurationSec)} · Maks{" "}
            {formatClock(detail.maxDurationSec)}
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
              Tidak dapat mengakses kamera. Periksa izin browser lalu pindai
              ulang.
            </p>
          ) : null}
          <div className="flex items-end gap-2">
            <span
              aria-hidden="true"
              className="size-4 shrink-0 rounded-bl-md border-b-2 border-l-2 border-foreground/40"
            />
            {cameras.length > 0 ? (
              <>
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
                <button
                  type="button"
                  onClick={handleScan}
                  disabled={status === "scanning"}
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
            ) : (
              <button
                type="button"
                onClick={handleScan}
                disabled={status === "scanning"}
                className={buttonVariants({
                  variant: "secondary",
                  size: "xs",
                  className: "bg-background/80 backdrop-blur-sm",
                })}
              >
                <RefreshCw className="size-3" aria-hidden="true" />
                {status === "scanning" ? "Memindai…" : "Pindai Kamera"}
              </button>
            )}
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
