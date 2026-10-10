import { Zap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function RekamSelesaiCta() {
  return (
    /* TODO: wire to /latihan/[slug]/sesi when the sesi move lands */
    <span
      aria-disabled="true"
      className={buttonVariants({ size: "lg", className: "w-full rounded-full" })}
    >
      <Zap data-icon="inline-start" /> Selesai
    </span>
  );
}
