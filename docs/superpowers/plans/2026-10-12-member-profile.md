# Member Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/profil` (PSR-80) per `docs/superpowers/specs/2026-10-11-member-profile-design.md`: shared member+coach profile UI with role prop, member route live.

**Architecture:** `features/profile/` owns types, Zod schema, pure dummy, cached fetcher, server-action stub, server cards, one client editor island (RHF `FormProvider`), and a server composition; thin `app/(member)/profil/` route + layout; bottom-nav Profil tab enabled.

**Tech Stack:** Next.js 16.3.8 App Router (`cacheComponents`, `'use cache'` + `cacheLife`), React 19 RSC, RHF 7 + `@hookform/resolvers` + Zod 4, TanStack Query 5 (`useMutation`), shadcn base-nova (`Card`, `Field`, `InputGroup`, `Select`, `Button`), `lucide-react` 1.x, Sonner `toast.promise`, Vitest 3.

## Global Constraints

- `next.config.ts` has `cacheComponents: true`; every `'use cache'` pairs with `cacheLife('minutes')`.
- `features/profile/actions/` + `features/profile/data/` are server-only (`import "server-only"`); never imported from client components except via server-action call (`updateProfile`) — same as spec §3.
- Import with `@/` alias only; no relative imports across folders.
- Flex/grid layouts only — no `absolute` in new/modified UI files.
- `lucide-react` icons only (`Save`, `LogOut`, `Camera`, `User`, `Medal`, `Gauge`, `ShieldCheck`); every visual is a `div role="img"` (no `next/image`, no src).
- No `Batal` string anywhere in new UI; `Batal` negatively asserted in shell test.
- `CameraDevice` reused from `@/features/member/types`; no duplicate.
- Zod 4: no `.default()` in `profileSchema` (keeps form input/output types identical, no `Resolver` cast needed).
- Commits follow `<type>(<scope>): <summary>`; behavior + characterization test share one commit; spec/doc updates get their own `docs` commit.

---

## File Structure

| File | Responsibility |
|---|---|
| `features/profile/types.ts` (create) | `ProfileRole`, `AthleteProfile`, `CoachProfile`, `Profile` union (spec §4 verbatim) |
| `features/profile/schemas.ts` (create) | `profileSchema` (Zod 4) + `UpdateProfileInput` |
| `features/profile/data/profile-dummy.ts` (create) | Pure dummies: member, coach, 2 cameras, `dummyProfileForRole` guard |
| `features/profile/data/get-profile.ts` (create) | Server-only cached fetcher `getProfile(role)` with endpoint TODOs |
| `features/profile/actions/update-profile.ts` (create) | Server-action stub: `schema.parse()` then echo, PATCH TODO |
| `features/profile/components/profile-athlete-card.tsx` (create) | Server card: placeholder avatar + rows + mini stats, role-aware, NO logout |
| `features/profile/components/profile-security-card.tsx` (create) | Server card: password row + dead `Ubah Kata Sandi` stub |
| `features/profile/components/profile-editor.tsx` (create) | Client island: `useForm` + `FormProvider`, composes fields + camera + children + save + logout |
| `features/profile/components/profile-biodata-form.tsx` (create) | Client fields (nama/NIM/email) via `useFormContext` |
| `features/profile/components/profile-camera-card.tsx` (create) | Client shadcn `Select` via `Controller` + `useFormContext` |
| `features/profile/components/profile-save-action.tsx` (create) | Client `useMutation` → `updateProfile` + `toast.promise`, `Save` icon |
| `features/profile/components/profile-logout-button.tsx` (create) | Client outline stub, `LogOut` icon, page-bottom placement |
| `features/profile/pages/profile-page.tsx` (create) | Server composition: title + 2 `Suspense` units |
| `app/(member)/profil/page.tsx` (create) | Thin RSC route → `ProfilePage role="member"` |
| `app/(member)/profil/layout.tsx` (create) | `MemberLayout activeTab="profil"` + trail |
| `features/member/components/member-bottom-nav.tsx` (modify) | Add `"profil"` tab, enable `/profil` link, drop TODO |
| `tests/unit/profile/profile-data.test.ts` (create) | Pins dummy shape (member + coach + invalid-role-null + cameras) |
| `tests/unit/profile/profile-shell.test.ts` (create) | Pins UI contract (placeholders, no Batal/absolute, TODOs, icons) |
| `tests/unit/profile/profile-route.test.ts` (create) | Pins route wiring (layout trail/tab, nav link) |

