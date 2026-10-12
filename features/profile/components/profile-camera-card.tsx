"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Camera } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CameraDevice } from "@/features/member/types";
import type { UpdateProfileInput } from "@/features/profile/schemas";

export function ProfileCameraCard({ cameras }: { cameras: CameraDevice[] }) {
  const { control } = useFormContext<UpdateProfileInput>();

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
          <Camera className="size-4" aria-hidden="true" /> Kamera
        </h2>
        <Controller
          name="cameraDeviceId"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="profil-camera">Perangkat Kamera</FieldLabel>
              <Select
                items={cameras.map((camera) => ({ label: camera.label, value: camera.id }))}
                value={field.value}
                onValueChange={(next) => {
                  if (typeof next === "string") field.onChange(next);
                }}
              >
                <SelectTrigger id="profil-camera" className="w-full" aria-label="Perangkat kamera">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {cameras.map((camera) => (
                      <SelectItem key={camera.id} value={camera.id}>
                        {camera.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </CardContent>
    </Card>
  );
}
