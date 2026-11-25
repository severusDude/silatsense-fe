"use client";

import { useRef } from "react";
import { FileVideo, FolderOpen, LoaderCircle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatBytes } from "@/features/member/data/format";
import { videoFileAccept } from "@/features/member/video-file";
import type { RecordedClip } from "@/features/member/types";

export function VideoFileInput({ acceptedMimeTypes, maxBytes, maxDurationSec, disabled, loading, clip, error, onSelect }: {
  acceptedMimeTypes: string[];
  maxBytes: number;
  maxDurationSec: number;
  disabled: boolean;
  loading: boolean;
  clip: RecordedClip | null;
  error: string | null;
  onSelect: (file: File) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const formats = acceptedMimeTypes.map((mime) => mime === "video/quicktime" ? "MOV" : mime.split("/")[1]?.toUpperCase()).join(", ");

  return (
    <Card>
      <CardContent className="flex min-w-0 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex min-w-0 items-center gap-2 text-xs font-bold uppercase">
            <FileVideo className="size-4 shrink-0 text-primary" aria-hidden="true" />
            Video dari perangkat
          </h2>
          {clip ? <Badge variant="outline" className="shrink-0">Siap diunggah</Badge> : null}
        </div>
        {clip ? (
          <>
            <video src={clip.previewUrl} controls playsInline preload="metadata" aria-label="Pratinjau video pilihan"
              className="aspect-video w-full rounded-xl bg-black object-contain" />
            <p className="truncate text-xs font-medium" title={clip.fileName}>{clip.fileName}</p>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-4 py-6 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {loading ? <LoaderCircle className="size-6 animate-spin" aria-hidden="true" /> : <FolderOpen className="size-6" aria-hidden="true" />}
            </span>
            <div className="space-y-1">
              <p className="text-sm font-semibold">Gunakan video latihanmu</p>
              <p className="text-xs leading-relaxed text-muted-foreground">Pilih video yang sudah tersimpan, tanpa menyalakan kamera.</p>
            </div>
            <input ref={input} type="file" accept={videoFileAccept(acceptedMimeTypes)} className="sr-only" tabIndex={-1}
              aria-label="File video latihan" disabled={disabled || loading}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                event.currentTarget.value = "";
                if (file) onSelect(file);
              }} />
            <Button type="button" variant="outline" className="rounded-full bg-background" disabled={disabled || loading}
              onClick={() => input.current?.click()}>
              <FolderOpen data-icon="inline-start" />{loading ? "Membaca video…" : "Pilih File Video"}
            </Button>
            <p className="text-[11px] leading-relaxed text-muted-foreground">{formats} · Maks. {formatBytes(maxBytes)} · {maxDurationSec} detik</p>
          </div>
        )}
        {disabled && !clip ? <p className="text-xs text-muted-foreground">Pilih target gerakan terlebih dahulu untuk memilih video.</p> : null}
        {error && !clip ? <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive">{error}</p> : null}
        <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Video belum dikirim saat dipilih. Tinjau pratinjau, lalu tekan Unggah Video untuk memulai analisis.
        </p>
      </CardContent>
    </Card>
  );
}