**Plan refinement vs spec (patch spec in Task 3):** the client form state needs one owner, so Task 3 adds `profile-editor.tsx` (RHF `FormProvider` container; server `ProfileSecurityCard` passed in as `children` so it stays server) and `dummyProfileCameras` (2 devices) to the dummy module. No other spec changes.

---

### Task 1: Profile DTOs, schema, dummy, fetcher + data test (PSR-81)

**Files:**
- Create: `features/profile/types.ts`, `features/profile/schemas.ts`, `features/profile/data/profile-dummy.ts`, `features/profile/data/get-profile.ts`
- Test: `tests/unit/profile/profile-data.test.ts`

**Interfaces:**
- Consumes: `CameraDevice` from `@/features/member/types` (`{ id, label, resolution, fps, latencyMs }`).
- Produces: `ProfileRole`, `Profile`, `AthleteProfile`, `CoachProfile`, `profileSchema`, `UpdateProfileInput`, `dummyProfileForRole(role): Profile | null`, `dummyProfileCameras: CameraDevice[]`, `getProfile(role): Promise<Profile | null>`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import {
  dummyAthleteProfile,
  dummyCoachProfile,
  dummyProfileCameras,
  dummyProfileForRole,
} from "@/features/profile/data/profile-dummy";

describe("dummyProfileForRole", () => {
  it("carries the member profile verbatim from Figma 94:41585", () => {
    // Arrange + Act
    const profile = dummyProfileForRole("member");

    // Assert
    expect(profile).toEqual(dummyAthleteProfile);
    expect(dummyAthleteProfile.name).toBe("Aced Suryana");
    expect(dummyAthleteProfile.nim).toBe("2307051");
    expect(dummyAthleteProfile.email).toBe("aced.suryana@student.unsil.ac.id");
    expect(dummyAthleteProfile.beltLabel).toBe("Sabuk Kuning (Ragam 2)");
    expect(dummyAthleteProfile.avgAccuracyPct).toBe(91.4);
    expect(dummyAthleteProfile.accuracyNote).toBe("Optimal");
    expect(dummyAthleteProfile.totalSessionsLabel).toBe("48 Sesi");
    expect(dummyAthleteProfile.totalPosturesLabel).toBe("1,240 Postur");
  });

  it("resolves the coach placeholder and null for an invalid role", () => {
    // Arrange + Act
    const coach = dummyProfileForRole("coach");

    // Assert
    expect(coach).toEqual(dummyCoachProfile);
    expect(dummyCoachProfile.name).toBe("Kang Fauzan");
    expect(dummyCoachProfile.titleLabel).toBe("Pelatih Kepala UKM");
    expect(dummyCoachProfile.teamAccuracyPct).toBe(84.6);
    expect(dummyProfileForRole("admin" as never)).toBeNull();
  });

  it("carries two camera devices defaulting to FaceTime HD", () => {
    // Arrange + Act + Assert
    expect(dummyProfileCameras).toHaveLength(2);
    expect(dummyProfileCameras[0].id).toBe("facetime-hd");
    expect(dummyProfileCameras[0].label).toContain("FaceTime HD Camera");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/profile/profile-data.test.ts`
Expected: FAIL with "Failed to resolve import @/features/profile/data/profile-dummy"

- [ ] **Step 3: Write `features/profile/types.ts` (spec §4 verbatim)**

```ts
export type ProfileRole = "member" | "coach";

export interface AthleteProfile {
  role: "member";
  name: string;
  handle: string;
  nim: string;
  email: string;
  roleLabel: string;
  division: string;
  beltLabel: string;
  beltTargetLabel: string;
  avgAccuracyPct: number;
  accuracyNote: string;
  totalSessionsLabel: string;
  totalPosturesLabel: string;
  cameraDeviceLabel: string;
  passwordUpdatedLabel: string;
}

export interface CoachProfile {
  role: "coach";
  name: string;
  handle: string;
  email: string;
  titleLabel: string;
  division: string;
  teamAccuracyPct: number;
  coachedSessionsLabel: string;
  cameraDeviceLabel: string;
  passwordUpdatedLabel: string;
}

export type Profile = AthleteProfile | CoachProfile;

export interface UpdateProfileInput {
  name: string;
  nim: string;
  email: string;
  cameraDeviceId: string;
}
```

- [ ] **Step 4: Write `features/profile/schemas.ts`**

```ts
import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100, "Nama maksimal 100 karakter"),
  nim: z.string().regex(/^\d+$/, "NIM hanya berisi angka"),
  email: z.email("Email tidak valid"),
  cameraDeviceId: z.string().min(1, "Pilih perangkat kamera"),
});

export type UpdateProfileInput = z.infer<typeof profileSchema>;
```

- [ ] **Step 5: Write `features/profile/data/profile-dummy.ts`**

```ts
import type { CameraDevice } from "@/features/member/types";
import type {
  AthleteProfile,
  CoachProfile,
  Profile,
  ProfileRole,
} from "@/features/profile/types";

export const dummyAthleteProfile: AthleteProfile = {
  role: "member",
  name: "Aced Suryana",
  handle: "@aced_suryana",
  nim: "2307051",
  email: "aced.suryana@student.unsil.ac.id",
  roleLabel: "Pesilat Binaan (Anggota Pemula)",
  division: "UKM Pencak Silat Universitas Siliwangi",
  beltLabel: "Sabuk Kuning (Ragam 2)",
  beltTargetLabel: "Target Evaluasi: Sabuk Hijau (Q3 2025)",
  avgAccuracyPct: 91.4,
  accuracyNote: "Optimal",
  totalSessionsLabel: "48 Sesi",
  totalPosturesLabel: "1,240 Postur",
  cameraDeviceLabel: "FaceTime HD Camera (Ultra Wide …)",
  passwordUpdatedLabel: "Terakhir diperbarui 2 bulan yang lalu",
};

export const dummyCoachProfile: CoachProfile = {
  role: "coach",
  name: "Kang Fauzan",
  handle: "@kang_fauzan",
  email: "fauzan@unsil.ac.id",
  titleLabel: "Pelatih Kepala UKM",
  division: "UKM Pencak Silat Universitas Siliwangi",
  teamAccuracyPct: 84.6,
  coachedSessionsLabel: "24 Sesi",
  cameraDeviceLabel: "FaceTime HD Camera (Ultra Wide …)",
  passwordUpdatedLabel: "Terakhir diperbarui 2 bulan yang lalu",
};

export const dummyProfileCameras: CameraDevice[] = [
  {
    id: "facetime-hd",
    label: "FaceTime HD Camera (Ultra Wide …)",
    resolution: "1920×1080",
    fps: 30,
    latencyMs: null,
  },
  {
    id: "usb-cam",
    label: "USB Camera 1080p",
    resolution: "1920×1080",
    fps: 30,
    latencyMs: null,
  },
];

export function dummyProfileForRole(role: ProfileRole): Profile | null {
  if (role === "coach") return dummyCoachProfile;
  if (role === "member") return dummyAthleteProfile;
  return null;
}
```

- [ ] **Step 6: Write `features/profile/data/get-profile.ts`**

```ts
import "server-only";

import { cacheLife } from "next/cache";

import { dummyProfileForRole } from "@/features/profile/data/profile-dummy";
import type { Profile, ProfileRole } from "@/features/profile/types";

export async function getProfile(role: ProfileRole): Promise<Profile | null> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /member/profile, GET /coach/profile) - dummy for now
  return dummyProfileForRole(role);
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `pnpm test tests/unit/profile/profile-data.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 8: Run typecheck**

Run: `pnpm typecheck`
Expected: clean, zero errors

- [ ] **Step 9: Commit**

```bash
git add features/profile/types.ts features/profile/schemas.ts features/profile/data/profile-dummy.ts features/profile/data/get-profile.ts tests/unit/profile/profile-data.test.ts
git commit -m "feat(profile): add profile DTOs dummy fetcher"
```

---

### Task 2: Server cards (athlete + security) + shell test (PSR-83, part 1)

**Files:**
- Create: `features/profile/components/profile-athlete-card.tsx`, `features/profile/components/profile-security-card.tsx`
- Test: `tests/unit/profile/profile-shell.test.ts` (Task 3 appends client-island assertions to this same file)

**Interfaces:**
- Consumes: `Profile` from Task 1.
- Produces: `ProfileAthleteCard({ profile }: { profile: Profile })`, `ProfileSecurityCard({ passwordUpdatedLabel }: { passwordUpdatedLabel: string })`.

- [ ] **Step 1: Write the failing shell test (server-card section)**

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

const athleteSrc = () => read("features/profile/components/profile-athlete-card.tsx");
const securitySrc = () => read("features/profile/components/profile-security-card.tsx");

describe("profile server cards", () => {
  it("renders placeholder avatar with initials and no logout inside the athlete card", () => {
    // Arrange + Act
    const src = athleteSrc();

    // Assert
    expect(src).toContain('role="img"');
    expect(src).toContain("AS");
    expect(src).toContain("Camera");
    expect(src).toContain("TODO");
    expect(src).not.toContain("Logout");
    expect(src).not.toContain("Batal");
  });

  it("keeps server cards flex-only with member copy and coach label swap", () => {
    // Arrange + Act
    const src = athleteSrc();

    // Assert
    expect(src).toContain("Peran & Divisi");
    expect(src).not.toContain("absolute");
    expect(securitySrc()).not.toContain("absolute");
    expect(src).toContain("Pelatih Kepala UKM");
  });

  it("keeps Ubah Kata Sandi a dead stub with a TODO", () => {
    // Arrange + Act
    const src = securitySrc();

    // Assert
    expect(src).toContain("Ubah Kata Sandi");
    expect(src).toContain("TODO");
    expect(src).toContain("Kata Sandi Akun");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/profile/profile-shell.test.ts`
