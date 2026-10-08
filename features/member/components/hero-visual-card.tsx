import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ImagePlaceholder } from "@/features/member/components/shared/image-placeholder";
import type { HeroMetricData } from "@/features/member/types";

export function HeroVisualCard({ metric }: { metric: HeroMetricData }) {
  return (
    <section aria-label="Akurasi terkini" className="flex flex-col">
      <Card className="gap-0 overflow-hidden border-stone-800 bg-stone-950 py-0">
        <ImagePlaceholder label="Visual pose pesilat" className="rounded-none border-0" />
        <div className="flex items-center justify-between px-4 pt-3">
          <Badge variant="success">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-success-foreground" />
            {metric.cameraReady ? "Kamera Siap" : "Kamera Mati"}
          </Badge>
        </div>
        <CardContent className="flex flex-col gap-2 p-4">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3 text-stone-950">
            <div className="flex flex-col gap-0.5">
              <p className="flex flex-wrap items-baseline gap-x-1.5">
                <span className="text-xl font-bold">{metric.accuracyPct}%</span>
                <span className="text-[10px] font-bold tracking-widest text-stone-500 uppercase">
                  Akurasi terkini
                </span>
              </p>
              <p className="text-xs text-stone-600">
                Toleransi sudut siku:{" "}
                <strong className="font-bold text-amber-700">{metric.elbowToleranceDeg}°</strong>{" "}
                (Target: &lt;{metric.targetDeg}°)
              </p>
            </div>
            <span className="shrink-0 rounded-lg bg-stone-100 px-2 py-1 text-[10px] font-bold text-stone-700 ring-1 ring-stone-200 ring-inset">
              Jarak {metric.cameraDistanceM}m
            </span>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
