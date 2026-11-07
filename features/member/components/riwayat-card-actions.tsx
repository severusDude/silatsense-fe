import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { TrainingModuleSlug } from "@/features/member/types";

export function RiwayatCardActions({
  sessionId,
  slug,
}: {
  sessionId: string;
  slug: TrainingModuleSlug;
}) {
  return (
    <div className="flex gap-2">
      <Link
        href={`/latihan/${slug}/rekam`}
        className={buttonVariants({ variant: "outline", size: "sm", className: "flex-1" })}
      >
        <RotateCcw data-icon="inline-start" /> Latihan Ulang
      </Link>
      <Link
        href={`/riwayat/${sessionId}`}
        className={buttonVariants({ size: "sm", className: "flex-1" })}
      >
        Detail Evaluasi <ArrowRight data-icon="inline-end" />
      </Link>
    </div>
  );
}