Expected: FAIL with "ENOENT" (athlete card file missing)

- [ ] **Step 3: Write `profile-athlete-card.tsx` (server, role-aware, no logout)**

```tsx
import { Camera, Gauge, Medal, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Profile } from "@/features/profile/types";

function AttributeRow({
  icon,
  eyebrow,
  value,
  note,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-muted/40 p-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        {icon}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
          {eyebrow}
        </span>
        <span className="text-xs font-semibold text-foreground">{value}</span>
        {note ? <span className="text-[11px] text-muted-foreground">{note}</span> : null}
      </span>
    </div>
  );
}

export function ProfileAthleteCard({ profile }: { profile: Profile }) {
  const isMember = profile.role === "member";
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-1 p-4">
        <div className="flex w-fit flex-col">
          <div
            role="img"
            aria-label={`Foto profil ${profile.name}`}
            className="flex size-24 items-center justify-center rounded-full bg-muted text-xl font-bold text-muted-foreground"
          >
            AS
          </div>
          {/* TODO: wire avatar upload when backend lands */}
          {/* Overlap via negative margin: badge sits on the avatar's bottom-right */}
          <button
            type="button"
            aria-label="Ubah foto profil"
            className="-mt-7 ml-[68px] flex size-7 items-center justify-center rounded-full border bg-background"
          >
            <Camera className="size-3.5" aria-hidden="true" />
          </button>
        </div>
        <h2 className="mt-1 text-lg font-bold text-foreground">{profile.name}</h2>
        <p className="text-xs text-muted-foreground">{profile.email}</p>
        <p className="text-[11px] text-muted-foreground">
          {profile.handle}
          {isMember ? ` • NIM ${profile.nim}` : null}
        </p>
        <div className="mt-2 flex w-full flex-col gap-2">
          <AttributeRow
            icon={<User className="size-4" aria-hidden="true" />}
            eyebrow={isMember ? "Peran & Divisi" : "Jabatan"}
            value={isMember ? profile.roleLabel : profile.titleLabel}
            note={profile.division}
          />
          {isMember ? (
            <AttributeRow
              icon={<Medal className="size-4" aria-hidden="true" />}
              eyebrow="Tingkatan Sabuk"
              value={profile.beltLabel}
              note={profile.beltTargetLabel}
            />
          ) : null}
          <AttributeRow
            icon={<Gauge className="size-4" aria-hidden="true" />}
            eyebrow={isMember ? "Akurasi Rata-Rata Biomekanika" : "Akurasi Tim"}
            value={isMember ? `${profile.avgAccuracyPct}% (${profile.accuracyNote})` : `${profile.teamAccuracyPct}%`}
          />
        </div>
        <div className="mt-2 grid w-full grid-cols-2 gap-2">
          <div className="flex flex-col rounded-xl border bg-muted/40 p-3">
            <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              {isMember ? "Total Sesi Latihan" : "Sesi Ulasan"}
            </span>
            <span className="text-base font-bold text-foreground">
              {isMember ? profile.totalSessionsLabel : profile.coachedSessionsLabel}
            </span>
          </div>
          <div className="flex flex-col rounded-xl border bg-muted/40 p-3">
            <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              {isMember ? "Pencatatan Sudut" : "Perangkat"}
            </span>
            <span className="text-base font-bold text-foreground">
              {isMember ? profile.totalPosturesLabel : "FaceTime HD"}
            </span>
          </div>
        </div>
        {/* Pelatih Kepala UKM — coach label-swap guard for the role prop (member Figma 94:41585 is the copy source) */}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Write `profile-security-card.tsx` (server, dead stub)**

```tsx
import { ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ProfileSecurityCard({
  passwordUpdatedLabel,
}: {
  passwordUpdatedLabel: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
          <ShieldCheck className="size-4" aria-hidden="true" /> Keamanan & Otentikasi
        </h2>
        <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/40 p-3">
          <div className="flex min-w-0 flex-col">
            <span className="text-xs font-semibold text-foreground">Kata Sandi Akun</span>
            <span className="text-[11px] text-muted-foreground">{passwordUpdatedLabel}</span>
          </div>
          {/* TODO: wire password change via lib/api-client.ts (PATCH /member/password) */}
          <button
            type="button"
            className="shrink-0 rounded-lg border bg-background px-3 py-1.5 text-[11px] font-semibold text-foreground"
          >
            Ubah Kata Sandi
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test tests/unit/profile/profile-shell.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add features/profile/components/profile-athlete-card.tsx features/profile/components/profile-security-card.tsx tests/unit/profile/profile-shell.test.ts
git commit -m "feat(profile): build athlete and security cards"
```

---

### Task 3: Client editor island (form + camera + save + logout) (PSR-83, part 2)

**Files:**
- Create: `features/profile/actions/update-profile.ts`, `features/profile/components/profile-editor.tsx`, `features/profile/components/profile-biodata-form.tsx`, `features/profile/components/profile-camera-card.tsx`, `features/profile/components/profile-save-action.tsx`, `features/profile/components/profile-logout-button.tsx`
- Modify: `tests/unit/profile/profile-shell.test.ts` (append client-island section), `docs/superpowers/specs/2026-10-11-member-profile-design.md` (spec patch, own `docs` commit)

**Interfaces:**
- Consumes: `profileSchema`, `UpdateProfileInput`, `getProfile`/`Profile`/`ProfileRole` (Task 1), `Select`/`Field`/`InputGroup`/`Button` from `@/components/ui/*`, `CameraDevice` from `@/features/member/types`.
- Produces: `updateProfile(input): Promise<UpdateProfileInput>`, `ProfileEditor({ profile, cameras, children })`, field/camera/save/logout components (no props except `cameras` on camera card).

- [ ] **Step 1: Append the client-island section to the shell test**

```ts
describe("profile client islands", () => {
  it("owns form state in the editor via FormProvider and zodResolver", () => {
    // Arrange + Act
    const src = read("features/profile/components/profile-editor.tsx");

    // Assert
    expect(src).toContain("FormProvider");
    expect(src).toContain("zodResolver(profileSchema)");
    expect(src).toContain("useForm<UpdateProfileInput>");
    expect(src).not.toContain("Batal");
  });

  it("validates the stub update at the server-action boundary with PATCH TODO", () => {
    // Arrange + Act
    const src = read("features/profile/actions/update-profile.ts");

    // Assert
    expect(src).toContain("profileSchema.parse");
    expect(src).toContain("PATCH /member/profile");
    expect(src).toContain("TODO");
  });

  it("saves once with the Save icon over toast.promise and invalidates the profile key", () => {
    // Arrange + Act
    const src = read("features/profile/components/profile-save-action.tsx");

    // Assert
    expect(src).toContain("Save");
    expect(src).toContain("toast.promise");
    expect(src).toContain("Simpan Perubahan");
    expect(src).toContain('["profile"]');
    expect(src).not.toContain("Batal");
  });

  it("logs out via a non-primary outline button with a sign-out TODO", () => {
    // Arrange + Act
    const src = read("features/profile/components/profile-logout-button.tsx");

    // Assert
    expect(src).toContain("LogOut");
    expect(src).toContain('variant="outline"');
    expect(src).toContain("TODO");
    expect(src).toContain("Logout");
  });

  it("keeps every client island free of absolute positioning", () => {
    // Arrange + Act + Assert
    for (const file of [
      "features/profile/components/profile-editor.tsx",
      "features/profile/components/profile-biodata-form.tsx",
      "features/profile/components/profile-camera-card.tsx",
      "features/profile/components/profile-save-action.tsx",
      "features/profile/components/profile-logout-button.tsx",
    ]) {
      expect(read(file)).not.toContain("absolute");
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/profile/profile-shell.test.ts`
Expected: FAIL with "ENOENT" (editor file missing)

- [ ] **Step 3: Write `features/profile/actions/update-profile.ts`**

```ts
"use server";

import "server-only";

import { profileSchema, type UpdateProfileInput } from "@/features/profile/schemas";

export async function updateProfile(input: UpdateProfileInput): Promise<UpdateProfileInput> {
  const parsed = profileSchema.parse(input);
  // TODO: connect backend via lib/api-client.ts (PATCH /member/profile) - stub echoes input for now
  return parsed;
}
```

- [ ] **Step 4: Write `profile-editor.tsx` (form owner)**

```tsx
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
```

- [ ] **Step 5: Write `profile-biodata-form.tsx` (fields only, member-shaped this move)**

```tsx
"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
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
      <CardContent className="flex flex-col gap-3 p-4">
        <h2 className="text-sm font-bold text-foreground">Pengaturan Akun & Biodata Silat</h2>
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
```

- [ ] **Step 6: Write `profile-camera-card.tsx` (Select mirrors `camera-source-card.tsx`)**

```tsx
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
```

- [ ] **Step 7: Write `profile-save-action.tsx` (single primary CTA, Save icon)**

```tsx
"use client";

import { useFormContext } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateProfile } from "@/features/profile/actions/update-profile";
import type { UpdateProfileInput } from "@/features/profile/schemas";

export function ProfileSaveAction() {
  const { handleSubmit, formState } = useFormContext<UpdateProfileInput>();
  const queryClient = useQueryClient();
  const mutation = useMutation<UpdateProfileInput, Error, UpdateProfileInput>({
    mutationFn: (values) => updateProfile(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const onSubmit = (values: UpdateProfileInput) =>
    toast.promise(mutation.mutateAsync(values), {
      loading: "Menyimpan perubahan…",
      success: "Perubahan tersimpan (stub)",
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
```

- [ ] **Step 8: Write `profile-logout-button.tsx` (bottom, non-primary)**

```tsx
"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProfileLogoutButton() {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full text-destructive"
      onClick={() => {
        // TODO: wire sign-out (auth session clear)
      }}
    >
      <LogOut className="size-4" aria-hidden="true" /> Logout
    </Button>
  );
}
```

- [ ] **Step 9: Run tests to verify they pass**

Run: `pnpm test tests/unit/profile/profile-shell.test.ts`
Expected: PASS (8 tests: 3 server + 5 client)

- [ ] **Step 10: Run typecheck**

Run: `pnpm typecheck`
Expected: clean, zero errors

- [ ] **Step 11: Commit the behavior + test**

```bash
git add features/profile/actions/update-profile.ts features/profile/components/profile-editor.tsx features/profile/components/profile-biodata-form.tsx features/profile/components/profile-camera-card.tsx features/profile/components/profile-save-action.tsx features/profile/components/profile-logout-button.tsx tests/unit/profile/profile-shell.test.ts
git commit -m "feat(profile): build profile editor form and actions"
```

- [ ] **Step 12: Patch the spec (editor + cameras) and commit docs separately**

Apply two edits to `docs/superpowers/specs/2026-10-11-member-profile-design.md`: (a) in §3 client-boundary paragraph, add `profile-editor.tsx` as the form owner (`useForm` + `FormProvider`; server `ProfileSecurityCard` passed as `children`); (b) in §4, add `dummyProfileCameras: CameraDevice[]` (2 devices, FaceTime HD default) to the DTO block.

```bash
git add docs/superpowers/specs/2026-10-11-member-profile-design.md
git commit -m "docs(profile): note editor island and camera dummies"
```

---

### Task 4: Wire `/profil` route + nav + gates (PSR-82)

**Files:**
- Create: `features/profile/pages/profile-page.tsx`, `app/(member)/profil/page.tsx`, `app/(member)/profil/layout.tsx`, `tests/unit/profile/profile-route.test.ts`
- Modify: `features/member/components/member-bottom-nav.tsx`

**Interfaces:**
- Consumes: `getProfile`, `dummyProfileCameras`, `ProfileAthleteCard`, `ProfileEditor`, `ProfileSecurityCard`, `MemberLayout` (+ `MemberTab`).
- Produces: `ProfilePage({ role })`, live `/profil` with Profil tab active.

- [ ] **Step 1: Write the failing route test**

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("profil route wiring", () => {
  it("renders ProfilePage role=member inside MemberLayout with the Profil trail", () => {
    // Arrange + Act
    const page = read("app/(member)/profil/page.tsx");
    const layout = read("app/(member)/profil/layout.tsx");

    // Assert
    expect(page).toContain('role="member"');
    expect(page).toContain("ProfilePage");
    expect(layout).toContain('activeTab="profil"');
    expect(layout).toContain('"Profil"');
  });

  it("enables the Profil tab in the member bottom nav", () => {
    // Arrange + Act
    const src = read("features/member/components/member-bottom-nav.tsx");

    // Assert
    expect(src).toContain('"profil"');
    expect(src).toContain('href="/profil"');
    expect(src).not.toContain("TODO: link to /profil");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/profile/profile-route.test.ts`
Expected: FAIL with "ENOENT" (`app/(member)/profil/page.tsx` missing)

- [ ] **Step 3: Write `features/profile/pages/profile-page.tsx`**

```tsx
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { dummyProfileCameras } from "@/features/profile/data/profile-dummy";
import { getProfile } from "@/features/profile/data/get-profile";
import type { ProfileRole } from "@/features/profile/types";
import { ProfileAthleteCard } from "@/features/profile/components/profile-athlete-card";
import { ProfileEditor } from "@/features/profile/components/profile-editor";
import { ProfileSecurityCard } from "@/features/profile/components/profile-security-card";

export function ProfilePage({ role }: { role: ProfileRole }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5 pt-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Profil & Pengaturan Akun
        </h1>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Kelola data biomekanika personal, telemetry stream perangkat kamera, dan
          preferensi akun atlet Anda.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <AthleteSection role={role} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <EditorSection role={role} />
      </Suspense>
    </div>
  );
}

async function AthleteSection({ role }: { role: ProfileRole }) {
  const profile = await getProfile(role);
  if (!profile) return null;
  return <ProfileAthleteCard profile={profile} />;
}

async function EditorSection({ role }: { role: ProfileRole }) {
  const profile = await getProfile(role);
  if (!profile) return null;
  return (
    <ProfileEditor profile={profile} cameras={dummyProfileCameras}>
      <ProfileSecurityCard passwordUpdatedLabel={profile.passwordUpdatedLabel} />
    </ProfileEditor>
  );
}
```

- [ ] **Step 4: Write `app/(member)/profil/page.tsx` (thin RSC, no logic)**

```tsx
import { ProfilePage } from "@/features/profile/pages/profile-page";

export default function Page() {
  return <ProfilePage role="member" />;
}
```

- [ ] **Step 5: Write `app/(member)/profil/layout.tsx` (mirrors `riwayat/layout.tsx`)**

```tsx
import type { ReactNode } from "react";
import { MemberLayout } from "@/features/member/pages/member-layout";

export default function ProfilLayout({ children }: { children: ReactNode }) {
  return (
    <MemberLayout activeTab="profil" trail={["Dashboard", "Profil"]}>
      {children}
    </MemberLayout>
  );
}
```

- [ ] **Step 6: Enable the Profil tab in `member-bottom-nav.tsx`**

Change `MemberTab` to `"dashboard" | "latihan" | "riwayat" | "profil"`, add `const profilActive = activeTab === "profil";`, and replace the disabled Profil block (including the `{/* TODO: link to /profil when the route lands */}` comment) with the active/link pair mirroring the Riwayat item:

```tsx
<li className={`${itemClass} ${profilActive ? "text-primary" : "text-muted-foreground"}`}>
  {profilActive ? (
    <span aria-current="page" className={linkInner}>
      <User className="size-4" aria-hidden="true" />
      Profil
    </span>
  ) : (
    <Link href="/profil" className={linkInner}>
      <User className="size-4" aria-hidden="true" />
      Profil
    </Link>
  )}
</li>
```

- [ ] **Step 7: Run the new tests**

Run: `pnpm test tests/unit/profile/`
Expected: PASS (all three suites: data, shell, route)

- [ ] **Step 8: Run full gates**

Run: `pnpm build`
Expected: compiles successfully, no errors

Run: `pnpm typecheck`
Expected: clean, zero errors

Run: `pnpm lint`
Expected: clean, zero warnings/errors on touched files

Run: `pnpm test`
Expected: all suites PASS

- [ ] **Step 9: Browser overflow check (`/profil`, 390px)**

Start the dev server detached per `AGENTS.md` (fresh port, e.g. 3101; bump if occupied), wait for readiness (max ~3 bounded re-checks), open via Playwright tab-new, navigate to `/profil`, and evaluate `document.documentElement.scrollWidth <= window.innerWidth`. Stop the server (`taskkill /PID <pid> /T /F`), confirm the port is free, delete Temp logs and `.playwright-mcp/`, verify `git status --short` shows only intended files. Paste the check result into the `In Review` comment.
Expected: `true`

- [ ] **Step 10: Commit**

```bash
git add features/profile/pages/profile-page.tsx "app/(member)/profil/page.tsx" "app/(member)/profil/layout.tsx" features/member/components/member-bottom-nav.tsx tests/unit/profile/profile-route.test.ts
git commit -m "feat(profile): wire profil route and nav"
```

---

## Self-Review

**1. Spec coverage:** Goal (§1) → Tasks 2–4. Deltas (§2): Batal-drop → shell test negative assertions (Tasks 2–3) + no Batal in any new file; logout-bottom-outline → Task 3 Step 8 + page-end order in editor (Step 4); placeholders → athlete card `role="img"` (Task 2); Save icon + PATCH stub → Task 3 Steps 3/7; role-prop sharing → types + athlete card conditional + `ProfilePage({ role })` (Tasks 1/2/4), coach route OUT respected (only `role="member"` wired). Architecture (§3) → Tasks 2–4 file-for-file (plus editor refinement, spec-patched in Task 3 Step 12). DTOs (§4) → Task 1 verbatim + pins. UI pattern (§5) → Task 2/3 components + shell assertions. Data flow (§6) → fetcher (Task 1), mutation + invalidation + read-your-own-write note (Task 3; implementer re-reads via `getProfile` before Done). Verification (§7) → data/shell/route tests + gates + browser step (Task 4). Tracking (§8) → branch + issues already exist (PSR-80–83).

**2. Placeholder scan:** fixed inline — every `TODO` in the plan is a literal stub string the engineer writes (spec-required endpoint TODOs), not plan vagueness; editor deviation handled via explicit spec-patch step; no "similar to", no missing signatures.

**3. Type consistency:** `UpdateProfileInput` defined once in `schemas.ts` (Task 1 Step 4) and imported everywhere else (editor, fields, camera, save, action); `Profile`/`ProfileRole` from `types.ts`; `cameras: CameraDevice[]` prop threading editor → camera card; `children: ReactNode` carries the server security card; `["profile"]` invalidation key matches the `getProfile` domain.
