"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { PasswordField } from "@/features/auth/components/password-field";
import { signUpSchema, type SignUpInput } from "@/features/auth/schemas";

export function SignUpForm() {
  const { control, handleSubmit } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange",
    criteriaMode: "firstError",
    defaultValues: {
      fullName: "",
      identifier: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  const mutation = useMutation<unknown, Error, SignUpInput>({
    mutationFn: async () => {
      // TODO: connect backend via lib/api-client.ts (no REST contract yet)
      throw new Error("Backend belum tersambung");
    },
  });

  const onSubmit = (values: SignUpInput) =>
    toast.promise(mutation.mutateAsync(values), {
      loading: "Mendaftarkan akun…",
      success: "Berhasil — backend belum tersambung (stub)",
      error: (e) => (e instanceof Error ? e.message : "Gagal mendaftar"),
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Controller
        name="fullName"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="sign-up-name">Nama Lengkap Pesilat</FieldLabel>
            <InputGroup>
              <InputGroupInput
                {...field}
                id="sign-up-name"
                placeholder="Contoh: Muhammad Fajar Nugraha"
                autoComplete="name"
                aria-invalid={fieldState.invalid}
              />
              <InputGroupAddon>
                <User className="size-4" />
              </InputGroupAddon>
            </InputGroup>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        name="identifier"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="sign-up-identifier">NPM / Email Mahasiswa</FieldLabel>
            <InputGroup>
              <InputGroupInput
                {...field}
                id="sign-up-identifier"
                placeholder="npm@student.unsil.ac.id atau nama"
                autoComplete="username"
                aria-invalid={fieldState.invalid}
              />
              <InputGroupAddon>
                <Mail className="size-4" />
              </InputGroupAddon>
            </InputGroup>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <PasswordField
        control={control}
        name="password"
        id="sign-up-password"
        label="Kata Sandi"
        autoComplete="new-password"
      />
      <PasswordField
        control={control}
        name="confirmPassword"
        id="sign-up-confirm"
        label="Ulangi Kata Sandi"
        placeholder="Ulangi kata sandi"
        autoComplete="new-password"
      />
      <Controller
        name="terms"
        control={control}
        render={({ field, fieldState }) => (
          <Field orientation="horizontal" data-invalid={fieldState.invalid}>
            <Checkbox
              id="sign-up-terms"
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
            <FieldLabel htmlFor="sign-up-terms">
              Saya menyetujui ketentuan latihan mandiri &amp; pemrosesan stream video
              secara lokal di browser sesuai standar UKM Silat UNSIL.
            </FieldLabel>
          </Field>
        )}
      />
      {control.getFieldState("terms").invalid && (
        <FieldError errors={[control.getFieldState("terms").error]} />
      )}
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        Daftar Akun Pesilat <ArrowRight data-icon="inline-end" />
      </Button>
    </form>
  );
}
