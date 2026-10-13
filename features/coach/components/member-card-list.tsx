import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { stageBadgeVariant } from "@/features/coach/components/coach-stage";
import type { TeamMember } from "@/features/coach/types";

export function MemberCardList({ members, totalAktif }: { members: TeamMember[]; totalAktif: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monitoring Pose Kinematika</CardTitle>
        <CardAction>
          <Badge variant="secondary">{totalAktif} Atlet Aktif</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">Tidak ada atlet yang cocok.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {members.map((member) => (
              <li key={member.id}>
                <Card size="sm">
                  <CardHeader>
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        role="img"
                        aria-label={`Avatar ${member.name}`}
                        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground"
                      >
                        {member.initials}
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <CardTitle className="truncate text-xs font-bold">{member.name}</CardTitle>
                          <Badge variant={stageBadgeVariant(member.stage)}>{member.stageLabel}</Badge>
                        </div>
                        <p className="truncate text-[11px] text-muted-foreground">{member.lastGerakan}</p>
                      </div>
                    </div>
                    <CardAction>
                      <span className="shrink-0 text-sm font-bold tabular-nums">{member.scorePct}%</span>
                    </CardAction>
                  </CardHeader>
                  {/* TODO: wire to /coach/members/[id] when the Phase 11 detail move lands */}
                  <CardFooter className="p-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-disabled="true"
                      title={`Lihat detail ${member.name} (TODO)`}
                      className="h-auto w-full justify-center gap-1 rounded-none border-0 px-2.5 py-2 text-xs font-bold text-primary hover:text-primary"
                    >
                      Lihat Detail <ChevronRight className="size-3.5" aria-hidden="true" />
                    </Button>
                  </CardFooter>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
