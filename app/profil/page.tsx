import { Suspense } from "react";
import { requireSession } from "@/features/auth/data/session";
import { ProfilePage } from "@/features/profile/pages/profile-page";

async function ProfilRolePage() {
  const user = await requireSession();
  return <ProfilePage role={user.role} />;
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ProfilRolePage />
    </Suspense>
  );
}
