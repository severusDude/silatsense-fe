import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { CoachMemberListItem } from "@/features/coach/types";

export function MemberCardList({
  members,
  countLabel,
  nextCursor,
  q = "",
}: {
  members: CoachMemberListItem[];
  countLabel: string;
  nextCursor: string | null;
  q?: string;
}) {
  const hasFilter = Boolean(q.trim());

  return (
    <section aria-labelledby="member-list-heading" className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="member-list-heading" className="text-sm font-bold">
          Monitoring Pose Kinematika
        </h2>
        <Badge variant="secondary">{countLabel}</Badge>
      </div>

      {members.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <p className="text-xs text-muted-foreground">
            {hasFilter ? "Tidak ada atlet yang cocok." : "Belum ada atlet binaan."}
          </p>
          {hasFilter ? (
            <Link
              href="/coach/members"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Kembali ke Awal
            </Link>
          ) : null}
        </div>
      ) : (
        <>
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
                          <Badge variant={member.statusVariant}>{member.statusLabel}</Badge>
                        </div>
                        <p className="truncate text-[11px] text-muted-foreground">
                          NIM {member.nim} • {member.lastGerakan}
                        </p>
                      </div>
                    </div>
                    <CardAction>
                      <span className="shrink-0 text-sm font-bold tabular-nums">
                        {member.scoreLabel}
                      </span>
                    </CardAction>
                  </CardHeader>
                  <CardFooter className="p-0">
                    <Link
                      href={member.detailHref}
                      className={buttonVariants({
                        variant: "ghost",
                        size: "sm",
                        className:
                          "h-auto w-full justify-center gap-1 rounded-none border-0 px-2.5 py-2 text-xs font-bold text-primary",
                      })}
                    >
                      Lihat Detail <ChevronRight className="size-3.5" aria-hidden="true" />
                    </Link>
                  </CardFooter>
                </Card>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            {nextCursor ? (
              <Link
                href={`/coach/members?${new URLSearchParams({
                  ...(q ? { q } : {}),
                  cursor: nextCursor,
                }).toString()}`}
                className={buttonVariants({ variant: "outline", size: "sm", className: "w-full sm:w-auto" })}
              >
                Muat Lebih Banyak
              </Link>
            ) : null}

            {hasFilter || nextCursor ? (
              <Link
                href="/coach/members"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Kembali ke Awal
              </Link>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
