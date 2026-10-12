"use client";

import type { ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, type UpdateProfileInput } from "@/features/profile/schemas";
import type { CameraDevice } from "@/features/member/types";
import type { Profile } from "@/features/profile/types";
import { ProfileBiodataForm } from "@/features/profile/components/profile-biodata-form";
import { ProfileCameraCard } from "@/features/profile/components/profile-camera-card";
import { ProfileLogoutButton } from "@/features/profile/components/profile-logout-button";
import { ProfileSaveAction } from "@/features/profile/components/profile-save-action";

export function ProfileEditor({
  profile,
  cameras,
  children,
}: {
  profile: Profile;
  cameras: CameraDevice[];
  children: ReactNode;
}) {
  const methods = useForm<UpdateProfileInput>({
    resolver: zodResolver(profileSchema),
    mode: "onChange",
    criteriaMode: "firstError",
    defaultValues: {
      name: profile.name,
      nim: profile.role === "member" ? profile.nim : "",
      email: profile.email,
      cameraDeviceId: cameras[0]?.id ?? "",
    },
  });

  return (
    <FormProvider {...methods}>
      <div className="flex flex-col gap-4">
        <ProfileBiodataForm />
        <ProfileCameraCard cameras={cameras} />
        {children}
        <div className="flex flex-col gap-2 pt-2">
          <ProfileSaveAction />
          <ProfileLogoutButton />
        </div>
      </div>
    </FormProvider>
  );
}
