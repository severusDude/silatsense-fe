import { Dumbbell, LayoutDashboard, ScrollText, User } from "lucide-react";

export function MemberBottomNav() {
  return (
    <nav aria-label="Navigasi member" className="sticky bottom-0 z-40 border-t bg-background/95 backdrop-blur">
      <ul className="mx-auto flex w-full max-w-[448px] px-4 py-2">
        <li className="flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-medium text-primary">
          <span aria-current="page" className="flex flex-col items-center gap-0.5">
            <LayoutDashboard className="size-4" aria-hidden="true" />
            Dashboard
          </span>
        </li>
        {/* TODO: link to /latihan when the route lands */}
        <li className="flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] text-muted-foreground">
          <span aria-disabled="true" className="flex flex-col items-center gap-0.5">
            <span className="flex items-center gap-1">
              <Dumbbell className="size-4" aria-hidden="true" />
              <span className="rounded-full bg-destructive px-1 text-[9px] font-bold text-white">4</span>
            </span>
            Latihan
          </span>
        </li>
        {/* TODO: link to /riwayat when the route lands */}
        <li className="flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] text-muted-foreground">
          <span aria-disabled="true" className="flex flex-col items-center gap-0.5">
            <ScrollText className="size-4" aria-hidden="true" />
            Riwayat
          </span>
        </li>
        {/* TODO: link to /profil when the route lands */}
        <li className="flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] text-muted-foreground">
          <span aria-disabled="true" className="flex flex-col items-center gap-0.5">
            <User className="size-4" aria-hidden="true" />
            Profil
          </span>
        </li>
      </ul>
    </nav>
  );
}
