import Link from "next/link";
import { ClipboardCheck, RotateCcw } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { SessionViewModel } from "@/features/member/types";

export function SesiActions({ session }: { session: SessionViewModel }) {
  const processing =
    session.processingStatus === "queued" ||
    session.processingStatus === "processing";

  return (
    <div className="flex flex-col gap-2.5">
      {session.canViewEvaluation ? (
        <Link
          href={`/latihan/${session.slug}/evaluasi/${session.id}`}
          className={buttonVariants({ size: "lg", className: "w-full rounded-full" })}
        >
          <ClipboardCheck data-icon="inline-start" /> Lihat Evaluasi
        </Link>
      ) : null}

      {processing ? (
        <p className="rounded-xl bg-secondary/50 p-3 text-center text-[11px] leading-relaxed text-muted-foreground">
          Analisis sedang berjalan. Halaman ini diperbarui otomatis saat hasilnya
          siap.
        </p>
      ) : null}

      {session.processingStatus === "failed" ? (
        <Link
          href={`/latihan/${session.slug}/rekam`}
          className={buttonVariants({ size: "lg", className: "w-full rounded-full" })}
        >
          <RotateCcw data-icon="inline-start" /> Rekam Ulang
        </Link>
      ) : (
        <Link
          href={`/latihan/${session.slug}/rekam`}
          className={buttonVariants({
            variant: "outline",
            size: "lg",
            className: "w-full rounded-full text-destructive",
          })}
        >
          <RotateCcw data-icon="inline-start" /> Latihan Ulang
        </Link>
      )}
    </div>
  );
}
