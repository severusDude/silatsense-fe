"use client";

import { Controller, useFormContext } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import type { UpdateProfileInput } from "@/features/profile/schemas";
import type { ProfileRole } from "@/features/profile/types";

export function ProfileBiodataForm({
  role = "member",
}: {
  role?: ProfileRole;
}) {
  const { control } = useFormContext<UpdateProfileInput>();
  const isCoach = role === "coach";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-bold">
          Pengaturan Akun & Biodata Silat
        </CardTitle>
        <CardDescription>
          {isCoach
            ? "Informasi utama akun pelatih, jabatan kepelatihan, dan afiliasi perguruan."
            : "Informasi utama lisensi atlet dan sinkronisasi perguruan."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="profil-name">Nama Lengkap</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  {...field}
                  id="profil-name"
                  autoComplete="name"
                  aria-invalid={fieldState.invalid}
                />
              </InputGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {isCoach ? (
          <>
            <Controller
              name="title"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="profil-title">Jabatan Pelatih</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      id="profil-title"
                      value={field.value ?? ""}
                      aria-invalid={fieldState.invalid}
                    />
                  </InputGroup>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="division"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="profil-division">Divisi / Perguruan</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      id="profil-division"
                      value={field.value ?? ""}
                      aria-invalid={fieldState.invalid}
                    />
                  </InputGroup>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="profil-email">Email Akun Pelatih</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      id="profil-email"
                      readOnly
                      disabled
                      className="cursor-not-allowed bg-muted/50 text-muted-foreground"
                    />
                  </InputGroup>
                  <FieldDescription>
                    Ubah email melalui menu verifikasi keamanan akun
                  </FieldDescription>
                </Field>
              )}
            />
          </>
        ) : (
          <>
            <Controller
              name="nim"
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="profil-nim">Nomor Induk / NPM Pesilat</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      id="profil-nim"
                      readOnly
                      disabled
                      className="cursor-not-allowed bg-muted/50 text-muted-foreground"
                    />
                  </InputGroup>
                  <FieldDescription>
                    Nomor Induk Mahasiswa terdaftar permanen
                  </FieldDescription>
                </Field>
              )}
            />

            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="profil-email">Email Akun Mahasiswa</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      id="profil-email"
                      readOnly
                      disabled
                      className="cursor-not-allowed bg-muted/50 text-muted-foreground"
                    />
                  </InputGroup>
                  <FieldDescription>
                    Ubah email melalui menu verifikasi keamanan akun
                  </FieldDescription>
                </Field>
              )}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
