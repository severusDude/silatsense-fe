import type { ReactNode } from "react";
import { CoachLayout } from "@/features/coach/pages/coach-layout";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <CoachLayout activeTab="members" trail={["Dashboard", "Member List", "Detail"]}>
      {children}
    </CoachLayout>
  );
}
