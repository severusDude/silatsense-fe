"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { PasswordField } from "@/features/auth/components/password-field";
import { signInSchema, type SignInInput } from "@/features/auth/schemas";
import { signInAction } from "@/features/auth/actions/sign-in";
import type { AuthSuccessResult } from "@/features/auth/types";

export function SignInForm() {
  const router = useRouter();

  const { control, handleSubmit, setError } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema) as Resolver<SignInInput>,
    mode: "onChange",
    criteriaMode: "firstError",
    defaultValues: { identifier: "", password: "", rememberMe: false },
  });

  const mutation = useMutation<AuthSuccessResult, Error, SignInInput>({
    mutationFn: async (values) => {
      const next =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("next") ?? undefined
          : undefined;

      const res = await signInAction({ ...values, next });
      if (!res.ok) {
        if (res.error.fieldErrors) {
          for (const [field, msg] of Object.entries(res.error.fieldErrors)) {
            if (field === "identifier" || field === "password") {
              setError(field, { message: msg });
            }
          }
        }
        throw new Error(res.error.message);
      }
      return res.data;
    },
    onSuccess: (data) => {
      router.replace(data.redirectTo);
      router.refresh();
    },
  });

  const onSubmit = (values: SignInInput) =>
    toast.promise(mutation.mutateAsync(values), {
      loading: "Memproses masuk…",
      success: "Berhasil masuk",
      error: (e) => (e instanceof Error ? e.message : "Gagal masuk"),
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Controller
        name="identifier"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="sign-in-identifier">NPM / Email Mahasiswa</FieldLabel>
            <InputGroup>
              <InputGroupInput
                {...field}
                id="sign-in-identifier"
                placeholder="227006104 atau nama@student.unsil.ac.id"
                autoComplete="username"
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
      <PasswordField
        control={control}
        name="password"
        id="sign-in-password"
        label="Kata sandi"
        placeholder="Minimal 8 karakter"
        autoComplete="current-password"
      />
      <div className="flex justify-end">
        <button type="button" className="text-xs font-medium text-primary hover:underline">
          Lupa sandi?
        </button>
      </div>
      <Controller
        name="rememberMe"
        control={control}
        render={({ field }) => (
          <Field orientation="horizontal">
            <Checkbox
              id="sign-in-remember"
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
            <FieldLabel htmlFor="sign-in-remember">Ingat saya di perangkat ini</FieldLabel>
          </Field>
        )}
      />
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        Masuk ke Sesi Latihan <ArrowRight data-icon="inline-end" />
      </Button>
    </form>
  );
}
