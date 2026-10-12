"use client";

import { useFormContext } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateProfile } from "@/features/profile/actions/update-profile";
import type { UpdateProfileInput } from "@/features/profile/schemas";

export function ProfileSaveAction() {
  const { handleSubmit, formState } = useFormContext<UpdateProfileInput>();
  const queryClient = useQueryClient();
  const mutation = useMutation<UpdateProfileInput, Error, UpdateProfileInput>({
    mutationFn: (values) => updateProfile(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const onSubmit = (values: UpdateProfileInput) =>
    toast.promise(mutation.mutateAsync(values), {
      loading: "Menyimpan perubahan…",
      success: "Perubahan tersimpan (stub)",
      error: (e) => (e instanceof Error ? e.message : "Gagal menyimpan"),
    });

  return (
    <Button
      type="button"
      onClick={handleSubmit(onSubmit)}
      disabled={!formState.isDirty || mutation.isPending}
      className="w-full"
    >
      <Save className="size-4" aria-hidden="true" /> Simpan Perubahan
    </Button>
  );
}
