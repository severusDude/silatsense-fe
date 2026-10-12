# Auth Forms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Figma-faithful `/sign-in` and `/sign-up` pages with RHF + Zod `onChange` validation, shadcn `Field`, password `InputGroup` eye toggle with `Tooltip`, and `TODO`-backend mutations wrapped in `toast.promise`.

**Architecture:** Thin RSC routes call `features/auth/pages/` compositions; client forms in `features/auth/components/` use `Controller` + `Field`; Zod schemas live in `features/auth/schemas/`; mutations are `useMutation` stubs marked `TODO: connect backend`.

**Tech Stack:** Next.js 16.3.8 App Router, React 19, RHF 7 + `@hookform/resolvers` + Zod 4, TanStack Query 5 `useMutation`, Sonner `toast.promise`, shadcn `base-nova` (`field`, `input-group`, `tooltip`, `checkbox`), `lucide-react` icons, Vitest.

## Global Constraints

- Never add `"use client"` under `app/` (only `app/providers.tsx` has it); routes contain no logic, fetch, or validation.
- `features/auth/schemas/` validates at the edge; server stubs never trust client input.
- Import with `@/` alias only; never relative imports across folders.
- shadcn Base UI only: no Radix imports, Radix docs do not apply.
- Password eye toggle uses shadcn `Tooltip` with visible text — never `aria-label`-only.
- Every task ends green before the next starts.
- One task = one commit = one review; commit format `<type>(<scope>): <summary>`.

---

## File Structure

| File | Responsibility |
|---|---|
| `features/auth/schemas/sign-in.ts` (create) | `identifierSchema` (NPM 8–12 digits OR email union), `signInSchema`, `SignInInput` type |
| `features/auth/schemas/sign-up.ts` (create) | `signUpSchema` (name + identifier + password + confirm + terms), `SignUpInput` type |
| `features/auth/schemas/index.ts` (create) | Re-export both schema modules |
| `tests/unit/auth/schemas.test.ts` (create) | Schema characterization: union accept/reject, confirm-match, terms |
| `components/ui/input-group.tsx` (create via CLI) | shadcn primitive for leading-icon inputs + trailing eye addon |
| `components/ui/tooltip.tsx` (create via CLI) | shadcn primitive for eye-toggle tooltip text |
| `components/ui/checkbox.tsx` (create via CLI) | shadcn primitive for remember-me + terms checkboxes |
| `features/auth/components/password-field.tsx` (create) | Generic RHF password field: `InputGroup` + eye `Tooltip`, `align="inline-end"` |
| `features/auth/components/sign-in-form.tsx` (create) | Client sign-in form: identifier + password + remember-me + CTA + `toast.promise` stub |
| `features/auth/components/sign-up-form.tsx` (create) | Client sign-up form: name + identifier + 2× password-field + terms + CTA + stub |
| `features/auth/pages/sign-in-page.tsx` (create) | Card composition: badge + heading + form + switch link + privacy note |
| `features/auth/pages/sign-up-page.tsx` (create) | Same composition for registration copy |
| `app/sign-in/page.tsx` (create) | Thin RSC route calling `SignInPage` |
| `app/sign-up/page.tsx` (create) | Thin RSC route calling `SignUpPage` |

---

### Task 1: Auth Zod schemas + tests (PSR-25)

**Files:**
- Create: `features/auth/schemas/sign-in.ts`
- Create: `features/auth/schemas/sign-up.ts`
- Create: `features/auth/schemas/index.ts`
- Test: `tests/unit/auth/schemas.test.ts`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: `identifierSchema: ZodType<string>`; `signInSchema` (`{ identifier, password, rememberMe }`); `SignInInput = z.infer<typeof signInSchema>`; `signUpSchema` (`{ fullName, identifier, password, confirmPassword, terms }`); `SignUpInput`. Tasks 2–3 import types + schemas from `@/features/auth/schemas`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { signInSchema, signUpSchema } from "@/features/auth/schemas";

const signInBase = { identifier: "227006104", password: "secretpassword", rememberMe: false };

describe("identifier (NPM/email union)", () => {
  it("accepts a 9-digit NPM", () => {
    expect(signInSchema.safeParse(signInBase).success).toBe(true);
  });

  it("accepts a student email", () => {
    const r = signInSchema.safeParse({ ...signInBase, identifier: "npm@student.unsil.ac.id" });
    expect(r.success).toBe(true);
  });

  it("rejects a 3-char string that is neither NPM nor email", () => {
    const r = signInSchema.safeParse({ ...signInBase, identifier: "abc" });
    expect(r.success).toBe(false);
  });

  it("rejects a 7-digit number (too short for NPM, not an email)", () => {
    const r = signInSchema.safeParse({ ...signInBase, identifier: "1234567" });
    expect(r.success).toBe(false);
  });
});

