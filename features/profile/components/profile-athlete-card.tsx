import { Camera, Gauge, Medal, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Profile } from "@/features/profile/types";

function AttributeRow({
  icon,
  eyebrow,
  value,
  note,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-muted/40 p-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        {icon}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
          {eyebrow}
        </span>
        <span className="text-xs font-semibold text-foreground">{value}</span>
        {note ? <span className="text-[11px] text-muted-foreground">{note}</span> : null}
      </span>
    </div>
  );
}

export function ProfileAthleteCard({ profile }: { profile: Profile }) {
  const isMember = profile.role === "member";
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-1 p-4">
        <div className="flex w-fit flex-col">
          <div
            role="img"
            aria-label={`Foto profil ${profile.name}`}
            className="flex size-24 items-center justify-center rounded-full bg-muted text-xl font-bold text-muted-foreground"
          >
            AS
          </div>
          {/* TODO: wire avatar upload when backend lands */}
          {/* Overlap via negative margin: badge sits on the avatar's bottom-right */}
          <button
            type="button"
            aria-label="Ubah foto profil"
            className="-mt-7 ml-[68px] flex size-7 items-center justify-center rounded-full border bg-background"
          >
            <Camera className="size-3.5" aria-hidden="true" />
          </button>
        </div>
        <h2 className="mt-1 text-lg font-bold text-foreground">{profile.name}</h2>
        <p className="text-xs text-muted-foreground">{profile.email}</p>
        <p className="text-[11px] text-muted-foreground">
          {profile.handle}
          {isMember ? ` • NIM ${profile.nim}` : null}
        </p>
        <div className="mt-2 flex w-full flex-col gap-2">
          <AttributeRow
            icon={<User className="size-4" aria-hidden="true" />}
            eyebrow={isMember ? "Peran & Divisi" : "Jabatan"}
            value={isMember ? profile.roleLabel : profile.titleLabel}
            note={profile.division}
          />
          {isMember ? (
            <AttributeRow
              icon={<Medal className="size-4" aria-hidden="true" />}
              eyebrow="Tingkatan Sabuk"
              value={profile.beltLabel}
              note={profile.beltTargetLabel}
            />
          ) : null}
          <AttributeRow
            icon={<Gauge className="size-4" aria-hidden="true" />}
            eyebrow={isMember ? "Akurasi Rata-Rata Biomekanika" : "Akurasi Tim"}
            value={isMember ? `${profile.avgAccuracyPct}% (${profile.accuracyNote})` : `${profile.teamAccuracyPct}%`}
          />
        </div>
        <div className="mt-2 grid w-full grid-cols-2 gap-2">
          <div className="flex flex-col rounded-xl border bg-muted/40 p-3">
            <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              {isMember ? "Total Sesi Latihan" : "Sesi Ulasan"}
            </span>
            <span className="text-base font-bold text-foreground">
              {isMember ? profile.totalSessionsLabel : profile.coachedSessionsLabel}
            </span>
          </div>
          <div className="flex flex-col rounded-xl border bg-muted/40 p-3">
            <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              {isMember ? "Pencatatan Sudut" : "Perangkat"}
            </span>
            <span className="text-base font-bold text-foreground">
              {isMember ? profile.totalPosturesLabel : "FaceTime HD"}
            </span>
          </div>
        </div>
        {/* Pelatih Kepala UKM — coach label-swap guard for the role prop (member Figma 94:41585 is the copy source) */}
      </CardContent>
    </Card>
  );
}
