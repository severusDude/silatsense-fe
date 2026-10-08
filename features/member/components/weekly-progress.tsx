import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CoachNoteData, WeeklyData } from "@/features/member/types";

export function WeeklyProgress({ weekly, note }: { weekly: WeeklyData; note: CoachNoteData }) {
  return (
    <section aria-labelledby="weekly-heading" className="flex flex-col">
      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <h2 id="weekly-heading" className="text-sm font-bold">
                {weekly.title}
              </h2>
              <p className="text-xs text-muted-foreground">{weekly.targetLabel}</p>
            </div>
            <Badge variant="secondary">{weekly.weekLabel}</Badge>
          </div>
          <div
            role="img"
            aria-label={`${weekly.title}: ${weekly.days.map((d) => `${d.label} ${d.value === null ? "istirahat" : `${d.value}%`}`).join(", ")}`}
            className="flex items-stretch justify-between gap-1.5 pt-1"
          >
            {weekly.days.map((day) => {
              const filled = day.state === "filled" || day.state === "active";
              return (
                <div key={day.label} className="flex flex-1 flex-col items-center gap-1">
                  <span
                    className={`text-[10px] ${day.state === "active" ? "font-bold text-primary" : day.state === "rest" ? "text-muted-foreground" : "font-bold text-muted-foreground"}`}
                  >
                    {day.value === null ? (day.state === "rest" ? "Rest" : "-") : `${day.value}%`}
                  </span>
                  {filled && day.value !== null ? (
                    <div className="flex h-16 w-full items-end justify-center overflow-hidden rounded-lg bg-muted">
                      {/* Data-driven height: chart value, not placement */}
                      <div
                        className={`w-full rounded-b-lg ${day.state === "active" ? "bg-primary" : "bg-stone-300"}`}
                        style={{ height: `${day.value}%` }}
                      />
                    </div>
                  ) : (
                    <div
                      aria-hidden="true"
                      className="flex h-16 w-full items-center justify-center rounded-lg border border-dashed bg-muted/50"
                    />
                  )}
                  <span
                    className={`text-[10px] ${day.state === "active" ? "font-bold text-primary" : "text-muted-foreground"}`}
                  >
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
          <figure className="flex flex-col gap-2 rounded-2xl border bg-muted/60 p-3">
            <figcaption className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="flex size-6 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground"
              >
                {note.initials}
              </span>
              <span className="text-xs font-bold">{note.name}</span>
            </figcaption>
            <blockquote className="text-xs leading-relaxed text-muted-foreground italic">
              &ldquo;{note.quote}&rdquo;
            </blockquote>
          </figure>
        </CardContent>
      </Card>
    </section>
  );
}
