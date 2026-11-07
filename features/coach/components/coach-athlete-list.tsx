import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CoachAthlete } from "@/features/coach/types";

export function CoachAthleteList({
  athletes,
  athleteCountLabel,
}: {
  athletes: CoachAthlete[];
  athleteCountLabel?: string;
}) {
  const badgeLabel = athleteCountLabel ?? `${athletes.length} Atlet`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ringkasan Latihan Member</CardTitle>
        <CardAction>
          <Badge variant="secondary">{badgeLabel}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        {athletes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border/80 p-6 text-center">
            <p className="text-xs font-semibold text-foreground">
              Belum ada atlet binaan
            </p>
            <p className="text-[11px] text-muted-foreground">
              Atlet yang terhubung dengan akun pelatih akan muncul di sini.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {athletes.map((athlete) => (
              <li key={athlete.id} className="flex flex-col rounded-2xl border">
                <div className="flex items-center gap-2.5 p-2.5">
                  <span
                    role="img"
                    aria-label={`Avatar ${athlete.name}`}
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground"
                  >
                    {athlete.initials}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="truncate text-xs font-bold">
                        {athlete.name}
                      </h3>
                      <Badge variant={athlete.statusVariant}>
                        {athlete.statusLabel}
                      </Badge>
                    </div>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {athlete.lastGerakan}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold tabular-nums">
                    {athlete.scoreLabel}
                  </span>
                </div>
                <Link
                  href={athlete.detailHref}
                  className={buttonVariants({
                    variant: "ghost",
                    size: "sm",
                    className:
                      "h-auto w-full justify-center gap-1 rounded-t-none border-t border-border px-2.5 py-2 text-xs font-bold text-primary hover:text-primary",
                  })}
                >
                  Lihat Detail{" "}
                  <ChevronRight className="size-3.5" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
