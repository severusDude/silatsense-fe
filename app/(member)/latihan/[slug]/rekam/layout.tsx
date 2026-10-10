import type { ReactNode } from "react";
import { MemberLayout } from "@/features/member/pages/member-layout";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <MemberLayout activeTab="latihan" trail={["Dashboard", "Latihan", "Mulai Latihan"]}>
      {children}
    </MemberLayout>
  );
}
