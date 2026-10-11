import Link from "next/link";
import { RotateCcw, Save } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { EvaluationSession } from "@/features/member/types";

export function EvaluasiActions({ session }: { session: EvaluationSession }) {
  return (
    <section aria-label="Tindak lanjut evaluasi" className="flex flex-col gap-2">
      <h2 className="text-sm font-bold">Siap Memperbaiki Deviasi Gerakan?</h2>
      <p className="text-[11px] text-muted-foreground">
        Targetkan akurasi ≥ 85% untuk lulus standar uji.
      </p>
      {/* TODO: connect backend via lib/api-client.ts (POST /member/evaluations/:slug/ack) — dead CTA for now */}
      <span
        aria-disabled="true"
        className={buttonVariants({ size: "lg", className: "w-full rounded-full" })}
      >
        <Save data-icon="inline-start" /> Selesai dan Simpan
      </span>
      <Link
        href={`/latihan/${session.slug}/rekam`}
        className={buttonVariants({
          variant: "outline",
          size: "lg",
          className: "w-full rounded-full",
        })}
      >
        <RotateCcw data-icon="inline-start" /> Latihan Ulang
      </Link>
    </section>
  );
}
