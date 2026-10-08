import { CircleCheck, Lightbulb, RotateCcw, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { LastSessionData, ObservationTone } from "@/features/member/types";

const toneConfig: Record<ObservationTone, { icon: typeof CircleCheck; row: string; title: string; body: string }> = {
  good: {
    icon: CircleCheck,
    row: "border-success-border bg-success",
    title: "text-success-foreground",
    body: "text-success-foreground",
  },
  warning: {
    icon: TriangleAlert,
    row: "border-warning-border bg-warning",
    title: "text-warning-foreground",
    body: "text-warning-foreground",
  },
  neutral: {
    icon: Lightbulb,
    row: "border-border bg-muted",
    title: "text-foreground",
    body: "text-muted-foreground",
  },
};

export function SessionFeedback({ session }: { session: LastSessionData }) {
  return (
    <section aria-labelledby="feedback-heading" className="flex flex-col">
      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] font-bold tracking-widest text-primary uppercase">Evaluasi sesi mandiri</p>
              <h2 id="feedback-heading" className="text-sm font-bold">
                {session.technique}
              </h2>
              <p className="text-xs text-muted-foreground">
                {session.time} • {session.reps} Repetisi
              </p>
            </div>
            <Badge variant="warning">
              {session.scorePct}% — {session.scoreLabel}
            </Badge>
          </div>
          <ul className="flex flex-col gap-2">
            {session.observations.map((observation) => {
              const tone = toneConfig[observation.tone];
              const Icon = tone.icon;
              return (
                <li
                  key={observation.title}
                  className={`flex items-start gap-2.5 rounded-xl border p-3 ${tone.row}`}
                >
                  <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <div className="flex flex-col gap-0.5">
                    <p className={`text-xs font-bold ${tone.title}`}>{observation.title}</p>
                    <p className={`text-xs leading-relaxed ${tone.body}`}>{observation.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          {/* TODO: wire to repeat /latihan flow when the route lands */}
          <span aria-disabled="true" className={buttonVariants({ className: "w-full" })}>
            <RotateCcw data-icon="inline-start" /> Ulangi Latihan Gerakan Ini
          </span>
        </CardContent>
      </Card>
    </section>
  );
}
