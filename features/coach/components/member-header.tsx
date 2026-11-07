import { Badge } from "@/components/ui/badge";

export function MemberHeader({ totalAktif }: { totalAktif: number }) {
  return (
    <section aria-labelledby="members-heading" className="flex items-start justify-between gap-3">
      <div className="flex flex-col gap-1">
        <h1 id="members-heading" className="text-xl font-bold tracking-tight">
          Member List
        </h1>
        <p className="text-xs text-muted-foreground">Pantau perkembangan tiap atlet binaan UKM UNSIL.</p>
      </div>
      <Badge variant="secondary" className="shrink-0">
        {totalAktif} Atlet Aktif
      </Badge>
    </section>
  );
}
