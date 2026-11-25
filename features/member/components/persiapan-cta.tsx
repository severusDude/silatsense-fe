import Link from "next/link";
import { Play, Timer, Upload } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function PersiapanCta({ slug }: { slug: string }) {
  return (
    <div className="flex flex-col gap-2.5">
      <Link
      href={`/latihan/${slug}/rekam`}
      className={buttonVariants({ size: "lg", className: "w-full rounded-full" })}
    >
      <Play data-icon="inline-start" /> Mulai Analisis Gerakan
      <span className="ml-auto flex items-center gap-1 rounded-full bg-black/20 px-2.5 py-1 text-xs font-normal">
        3s Mundur <Timer className="size-3.5" aria-hidden="true" />
      </span>
      </Link>
      <Link href={`/latihan/${slug}/rekam?source=file`}
        className={buttonVariants({ variant: "outline", size: "lg", className: "w-full rounded-full" })}>
        <Upload data-icon="inline-start" /> Upload Video dari Perangkat
      </Link>
      <p className="text-center text-[11px] text-muted-foreground">Sudah punya rekaman? Pilih video tanpa menggunakan kamera.</p>
    </div>
  );
}
