import { Badge } from "@/components/ui/badge";
import type { TrainingHero } from "@/features/member/types";

export function LatihanHero({ hero }: { hero: TrainingHero }) {
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
      <div className="flex items-center justify-between gap-3 border-t pt-2 text-xs text-muted-foreground">
        <span>{hero.sessionsLabel}</span>
        <span>{hero.accuracyLabel}</span>
      </div>
    </section>
  );
}
