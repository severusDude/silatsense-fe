import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { HistorySummaryViewModel } from "@/features/member/types";

export function RiwayatStatGrid({ summary }: { summary: HistorySummaryViewModel }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {/* 1. Total Sesi */}
      <Card>
        <CardContent className="flex flex-col gap-1 p-3">
          <p className="text-[11px] font-medium text-muted-foreground">Total Sesi</p>
          <p className="text-lg font-bold text-foreground">{summary.totalSessionsLabel}</p>
          <div className="flex items-center gap-1.5 opacity-60">
            <Badge variant="outline" className="text-[9px] font-medium">
              Segera hadir
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 2. Rata-rata Akurasi (Unsupported / Inactive) */}
      <Card className="opacity-60 bg-muted/20 border-dashed border-border/80">
        <CardContent className="flex flex-col gap-1 p-3">
          <div className="flex items-center justify-between gap-1">
            <p className="text-[11px] font-medium text-muted-foreground">Rata-rata Akurasi</p>
            <Badge variant="outline" className="text-[9px] font-medium">
              Segera hadir
            </Badge>
          </div>
          <p className="text-lg font-bold text-muted-foreground">—</p>
          <p className="text-[10px] font-medium text-muted-foreground">
            {summary.accuracy.note}
          </p>
        </CardContent>
      </Card>

      {/* 3. Fokus Dominan */}
      <Card>
        <CardContent className="flex flex-col gap-1 p-3">
          <p className="text-[11px] font-medium text-muted-foreground">Fokus Dominan</p>
          <p className="truncate text-lg font-bold text-foreground">{summary.dominantFocusLabel}</p>
          <p className="text-[10px] font-semibold text-muted-foreground">
            {summary.dominantSessionsLabel}
          </p>
        </CardContent>
      </Card>

      {/* 4. Durasi Latihan */}
      <Card>
        <CardContent className="flex flex-col gap-1 p-3">
          <p className="text-[11px] font-medium text-muted-foreground">Durasi Latihan</p>
          <p className="text-lg font-bold text-foreground">{summary.durationHoursLabel}</p>
          <p className="text-[10px] font-semibold text-muted-foreground">
            {summary.durationNoteLabel}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
