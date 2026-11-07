import { VideoOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionMediaStatus } from "@/features/member/types";

const COPY: Record<
  Exclude<SessionMediaStatus, "available">,
  { title: string; body: string }
> = {
  expired: {
    title: "Rekaman kedaluwarsa",
    body: "Rekaman hanya tersedia 24 jam setelah diunggah.",
  },
  deleted: {
    title: "Rekaman sudah dihapus",
    body: "Sesi tetap tersimpan, tetapi berkas videonya sudah dihapus.",
  },
  unavailable: {
    title: "Rekaman tidak tersedia",
    body: "Berkas video belum tersedia atau masih diproses.",
  },
};

export function MediaUnavailable({
  status,
  expiresAtLabel,
  className,
}: {
  status: Exclude<SessionMediaStatus, "available">;
  expiresAtLabel?: string;
  className?: string;
}) {
  const copy = COPY[status];

  return (
    <div
      role="img"
      aria-label={`${copy.title}. ${copy.body}`}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-secondary/40 p-6 text-center",
        className,
      )}
    >
      <VideoOff aria-hidden="true" className="size-8 text-muted-foreground" />
      <p className="text-sm font-bold text-foreground">{copy.title}</p>
      <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
        {copy.body}
      </p>
      {status === "expired" && expiresAtLabel && expiresAtLabel !== "—" ? (
        <p className="text-[10px] text-muted-foreground">
          Kedaluwarsa: {expiresAtLabel}
        </p>
      ) : null}
    </div>
  );
}
