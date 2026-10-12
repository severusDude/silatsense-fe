import Link from "next/link";
import { Play, Timer } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function PersiapanCta({ slug }: { slug: string }) {
  return (
    <Link
      href={`/latihan/${slug}/rekam`}
      className={buttonVariants({ size: "lg", className: "w-full rounded-full" })}
    >
      <Play data-icon="inline-start" /> Mulai Analisis Gerakan
      <span className="ml-auto flex items-center gap-1 rounded-full bg-black/20 px-2.5 py-1 text-xs font-normal">
        3s Mundur <Timer className="size-3.5" aria-hidden="true" />
      </span>
    </Link>
  );
}
