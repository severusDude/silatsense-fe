import type { ReactNode } from "react";
import { CoachBottomNav, type CoachTab } from "@/features/coach/components/coach-bottom-nav";
import { CoachTopNav } from "@/features/coach/components/coach-top-nav";

export function CoachLayout({
  children,
  activeTab = "dasbor",
  trail = ["Dashboard"],
}: {
  children: ReactNode;
  activeTab?: CoachTab;
  trail?: string[];
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CoachTopNav trail={trail} />
      <main className="mx-auto flex w-full max-w-[448px] flex-1 flex-col gap-5 px-4 pt-4 pb-8">
        {children}
      </main>
      <CoachBottomNav activeTab={activeTab} />
    </div>
  );
}
