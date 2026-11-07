import { Compass, ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { PersiapanViewModel } from "@/features/member/types";

export function CalibrationCard({ detail }: { detail: PersiapanViewModel }) {
  const capabilityLabel = detail.capability.scoringAvailable
    ? "Penilaian aktif"
    : "Penilaian segera hadir";

  return (
    <Card>
      <CardContent className="flex flex-col gap-3.5 p-4">
        <div className="flex flex-col gap-1.5 border-b pb-3">
          <div className="flex items-center justify-between gap-2">
            <Badge className="bg-destructive/10 text-destructive">
              {detail.eyebrow}
            </Badge>
            <Badge
              variant={detail.capability.scoringAvailable ? "success" : "outline"}
              className={
                detail.capability.scoringAvailable
                  ? undefined
                  : "text-muted-foreground"
              }
            >
              {capabilityLabel}
            </Badge>
          </div>
          <h2 className="text-lg font-bold">{detail.title}</h2>
          {detail.description ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {detail.description}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
            <span>{detail.levelLabel}</span>
            {detail.estimatedDurationLabel ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{detail.estimatedDurationLabel}</span>
              </>
            ) : null}
          </div>
          {detail.capability.scoringAvailable ? null : (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Referensi gerakan belum siap — latihan tetap dapat dilakukan tanpa
              skor kemiripan.
            </p>
          )}
          {detail.capability.referenceVersions.length > 0 ? (
            <p className="text-[10px] text-muted-foreground">
              Referensi: {detail.capability.referenceVersions.join(", ")}
            </p>
          ) : null}
        </div>

        {detail.checklist.length > 0 ? (
          <div className="flex flex-col gap-2">
            <h3 className="flex items-center gap-1.5 text-xs font-bold tracking-wide">
              <ListChecks className="size-4" aria-hidden="true" />
              CHECKLIST PERSIAPAN
            </h3>
            <ul className="flex flex-col gap-2">
              {detail.checklist.map((item, index) => (
                <li
                  key={item.id}
                  className="flex items-start gap-2.5 rounded-xl bg-secondary/50 p-2.5"
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold"
                  >
                    {index + 1}
                  </span>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="text-xs leading-relaxed">{item.text}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.source}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {detail.guides.length > 0 ? (
          <div className="flex flex-col gap-1.5 rounded-xl bg-secondary/50 p-3">
            <h3 className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide">
              <Compass className="size-3.5" aria-hidden="true" />
              PANDUAN POSTUR KUNCI {detail.eyebrow}:
            </h3>
            <ul className="flex flex-col gap-1">
              {detail.guides.map((guide) => (
                <li
                  key={guide.id}
                  className="flex items-start gap-2 text-[11px] leading-relaxed"
                >
                  <span
                    aria-hidden="true"
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-destructive"
                  />
                  <p>
                    <span className="text-muted-foreground">{guide.text}</span>
                    <span className="text-muted-foreground"> ({guide.source})</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
