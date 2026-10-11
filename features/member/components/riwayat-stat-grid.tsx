import { Card, CardContent } from "@/components/ui/card";
import type { HistorySummary } from "@/features/member/types";

const stats = (summary: HistorySummary) => [
  { label: "Total Sesi", value: summary.totalSessionsLabel, note: summary.sessionsDeltaLabel },
  {
    label: "Rata-rata Akurasi",
    value: `${summary.avgAccuracyPct}%`,
    note: summary.accuracyNote,
  },
  {
    label: "Fokus Dominan",
    value: summary.dominantFocus,
    note: summary.dominantSessionsLabel,
  },
  {
    label: "Jam Sensor",
    value: summary.sensorHoursLabel,
    note: summary.sensorNote,
  },
];

export function RiwayatStatGrid({ summary }: { summary: HistorySummary }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {stats(summary).map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex flex-col gap-1 p-3">
            <p className="text-[11px] font-medium text-muted-foreground">{stat.label}</p>
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
            <p className="text-[10px] font-semibold text-success-foreground">{stat.note}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
