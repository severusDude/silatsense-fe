"use client";

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
import { formatFps } from "@/features/member/camera-format";
import type { CameraDevice, CameraStatus } from "@/features/member/types";

export function CameraSourceCard({
  cameras,
  selectedId,
  onSelect,
  status,
  error,
  onScan,
}: {
  cameras: CameraDevice[];
  selectedId: string;
  onSelect: (id: string) => void;
  status: CameraStatus;
  error?: string | null;
  onScan: () => void;
}) {
  const selected = cameras.find((camera) => camera.id === selectedId);

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-1.5 text-xs font-bold tracking-wide">
            <Camera className="size-4" aria-hidden="true" /> PILIH SUMBER KAMERA
          </h2>
          <button
            type="button"
            onClick={onScan}
            disabled={status === "scanning"}
            className={buttonVariants({ variant: "secondary", size: "xs" })}
          >
            {status === "scanning" ? (
              <Loader2 className="size-3 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="size-3" aria-hidden="true" />
            )}
            {status === "scanning"
              ? "Memindai…"
              : status === "idle"
                ? "Pindai Kamera"
                : "Pindai Ulang"}
          </button>
        </div>

        {cameras.length > 0 ? (
          <Select
            items={cameras.map((camera) => ({
              label: camera.label,
              value: camera.id,
            }))}
            value={selectedId}
            onValueChange={(next) => {
              if (typeof next === "string") onSelect(next);
            }}
          >
            <SelectTrigger
              className="w-full"
              aria-label="Sumber kamera"
              disabled={status === "scanning"}
            >
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
        ) : (
          <p className="rounded-xl border border-dashed px-3 py-2 text-[11px] text-muted-foreground">
            {status === "scanning"
              ? "Memindai kamera perangkat…"
              : "Belum ada kamera terdeteksi."}
          </p>
        )}

        {status === "idle" ? (
          <p className="text-[11px] text-muted-foreground">
            Ketuk Pindai Kamera untuk membaca kamera perangkat ini.
          </p>
        ) : null}
        {error ? (
          <p role="status" className="text-[11px] text-muted-foreground">
            {error}
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
                {formatFps(selected.fps)}
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
