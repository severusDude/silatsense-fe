import type { ReactNode } from "react";
import { MemberBottomNav, type MemberTab } from "@/features/member/components/member-bottom-nav";
import { MemberTopNav } from "@/features/member/components/member-top-nav";

export function MemberLayout({
  children,
  activeTab = "dashboard",
  trail = ["Dashboard"],
}: {
  children: ReactNode;
  activeTab?: MemberTab;
  trail?: string[];
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MemberTopNav trail={trail} />
      <main className="mx-auto flex w-full max-w-[448px] flex-1 flex-col gap-5 px-4 pt-4 pb-8">
        {children}
      </main>
      <MemberBottomNav activeTab={activeTab} />
    </div>
  );
}
