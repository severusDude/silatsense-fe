import { MapPin } from "lucide-react";

export function RiwayatCoachNote({ note }: { note: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border bg-card p-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-destructive/10">
        <MapPin aria-hidden="true" className="size-3 text-destructive" />
      </span>
      <p className="text-[11px] leading-relaxed text-foreground">
        <span className="font-bold text-destructive">Catatan Pelatih: </span>
        <span className="font-medium">{note}</span>
      </p>
    </div>
  );
}
