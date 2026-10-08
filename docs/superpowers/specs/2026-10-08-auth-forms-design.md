# Auth Forms Design — sign-in + sign-up (PSR-23)

Date: 2026-10-08. Status: approved. Linear parent: PSR-23 (`[auth] Ship sign-in sign-up forms`), milestone `[Phase 2] Auth forms`. Subs: PSR-25 schemas, PSR-26 sign-in, PSR-24 sign-up.

## 1. Goal

Figma-faithful `/sign-in` and `/sign-up` frontend. RHF + Zod (`mode: "onChange"`), shadcn `Field`, password `InputGroup` with eye toggle `align="inline-end"`. Mutations stubbed (`TODO: connect backend`) with `toast.promise` feedback.

## 2. Figma source

- Sign-in (`94:37583`, "Login"): badge "Sistem Latihan Visi Komputer UNSIL", heading "KEMBALI KE MATRAS LATIHAN.", identifier field (NPM/email, leading person icon, value `227006104`), password field (leading lock, trailing eye, `Lupa sandi?` link), `Ingat saya di perangkat ini` checkbox (checked), CTA "Masuk ke Sesi Latihan →", switch link "Daftar akun pesilat di sini", client-side AI privacy note. Header: logo + `Daftar >`.
- Sign-up (`94:37682`, "Register"): badge "Registrasi Pesilat Mandiri UNSIL", heading "MULAI ANALISIS GERAKANMU.", fields Nama Lengkap (person icon), NPM/Email (mail icon), Kata Sandi + Ulangi Kata Sandi (lock/shield icons, eye toggles), terms checkbox (checked, UKM Silat UNSIL video-stream consent), CTA "Daftar Akun Pesilat →", switch link "Masuk >", biometric privacy note. Header: logo + `Masuk >`.

## 3. Architecture

- Routes (thin RSC, no logic): `app/sign-in/page.tsx` → `SignInPage`, `app/sign-up/page.tsx` → `SignUpPage`.
- Compositions: `features/auth/pages/sign-in-page.tsx`, `sign-up-page.tsx` (Card: badge + heading + subtitle + form + switch link + privacy note).
- Client components: `features/auth/components/sign-in-form.tsx`, `sign-up-form.tsx`, shared `password-field.tsx` (`"use client"`, `useState` eye toggle).
- Schemas: `features/auth/schemas/` directory form (`sign-in.ts`, `sign-up.ts`, `index.ts` re-export).
- No `app/api/` (external clients only). Backend stub lives in the client mutation with `TODO` until REST contract exists.
- Missing primitive: add `components/ui/input-group.tsx` and `components/ui/tooltip.tsx` via shadcn (base-nova, Base UI). No Radix. `@/` imports only.

## 4. Schemas / validation

```ts
identifierSchema = z.union([
  z.string().regex(/^\d{8,12}$/, "NPM harus 8–12 digit"),
  z.string().email("Masukkan NPM atau email yang valid"),
]);
signInSchema = z.object({
  identifier: identifierSchema,
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
  rememberMe: z.boolean().default(false),
});
signUpSchema = z.object({
  fullName: z.string().trim().min(3, "Nama minimal 3 karakter"),
  identifier: identifierSchema,
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
  confirmPassword: z.string(),
  terms: z.boolean().refine((v) => v === true, "Centang persetujuan untuk lanjut"),
}).refine((v) => v.password === v.confirmPassword, {
  message: "Konfirmasi kata sandi tidak cocok",
  path: ["confirmPassword"],
});
```

RHF: `useForm({ resolver: zodResolver(schema), mode: "onChange", criteriaMode: "firstError", defaultValues })`.

## 5. UI pattern

- Each field: `Controller` → `Field data-invalid={fieldState.invalid}` → `FieldLabel` (uppercase Grotesk) + `Input` (leading icon via relative wrapper or `InputGroupAddon align="inline-start"`) + `FieldError errors={[fieldState.error]}` when invalid.
- Password (`password-field.tsx`): `InputGroup` > `InputGroupInput type={show ? "text" : "password"}` (after input in DOM) + `InputGroupAddon align="inline-end"` > shadcn `Tooltip` wrapping `InputGroupButton type="button" size="icon-xs"` with `Eye`/`EyeOff` icon and visible tooltip text (`Tampilkan kata sandi` / `Sembunyikan kata sandi`). Never `aria-label`-only for the toggle — tooltip is the label affordance.
- CTA: `Button` primary full-width with `ArrowRight` icon. Checkbox: Base UI checkbox via shadcn with `Field orientation="horizontal"`.
- `Lupa sandi?` renders as non-navigating affordance (TODO backend reset flow, out of scope).

## 6. Mutation / feedback

```tsx
const mutation = useMutation({
  mutationFn: async (values: SignInInput) => {
    // TODO: connect backend via lib/api-client.ts (no REST contract yet)
    throw new Error("Backend belum tersambung");
  },
});
const onSubmit = (values: SignInInput) =>
  toast.promise(mutation.mutateAsync(values), {
    loading: "Memproses…",
    success: "Berhasil — backend belum tersambung (stub)",
    error: (e) => e instanceof Error ? e.message : "Gagal masuk",
  });
```

Sonner `Toaster` already mounted in `app/layout.tsx`. Remember-me / forgot / terms persist nothing in v1.

## 7. Verification

- `tests/unit/auth/schemas.test.ts`: union accepts NPM + email / rejects short digits + bad email; sign-up rejects mismatch + unchecked terms.
- Green: `pnpm build` + `tsc --noEmit` + `eslint` + `pnpm test`.
- Browser: `document.documentElement.scrollWidth <= window.innerWidth` at 390px + desktop on both routes; eye toggle + toast states exercised.

## 8. Out of scope

Backend connect, session/cookie handling, password-reset flow, OAuth, E2E tests, dark-theme derivation (PSR-22), shared auth layout chrome (headers/footers reuse existing app shell).
