import { Badge } from "@/components/ui/badge";
import type { TrainingCatalogViewModel } from "@/features/member/types";

export function LatihanHero({
  hero,
}: {
  hero: TrainingCatalogViewModel["hero"];
}) {
  return (
    <section aria-labelledby="latihan-heading" className="flex flex-col gap-2">
      <ul className="flex flex-wrap gap-1.5" aria-label="Kategori modul">
        {hero.badges.map((badge) => (
          <li key={badge} className="flex">
            <Badge variant="secondary">{badge}</Badge>
          </li>
        ))}
      </ul>
      <h1 id="latihan-heading" className="text-2xl font-bold tracking-tight">
        {hero.title}
      </h1>
      <p className="text-xs leading-relaxed text-muted-foreground">{hero.subtitle}</p>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-xs text-muted-foreground">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>{hero.completedSessionsLabel}</span>
          <span aria-hidden="true">·</span>
          <span>{hero.scoredSessionsLabel}</span>
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-dashed px-2 py-0.5 text-[11px]">
          Akurasi: {hero.accuracy.label}
        </span>
      </div>
    </section>
  );
}
