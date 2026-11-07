import { TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PostureIssue } from "@/features/coach/types";

export function CoachPostureGrid({ posture }: { posture: PostureIssue[] }) {
  if (posture.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Isu Postur Teratas Tim</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-4 text-center text-xs text-muted-foreground">
            Belum ada isu postur terdeteksi
          </p>
        </CardContent>
      </Card>
    );
  }

  const banner = posture[0];
  const tiles = posture.slice(1, 5);
  const remainder = posture.length > 5 ? posture.length - 5 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Isu Postur Teratas Tim</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        <p className="flex items-center gap-2 rounded-2xl border border-warning bg-warning/10 p-2.5 text-[11px] font-medium">
          <TriangleAlert className="size-4 shrink-0 text-warning" aria-hidden="true" />
          <span>
            {banner.name} — {banner.sessionCount} sesi terindikasi
          </span>
        </p>
        {tiles.length > 0 ? (
          <ul className="grid grid-cols-2 gap-2.5">
            {tiles.map((point) => (
              <li
                key={point.id}
                className="flex flex-col gap-1 rounded-2xl border border-warning/50 bg-card p-2.5"
              >
                <span className="truncate text-[11px] font-bold">{point.name}</span>
                <span className="text-sm font-bold tabular-nums">
                  {point.sessionLabel}
                </span>
                <Badge variant={point.statusVariant}>{point.statusLabel}</Badge>
              </li>
            ))}
          </ul>
        ) : null}
        {remainder > 0 ? (
          <p className="text-center text-[11px] text-muted-foreground">
            +{remainder} isu lainnya
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
