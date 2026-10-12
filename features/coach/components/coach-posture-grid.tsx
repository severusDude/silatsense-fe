import { TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PosturePoint } from "@/features/coach/types";

export function CoachPostureGrid({ posture }: { posture: PosturePoint[] }) {
  const [tiles, banner] = [posture.slice(0, 4), posture[4]];
  return (
    <Card>
      <CardHeader>
        <CardTitle>5 Titik Validasi Postur Tim</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        <ul className="grid grid-cols-2 gap-2.5">
          {tiles.map((point) => (
            <li key={point.id} className={`flex flex-col gap-1 rounded-2xl border p-2.5 ${point.warning ? "border-warning" : ""}`}>
              <span className="text-[11px] font-bold">{point.name}</span>
              <span className="text-sm font-bold tabular-nums">{point.scorePct}%</span>
              <Badge variant={point.warning ? "warning" : "success"}>{point.statusLabel}</Badge>
            </li>
          ))}
        </ul>
        {banner ? (
          <p className="flex items-center gap-2 rounded-2xl border border-warning bg-warning/10 p-2.5 text-[11px] font-medium">
            <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
            {banner.name} — {banner.scorePct}% {banner.statusLabel}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
