import Link from "next/link";
import { FileText, LayoutDashboard, User, UsersRound } from "lucide-react";

export type CoachTab = "dasbor" | "members" | "laporan" | "profil";

const itemClass = "flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-medium";
const linkInner = "flex flex-col items-center gap-0.5";

const tabs: { id: CoachTab; label: string; href: string; Icon: typeof LayoutDashboard }[] = [
  { id: "dasbor", label: "Dasbor", href: "/coach", Icon: LayoutDashboard },
  { id: "members", label: "Member List", href: "/coach/members", Icon: UsersRound },
  { id: "laporan", label: "Laporan", href: "/coach/laporan", Icon: FileText },
  { id: "profil", label: "Profil", href: "/profil", Icon: User },
];

export function CoachBottomNav({ activeTab = "dasbor" }: { activeTab?: CoachTab }) {
  return (
    <nav aria-label="Navigasi pelatih" className="sticky bottom-0 z-40 border-t bg-background/95 backdrop-blur">
      <ul className="mx-auto flex w-full max-w-[448px] px-4 py-2">
        {tabs.map(({ id, label, href, Icon }) =>
          activeTab === id ? (
            <li key={id} className={`${itemClass} text-primary`}>
              <span aria-current="page" className={linkInner}>
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </span>
            </li>
          ) : (
            <li key={id} className={`${itemClass} text-muted-foreground}`}>
              {/* TODO: wire members + laporan routes when their moves land (Phase 10/11) */}
              <Link href={href} className={linkInner}>
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </Link>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
