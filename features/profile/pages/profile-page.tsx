import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { dummyProfileCameras } from "@/features/profile/data/profile-dummy";
import { getProfile } from "@/features/profile/data/get-profile";
import type { ProfileRole } from "@/features/profile/types";
import { ProfileAthleteCard } from "@/features/profile/components/profile-athlete-card";
import { ProfileEditor } from "@/features/profile/components/profile-editor";
import { ProfileSecurityCard } from "@/features/profile/components/profile-security-card";

export function ProfilePage({ role }: { role: ProfileRole }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5 pt-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Profil & Pengaturan Akun
        </h1>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Kelola data biomekanika personal, telemetry stream perangkat kamera, dan
          preferensi akun atlet Anda.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <AthleteSection role={role} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <EditorSection role={role} />
      </Suspense>
    </div>
  );
}

async function AthleteSection({ role }: { role: ProfileRole }) {
  const profile = await getProfile(role);
  if (!profile) return null;
  return <ProfileAthleteCard profile={profile} />;
}

async function EditorSection({ role }: { role: ProfileRole }) {
  const profile = await getProfile(role);
  if (!profile) return null;
  return (
    <ProfileEditor profile={profile} cameras={dummyProfileCameras}>
      <ProfileSecurityCard passwordUpdatedLabel={profile.passwordUpdatedLabel} />
    </ProfileEditor>
  );
}
