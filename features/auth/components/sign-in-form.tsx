"use client";

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

export function SignInForm() {
  const { control, handleSubmit } = useForm<SignInInput>({
    // Adapter: signInSchema uses `.default(false)`, so under zod v4 its
    // input type (`rememberMe?`) differs from its output type
    // (`SignInInput.rememberMe`). The form always supplies `rememberMe`
    // via defaultValues, making this cast sound at runtime.
    resolver: zodResolver(signInSchema) as Resolver<SignInInput>,
    mode: "onChange",
    criteriaMode: "firstError",
    defaultValues: { identifier: "", password: "", rememberMe: false },
  });

  const mutation = useMutation({
    mutationFn: async (_values: SignInInput) => {
      // TODO: connect backend via lib/api-client.ts (no REST contract yet)
      throw new Error("Backend belum tersambung");
    },
  });

  const onSubmit = (values: SignInInput) =>
    toast.promise(mutation.mutateAsync(values), {
      loading: "Memproses masuk…",
      success: "Berhasil — backend belum tersambung (stub)",
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
                placeholder="227006104"
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
        placeholder="secretpassword"
        autoComplete="current-password"
      />
      <Controller
        name="rememberMe"
        control={control}
        render={({ field }) => (
          <Field orientation="horizontal">
            <Checkbox
              id="sign-in-remember"
              checked={field.value}
              onCheckedChange={field.onChange}
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
