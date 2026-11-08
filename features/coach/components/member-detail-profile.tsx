import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getInitials } from "@/components/shared/silat-reference";
import type { CoachMemberProfileViewModel } from "@/features/coach/types";

export function MemberDetailProfile({ profile }: { profile: CoachMemberProfileViewModel }) {
  return (
    <section aria-labelledby="member-detail-name" className="flex flex-col gap-3">
      <Card>
        <CardContent className="flex items-center gap-3">
          <span
            role="img"
            aria-label={`Avatar ${profile.name}`}
            className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-secondary text-lg font-bold text-secondary-foreground"
          >
            {getInitials(profile.name)}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Badge variant={profile.statusVariant}>{profile.statusLabel}</Badge>
            <h1 id="member-detail-name" className="truncate text-lg font-bold">
              {profile.name}
            </h1>
            <p className="text-xs text-muted-foreground">NIM {profile.nim}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <dl className="grid grid-cols-3 gap-2.5">
            <div className="flex flex-col items-center gap-0.5 text-center">
              <dt className="text-[11px] text-muted-foreground">Sabuk</dt>
              <dd className="text-xs font-bold">{profile.beltLabel}</dd>
              {profile.beltTargetLabel ? (
                <span className="text-[10px] text-muted-foreground">{profile.beltTargetLabel}</span>
              ) : null}
            </div>
            <div className="flex flex-col items-center gap-0.5 text-center opacity-60">
              <dt className="text-[11px] text-muted-foreground">Kehadiran</dt>
              <dd className="text-xs font-bold text-muted-foreground">Segera hadir</dd>
            </div>
            <div className="flex flex-col items-center gap-0.5 text-center opacity-60">
              <dt className="text-[11px] text-muted-foreground">Agregat</dt>
              <dd className="text-xs font-bold text-muted-foreground">Segera hadir</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card className="opacity-80">
        <CardContent className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {profile.scoredSessionCount} sesi dinilai
          </p>
          <Badge variant="outline" className="border-dashed text-muted-foreground">
            Segera hadir
          </Badge>
        </CardContent>
      </Card>
    </section>
  );
}
