import { CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SessionDetailViewModel } from "@/features/member/types";

export function SessionKelayakanCard({
  session,
}: {
  session: SessionDetailViewModel;
}) {
  const scoreValue = session.score.value;
  const scoreFormatted =
    scoreValue !== null ? `${Math.round(scoreValue)} poin` : "Belum dinilai";

  return (
    <section aria-label="Ringkasan evaluasi sesi" className="flex flex-col gap-2">
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Evaluasi Kinematika</CardTitle>
          <CardDescription>Skor kemiripan berbasis analisis MediaPipe</CardDescription>
          <CardAction>
            <Badge variant="outline">Telemetri AI</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {/* Active Score Summary Box */}
          <div className="flex items-center justify-between gap-2 rounded-xl bg-secondary/50 p-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Skor Kemiripan Sesi
              </span>
              <span className="text-xl font-bold text-foreground">
                {scoreFormatted}
              </span>
              <span className="text-[10px] text-muted-foreground">
                Skala 0–100 poin terhadap referensi jurus
              </span>
            </div>
            {session.score.analysisStatusLabel ? (
              <Badge variant="outline">
                {session.score.analysisStatusLabel}
              </Badge>
            ) : null}
          </div>

          {/* Status Kelayakan Tanding / IPSI (Unsupported / Inactive Block) */}
          <div className="flex flex-col gap-2 rounded-xl border p-3 opacity-60 bg-muted/20 border-dashed border-border/80">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-xs font-bold text-muted-foreground">
                Status Kelayakan Tanding / IPSI
              </span>
              <Badge variant="outline">Segera hadir</Badge>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Ambang batas kelulusan tanding dan klasifikasi IPSI belum terhubung pada modul ini.
            </p>
          </div>

          {/* Jadwal Uji Ulang (Unsupported / Inactive Block) */}
          <div className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2 opacity-60 bg-muted/20 border-dashed border-border/80">
            <span className="text-[11px] text-muted-foreground">
              {session.retestSchedule.label}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <CalendarDays aria-hidden="true" className="size-3.5 shrink-0" />
              <Badge variant="outline">Segera hadir</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
