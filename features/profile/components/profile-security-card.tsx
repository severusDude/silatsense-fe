import { ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ProfileSecurityCard({
  passwordUpdatedLabel,
}: {
  passwordUpdatedLabel: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
          <ShieldCheck className="size-4" aria-hidden="true" /> Keamanan & Otentikasi
        </h2>
        <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/40 p-3">
          <div className="flex min-w-0 flex-col">
            <span className="text-xs font-semibold text-foreground">Kata Sandi Akun</span>
            <span className="text-[11px] text-muted-foreground">{passwordUpdatedLabel}</span>
          </div>
          {/* TODO: wire password change via lib/api-client.ts (PATCH /member/password) */}
          <button
            type="button"
            className="shrink-0 rounded-lg border bg-background px-3 py-1.5 text-[11px] font-semibold text-foreground"
          >
            Ubah Kata Sandi
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
