import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SignUpForm } from "@/features/auth/components/sign-up-form";

export function SignUpPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-8">
      <Card>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <p className="w-fit rounded-full border px-3 py-1 text-xs text-muted-foreground">
              <span className="mr-2 inline-block size-2 rounded-full bg-emerald-500" />
              Registrasi Pesilat Mandiri UNSIL
            </p>
            <h1 className="font-heading text-3xl font-bold tracking-tight">
              MULAI ANALISIS GERAKANMU.
            </h1>
            <p className="text-sm text-muted-foreground">
              Daftarkan akun untuk mengakses deteksi sudut sendi real-time, evaluasi
              4 pilar biomekanik, dan catatan perkembangan dari pelatih UKM.
            </p>
          </div>
          <TooltipProvider>
            <SignUpForm />
          </TooltipProvider>
          <p className="text-center text-sm text-muted-foreground">
            Sudah terdaftar sebagai pesilat aktif?{" "}
            <Link href="/sign-in" className="font-medium text-primary hover:underline">
              Masuk
            </Link>
          </p>
          <p className="flex gap-2 rounded-xl border bg-muted/50 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 shrink-0" />
            Data biometrik &amp; video latihan diproses di sisi klien demi privasi anggota.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
