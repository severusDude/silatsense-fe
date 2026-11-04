import { ModuleCard } from "@/features/member/components/module-card";
import { Card, CardContent } from "@/components/ui/card";
import type { TrainingModuleViewModel } from "@/features/member/types";

export function ModuleCardList({
  modules,
}: {
  modules: TrainingModuleViewModel[];
}) {
  return (
    <section aria-labelledby="modul-heading" className="flex flex-col gap-3">
      <h2 id="modul-heading" className="sr-only">
        Modul latihan
      </h2>
      {modules.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {modules.map((module) => (
            <li key={module.slug} className="flex flex-col">
              <ModuleCard module={module} />
            </li>
          ))}
        </ul>
      ) : (
        <Card>
          <CardContent className="p-4 text-xs text-muted-foreground">
            Belum ada modul latihan yang tersedia.
          </CardContent>
        </Card>
      )}
    </section>
  );
}
