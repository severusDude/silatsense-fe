import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { EvaluationSession } from "@/features/member/types";

export function EvaluasiPostureList({
  session,
}: {
  session: EvaluationSession;
}) {
  return (
    <section aria-label="Penilaian postur anatomis" className="flex flex-col gap-2">
      <Card>
        <CardContent className="flex flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col">
              <h2 className="text-sm font-bold">Penilaian Postur Anatomis</h2>
              <p className="text-[10px] text-muted-foreground">
                Evaluasi 5 parameter biomekanika pukulan lurus
              </p>
            </div>
            <Badge variant="outline">3 Sesuai · 2 Perlu Koreksi</Badge>
          </div>
          <div className="flex flex-col gap-2">
            {session.postures.map((posture) => {
              const ok = posture.status === "sesuai";
              const Icon = ok ? CheckCircle2 : AlertTriangle;
              return (
                <Card key={posture.id}>
                  <CardContent className="flex flex-col gap-1.5 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="flex items-center gap-2 text-xs font-bold">
                        <span
                          className={
                            ok
                              ? "flex size-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success"
                              : "flex size-6 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning"
                          }
                        >
                          <Icon
                            aria-hidden="true"
                            className="size-3.5"
                          />
                        </span>
                        {posture.name}
                      </p>
                      <Badge variant={ok ? "success" : "warning"}>
                        {posture.statusLabel}
                      </Badge>
                    </div>
                    <p className="pl-8 text-[11px] leading-relaxed text-muted-foreground">
                      {posture.detail}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
