"use client";

import { useState } from "react";
import { Camera, Loader2, RefreshCw } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CameraDevice } from "@/features/member/types";

type ScanStatus = "dummy" | "scanning" | "live" | "denied";

/** Probe attached cameras for real labels + settings. Tracks stop immediately; no preview. */
async function discoverCameras(): Promise<CameraDevice[]> {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const inputs = devices.filter((device) => device.kind === "videoinput");
  const found: CameraDevice[] = [];
  let index = 0;
  for (const input of inputs) {
    index += 1;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: input.deviceId } },
        audio: false,
      });
      const settings = stream.getVideoTracks()[0]?.getSettings();
      stream.getTracks().forEach((track) => track.stop());
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
  return found;
}

export function CameraSourceCard({
  cameras: fallbackCameras,
  defaultCameraId,
}: {
  cameras: CameraDevice[];
  defaultCameraId: string;
}) {
  const [cameras, setCameras] = useState<CameraDevice[]>(fallbackCameras);
  const [selectedId, setSelectedId] = useState<string>(defaultCameraId);
  const [status, setStatus] = useState<ScanStatus>("dummy");

  const selected = cameras.find((camera) => camera.id === selectedId);

  async function handleScan() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      setStatus("denied");
      return;
    }
    setStatus("scanning");
    try {
      const found = await discoverCameras();
      if (found.length === 0) {
        setStatus("denied");
        return;
      }
      setCameras(found);
      const first = found[0];
      if (first) setSelectedId(first.id);
      setStatus("live");
    } catch {
      setStatus("denied");
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-1.5 text-xs font-bold tracking-wide">
            <Camera className="size-4" aria-hidden="true" /> PILIH SUMBER KAMERA
          </h2>
          <button
            type="button"
            onClick={handleScan}
            disabled={status === "scanning"}
            className={buttonVariants({ variant: "secondary", size: "xs" })}
          >
            {status === "scanning" ? (
              <Loader2 className="size-3 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="size-3" aria-hidden="true" />
            )}
            {status === "scanning" ? "Memindai…" : "Pindai Ulang"}
          </button>
        </div>
        <Select
          items={cameras.map((camera) => ({
            label: camera.label,
            value: camera.id,
          }))}
          value={selectedId}
          onValueChange={(next) => {
            if (typeof next === "string") setSelectedId(next);
          }}
        >
          <SelectTrigger className="w-full" aria-label="Sumber kamera">
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
        {status === "dummy" ? (
          <p className="text-[11px] text-muted-foreground">
            Daftar contoh — ketuk Pindai Ulang untuk memindai kamera perangkat
            ini.
          </p>
        ) : null}
        {status === "denied" ? (
          <p role="status" className="text-[11px] text-muted-foreground">
            Tidak dapat mengakses kamera — menampilkan daftar contoh.
          </p>
        ) : null}
        {selected ? (
          <dl className="grid grid-cols-3 gap-2 rounded-xl bg-success p-2.5">
            <div className="flex flex-col items-center gap-0.5">
              <dt className="text-[10px] font-semibold tracking-wide text-success-foreground/80">
                RESOLUSI
              </dt>
              <dd className="text-sm font-bold text-success-foreground">
                {selected.resolution}
              </dd>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <dt className="text-[10px] font-semibold tracking-wide text-success-foreground/80">
                FPS
              </dt>
              <dd className="text-sm font-bold text-success-foreground">
                {selected.fps}
              </dd>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <dt className="text-[10px] font-semibold tracking-wide text-success-foreground/80">
                LATENSI
              </dt>
              <dd className="text-sm font-bold text-success-foreground">
                {selected.latencyMs === null ? "—" : `${selected.latencyMs} ms`}
              </dd>
            </div>
          </dl>
        ) : null}
      </CardContent>
    </Card>
  );
}
