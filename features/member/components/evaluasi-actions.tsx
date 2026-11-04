import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { EvaluationViewModel } from "@/features/member/types";

export function EvaluasiActions({
  evaluation,
}: {
  evaluation: EvaluationViewModel;
}) {
  return (
    <section aria-label="Tindak lanjut evaluasi" className="flex flex-col gap-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold">
            Siap Memperbaiki Gerakan?
          </CardTitle>
          <CardDescription>
            Rekam ulang gerakan yang sama untuk membandingkan skor kemiripan
            berikutnya.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex-col items-stretch gap-2">
          <Link
            href={`/latihan/${evaluation.slug}/rekam`}
            className={buttonVariants({ size: "lg", className: "w-full rounded-full" })}
          >
            <RotateCcw data-icon="inline-start" /> Latihan Ulang
          </Link>
          <Link
            href={`/latihan/${evaluation.slug}/sesi/${evaluation.sessionId}`}
            className={buttonVariants({
              variant: "outline",
              size: "lg",
              className: "w-full rounded-full",
            })}
          >
            <ArrowLeft data-icon="inline-start" /> Kembali ke Sesi
          </Link>
        </CardFooter>
      </Card>
    </section>
  );
}
