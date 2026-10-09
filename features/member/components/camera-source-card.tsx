import { Camera, ChevronDown, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function CameraSourceCard() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-1.5 text-xs font-bold tracking-wide">
            <Camera className="size-4" aria-hidden="true" /> PILIH SUMBER KAMERA
          </h2>
          {/* TODO: rescan camera devices when device enumeration lands */}
          <span
            aria-disabled="true"
            className="inline-flex shrink-0 items-center gap-1 rounded-md bg-secondary px-2 py-1 text-[11px] font-semibold text-secondary-foreground"
          >
            <RefreshCw className="size-3" aria-hidden="true" /> Pindai Ulang
          </span>
        </div>
        <span
          aria-disabled="true"
          className="flex items-center justify-between gap-3 rounded-xl border bg-secondary/50 px-3 py-2.5 text-xs font-medium"
        >
          Logitech Brio 4K Ultra HD
          <ChevronDown
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </span>
        <p className="flex items-center gap-1.5 rounded-lg bg-success px-2.5 py-1.5 text-[11px] font-medium text-success-foreground">
          <span
            aria-hidden="true"
            className="size-1.5 shrink-0 rounded-full bg-success-foreground"
          />
          Terhubung (1080p @ 60 FPS) • Latensi Ultra-Rendah 18ms
        </p>
      </CardContent>
    </Card>
  );
}
