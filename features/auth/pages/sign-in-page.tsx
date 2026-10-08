import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SignInForm } from "@/features/auth/components/sign-in-form";

export function SignInPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-8">
      <Card>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <p className="w-fit rounded-full border px-3 py-1 text-xs text-muted-foreground">
              <span className="mr-2 inline-block size-2 rounded-full bg-emerald-500" />
              Sistem Latihan Visi Komputer UNSIL
            </p>
            <h1 className="font-heading text-3xl font-bold tracking-tight">
              KEMBALI KE MATRAS LATIHAN.
            </h1>
            <p className="text-sm text-muted-foreground">
              Masuk untuk melanjutkan analisis sudut biomekanik, evaluasi repetisi
              mandiri, dan catatan perkembangan pelatih UKM Silat UNSIL.
            </p>
          </div>
          <TooltipProvider>
            <SignInForm />
          </TooltipProvider>
          <p className="text-center text-sm text-muted-foreground">
            Belum terdaftar sebagai anggota UKM?{" "}
            <Link href="/sign-up" className="font-medium text-primary hover:underline">
              Daftar akun pesilat di sini
            </Link>
          </p>
          <p className="flex gap-2 rounded-xl border bg-muted/50 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 shrink-0" />
            Privasi stream kamera diproses secara lokal pada browser (Client-side AI).
            Tidak ada rekaman video atlet yang diunggah tanpa izin.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
