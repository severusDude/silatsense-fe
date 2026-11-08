import { Suspense, type ReactNode } from "react";
import { requireSession } from "@/features/auth/data/session";
import { CoachLayout } from "@/features/coach/pages/coach-layout";
import { MemberLayout } from "@/features/member/pages/member-layout";

async function ProfilRoleLayout({ children }: { children: ReactNode }) {
  const user = await requireSession();

  if (user.role === "coach") {
    return (
      <CoachLayout activeTab="profil" trail={["Dashboard", "Profil"]}>
        {children}
      </CoachLayout>
    );
  }

  return (
    <MemberLayout activeTab="profil" trail={["Dashboard", "Profil"]}>
      {children}
    </MemberLayout>
  );
}

export default function ProfilLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ProfilRoleLayout>{children}</ProfilRoleLayout>
    </Suspense>
  );
}
