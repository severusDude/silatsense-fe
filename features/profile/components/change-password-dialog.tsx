"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PasswordField } from "@/features/auth/components/password-field";
import { changePasswordAction } from "@/features/profile/actions/change-password";
import {
  passwordChangeFormSchema,
  type PasswordChangeFormInput,
} from "@/features/profile/schemas";
import type { ProfileRole } from "@/features/profile/types";

export function ChangePasswordDialog({
  open,
  onOpenChange,
  role = "member",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: ProfileRole;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { isSubmitting },
  } = useForm<PasswordChangeFormInput>({
    resolver: zodResolver(passwordChangeFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  });

  const onSubmit = (values: PasswordChangeFormInput) => {
    startTransition(async () => {
      const res = await changePasswordAction(values, role);
      if (!res.ok) {
        if (res.error.fieldErrors) {
          for (const [field, msg] of Object.entries(res.error.fieldErrors)) {
            setError(field as keyof PasswordChangeFormInput, { message: msg });
          }
        }
        toast.error(res.error.message);
        return;
      }

      toast.success("Kata sandi berhasil diperbarui");
      reset();
      onOpenChange(false);
      router.refresh();
    });
  };

  const isWorking = isPending || isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ubah Kata Sandi</DialogTitle>
          <DialogDescription>
            Masukkan kata sandi saat ini dan tentukan kata sandi baru untuk akun Anda.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <PasswordField
            control={control}
            name="currentPassword"
            label="Kata Sandi Saat Ini"
            id="current-password"
            autoComplete="current-password"
          />

          <PasswordField
            control={control}
            name="newPassword"
            label="Kata Sandi Baru"
            id="new-password"
            autoComplete="new-password"
          />

          <PasswordField
            control={control}
            name="confirmPassword"
            label="Konfirmasi Kata Sandi Baru"
            id="confirm-password"
            autoComplete="new-password"
          />

          <DialogFooter className="mt-2">
            <DialogClose
              render={
                <Button
                  variant="outline"
                  type="button"
                  disabled={isWorking}
                  onClick={() => {
                    reset();
                    onOpenChange(false);
                  }}
                >
                  Batal
                </Button>
              }
            />
            <Button type="submit" disabled={isWorking}>
              {isWorking ? "Menyimpan…" : "Simpan Kata Sandi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
