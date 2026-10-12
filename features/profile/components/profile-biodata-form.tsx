"use client";

import { Controller, useFormContext } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import type { UpdateProfileInput } from "@/features/profile/schemas";

const fields = [
  { name: "name", label: "Nama Lengkap", autoComplete: "name" },
  { name: "nim", label: "Nomor Induk / NIM Pesilat", autoComplete: "off" },
  { name: "email", label: "Email Akun Mahasiswa", autoComplete: "email" },
] as const;

export function ProfileBiodataForm() {
  const { control } = useFormContext<UpdateProfileInput>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-bold">Pengaturan Akun & Biodata Silat</CardTitle>
        <CardDescription>Informasi utama lisensi atlet dan sinkronisasi perguruan.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {fields.map((item) => (
          <Controller
            key={item.name}
            name={item.name}
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`profil-${item.name}`}>{item.label}</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    {...field}
                    id={`profil-${item.name}`}
                    autoComplete={item.autoComplete}
                    aria-invalid={fieldState.invalid}
                  />
                </InputGroup>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        ))}
      </CardContent>
    </Card>
  );
}
