"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/actions/sign-out";

export function ProfileLogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleLogout = async () => {
    setIsPending(true);
    try {
      const res = await signOutAction();
      if (!res.ok) {
        toast.error(res.error.message || "Gagal keluar");
        return;
      }
      toast.success("Berhasil keluar");
      router.replace(res.data.redirectTo);
      router.refresh();
    } catch {
      toast.error("Gagal keluar, silakan coba lagi");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full text-destructive"
      disabled={isPending}
      onClick={handleLogout}
    >
      <LogOut className="size-4" aria-hidden="true" />
      {isPending ? "Keluar…" : "Logout"}
    </Button>
  );
}
