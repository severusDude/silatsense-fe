import { ModuleCard } from "@/features/member/components/module-card";
import type { TrainingModule } from "@/features/member/types";

export function ModuleCardList({ modules }: { modules: TrainingModule[] }) {
  return (
    <section aria-labelledby="modul-heading" className="flex flex-col gap-3">
      <h2 id="modul-heading" className="sr-only">
        Modul latihan
      </h2>
      <ul className="flex flex-col gap-3">
        {modules.map((module) => (
          <li key={module.slug} className="flex flex-col">
            <ModuleCard module={module} />
          </li>
        ))}
      </ul>
    </section>
  );
}
