import type { ReactNode } from "react";
import { MemberLayout } from "@/features/member/pages/member-layout";

export default function ProfilLayout({ children }: { children: ReactNode }) {
  return (
    <MemberLayout activeTab="profil" trail={["Dashboard", "Profil"]}>
      {children}
    </MemberLayout>
  );
}
