import Link from "next/link";
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

export function SessionFeedback({ session }: { session: LastSessionData | null }) {
  if (!session) {
    return (
      <section aria-labelledby="feedback-heading" className="flex flex-col">
        <Card>
          <CardContent className="flex flex-col gap-3 p-4">
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] font-bold tracking-widest text-primary uppercase">Evaluasi sesi mandiri</p>
              <h2 id="feedback-heading" className="text-sm font-bold">
                Belum ada sesi latihan mandiri
              </h2>
              <p className="text-xs text-muted-foreground">
                Mulai sesi rekaman pertamamu untuk melihat evaluasi postur dan catatan pelatih di sini.
              </p>
            </div>
            <Link href="/latihan" className={buttonVariants({ variant: "outline", className: "w-full" })}>
              <RotateCcw data-icon="inline-start" /> Mulai Latihan Sekarang
            </Link>
          </CardContent>
        </Card>
      </section>
    );
  }

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
                {session.time} • Durasi {session.durationLabel}
              </p>
            </div>
            <Badge variant={session.badgeVariant}>{session.badgeLabel}</Badge>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-border/80 bg-muted/20 px-3 py-2 opacity-60">
            <span className="text-[11px] text-muted-foreground">Penghitungan repetisi otomatis</span>
            <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground uppercase">
              {session.reps.label}
            </Badge>
          </div>
          <ul className="flex flex-col gap-2">
            {session.observations.map((observation, idx) => {
              const tone = toneConfig[observation.tone];
              const Icon = tone.icon;
              return (
                <li
                  key={`${observation.title}-${idx}`}
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
          <div className="flex flex-col gap-2">
            <Link href={session.retryHref} className={buttonVariants({ variant: "outline", className: "w-full" })}>
              <RotateCcw data-icon="inline-start" /> Ulangi Latihan Gerakan Ini
            </Link>
            <Link
              href={session.detailHref}
              className={buttonVariants({ variant: "ghost", size: "sm", className: "w-full" })}
            >
              Lihat Detail Evaluasi
            </Link>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
