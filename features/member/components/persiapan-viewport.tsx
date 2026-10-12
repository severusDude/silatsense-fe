"use client";

import { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { ImagePlaceholder } from "@/features/member/components/shared/image-placeholder";

export function PersiapanViewport({
  label,
  stream,
  qualityBadge,
}: {
  label: string;
  stream: MediaStream | null;
  qualityBadge: string | null;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.srcObject = stream;
  }, [stream]);

  return (
    <section
      aria-label="Pratinjau kamera"
      className="grid overflow-hidden rounded-2xl border bg-card shadow-sm"
    >
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          aria-label={`${label} — pratinjau langsung`}
          className="col-start-1 row-start-1 aspect-video w-full bg-black object-cover"
        />
      ) : (
        <ImagePlaceholder
          label={label}
          className="col-start-1 row-start-1 rounded-none border-0"
        />
      )}
      <div className="col-start-1 row-start-1 flex flex-col justify-between gap-2 p-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-4 shrink-0 rounded-tl-md border-l-2 border-t-2 border-foreground/40"
          />
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
            {qualityBadge ?? "Siaga"}
          </Badge>
          <span className="flex-1" />
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
