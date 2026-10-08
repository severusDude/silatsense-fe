import Link from "next/link";
import { Dumbbell, LayoutDashboard, ScrollText, User } from "lucide-react";

export type MemberTab = "dashboard" | "latihan";

const itemClass = "flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-medium";
const linkInner = "flex flex-col items-center gap-0.5";

export function MemberBottomNav({ activeTab = "dashboard" }: { activeTab?: MemberTab }) {
  const dashboardActive = activeTab === "dashboard";
  const latihanActive = activeTab === "latihan";
  return (
    <nav aria-label="Navigasi member" className="sticky bottom-0 z-40 border-t bg-background/95 backdrop-blur">
      <ul className="mx-auto flex w-full max-w-[448px] px-4 py-2">
        <li className={`${itemClass} ${dashboardActive ? "text-primary" : "text-muted-foreground"}`}>
          {dashboardActive ? (
            <span aria-current="page" className={linkInner}>
              <LayoutDashboard className="size-4" aria-hidden="true" />
              Dashboard
            </span>
          ) : (
            <Link href="/dashboard" className={linkInner}>
              <LayoutDashboard className="size-4" aria-hidden="true" />
              Dashboard
            </Link>
          )}
        </li>
        <li className={`${itemClass} ${latihanActive ? "text-primary" : "text-muted-foreground"}`}>
          {latihanActive ? (
            <span aria-current="page" className={linkInner}>
              <span className="flex items-center gap-1">
                <Dumbbell className="size-4" aria-hidden="true" />
                <span className="rounded-full bg-destructive px-1 text-[9px] font-bold text-white">4</span>
              </span>
              Latihan
            </span>
          ) : (
            <Link href="/latihan" className={linkInner}>
              <span className="flex items-center gap-1">
                <Dumbbell className="size-4" aria-hidden="true" />
                <span className="rounded-full bg-destructive px-1 text-[9px] font-bold text-white">4</span>
              </span>
              Latihan
            </Link>
          )}
        </li>
        {/* TODO: link to /riwayat when the route lands */}
        <li className={`${itemClass} text-muted-foreground`}>
          <span aria-disabled="true" className={linkInner}>
            <ScrollText className="size-4" aria-hidden="true" />
            Riwayat
          </span>
        </li>
        {/* TODO: link to /profil when the route lands */}
        <li className={`${itemClass} text-muted-foreground`}>
          <span aria-disabled="true" className={linkInner}>
            <User className="size-4" aria-hidden="true" />
            Profil
          </span>
        </li>
      </ul>
    </nav>
  );
}
