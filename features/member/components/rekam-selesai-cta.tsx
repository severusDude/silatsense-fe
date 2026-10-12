import Link from "next/link";
import { Zap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function RekamSelesaiCta({ slug }: { slug: string }) {
  return (
    <Link
      href={`/latihan/${slug}/sesi`}
      className={buttonVariants({ size: "lg", className: "w-full rounded-full" })}
    >
      <Zap data-icon="inline-start" /> Selesai
    </Link>
  );
}