describe("signInSchema password", () => {
  it("rejects passwords shorter than 8 chars", () => {
    const r = signInSchema.safeParse({ ...signInBase, password: "short" });
    expect(r.success).toBe(false);
  });
});

describe("signUpSchema", () => {
  const valid = {
    fullName: "Muhammad Fajar Nugraha",
    identifier: "npm@student.unsil.ac.id",
    password: "password123",
    confirmPassword: "password123",
    terms: true,
  };

  it("accepts a complete valid registration", () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects mismatched confirmation on confirmPassword", () => {
    const r = signUpSchema.safeParse({ ...valid, confirmPassword: "different99" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0]?.path).toEqual(["confirmPassword"]);
    }
  });

  it("rejects unchecked terms", () => {
    const r = signUpSchema.safeParse({ ...valid, terms: false });
    expect(r.success).toBe(false);
  });

  it("rejects a 2-char name", () => {
    const r = signUpSchema.safeParse({ ...valid, fullName: "Ab" });
    expect(r.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/auth/schemas.test.ts`
Expected: FAIL with "Failed to resolve import @/features/auth/schemas" (schemas do not exist yet).

- [ ] **Step 3: Write minimal implementation**

`features/auth/schemas/sign-in.ts`:

```ts
import { z } from "zod";

export const identifierSchema = z.union([
  z.string().regex(/^\d{8,12}$/, "NPM harus 8–12 digit"),
  z.string().email("Masukkan NPM atau email yang valid"),
]);

export const signInSchema = z.object({
  identifier: identifierSchema,
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
  rememberMe: z.boolean().default(false),
});

export type SignInInput = z.infer<typeof signInSchema>;
```

`features/auth/schemas/sign-up.ts`:

```ts
import { z } from "zod";
import { identifierSchema } from "@/features/auth/schemas/sign-in";

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(3, "Nama minimal 3 karakter"),
    identifier: identifierSchema,
    password: z.string().min(8, "Kata sandi minimal 8 karakter"),
    confirmPassword: z.string(),
    terms: z.boolean().refine((v) => v === true, "Centang persetujuan untuk lanjut"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;
```

`features/auth/schemas/index.ts`:

```ts
export * from "@/features/auth/schemas/sign-in";
export * from "@/features/auth/schemas/sign-up";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/auth/schemas.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add features/auth/schemas tests/unit/auth/schemas.test.ts
git commit -m "feat(auth): add sign-in sign-up Zod schemas"
```

---

### Task 2: Sign-in form page (PSR-26)

**Files:**
- Create via CLI: `components/ui/input-group.tsx`, `components/ui/tooltip.tsx`, `components/ui/checkbox.tsx`
- Create: `features/auth/components/password-field.tsx`
- Create: `features/auth/components/sign-in-form.tsx`
- Create: `features/auth/pages/sign-in-page.tsx`
- Create: `app/sign-in/page.tsx`

**Interfaces:**
- Consumes: `signInSchema`, `SignInInput` from `@/features/auth/schemas` (Task 1).
- Produces: `PasswordField` generic (`{ control: Control<T>; name: Path<T>; label: string; placeholder?: string; autoComplete?: string; id: string }`) reused by Task 3; `SignInPage` composition; route `/sign-in`.

- [ ] **Step 1: Add the three missing shadcn primitives**

Run: `npx shadcn@latest add input-group tooltip checkbox`
Expected: creates `components/ui/input-group.tsx`, `components/ui/tooltip.tsx`, `components/ui/checkbox.tsx`; style `base-nova` (do not change existing files if the CLI offers to overwrite — answer no).

- [ ] **Step 2: Confirm generated export names**

Run: `Select-String -Pattern "^export|^function" components/ui/input-group.tsx components/ui/tooltip.tsx components/ui/checkbox.tsx`
Expected: `input-group` exports `InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput`; `tooltip` exports `Tooltip, TooltipContent, TooltipProvider, TooltipTrigger`; `checkbox` exports `Checkbox`. If any name differs, use the generated name in the code below.

- [ ] **Step 3: Create the shared password field**

`features/auth/components/password-field.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type PasswordFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  id: string;
  placeholder?: string;
  autoComplete?: string;
};

export function PasswordField<T extends FieldValues>({
  control,
  name,
  label,
  id,
  placeholder = "Min. 8 karakter",
  autoComplete,
}: PasswordFieldProps<T>) {
  const [show, setShow] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <InputGroup>
            <InputGroupInput
              {...field}
              id={id}
              type={show ? "text" : "password"}
              placeholder={placeholder}
              autoComplete={autoComplete}
              aria-invalid={fieldState.invalid}
            />
            <InputGroupAddon>
              <Lock className="size-4" />
            </Inp
...[truncated 9113 chars]