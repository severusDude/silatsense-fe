import Link from "next/link";
import { ArrowRight, CheckCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SessionDetailActions() {
  return (
    <section aria-label="Tindak lanjut remediasi" className="flex flex-col gap-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold">Siap Melakukan Remediasi?</CardTitle>
          <CardDescription>
            Konfirmasi telah membaca arahan, lalu mulai remedial pukulan.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex-col items-stretch gap-2">
          {/* TODO: connect backend via lib/api-client.ts (POST /member/remedial) — dead CTA for now */}
          <span
            aria-disabled="true"
            className={buttonVariants({ variant: "outline", size: "lg", className: "w-full rounded-full" })}
          >
            <CheckCheck data-icon="inline-start" /> Konfirmasi Telah Membaca
          </span>
          <Link
            href="/latihan/pukulan/rekam"
            className={buttonVariants({ size: "lg", className: "w-full rounded-full" })}
          >
            Mulai Remedial Pukulan Sekarang <ArrowRight data-icon="inline-end" />
          </Link>
        </CardFooter>
      </Card>
    </section>
  );
}
