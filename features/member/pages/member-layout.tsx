import type { ReactNode } from "react";
import { MemberBottomNav } from "@/features/member/components/member-bottom-nav";
import { MemberTopNav } from "@/features/member/components/member-top-nav";

export function MemberLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MemberTopNav />
      <main className="mx-auto flex w-full max-w-[448px] flex-1 flex-col gap-5 px-4 pt-4 pb-8">
        {children}
      </main>
      <MemberBottomNav />
    </div>
  );
}
