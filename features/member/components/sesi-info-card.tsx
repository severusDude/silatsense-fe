import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { TrainingSession } from "@/features/member/types";

export function SesiInfoCard({ session }: { session: TrainingSession }) {
  const rows: { label: string; value: string }[] = [
    { label: "Latihan", value: session.trainingName },
    { label: "Durasi", value: `${session.durationLabel} (${session.durationSec} dtk)` },
    { label: "Direkam", value: session.recordedAtLabel },
    { label: "Ukuran berkas", value: session.fileSizeLabel },
    { label: "Kamera", value: session.camera.label },
    { label: "Resolusi", value: session.camera.resolution },
    { label: "FPS", value: `${session.camera.fps} FPS` },
  ];

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2 border-b pb-3">
          <Badge className="bg-destructive/10 text-destructive">
            {session.eyebrow}
          </Badge>
          <h2 className="text-lg font-bold">{session.trainingName}</h2>
        </div>
        <dl className="flex flex-col gap-2">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3 rounded-xl bg-secondary/50 p-2.5"
            >
              <dt className="shrink-0 text-[11px] font-bold tracking-wide text-muted-foreground">
                {row.label}
              </dt>
              <dd className="truncate text-xs font-semibold">{row.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
