import { Crosshair, Video } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { SessionDetail } from "@/features/member/types";

export function SessionVideoPlaceholder({ session }: { session: SessionDetail }) {
  return (
    <section aria-label="Objek tinjauan kinematika" className="flex flex-col gap-2">
      <Card>
        <CardHeader className="flex flex-col gap-0.5">
          <p className="text-[10px] font-bold tracking-widest text-destructive uppercase">
            Objek tinjauan kinematika
          </p>
          <p className="text-base font-bold text-foreground">{session.techniqueName}</p>
          <p className="text-[11px] text-muted-foreground">{session.techniqueDesc}</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {/* TODO: bind real telemetry frame when backend serves media (GET /member/history/:id) — placeholder shell only */}
          <div className="flex aspect-video w-full flex-col justify-between gap-2 overflow-hidden rounded-2xl bg-foreground p-2.5">
            <p className="flex items-center gap-1.5 text-[10px] text-background/80">
              <Video aria-hidden="true" className="size-3.5 shrink-0" />
              {session.video.cameraLabel}
            </p>
            <p className="flex items-center justify-center">
              <span className="flex size-16 items-center justify-center rounded-full border border-dashed border-destructive/70">
                <Crosshair aria-hidden="true" className="size-5 text-destructive" />
              </span>
            </p>
            <p className="flex items-center justify-end">
              <span className="rounded-md bg-background/20 px-1.5 py-0.5 text-[9px] text-background/80">
                {session.video.qualityLabel}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
