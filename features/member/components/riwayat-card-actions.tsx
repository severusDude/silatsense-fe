import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { RiwayatSlug } from "@/features/member/types";

export function RiwayatCardActions({ slug }: { slug: RiwayatSlug }) {
  return (
    <div className="flex gap-2">
      <Link
        href={`/latihan/${slug}/rekam`}
        className={buttonVariants({ variant: "outline", size: "sm", className: "flex-1" })}
      >
        <RotateCcw data-icon="inline-start" /> Latihan Ulang
      </Link>
      {/* TODO: wire Detail Evaluasi to lib/api-client.ts (GET /member/history/:id) when the detail move lands — dead stub for now */}
      <span
        aria-disabled="true"
        className={buttonVariants({ size: "sm", className: "flex-1" })}
      >
        Detail Evaluasi <ArrowRight data-icon="inline-end" />
      </span>
    </div>
  );
}
