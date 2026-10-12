import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { PersiapanDetail } from "@/features/member/types";

export function CalibrationCard({ detail }: { detail: PersiapanDetail }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3.5 p-4">
        <div className="flex flex-col gap-1.5 border-b pb-3">
          <div className="flex items-center justify-between gap-2">
            <Badge className="bg-destructive/10 text-destructive">
              {detail.eyebrow}
            </Badge>
            <p className="text-[11px] font-bold">
              {detail.accuracyLabel}{" "}
              <span className="text-destructive">{detail.accuracyValue}</span>
            </p>
          </div>
          <h2 className="text-lg font-bold">{detail.title}</h2>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {detail.description}
          </p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-bold tracking-wide">
            KESIAPAN SENSOR & AI
          </h3>
          <Badge variant="success">{detail.readinessLabel}</Badge>
        </div>
        <ul className="flex flex-col gap-2">
          {detail.checks.map((check) => (
            <li
              key={check.title}
              className="flex items-center justify-between gap-3 rounded-xl bg-secondary/50 p-2.5"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="flex size-5 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground"
                >
                  <Check className="size-3" />
                </span>
                <div className="flex min-w-0 flex-col">
                  <p className="text-xs font-semibold">{check.title}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {check.detail}
                  </p>
                </div>
              </div>
              <p className="shrink-0 text-xs font-bold text-success-foreground">
                {check.stateLabel}
              </p>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-1.5 rounded-xl bg-secondary/50 p-3">
          <h3 className="text-[11px] font-bold tracking-wide">
            PANDUAN POSTUR KUNCI {detail.eyebrow}:
          </h3>
          <ul className="flex flex-col gap-1">
            {detail.guides.map((guide) => (
              <li
                key={guide.term}
                className="flex items-start gap-2 text-[11px] leading-relaxed"
              >
                <span
                  aria-hidden="true"
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-destructive"
                />
                <p>
                  <strong>{guide.term}</strong>{" "}
                  <span className="text-muted-foreground">{guide.detail}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
