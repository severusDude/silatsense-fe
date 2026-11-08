"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordDialog } from "@/features/profile/components/change-password-dialog";
import type { ProfileRole } from "@/features/profile/types";

export function ProfileSecurityCard({
  passwordUpdatedLabel,
  role = "member",
}: {
  passwordUpdatedLabel: string;
  role?: ProfileRole;
}) {
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5 text-sm font-bold">
            <ShieldCheck className="size-4" aria-hidden="true" /> Keamanan & Otentikasi
          </CardTitle>
          <CardDescription>
            {role === "coach"
              ? "Kelola proteksi akun pelatih dan pengaturan otentikasi."
              : "Kelola proteksi akun atlet dan akses pelatih."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/40 p-3">
            <div className="flex min-w-0 flex-col">
              <span className="text-xs font-semibold text-foreground">Kata Sandi Akun</span>
              <span className="text-[11px] text-muted-foreground">{passwordUpdatedLabel}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsPasswordDialogOpen(true)}
              className="cursor-pointer shrink-0 rounded-lg border bg-background px-3 py-1.5 text-[11px] font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Ubah Kata Sandi
            </button>
          </div>
        </CardContent>
      </Card>

      <ChangePasswordDialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
        role={role}
      />
    </>
  );
}
