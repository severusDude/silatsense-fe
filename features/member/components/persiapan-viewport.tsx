import { SwitchCamera } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ImagePlaceholder } from "@/features/member/components/shared/image-placeholder";

export function PersiapanViewport({ label }: { label: string }) {
  return (
    <section
      aria-label="Pratinjau kamera"
      className="grid overflow-hidden rounded-2xl border bg-card shadow-sm"
    >
      <ImagePlaceholder
        label={label}
        className="col-start-1 row-start-1 rounded-none border-0"
      />
      <div className="col-start-1 row-start-1 flex flex-col justify-between gap-2 p-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-4 shrink-0 rounded-tl-md border-l-2 border-t-2 border-foreground/40"
          />
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
            1080p @ 60 FPS
          </Badge>
          <span className="flex-1" />
          {/* TODO: switch camera source when device enumeration lands */}
          <span
            aria-disabled="true"
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-background/80 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm"
          >
            <SwitchCamera className="size-3" aria-hidden="true" /> Ganti
          </span>
          <span
            aria-hidden="true"
            className="size-4 shrink-0 rounded-tr-md border-r-2 border-t-2 border-foreground/40"
          />
        </div>
        <div className="flex items-end gap-2">
          <span
            aria-hidden="true"
            className="size-4 shrink-0 rounded-bl-md border-b-2 border-l-2 border-foreground/40"
          />
          <Badge variant="success">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-success-foreground"
            />
            Pesilat Terdeteksi
          </Badge>
          <span className="flex-1" />
          <span
            aria-hidden="true"
            className="size-4 shrink-0 rounded-br-md border-b-2 border-r-2 border-foreground/40"
          />
        </div>
      </div>
    </section>
  );
}
