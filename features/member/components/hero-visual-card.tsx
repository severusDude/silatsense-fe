import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ImagePlaceholder } from "@/features/member/components/shared/image-placeholder";
import type { HeroMetricData } from "@/features/member/types";

export function HeroVisualCard({ metric }: { metric: HeroMetricData }) {
  return (
    <section aria-label="Skor kemiripan terkini" className="flex flex-col">
      <Card className="gap-0 overflow-hidden border-stone-800 bg-stone-950 py-0">
        <ImagePlaceholder label="Visual pose pesilat" className="rounded-none border-0" />
        <div className="flex items-center justify-between px-4 pt-3">
          <Badge variant={metric.statusVariant}>
            <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
            {metric.statusLabel}
          </Badge>
          <span className="text-[11px] font-medium text-stone-300">
            {metric.completedSessionsLabel} • {metric.totalDurationLabel}
          </span>
        </div>
        <CardContent className="flex flex-col gap-2 p-4">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3 text-stone-950">
            <div className="flex flex-col gap-0.5">
              <p className="flex flex-wrap items-baseline gap-x-1.5">
                <span className="text-xl font-bold">{metric.scoreLabel}</span>
                <span className="text-[10px] font-bold tracking-widest text-stone-500 uppercase">
                  {metric.scoreSubtitle}
                </span>
              </p>
              <p className="text-xs text-stone-600">
                Total tercatat: <strong className="font-bold text-stone-900">{metric.completedSessionsLabel}</strong>
              </p>
            </div>
            <span className="shrink-0 rounded-lg bg-stone-100 px-2 py-1 text-[10px] font-bold text-stone-700 ring-1 ring-stone-200 ring-inset">
              Durasi {metric.totalDurationLabel}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-stone-700 bg-stone-900/60 px-3 py-2 opacity-60">
            <span className="text-[11px] text-stone-300">
              Akurasi gabungan &amp; toleransi sensor jarak kamera
            </span>
            <Badge
              variant="outline"
              className="border-stone-600 text-[10px] font-semibold text-stone-300 uppercase"
            >
              {metric.sensorTelemetry.label}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
