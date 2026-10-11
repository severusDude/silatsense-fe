import Link from "next/link";
import { RotateCcw, Save } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { EvaluationSession } from "@/features/member/types";

export function EvaluasiActions({ session }: { session: EvaluationSession }) {
  return (
    <section aria-label="Tindak lanjut evaluasi" className="flex flex-col gap-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold">Siap Memperbaiki Deviasi Gerakan?</CardTitle>
          <CardDescription>Targetkan akurasi ≥ 85% untuk lulus standar uji.</CardDescription>
        </CardHeader>
        <CardFooter className="flex-col items-stretch gap-2">
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
        </CardFooter>
      </Card>
    </section>
  );
}
