"use client";

import { useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save } from "lucide-react";
import {
  coachProfileApiV1CoachProfileGetQueryKey,
  memberProfileApiV1MemberProfileGetQueryKey,
} from "@/api/@tanstack/react-query.gen";
import { Button } from "@/components/ui/button";
import { updateProfileAction } from "@/features/profile/actions/update-profile";
import type { UpdateProfileInput } from "@/features/profile/schemas";
import type { ProfileRole } from "@/features/profile/types";

export function ProfileSaveAction({
  role = "member",
}: {
  role?: ProfileRole;
}) {
  const { handleSubmit, formState, reset } = useFormContext<UpdateProfileInput>();
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (values: UpdateProfileInput) => {
      const result = await updateProfileAction(values);
      if (!result.ok) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey:
          role === "coach"
            ? coachProfileApiV1CoachProfileGetQueryKey()
            : memberProfileApiV1MemberProfileGetQueryKey(),
      });
      reset(variables);
      router.refresh();
    },
  });

  const onSubmit = (values: UpdateProfileInput) =>
    toast.promise(mutation.mutateAsync(values), {
      loading: "Menyimpan perubahan…",
      success: "Profil berhasil diperbarui",
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
