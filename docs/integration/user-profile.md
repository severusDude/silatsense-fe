# User & Coach Profile (`/profil`) — FE ↔ BE Integration Spec

- **Status:** Draft — Phase 14 (Member Profile) shipped; Phase 20 (Coach Profile) audited & awaiting approval (2026-11-08).
- **Date:** 2026-11-08
- **Linear:** PSR-111 (Phase 14 Member Profile, Done); PSR-135 `[profile] Audit coach profile contract` (label `docs`, project `silatsense`, assignee `me`). Implementation parent/sub-issues created after spec approval.
- **Branch:** `feature/psr-135-profile-audit-coach-profile-contract` (cut from `origin/development`).
- **Scope:** Shared profile module (`features/profile/**`) and `/profil` route (`app/profil/**`, migrated from `app/(member)/profil/**`) for **Coach Profile** (`role="coach"`) alongside **Member Profile** (`role="member"`):
  - `GET /api/v1/coach/profile` & `GET /api/v1/member/profile`
  - `PATCH /api/v1/coach/profile` & `PATCH /api/v1/member/profile`
  - `PATCH /api/v1/coach/password` & `PATCH /api/v1/member/password`
- **Out of scope:** Avatar image upload (no BE endpoint), email verification/linking UI flows, password reset/recovery screens, other coach modules (`/coach`, `/coach/members/**`, `/coach/laporan`), all other member routes, backend changes.
- **BE source of truth:** `https://silatsense-be.vercel.app/openapi.json` (v0.7.0, verified 2026-11-08). Generated client in `src/api/` is in sync with this contract.
- **FE baseline:** Next.js 16.3.8 (`cacheComponents: true`), React 19.2.8, TanStack Query 5.104.1, Zod 4.6.5, `@hey-api/openapi-ts` 0.99.0 generated client in `src/api/`.
- **Canonical conventions:** [`docs/integration/README.md`](./README.md), [`docs/integration/authentication.md`](./authentication.md), [`docs/CODE_STANDARD.md`](../CODE_STANDARD.md).

---

## 0. TL;DR

Phase 14 (`PSR-111`) wired the profile module (`features/profile`) for **Member Profile** (`GET /api/v1/member/profile`, `PATCH /api/v1/member/profile`, `PATCH /api/v1/member/password`). However, **Coach Profile** (`role="coach"`) remains only partially wired and currently breaks at runtime due to five concrete gaps:

1. **Route & AuthGate Block (`app/(member)/profil`):**
   `CoachBottomNav` links the `Profil` tab to `/profil`, but `/profil` lives inside `app/(member)/profil/page.tsx` under `app/(member)/layout.tsx` (`<AuthGate role="member">`) and `<MemberLayout>`. When an authenticated coach navigates to `/profil`, `requireRole("member")` immediately redirects them back to `/coach`. Even without the redirect, `app/(member)/profil/page.tsx` hardcodes `<ProfilePage role="member" />` and `MemberLayout`.
2. **Hardcoded Member Profile Patch (`update-profile.ts`):**
   `updateProfileAction` only calls `updateMemberProfileApiV1MemberProfilePatch` (`PATCH /api/v1/member/profile`) and only forwards `{ fullName, division }`. It never calls `updateCoachProfileApiV1CoachProfilePatch` (`PATCH /api/v1/coach/profile`), nor does it accept or forward `title` (`CoachProfilePatch.title`).
3. **Hardcoded Member Password Patch (`change-password.ts`):**
   `changePasswordAction` only calls `memberPasswordApiV1MemberPasswordPatch` (`PATCH /api/v1/member/password`). It never calls `coachPasswordApiV1CoachPasswordPatch` (`PATCH /api/v1/coach/password`), causing a `403 Forbidden` if a coach submits the password dialog.
4. **Hardcoded Member Query Key Invalidation & Biodata Fields:**
   - `ProfileSaveAction` only invalidates `memberProfileApiV1MemberProfileGetQueryKey()`, ignoring `coachProfileApiV1CoachProfileGetQueryKey()`.
   - `ProfileBiodataForm` only renders `Nama Lengkap` (editable), `Nomor Induk / NPM Pesilat` (read-only), and `Email Akun Mahasiswa` (read-only). Coaches have `npm: null` in `ProfileOut`, while `CoachProfilePatch` allows editing `fullName`, `title` (Jabatan), and `division` (Divisi / Perguruan).
   - `ProfileCameraCard` (`Konfigurasi Input kamera`) is unconditionally rendered even though coaches do not record training sessions.
5. **Inconsistent Coach Mini-Stat Tile (`ProfileAthleteCard` & `profile-mapper.ts`):**
   `ProfileOut.statistics` is `null` for coaches and does not expose a coach reviewed-session count (`Sesi Ulasan`), yet `ProfileAthleteCard` renders the left mini-stat tile (`Sesi Ulasan`) as **active** with `"0 Sesi"` instead of **inactive (`"Coming soon"`)**.

### Approved Direction (Resolved 2026-11-08, A1–A4):
- **A1 (Shared `/profil` route with server role resolution):** Move `app/(member)/profil` to top-level `app/profil/` (`layout.tsx`, `page.tsx`, `error.tsx`). Resolve the authenticated session via `requireSession()` inside `<Suspense>`, rendering `CoachLayout` + `<ProfilePage role="coach" />` for coaches and `MemberLayout` + `<ProfilePage role="member" />` for members.
- **A2 (Role-aware Biodata Form):** For `role === "coach"`, render editable `fullName` (`Nama Lengkap`), `title` (`Jabatan`), and `division` (`Divisi / Perguruan`), plus read-only `email` (`Email Akun Pelatih`), and hide `NPM`. Keep the Member form unchanged (`fullName` editable, `NPM` and `email` read-only).
- **A3 (Honest UI on Coach `Sesi Ulasan` tile):** Mark the left mini-stat tile (`Sesi Ulasan`) as **visually inactive (`"Coming soon"`)** when `role === "coach"` (or `statistics === null`), matching `Akurasi Tim` and `Perangkat`.
- **A4 (Hide Camera Card for Coach):** Hide `ProfileCameraCard` when `role === "coach"` since only members record training videos.

---

## 1. Phase 1 Assessment — Current FE Inventory (`{Coach Profile}`)

### 1.1 Routes, Layouts, and Page Compositions

| Route / File | Server / Client | Current Behavior & Data Flow | Coach Profile Issue |
|---|---|---|---|
| `app/(member)/layout.tsx` | Server (RSC) | Wraps all `(member)` routes in `<Suspense fallback={null}><AuthGate role="member">{children}</AuthGate></Suspense>`. | Blocks coaches (`requireRole("member")` redirects coaches to `/coach`). |
| `app/(member)/profil/layout.tsx` | Server (RSC) | Wraps children in `<MemberLayout activeTab="profil" trail={["Dashboard", "Profil"]}>`. | Always renders member top/bottom nav instead of `CoachLayout`. |
| `app/(member)/profil/page.tsx` | Server (RSC) | Renders `<ProfilePage role="member" />`. | Hardcodes `role="member"`, never passes `role="coach"`. |
| `features/coach/components/coach-bottom-nav.tsx` | Server (RSC) | 4th tab: `{ id: "profil", label: "Profil", href: "/profil", Icon: User }`. | Navigates coach to `/profil`, which immediately redirects back to `/coach`. |
| `features/profile/pages/profile-page.tsx` (`ProfilePage`) | Server (RSC) | Accepts `{ role: ProfileRole }`. Renders static H1/description + two `<Suspense>` sections (`AthleteSection`, `EditorSection`), each calling `getProfile(role)`. | Subtitle copy is athlete/camera-specific (`"...telemetry stream perangkat kamera, dan preferensi akun atlet Anda"`). Always passes `dummyProfileCameras` to `ProfileEditor`. |

### 1.2 Components (`features/profile/components/`)

| Component | Server / Client | Props | Current Responsibility & Coach Gap |
|---|---|---|---|
| `profile-athlete-card.tsx` (`ProfileAthleteCard`) | Server (RSC) | `{ profile: ProfileViewModel }` | Renders avatar initials (`role="img"`), disabled camera upload button (`TODO: wire avatar upload`), name, email, `@handle` (+ `• NIM {npm}` if `isMember`), `AttributeRow` for `Peran & Divisi` / `Jabatan` (`profile.roleLabel` + `profile.division`), `Tingkatan Sabuk` (if `isMember`), inactive `accuracyStat` (`Akurasi Tim` for coach) with `"Coming soon"` Badge, active left tile (`Total Sesi Latihan` / `Sesi Ulasan` → `profile.totalSessionsLabel`), and inactive right tile (`Pencatatan Sudut` / `Perangkat` → `"Coming soon"`). **Gap:** Left tile `Sesi Ulasan` is rendered **active** (`0 Sesi`) for coaches even though `ProfileOut.statistics` is `null` and BE has no reviewed-session count on `ProfileOut`. |
| `profile-editor.tsx` (`ProfileEditor`) | Client (`"use client"`) | `{ profile: ProfileViewModel; cameras: CameraDevice[]; children: ReactNode }` | Initializes `useForm<UpdateProfileInput>` with `zodResolver(profileSchema)` and `defaultValues: { name, nim, email, cameraDeviceId }`. Renders `ProfileBiodataForm`, `ProfileCameraCard`, `children` (`ProfileSecurityCard`), `ProfileSaveAction`, `ProfileLogoutButton`. **Gap:** Does not seed `role`, `title`, or `division` into `defaultValues`; unconditionally renders `ProfileCameraCard` for coaches; does not pass `role` to `ProfileBiodataForm` or `ProfileSaveAction`. |
| `profile-biodata-form.tsx` (`ProfileBiodataForm`) | Client (`"use client"`) | — | Reads `useFormContext<UpdateProfileInput>()`. Renders `name` (`Nama Lengkap`, editable), `nim` (`Nomor Induk / NPM Pesilat`, readOnly + disabled), `email` (`Email Akun Mahasiswa`, readOnly + disabled). **Gap:** Shows member-only `nim` field and member labels for coaches; has no inputs for coach `title` (`Jabatan`) or `division` (`Divisi / Perguruan`). |
| `profile-camera-card.tsx` (`ProfileCameraCard`) | Client (`"use client"`) | `{ cameras: CameraDevice[] }` | Persists preferred camera ID in `localStorage` (`silatsense_preferred_camera`) via `useSyncExternalStore`. **Gap:** Rendered for coaches even though coaches do not record training videos (Approved A4: hide for `role === "coach"`). |
| `profile-security-card.tsx` (`ProfileSecurityCard`) | Client (`"use client"`) | `{ passwordUpdatedLabel: string }` | Renders `Kata Sandi Akun` + `passwordUpdatedLabel` and opens `ChangePasswordDialog`. **Gap:** Does not accept or forward `role: ProfileRole` to `ChangePasswordDialog`, and card description is hardcoded (`"Kelola proteksi akun atlet dan akses pelatih."`). |
| `change-password-dialog.tsx` (`ChangePasswordDialog`) | Client (`"use client"`) | `{ open: boolean; onOpenChange: (open: boolean) => void }` | RHF + `zodResolver(passwordChangeFormSchema)`. Calls `changePasswordAction(values)` inside `startTransition`. **Gap:** Does not pass `role` to `changePasswordAction` and does not call `router.refresh()` after updating password (`passwordChangedAt` label stays stale until reload). |
| `profile-save-action.tsx` (`ProfileSaveAction`) | Client (`"use client"`) | — | `useMutation` calling `updateProfileAction(values)` wrapped in `toast.promise`. On success: invalidates `memberProfileApiV1MemberProfileGetQueryKey()`, calls `reset(variables)` and `router.refresh()`. **Gap:** Does not invalidate `coachProfileApiV1CoachProfileGetQueryKey()` when `role === "coach"`. |
| `profile-logout-button.tsx` (`ProfileLogoutButton`) | Client (`"use client"`) | — | Calls `signOutAction()`, shows toast, `router.replace(res.data.redirectTo)` + `router.refresh()`. Works for both roles. |

### 1.3 Hooks, Local Types, Zod Schemas, Mocks/Fixtures, Data Fetching, and Actions

- **Hooks:** Uses `useForm` / `useFormContext` / `Controller` (`react-hook-form`), `useMutation` / `useQueryClient` (`@tanstack/react-query`), `useSyncExternalStore` / `useTransition` / `useState` (`react`), `useRouter` (`next/navigation`). No custom hooks directory under `features/profile/`.
- **Local Types (`features/profile/types.ts`):**
  - Re-exports wire types `CoachProfilePatch`, `MemberProfilePatch`, `PasswordChange`, `ProfileOut` from `@/api`.
  - Defines `ProfileRole = "member" | "coach"`, `ActionResult<T>`, `StatItemViewModel`, and `ProfileViewModel` (plus alias `Profile = ProfileViewModel`).
  - **Gap:** `ProfileViewModel` lacks `title: string` (raw/editable Jabatan value for coach form seeding, distinct from `roleLabel` which is display copy) and lacks `sessionStat: StatItemViewModel` to distinguish active member `Total Sesi Latihan` from inactive coach `Sesi Ulasan`.
- **Local Zod Schemas (`features/profile/schemas.ts`):**
  - `updateProfileSchema` (aliased as `profileSchema`): validates `name` (optional, trimmed 2..120), `fullName` (optional, trimmed 2..120), `division` (`z.string().max(120).optional().nullable()`), `nim` (optional), `email` (optional), `cameraDeviceId` (optional), with `.refine()` requiring `name` or `fullName` ≥ 2 chars.
  - **Gap:** `updateProfileSchema` has no `role` (`"member" | "coach"`) or `title` (`z.string().trim().max(120).optional().nullable()`) fields for `CoachProfilePatch`.
  - `passwordChangeFormSchema`: validates `currentPassword` (8..128), `newPassword` (8..128), `confirmPassword` (8..128), plus refinements for `newPassword === confirmPassword` and `currentPassword !== newPassword`.
  - **Gap:** `passwordChangeFormSchema` (or `changePasswordAction` input) has no optional `role` discriminator (`"member" | "coach"`).
- **Mocks / Fixtures (`features/profile/data/profile-dummy.ts`):**
  - Exports `dummyMemberProfileDto`, `dummyCoachProfileDto`, `dummyAthleteProfile`, `dummyCoachProfile`, `dummyProfileCameras`, and `dummyProfileForRole(role)`.
  - Still imported by `features/profile/pages/profile-page.tsx` (for `dummyProfileCameras`) and `tests/unit/profile/profile-data.test.ts`.
- **Data Fetching (`features/profile/data/get-profile.ts`) & Mapper (`features/profile/data/profile-mapper.ts`):**
  - `getProfile = cache(async (role: ProfileRole = "member"): Promise<ProfileViewModel | null> => ...)`:
    - Reads token via `getAccessToken()`; returns `null` if missing.
    - Selects `coachProfileApiV1CoachProfileGet` when `role === "coach"`, else `memberProfileApiV1MemberProfileGet`.
    - Passes `headers: { Authorization: \`Bearer ${token}\` }`, `cache: "no-store"`, `throwOnError: false`.
    - Returns `null` on `401`, throws `Error` on other errors/empty data, and maps via `toProfileViewModel(data)`.
- **Server Actions (`features/profile/actions/`):**
  - `update-profile.ts` (`updateProfileAction`):
    - Assumed endpoint: **hardcoded** `PATCH /api/v1/member/profile` (`updateMemberProfileApiV1MemberProfilePatch`).
    - Assumed payload: `{ fullName: resolvedName ?? null, ...(division !== undefined ? { division } : {}) }`.
    - Assumed response: `200 ProfileOut`.
  - `change-password.ts` (`changePasswordAction`):
    - Assumed endpoint: **hardcoded** `PATCH /api/v1/member/password` (`memberPasswordApiV1MemberPasswordPatch`).
    - Assumed payload: `{ currentPassword, newPassword }`.
    - Assumed response: `204 void` → `{ ok: true, data: { success: true } }`.

---

## 2. Phase 1 Assessment — Backend Contract Snapshot

### 2.1 Endpoints (`Account profile` & `Authentication`)

All endpoints below require `HTTPBearer` (`Authorization: Bearer <accessToken>`). These are singleton account endpoints — there are **no path parameters, no query parameters, and no pagination/filter parameters**.

| # | Method + Path | Auth | Request Body | Success Response | Error Statuses & Shape | Generated SDK Function |
|---|---|---|---|---|---|---|
| 1 | `GET /api/v1/coach/profile` | Bearer (`coach`) | — | `200 ProfileOut` | `401, 403, 422, 500` (`DomainErrorOut`) | `coachProfileApiV1CoachProfileGet` |
| 2 | `PATCH /api/v1/coach/profile` | Bearer (`coach`) | `CoachProfilePatch` | `200 ProfileOut` | `401, 403, 422, 500` (`DomainErrorOut`) | `updateCoachProfileApiV1CoachProfilePatch` |
| 3 | `PATCH /api/v1/coach/password` | Bearer (`coach`) | `PasswordChange` | `204 void` | `401, 403, 422, 500` (`DomainErrorOut`) | `coachPasswordApiV1CoachPasswordPatch` |
| 4 | `GET /api/v1/member/profile` | Bearer (`member`) | — | `200 ProfileOut` | `401, 403, 422, 500` (`DomainErrorOut`) | `memberProfileApiV1MemberProfileGet` |
| 5 | `PATCH /api/v1/member/profile` | Bearer (`member`) | `MemberProfilePatch` | `200 ProfileOut` | `401, 403, 422, 500` (`DomainErrorOut`) | `updateMemberProfileApiV1MemberProfilePatch` |
| 6 | `PATCH /api/v1/member/password` | Bearer (`member`) | `PasswordChange` | `204 void` | `401, 403, 422, 500` (`DomainErrorOut`) | `memberPasswordApiV1MemberPasswordPatch` |
| 7 | `GET /api/v1/auth/session` | Bearer (`any`) | — | `200 AuthUser` | `401, 422, 500` (`DomainErrorOut`) | `authSessionApiV1AuthSessionGet` (via `getSession()` / `requireSession()`) |

### 2.2 Generated Wire DTOs (verbatim from `src/api/types.gen.ts`)

```ts
export type ProfileOut = {
  id: string;
  role: 'member' | 'coach';
  fullName: string;
  npm: string | null;
  email: string | null;
  emailVerifiedAt: string | null; // ISO 8601 datetime
  division: string | null;
  title: string | null;
  belt: string | null;
  beltTarget: string | null;
  passwordChangedAt: string | null; // ISO 8601 datetime
  coach: CoachIdentity | null;
  createdAt: string; // ISO 8601 datetime
  statistics: ActivitySummary | null;
};

export type CoachProfilePatch = {
  fullName?: string | null; // max 120 chars
  division?: string | null; // max 120 chars
  title?: string | null;    // max 120 chars
};

export type MemberProfilePatch = {
  fullName?: string | null; // max 120 chars
  division?: string | null; // max 120 chars
};

export type PasswordChange = {
  currentPassword: string; // 8..128 chars
  newPassword: string;     // 8..128 chars
};

export type CoachIdentity = {
  id: string;
  fullName: string;
  title: string | null;
};

export type ActivitySummary = {
  completedSessionCount: number;
  totalDurationSeconds: number;
  durationSampleCount: number;
  scoredSessionCount: number;
  excludedScoreCount: number;
  similarityGroups: Array<SimilarityGroup>;
};

export type SimilarityGroup = {
  movementSlug: string;
  method: string;
  analyzerVersion: string;
  featureVersion: string;
  referenceVersion: string;
  averageScore: number | null;
  sampleCount: number;
};

export type AuthUser = {
  id: string;
  fullName: string;
  identifier: string;
  role: 'member' | 'coach';
};

export type DomainErrorOut = {
  detail: string;
  code: string;
  requestId: string;
  errors?: Array<ValidationIssue> | null;
};
```

### 2.3 Generated Zod Schemas (verbatim from `src/api/zod.gen.ts`)

```ts
export const zCoachProfilePatch = z.object({
  fullName: z.string().max(120).nullish(),
  division: z.string().max(120).nullish(),
  title: z.string().max(120).nullish(),
});

export const zMemberProfilePatch = z.object({
  fullName: z.string().max(120).nullish(),
  division: z.string().max(120).nullish(),
});

export const zPasswordChange = z.object({
  currentPassword: z.string().min(8).max(128),
  newPassword: z.string().min(8).max(128),
});

export const zProfileOut = z.object({
  id: z.string(),
  role: z.enum(['member', 'coach']),
  fullName: z.string(),
  npm: z.string().nullable(),
  email: z.string().nullable(),
  emailVerifiedAt: z.iso.datetime().nullable(),
  division: z.string().nullable(),
  title: z.string().nullable(),
  belt: z.string().nullable(),
  beltTarget: z.string().nullable(),
  passwordChangedAt: z.iso.datetime().nullable(),
  coach: zCoachIdentity.nullable(),
  createdAt: z.iso.datetime(),
  statistics: zActivitySummary.nullable(),
});

export const zCoachProfileApiV1CoachProfileGetResponse = zProfileOut;
export const zUpdateCoachProfileApiV1CoachProfilePatchBody = zCoachProfilePatch;
export const zUpdateCoachProfileApiV1CoachProfilePatchResponse = zProfileOut;
export const zCoachPasswordApiV1CoachPasswordPatchBody = zPasswordChange;
export const zCoachPasswordApiV1CoachPasswordPatchResponse = z.void();
```

---

## 3. Phase 1 & 2 — Gap Analysis

Status legend:
- **Match** — directly supported with identical semantics.
- **Mismatch** — route guard, endpoint target, field name, nullability, or format differs; resolved in routing, mapper, or action dispatch.
- **Missing in BE** — UI expects data or capability not exposed by the endpoint; rendered inactive (`opacity-60 bg-muted/20 border-dashed`) with `"Coming soon"` or read-only/client-only per [`README.md`](./README.md) §6.
- **Derived** — computed deterministically from real BE fields in `profile-mapper.ts`.
- **Unused in BE** — present on `ProfileOut` but not displayed on `/profil`.

### 3.1 Comprehensive Gap Table (Coach & Member Profile)

| FE Need / Assumed Behavior | BE Endpoint & Field | Status | Notes (Field Names, Types, Nullability, Enums, Date Formats) |
|---|---|---|---|
| **Routing & Shell** | | | |
| Coach navigates to `/profil` from `CoachBottomNav` | `GET /api/v1/auth/session` → `AuthUser.role` (`'member' \| 'coach'`) | **Mismatch (route guard & shell)** | `/profil` currently sits under `app/(member)/layout.tsx` (`AuthGate role="member"`), redirecting coaches to `/coach`. Move `/profil` to `app/profil/`, resolve `user = await requireSession()`, and render `CoachLayout` + `<ProfilePage role="coach" />` for coaches or `MemberLayout` + `<ProfilePage role="member" />` for members (Approved A1). |
| **Identity & Profile Card (`ProfileAthleteCard`)** | | | |
| `id` (`string`) | `ProfileOut.id` (`string`) | **Match** | Opaque user ID. |
| `role` (`'member' \| 'coach'`) | `ProfileOut.role` (`'member' \| 'coach'`) | **Match** | Exact enum match. |
| `name` (`string`) | `ProfileOut.fullName` (`string`, non-null) | **Mismatch (field name)** | Map `dto.fullName` → `vm.name`. |
| Avatar `initials` (`"KF"`, `"AS"`) | `ProfileOut.fullName` (`string`) | **Derived** | `getInitials(dto.fullName)` (first letters of first two words, or first 2 chars of single word; fallback `"SS"`). |
| Avatar photo URL / upload button | — | **Missing in BE** | No avatar field or upload endpoint in `ProfileOut`. Keep initials circle + disabled camera button (`TODO: wire avatar upload when backend lands`). |
| `handle` (`"@kang_fauzan"`) | — | **Derived** | No handle field in BE. Derived via `deriveHandle(dto.fullName)` (`@` + lowercase alphanumeric underscore slug). |
| `email` (`string`) | `ProfileOut.email` (`string \| null`) | **Mismatch (nullability)** | Nullable in BE. Map `dto.email ?? "Email belum ditautkan"`. |
| `npm` (`string`, Member only) | `ProfileOut.npm` (`string \| null`) | **Mismatch (name & nullability)** | Always `null` for coaches; string or `null` for members. Map `dto.npm ?? "-"`. Rendered in card header only when `isMember && profile.npm !== "-"`. |
| `title` / `roleLabel` (Coach: `"Pelatih Kepala UKM"`, Member: `"Pesilat Binaan (Anggota Pemula)"`) | `ProfileOut.title` (`string \| null`) | **Mismatch (nullability & role fallback)** | For coach: `roleLabel = dto.title ?? "Pelatih Kepala UKM"`, raw `title = dto.title ?? ""`. For member: `roleLabel = "Pesilat Binaan (Anggota Pemula)"`, `title = ""`. |
| `division` (`"UKM Pencak Silat Universitas Siliwangi"`) | `ProfileOut.division` (`string \| null`) | **Mismatch (nullability)** | Nullable in BE. Map `dto.division ?? "UKM Pencak Silat Universitas Siliwangi"`. |
| `beltLabel` & `beltTargetLabel` (Member only) | `ProfileOut.belt` (`string \| null`), `ProfileOut.beltTarget` (`string \| null`) | **Match (Member) / Unused (Coach)** | Always `null` for coaches (`AttributeRow` hidden when `!isMember`). For members: fallback `"Belum ditentukan"`. |
| `passwordUpdatedLabel` (`"Terakhir diperbarui 2 bulan yang lalu"`) | `ProfileOut.passwordChangedAt` (`string \| null`, ISO 8601 datetime) | **Mismatch (date format & nullability)** | Formatted via `formatRelativeTime(dto.passwordChangedAt)` (`Intl.RelativeTimeFormat("id")`). If `null`: `"Belum pernah diperbarui"`. |
| **Statistical Metrics (`ProfileAthleteCard`)** | | | |
| Coach `Akurasi Tim` (`84.6%`) / Member `Akurasi Rata-Rata Biomekanika` (`91.4%`) | `ProfileOut.statistics` (`ActivitySummary \| null`) | **Missing in BE** | `ProfileOut` has no team accuracy or composite member accuracy percentage. Rendered **inactive** (`opacity-60 border-dashed`) with `<Badge variant="outline">Coming soon</Badge>`. |
| Coach `Sesi Ulasan` (`"24 Sesi"`) (left mini-stat tile) | `ProfileOut.statistics` (`null` for coach; no reviewed-session field) | **Missing in BE (Coach)** | Currently rendered active as `"0 Sesi"` for coaches — **bug**. Per Approved A3, mark `sessionStat.isAvailable = false` for `role === "coach"` (and whenever `dto.statistics === null`) so Coach `Sesi Ulasan` renders **inactive (`"Coming soon"`)**. |
| Member `Total Sesi Latihan` (`"48 Sesi"`) (left mini-stat tile) | `ProfileOut.statistics.completedSessionCount` (`number`) | **Match (Member)** | Active high-contrast tile (`${completedSessionCount} Sesi`) when `role === "member"`. |
| Coach `Perangkat` / Member `Pencatatan Sudut` (right mini-stat tile) | — | **Missing in BE** | No posture/angle count or hardware tracking in `ProfileOut`. Rendered **inactive** (`opacity-60 border-dashed`) with `"Coming soon"`. |
| **Biodata Form & Profile Mutation (`ProfileEditor`, `ProfileBiodataForm`, `update-profile.ts`)** | | | |
| Coach profile update endpoint | `PATCH /api/v1/coach/profile` (`CoachProfilePatch`) | **Mismatch (hardcoded member endpoint)** | `updateProfileAction` currently calls `PATCH /api/v1/member/profile` for all users. Must branch on `role === "coach"` to call `updateCoachProfileApiV1CoachProfilePatch`. |
| Coach editable `fullName` (`Nama Lengkap`) | `CoachProfilePatch.fullName` (`string \| null`, max 120) | **Match** | Trimmed `2..120` chars in Zod form/action schema. |
| Coach editable `title` (`Jabatan`) | `CoachProfilePatch.title` (`string \| null`, max 120) | **Mismatch (missing in FE form & schema)** | Supported in `CoachProfilePatch`, missing in `ProfileBiodataForm` and `updateProfileSchema`. Per Approved A2, expose editable `Jabatan` input for `role === "coach"`. |
| Coach editable `division` (`Divisi / Perguruan`) | `CoachProfilePatch.division` (`string \| null`, max 120) | **Mismatch (missing in FE form)** | Supported in `CoachProfilePatch`. Per Approved A2, expose editable `Divisi / Perguruan` input for `role === "coach"`. |
| Coach `NPM` input (`nim`) | `ProfileOut.npm` (`null` for coach) | **Mismatch (shown for coach)** | Coaches have no NPM. Per Approved A2, hide the `NPM` field when `role === "coach"` (keep read-only `NPM` for `role === "member"`). |
| Coach & Member `email` input | `ProfileOut.email` (`string \| null`, immutable in profile PATCH) | **Missing in PATCH (read-only)** | Neither `CoachProfilePatch` nor `MemberProfilePatch` accepts `email`. Render read-only/disabled with caption `"Ubah email melalui menu verifikasi keamanan akun"`. |
| Query key invalidation on save (`ProfileSaveAction`) | `coachProfileApiV1CoachProfileGetQueryKey()` / `memberProfileApiV1MemberProfileGetQueryKey()` | **Mismatch (member-only key)** | `ProfileSaveAction` must invalidate `coachProfileApiV1CoachProfileGetQueryKey()` when `role === "coach"` and `memberProfileApiV1MemberProfileGetQueryKey()` when `role === "member"`. |
| **Camera Preferences (`ProfileCameraCard`)** | | | |
| Camera selector card on Coach Profile | — (Client `localStorage`) | **Missing in BE (Member-only hardware)** | Per Approved A4, hide `ProfileCameraCard` when `role === "coach"` since only members record training videos. |
| **Security & Password Mutation (`ProfileSecurityCard`, `ChangePasswordDialog`, `change-password.ts`)** | | | |
| Coach password change endpoint | `PATCH /api/v1/coach/password` (`PasswordChange` → `204`) | **Mismatch (hardcoded member endpoint)** | `changePasswordAction` currently calls `PATCH /api/v1/member/password` for all users. Must branch on `role === "coach"` to call `coachPasswordApiV1CoachPasswordPatch`. |
| `currentPassword` & `newPassword` | `PasswordChange { currentPassword, newPassword }` (`8..128` chars) | **Match** | Validated by `passwordChangeFormSchema` (`8..128` chars, `confirmPassword` match, `newPassword !== currentPassword` stripped to `{ currentPassword, newPassword }` before SDK call). |
| **Unused Fields on `ProfileOut`** | | | |
| `emailVerifiedAt` | `ProfileOut.emailVerifiedAt` (`string \| null`, ISO 8601) | **Unused in BE** | Email verification flow is out of scope (Not-list). |
| `coach` (`CoachIdentity \| null`) | `ProfileOut.coach` | **Unused in BE** | `null` for coaches; member's assigned coach is displayed on `/dashboard` and `/riwayat/[id]`, not `/profil`. |
| `createdAt` | `ProfileOut.createdAt` (`string`, ISO 8601) | **Unused in BE** | Account creation timestamp not displayed in Figma `94:41585`. |
| `statistics.totalDurationSeconds`, `durationSampleCount`, `scoredSessionCount`, `excludedScoreCount`, `similarityGroups` | `ProfileOut.statistics` | **Unused in BE** | Displayed on `/dashboard` and `/riwayat`, not on `/profil`. |

---

## 4. Cross-Cutting Concerns

| Concern | Current FE State (`features/profile`) | BE Contract & Repo Convention | Integration Strategy for Coach & Member Profile |
|---|---|---|---|
| **Auth / Token Handling** | `getProfile`, `updateProfileAction`, and `changePasswordAction` read `getAccessToken()`. However, `/profil` sits under `app/(member)/layout.tsx` (`AuthGate role="member"`). | All profile & password endpoints require `HTTPBearer`. Tokens live in HttpOnly cookies (`ss_at`, `ss_rt`); `proxy.ts` already includes `"/profil"` in `isProtectedRoute(pathname)` and forwards refreshed tokens via `x-silatsense-access`. | Move `/profil` out of `app/(member)/` to `app/profil/`. Inside `app/profil/layout.tsx` and `app/profil/page.tsx`, call `requireSession()` (memoized via React `cache()`) inside `<Suspense>` to obtain `user.role` (`"member" \| "coach"`). Never expose tokens to client components. |
| **Base URL / Env Config** | `src/hey-api.ts` sets `baseUrl: process.env.NEXT_PUBLIC_API_URL ?? config?.baseUrl ?? "https://silatsense-be.vercel.app"` and wires `fetch: fetchWithTransientRetry`. | `openapi-ts.config.ts` points `runtimeConfigPath` at `./src/hey-api`. | No change needed. `GET /api/v1/coach/profile` automatically inherits transient 5xx retry (`MAX_RETRIES = 2`), while `PATCH` mutations are non-idempotent and never auto-retry. |
| **Error Mapping** | `updateProfileAction` and `changePasswordAction` use `normalizeApiError(error, response)` from `lib/api-client.ts`. `getProfile` returns `null` on `401` and throws on other errors. | `401, 403, 422, 500` return `DomainErrorOut { detail, code, requestId, errors }`. FastAPI validation errors (`422`) or `DomainErrorOut` are normalized by `normalizeApiError`. | Keep `401 -> null` and `403/422/500 -> throw` in `getProfile` (caught by `CoachMainErrorBoundary` / `MemberMainErrorBoundary` and `app/profil/error.tsx`). Actions return `ActionResult<T>` with Indonesian field/form errors. |
| **Loading & Empty States** | `ProfilePage` wraps `AthleteSection` and `EditorSection` in `<Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>`. | `ProfileOut` fields (`npm`, `email`, `division`, `title`, `belt`, `beltTarget`, `passwordChangedAt`, `statistics`) are all nullable. | Keep the two `<Suspense>` boundaries inside `ProfilePage` plus outer `<Suspense fallback={null}>` in `app/profil/layout.tsx` for cookie-reading `requireSession()`. `toProfileViewModel` provides safe Indonesian fallbacks for every nullable field. |
| **Cache Keys, Next 16 `cacheComponents: true` & Invalidation** | `getProfile` uses React `cache()` + `cache: "no-store"`. `ProfileSaveAction` only invalidates `memberProfileApiV1MemberProfileGetQueryKey()`. | Under `cacheComponents: true`, `'use cache'` is strictly forbidden on cookie/token-dependent reads ([`README.md`](./README.md) §9). Query keys must be called without auth headers. | Keep React `cache()` + `cache: "no-store"` in `getProfile`. In `ProfileSaveAction`, invalidate `coachProfileApiV1CoachProfileGetQueryKey()` when `role === "coach"` and `memberProfileApiV1MemberProfileGetQueryKey()` when `role === "member"`, plus `router.refresh()`. In `ChangePasswordDialog`, also call `router.refresh()` on success so `passwordUpdatedLabel` updates immediately. |
| **SSR vs Client Fetching** | `ProfilePage` and `ProfileAthleteCard` are RSCs. `ProfileEditor`, `ProfileBiodataForm`, `ProfileCameraCard`, `ProfileSecurityCard`, `ChangePasswordDialog`, `ProfileSaveAction`, `ProfileLogoutButton` are client islands. | `ss_at` is HttpOnly; browser JS cannot call the BE directly. | Keep reads 100% server-side in RSC (`getProfile(role)`). All mutations run through `"use server"` actions (`updateProfileAction`, `changePasswordAction`). |
| **CORS** | No browser XHR to `silatsense-be.vercel.app`. | Server-to-server RSC / Server Action → FastAPI. | Non-issue. |

---

## 5. Phase 2 — Decisions (Adapt FE vs Request BE Change)

### D1 — Shared `/profil` Route with Server-Side Role Resolution & Layout Switching (Approved A1)
- **Decision:** Adapt FE — move `app/(member)/profil/` to `app/profil/` (`app/profil/layout.tsx`, `app/profil/page.tsx`, `app/profil/error.tsx`).
- **Why:** Both `MemberBottomNav` and `CoachBottomNav` already link their `Profil` tab to `/profil` (pinned by `tests/unit/coach/coach-shell.test.ts` and `tests/unit/profile/profile-route.test.ts`), but keeping `/profil` inside `app/(member)/` subjects coaches to `<AuthGate role="member">` (which redirects coaches back to `/coach`) and renders `MemberLayout`.
- **How:**
  - `app/profil/layout.tsx` (RSC): wraps an async server component `ProfilRoleLayout` in `<Suspense fallback={null}>`. `ProfilRoleLayout` calls `const user = await requireSession()` (from `@/features/auth/data/session`, memoized per request).
    - If `user.role === "coach"`, renders `<CoachLayout activeTab="profil" trail={["Dashboard", "Profil"]}>{children}</CoachLayout>`.
    - Otherwise (`user.role === "member"`), renders `<MemberLayout activeTab="profil" trail={["Dashboard", "Profil"]}>{children}</MemberLayout>`.
  - `app/profil/page.tsx` (RSC): wraps an async server caller in `<Suspense fallback={null}>` (or resolves `user = await requireSession()` inside `ProfilePage`) and renders `<ProfilePage role={user.role} />` (while keeping `<ProfilePage role="member" />` / `<ProfilePage role="coach" />` prop support so `ProfilePage` remains directly testable with an explicit `role` prop).
  - `app/profil/error.tsx`: thin error boundary re-export per `CODE_STANDARD.md` §3.
- **BE change:** None.

### D2 — Role-Aware Biodata Form & Coach Editable Fields (`fullName`, `title`, `division`) (Approved A2)
- **Decision:** Adapt FE (`features/profile/components/profile-biodata-form.tsx`, `features/profile/components/profile-editor.tsx`, `features/profile/schemas.ts`).
- **Why:** `CoachProfilePatch` supports `{ fullName, division, title }` (each max 120 chars), and coaches have `npm: null`. Showing a disabled `Nomor Induk / NPM Pesilat` field to a coach while preventing them from editing their `Jabatan` (`title`) or `Divisi / Perguruan` (`division`) contradicts the BE contract.
- **How:**
  - Pass `role: ProfileRole` to `ProfileBiodataForm` (or read `role` from `ProfileEditor` context/props).
  - **When `role === "coach"`:**
    - Card description: `"Informasi utama akun pelatih, jabatan kepelatihan, dan afiliasi perguruan."`
    - Field 1 (`name` → `fullName`): `Nama Lengkap` (editable, 2..120 chars).
    - Field 2 (`title`): `Jabatan Pelatih` (editable, max 120 chars, e.g. `"Pelatih Kepala UKM"`).
    - Field 3 (`division`): `Divisi / Perguruan` (editable, max 120 chars, e.g. `"UKM Pencak Silat Universitas Siliwangi"`).
    - Field 4 (`email`): `Email Akun Pelatih` (read-only + disabled, caption `"Ubah email melalui menu verifikasi keamanan akun"`).
    - `NPM` field is **not rendered** for coaches.
  - **When `role === "member"`:**
    - Preserves existing Member form verbatim: `Nama Lengkap` (editable), `Nomor Induk / NPM Pesilat` (read-only + disabled, caption `"Nomor Induk Mahasiswa terdaftar permanen"`), `Email Akun Mahasiswa` (read-only + disabled, caption `"Ubah email melalui menu verifikasi keamanan akun"`).
- **BE change:** None.

### D3 — Honest UI for Coach Mini-Stat Tiles (`Sesi Ulasan` Inactive `"Coming soon"`) (Approved A3)
- **Decision:** Adapt FE (`features/profile/data/profile-mapper.ts`, `features/profile/types.ts`, `features/profile/components/profile-athlete-card.tsx`).
- **Why:** `ProfileOut` returns `statistics: null` for coaches and has no reviewed-session counter (`Sesi Ulasan`). Rendering `0 Sesi` as an active metric for coaches violates the Honest UI policy ([`README.md`](./README.md) §6.1).
- **How:**
  - Add `sessionStat: StatItemViewModel` and `title: string` to `ProfileViewModel`:
    - For `role === "member"`:
      `sessionStat = { isAvailable: true, label: "Total Sesi Latihan", value: "${completedSessions} Sesi" }`
    - For `role === "coach"`:
      `sessionStat = { isAvailable: false, label: "Sesi Ulasan", badge: "Coming soon" }`
  - In `ProfileAthleteCard`, render the left mini-stat tile as **active** (`border bg-muted/40` + `profile.sessionStat.value ?? profile.totalSessionsLabel`) when `profile.sessionStat.isAvailable` is `true`, and **inactive** (`border-dashed border-border/80 bg-muted/20 opacity-60` + `profile.sessionStat.badge ?? "Coming soon"`) when `profile.sessionStat.isAvailable` is `false`.
  - Keep `totalSessionsLabel` on `ProfileViewModel` for backwards compatibility with existing member tests.
- **BE change:** None.

### D4 — Hide `ProfileCameraCard` on Coach Profile & Adapt Page Copy (Approved A4)
- **Decision:** Adapt FE (`features/profile/components/profile-editor.tsx`, `features/profile/pages/profile-page.tsx`, `features/profile/components/profile-security-card.tsx`).
- **Why:** Only members record training sessions in `/rekam`. Showing camera hardware selection to a coach is irrelevant.
- **How:**
  - In `ProfileEditor`, render `<ProfileCameraCard cameras={cameras} />` only when `profile.role === "member"`.
  - In `ProfilePage`, render role-appropriate subtitle copy:
    - Member: `"Kelola data biomekanika personal, telemetry stream perangkat kamera, dan preferensi akun atlet Anda."`
    - Coach: `"Kelola identitas kepelatihan, afiliasi perguruan, dan pengaturan keamanan akun pelatih Anda."`
- **BE change:** None.

### D5 — Role-Aware `updateProfileAction` (`PATCH /api/v1/coach/profile` vs `PATCH /api/v1/member/profile`)
- **Decision:** Adapt FE (`features/profile/actions/update-profile.ts`, `features/profile/schemas.ts`).
- **Why:** Coaches must call `updateCoachProfileApiV1CoachProfilePatch` (`PATCH /api/v1/coach/profile`) with `CoachProfilePatch { fullName, division, title }`, while members call `updateMemberProfileApiV1MemberProfilePatch` (`PATCH /api/v1/member/profile`) with `MemberProfilePatch { fullName, division }`.
- **How:**
  - Extend `updateProfileSchema` with `role: z.enum(["member", "coach"]).optional().default("member")` and `title: z.string().trim().max(120, "Jabatan maksimal 120 karakter").optional().nullable()`.
  - In `updateProfileAction(input: unknown)`:
    - Parse `input` with `updateProfileSchema.safeParse(input)`.
    - Read `token = await getAccessToken()`.
    - When `parsed.data.role === "coach"`: call `updateCoachProfileApiV1CoachProfilePatch` with `body: { fullName: resolvedName ?? null, ...(division !== undefined ? { division: division.trim() || null } : {}), ...(title !== undefined ? { title: title.trim() || null } : {}) }`.
    - When `parsed.data.role === "member"` (default): call `updateMemberProfileApiV1MemberProfilePatch` with `body: { fullName: resolvedName ?? null, ...(division !== undefined ? { division } : {}) }`.
    - Strip all client-only fields (`role`, `nim`, `email`, `cameraDeviceId`, `name`).
- **BE change:** None.

### D6 — Role-Aware `changePasswordAction` (`PATCH /api/v1/coach/password` vs `PATCH /api/v1/member/password`)
- **Decision:** Adapt FE (`features/profile/actions/change-password.ts`, `features/profile/components/profile-security-card.tsx`, `features/profile/components/change-password-dialog.tsx`).
- **Why:** Coaches must call `coachPasswordApiV1CoachPasswordPatch` (`PATCH /api/v1/coach/password`), while members call `memberPasswordApiV1MemberPasswordPatch` (`PATCH /api/v1/member/password`).
- **How:**
  - Pass `role?: ProfileRole` (default `"member"`) from `ProfilePage` → `ProfileSecurityCard` → `ChangePasswordDialog` → `changePasswordAction(values, role)`.
  - In `changePasswordAction(input: unknown, role: ProfileRole = "member")`:
    - Validate `input` with `passwordChangeFormSchema.safeParse(input)`.
    - Select `coachPasswordApiV1CoachPasswordPatch` when `role === "coach"`, else `memberPasswordApiV1MemberPasswordPatch`.
    - Send `{ currentPassword: parsed.data.currentPassword, newPassword: parsed.data.newPassword }` (explicitly stripping `confirmPassword`).
  - In `ChangePasswordDialog`, call `router.refresh()` on success so `passwordUpdatedLabel` re-renders with the fresh server timestamp.
- **BE change:** None.

### D7 — Role-Aware Query Key Invalidation in `ProfileSaveAction`
- **Decision:** Adapt FE (`features/profile/components/profile-save-action.tsx`).
- **Why:** After a coach updates their profile, TanStack Query must invalidate `coachProfileApiV1CoachProfileGetQueryKey()` (and `memberProfileApiV1MemberProfileGetQueryKey()` for a member) before `router.refresh()`.
- **How:**
  - Pass `role?: ProfileRole` (default `"member"`) to `ProfileSaveAction`.
  - In `onSuccess`: invalidate `role === "coach" ? coachProfileApiV1CoachProfileGetQueryKey() : memberProfileApiV1MemberProfileGetQueryKey()`, call `reset(variables)`, and call `router.refresh()`.
- **BE change:** None.

---

## 6. Target Architecture & ViewModel Specification

### 6.1 Data Flow Diagram

```
Browser (GET /profil — Coach or Member)
  │
  ├─ proxy.ts
  │    └─ isProtectedRoute("/profil") -> proactive refresh if near expiry -> forwards x-silatsense-access
  │
  ├─ app/profil/layout.tsx (RSC)
  │    └─ <Suspense fallback={null}>
  │         └─ ProfilRoleLayout -> requireSession() [React cache() -> GET /api/v1/auth/session]
  │              ├─ [role === "coach"]  -> <CoachLayout activeTab="profil" trail={["Dashboard", "Profil"]}>
  │              └─ [role === "member"] -> <MemberLayout activeTab="profil" trail={["Dashboard", "Profil"]}>
  │
  ├─ app/profil/page.tsx (RSC)
  │    └─ <Suspense fallback={null}>
  │         └─ ProfilRolePage -> requireSession() (memoized hit) -> <ProfilePage role={user.role} />
  │              ├─ <Suspense fallback={<Skeleton />}>
  │              │    └─ AthleteSection -> getProfile(role) [React cache()]
  │              │         ├─ [coach]  coachProfileApiV1CoachProfileGet({ cache: "no-store" }) -> 200 ProfileOut
  │              │         └─ [member] memberProfileApiV1MemberProfileGet({ cache: "no-store" }) -> 200 ProfileOut
  │              │              └─ toProfileViewModel(ProfileOut)
  │              │                   └─ <ProfileAthleteCard profile={viewModel} />
  │              │                        ├─ [coach]  Jabatan + Divisi; Akurasi Tim, Sesi Ulasan, Perangkat = "Coming soon"
  │              │                        └─ [member] Peran & Divisi + Sabuk; Total Sesi active; Akurasi & Sudut = "Coming soon"
  │              └─ <Suspense fallback={<Skeleton />}>
  │                   └─ EditorSection -> getProfile(role) (memoized hit)
  │                        └─ <ProfileEditor profile={viewModel} cameras={dummyProfileCameras}>
  │                             ├─ <ProfileBiodataForm role={profile.role} />
  │                             │    ├─ [coach]  fullName, title (Jabatan), division editable; email read-only; no NPM
  │                             │    └─ [member] fullName editable; NPM & email read-only
  │                             ├─ [profile.role === "member"] <ProfileCameraCard cameras={cameras} /> (localStorage)
  │                             ├─ <ProfileSecurityCard role={profile.role} passwordUpdatedLabel={...} />
  │                             │    └─ <ChangePasswordDialog role={profile.role} />
  │                             │         └─ changePasswordAction(values, role)
  │                             │              ├─ [coach]  coachPasswordApiV1CoachPasswordPatch() -> 204
  │                             │              └─ [member] memberPasswordApiV1MemberPasswordPatch() -> 204
  │                             ├─ <ProfileSaveAction role={profile.role} />
  │                             │    └─ updateProfileAction(values)
  │                             │         ├─ [coach]  updateCoachProfileApiV1CoachProfilePatch({ fullName, division, title })
  │                             │         └─ [member] updateMemberProfileApiV1MemberProfilePatch({ fullName, division })
  │                             │    └─ onSuccess: invalidate role QueryKey + reset(variables) + router.refresh()
  │                             └─ <ProfileLogoutButton /> -> signOutAction()
```

### 6.2 ViewModel Interfaces (`features/profile/types.ts`)

```ts
import type {
  CoachProfilePatch,
  MemberProfilePatch,
  PasswordChange,
  ProfileOut,
} from "@/api";
import type { NormalizedApiError } from "@/lib/api-client";

export type ProfileRole = "member" | "coach";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: NormalizedApiError };

export interface StatItemViewModel {
  isAvailable: boolean;
  label: string;
  value?: string;
  badge?: string;
  note?: string;
}

export interface ProfileViewModel {
  id: string;
  role: ProfileRole;
  name: string;
  initials: string;
  handle: string;
  npm: string;
  email: string;
  title: string; // raw coach title ("" when null) for form defaultValues
  roleLabel: string; // display label: "Pesilat Binaan (Anggota Pemula)" | dto.title ?? "Pelatih Kepala UKM"
  division: string;
  beltLabel: string;
  beltTargetLabel: string;
  passwordUpdatedLabel: string;
  totalSessionsLabel: string;
  avgAccuracyPct: number | null;
  accuracyNote: string | null;
  totalPosturesLabel: string | null;
  teamAccuracyPct: number | null;
  coachedSessionsLabel: string | null;
  sessionStat: StatItemViewModel; // Member: { isAvailable: true, label: "Total Sesi Latihan", value: "48 Sesi" } | Coach: { isAvailable: false, label: "Sesi Ulasan", badge: "Coming soon" }
  accuracyStat: StatItemViewModel;
  postureStat: StatItemViewModel;
  raw: ProfileOut;
}

export type Profile = ProfileViewModel;

export type { CoachProfilePatch, MemberProfilePatch, PasswordChange, ProfileOut };
```

---

## 7. Phase 2 — List of FE Files to Change

### 7.1 New Files

| File Path | Purpose |
|---|---|
| `app/profil/layout.tsx` | Shared `/profil` RSC layout. Wraps role resolution (`requireSession()`) in `<Suspense fallback={null}>` and renders `<CoachLayout activeTab="profil" trail={["Dashboard", "Profil"]}>` for coaches or `<MemberLayout activeTab="profil" trail={["Dashboard", "Profil"]}>` for members. |
| `app/profil/page.tsx` | Shared `/profil` RSC page. Resolves `user = await requireSession()` inside `<Suspense fallback={null}>` and renders `<ProfilePage role={user.role} />`. |
| `app/profil/error.tsx` | Thin `"use client"` segment error boundary delegating to `MemberMainErrorBoundary` / shared profile error fallback per `CODE_STANDARD.md` §3. |

### 7.2 Modified Files

| File Path | Changes |
|---|---|
| `features/profile/types.ts` | Add `title: string` and `sessionStat: StatItemViewModel` to `ProfileViewModel`. |
| `features/profile/data/profile-mapper.ts` | Populate `title: dto.title ?? ""` and `sessionStat` (`isAvailable: isMember`, value `${completedSessions} Sesi` for member, badge `"Coming soon"` for coach). |
| `features/profile/data/get-profile.ts` | Validate SDK response with `zCoachProfileApiV1CoachProfileGetResponse.parse(data)` / `zMemberProfileApiV1MemberProfileGetResponse.parse(data)` before mapping. |
| `features/profile/schemas.ts` | Add `role: z.enum(["member", "coach"]).optional().default("member")` and `title: z.string().trim().max(120, "Jabatan maksimal 120 karakter").optional().nullable()` to `updateProfileSchema`, and `division: z.string().trim().max(120, "Divisi maksimal 120 karakter").optional().nullable()`. |
| `features/profile/actions/update-profile.ts` | Branch on `parsed.data.role === "coach"` to call `updateCoachProfileApiV1CoachProfilePatch` (`{ fullName, division, title }`) vs `updateMemberProfileApiV1MemberProfilePatch` (`{ fullName, division }`). |
| `features/profile/actions/change-password.ts` | Accept `role: ProfileRole = "member"` parameter; branch on `role === "coach"` to call `coachPasswordApiV1CoachPasswordPatch` vs `memberPasswordApiV1MemberPasswordPatch`. |
| `features/profile/pages/profile-page.tsx` | Render role-aware subtitle copy (`atlet` vs `pelatih`) and pass `role` to `ProfileSecurityCard`. |
| `features/profile/components/profile-athlete-card.tsx` | Use `profile.sessionStat.isAvailable` to render the left mini-stat tile as active (`Total Sesi Latihan` for member) or inactive dashed `"Coming soon"` (`Sesi Ulasan` for coach). |
| `features/profile/components/profile-editor.tsx` | Seed `role: profile.role`, `title: profile.title`, `division: profile.division` into `useForm` `defaultValues`; pass `role={profile.role}` to `ProfileBiodataForm` and `ProfileSaveAction`; render `<ProfileCameraCard>` only when `profile.role === "member"`. |
| `features/profile/components/profile-biodata-form.tsx` | Accept `role?: ProfileRole` (default `"member"`). When `role === "coach"`, render editable `Nama Lengkap` (`name`), `Jabatan Pelatih` (`title`), `Divisi / Perguruan` (`division`), and read-only `Email Akun Pelatih` (`email`), hiding `NPM`. When `role === "member"`, keep existing 3 fields unchanged. |
| `features/profile/components/profile-security-card.tsx` | Accept `role?: ProfileRole` and forward to `ChangePasswordDialog`. |
| `features/profile/components/change-password-dialog.tsx` | Accept `role?: ProfileRole`, pass to `changePasswordAction(values, role)`, and call `router.refresh()` on success. |
| `features/profile/components/profile-save-action.tsx` | Accept `role?: ProfileRole`; invalidate `coachProfileApiV1CoachProfileGetQueryKey()` when `role === "coach"` and `memberProfileApiV1MemberProfileGetQueryKey()` when `role === "member"`. |
| `tests/unit/profile/profile-mapper.test.ts` | Assert `vm.title` and `vm.sessionStat` (`isAvailable: true` for member, `isAvailable: false` + `"Coming soon"` for coach). |
| `tests/unit/profile/profile-actions.test.ts` | Add unit tests for `updateProfileAction` with `role: "coach"` (`updateCoachProfileApiV1CoachProfilePatch` with `fullName`, `title`, `division`) and `changePasswordAction` with `role: "coach"` (`coachPasswordApiV1CoachPasswordPatch`). |
| `tests/unit/profile/profile-route.test.ts` | Update route test paths from `app/(member)/profil/*` to `app/profil/*` and assert both `CoachLayout` (`role="coach"`) and `MemberLayout` (`role="member"`) wiring. |
| `tests/unit/profile/profile-shell.test.ts` | Assert coach query key invalidation, coach action dispatch, and conditional camera card rendering. |

### 7.3 Deleted / Moved Files

| File Path | Reason |
|---|---|
| `app/(member)/profil/layout.tsx` | Moved to `app/profil/layout.tsx` so `/profil` is accessible to both `member` and `coach` roles without `(member)` `AuthGate` redirect. |
| `app/(member)/profil/page.tsx` | Moved to `app/profil/page.tsx` with session role resolution. |

**No changes** to `src/api/**`, `components/ui/**`, `features/coach/**` (`CoachBottomNav` already links to `/profil`), or `features/member/**` (`MemberBottomNav` already links to `/profil`).

---

## 8. Phase 2 — Generated SDK / Query / Mutation Mapping

| FE Usage / Consumer | BE Endpoint | Generated SDK Function | Generated TanStack Artifact (`src/api/@tanstack/react-query.gen.ts`) | Generated Wire Zod Schema (`src/api/zod.gen.ts`) | How Used in FE |
|---|---|---|---|---|---|
| `getProfile("coach")` (`features/profile/data/get-profile.ts`) | `GET /api/v1/coach/profile` | `coachProfileApiV1CoachProfileGet` | `coachProfileApiV1CoachProfileGetOptions()`<br>`coachProfileApiV1CoachProfileGetQueryKey()` | `zProfileOut`<br>`zCoachProfileApiV1CoachProfileGetResponse` | Server RSC read inside React `cache()` with `Authorization: Bearer <token>` and `cache: "no-store"`. |
| `getProfile("member")` (`features/profile/data/get-profile.ts`) | `GET /api/v1/member/profile` | `memberProfileApiV1MemberProfileGet` | `memberProfileApiV1MemberProfileGetOptions()`<br>`memberProfileApiV1MemberProfileGetQueryKey()` | `zProfileOut`<br>`zMemberProfileApiV1MemberProfileGetResponse` | Server RSC read inside React `cache()` with `Authorization: Bearer <token>` and `cache: "no-store"`. |
| `updateProfileAction` (`role === "coach"`) (`features/profile/actions/update-profile.ts`) | `PATCH /api/v1/coach/profile` | `updateCoachProfileApiV1CoachProfilePatch` | `updateCoachProfileApiV1CoachProfilePatchMutation()` *(documented; called via Server Action)* | `zCoachProfilePatch`<br>`zUpdateCoachProfileApiV1CoachProfilePatchBody`<br>`zUpdateCoachProfileApiV1CoachProfilePatchResponse` | `"use server"` action with Bearer token; sends `{ fullName, division, title }`. |
| `updateProfileAction` (`role === "member"`) (`features/profile/actions/update-profile.ts`) | `PATCH /api/v1/member/profile` | `updateMemberProfileApiV1MemberProfilePatch` | `updateMemberProfileApiV1MemberProfilePatchMutation()` *(documented; called via Server Action)* | `zMemberProfilePatch`<br>`zUpdateMemberProfileApiV1MemberProfilePatchBody`<br>`zUpdateMemberProfileApiV1MemberProfilePatchResponse` | `"use server"` action with Bearer token; sends `{ fullName, division }`. |
| `changePasswordAction` (`role === "coach"`) (`features/profile/actions/change-password.ts`) | `PATCH /api/v1/coach/password` | `coachPasswordApiV1CoachPasswordPatch` | `coachPasswordApiV1CoachPasswordPatchMutation()` *(documented; called via Server Action)* | `zPasswordChange`<br>`zCoachPasswordApiV1CoachPasswordPatchBody`<br>`zCoachPasswordApiV1CoachPasswordPatchResponse` (`z.void()`) | `"use server"` action with Bearer token; sends `{ currentPassword, newPassword }` (`204`). |
| `changePasswordAction` (`role === "member"`) (`features/profile/actions/change-password.ts`) | `PATCH /api/v1/member/password` | `memberPasswordApiV1MemberPasswordPatch` | `memberPasswordApiV1MemberPasswordPatchMutation()` *(documented; called via Server Action)* | `zPasswordChange`<br>`zMemberPasswordApiV1MemberPasswordPatchBody`<br>`zMemberPasswordApiV1MemberPasswordPatchResponse` (`z.void()`) | `"use server"` action with Bearer token; sends `{ currentPassword, newPassword }` (`204`). |
| `ProfileSaveAction` cache invalidation (`features/profile/components/profile-save-action.tsx`) | — | — | `coachProfileApiV1CoachProfileGetQueryKey()`<br>`memberProfileApiV1MemberProfileGetQueryKey()` | — | Called **without** `headers` in `useMutation.onSuccess` alongside `router.refresh()`. |
| `ProfilRoleLayout` / `ProfilRolePage` (`app/profil/layout.tsx`, `app/profil/page.tsx`) | `GET /api/v1/auth/session` | `authSessionApiV1AuthSessionGet` (via `requireSession()`) | `authSessionApiV1AuthSessionGetOptions()`<br>`authSessionApiV1AuthSessionGetQueryKey()` | `zAuthUser`<br>`zAuthSessionApiV1AuthSessionGetResponse` | Server RSC role resolution memoized per request via React `cache()`. |

> **Why browser components do not call generated `*Mutation()` / `*Options()` directly against the network:** Access tokens (`ss_at`) live in `HttpOnly` cookies ([`authentication.md`](./authentication.md)). Reads execute in Server Components (`getProfile`) and mutations execute in Server Actions (`updateProfileAction`, `changePasswordAction`), while client islands use the generated `*QueryKey()` factories for cache invalidation.

---

## 9. Phase 2 — Zod Validation Strategy

Per [`README.md`](./README.md) §7, Zod validation is enforced at three distinct layers:

### 9.1 Layer 1 — Wire Validators (Generated in `src/api/zod.gen.ts`)
- Enforced automatically by the generated SDK (`validator: true` in `openapi-ts.config.ts`) on both request bodies (`zUpdateCoachProfileApiV1CoachProfilePatchBody`, `zUpdateMemberProfileApiV1MemberProfilePatchBody`, `zCoachPasswordApiV1CoachPasswordPatchBody`, `zMemberPasswordApiV1MemberPasswordPatchBody`) and responses (`zCoachProfileApiV1CoachProfileGetResponse`, `zMemberProfileApiV1MemberProfileGetResponse`).
- Also parsed explicitly in `getProfile` and in unit tests (`tests/unit/profile/profile-mapper.test.ts`) so any OpenAPI schema drift fails unit tests immediately.

### 9.2 Layer 2 — Client RHF Form Validators (`features/profile/schemas.ts`)
- Used by `zodResolver(profileSchema)` in `ProfileEditor` and `zodResolver(passwordChangeFormSchema)` in `ChangePasswordDialog`.
- Stricter than the wire schemas (e.g. `fullName`/`name` requires `.trim().min(2)` on the client even though `CoachProfilePatch.fullName` only specifies `max(120)` on the wire) with Indonesian field-level error messages:

```ts
import { z } from "zod";
import { zCoachProfilePatch, zPasswordChange } from "@/api/zod.gen";

export const updateProfileSchema = z
  .object({
    role: z.enum(["member", "coach"]).optional(),
    name: z
      .string()
      .trim()
      .min(2, "Nama minimal 2 karakter")
      .max(120, "Nama maksimal 120 karakter")
      .optional(),
    fullName: zCoachProfilePatch.shape.fullName
      .unwrap()
      .unwrap()
      .trim()
      .min(2, "Nama minimal 2 karakter")
      .optional(),
    title: z
      .string()
      .trim()
      .max(120, "Jabatan maksimal 120 karakter")
      .optional()
      .nullable(),
    division: z
      .string()
      .trim()
      .max(120, "Divisi maksimal 120 karakter")
      .optional()
      .nullable(),
    nim: z.string().optional(),
    email: z.string().optional(),
    cameraDeviceId: z.string().optional(),
  })
  .refine(
    (data) =>
      Boolean(
        (data.name && data.name.trim().length >= 2) ||
          (data.fullName && data.fullName.trim().length >= 2)
      ),
    {
      message: "Nama lengkap minimal 2 karakter",
      path: ["name"],
    }
  );

export const passwordChangeFormSchema = zPasswordChange
  .extend({
    currentPassword: z
      .string()
      .min(8, "Kata sandi saat ini minimal 8 karakter")
      .max(128, "Kata sandi maksimal 128 karakter"),
    newPassword: z
      .string()
      .min(8, "Kata sandi baru minimal 8 karakter")
      .max(128, "Kata sandi maksimal 128 karakter"),
    confirmPassword: z
      .string()
      .min(8, "Konfirmasi kata sandi minimal 8 karakter")
      .max(128, "Kata sandi maksimal 128 karakter"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Kata sandi baru harus berbeda dari kata sandi saat ini",
    path: ["newPassword"],
  });
```

### 9.3 Layer 3 — Server Action Boundary Validators (`features/profile/actions/`)
- First line of `updateProfileAction(input: unknown)` and `changePasswordAction(input: unknown, role: ProfileRole = "member")` runs `.safeParse(input)`.
- Client-only fields (`role`, `name`, `nim`, `email`, `cameraDeviceId`, `confirmPassword`) are explicitly destructured/stripped before constructing `CoachProfilePatch`, `MemberProfilePatch`, or `PasswordChange`.
- For `role === "member"`, `title` is never included in `MemberProfilePatch`.

---

## 10. Phase 2 — Risks & Mitigations

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R1 | **Moving `/profil` out of `app/(member)/` removes the `(member)` layout `AuthGate`.** | Unauthenticated users could reach `/profil` if `requireSession()` is omitted. | `app/profil/layout.tsx` calls `await requireSession()` inside `<Suspense fallback={null}>`, which redirects unauthenticated requests to `/sign-in` exactly like `AuthGate`, while allowing both `"member"` and `"coach"` roles. `proxy.ts` also guards `/profil` in `isProtectedRoute`. |
| R2 | **Next.js 16 `cacheComponents: true` build error on cookie access in `app/profil/layout.tsx`.** | Reading cookies (`requireSession()`) outside a `<Suspense>` boundary fails `pnpm build`. | Wrap `ProfilRoleLayout` in `<Suspense fallback={null}>` in `app/profil/layout.tsx` (matching `app/(coach)/layout.tsx` and `app/(member)/layout.tsx`). |
| R3 | **Duplicate `/api/v1/auth/session` requests across layout, top-nav, and page.** | Extra latency on `/profil` SSR. | `getSession()` in `features/auth/data/session.ts` is wrapped in React `cache()`, so `ProfilRoleLayout`, `CoachTopNav` / `MemberTopNav`, and `ProfilRolePage` share a single per-request `/api/v1/auth/session` call. |
| R4 | **Role mismatch on profile/password mutations (`403 Forbidden`).** | Calling `/api/v1/member/*` with a coach JWT (or vice versa) returns `403`. | `ProfileEditor` seeds `role: profile.role` from the server-fetched `ProfileOut.role`, and forwards `role` to `updateProfileAction` and `changePasswordAction`. Even if tampered on the client, the BE enforces JWT role authorization (`403 DomainErrorOut`). |
| R5 | **Empty strings sent for optional `title` or `division` on Coach Profile.** | Clearing `title` or `division` in the form might store `""` instead of `null` or vice versa. | Normalize trimmed empty strings to `null` (`title.trim() || null`, `division.trim() || null`) when building `CoachProfilePatch`, matching the nullable BE contract (`string | null`). |
| R6 | **Existing unit tests inspect `app/(member)/profil/page.tsx` and `profile-shell.test.ts`.** | `pnpm test` fails if route/shell tests still hardcode `app/(member)/profil`. | Update `tests/unit/profile/profile-route.test.ts` and `tests/unit/profile/profile-shell.test.ts` in lockstep with the route migration while keeping all behavioral and layout invariants tested. |

---

## 11. Open & Resolved Questions

### Resolved (2026-11-08)

| # | Question | Resolution |
|---|---|---|
| Q1 | **Routing & layout shell for Coach Profile:** Keep shared `/profil` URL or create `/coach/profil`? | **Approved A1:** Keep shared `/profil` URL (`app/profil/`), resolve session role on server via `requireSession()`, and render `CoachLayout + ProfilePage(role="coach")` for coaches or `MemberLayout + ProfilePage(role="member")` for members. |
| Q2 | **Editable fields in `ProfileBiodataForm` for Coach:** Which fields should be editable? | **Approved A2:** Role-aware fields — for Coach, show editable `fullName` (`Nama Lengkap`), `title` (`Jabatan Pelatih`), and `division` (`Divisi / Perguruan`), plus read-only `email`, and hide `NPM`. Keep Member form as-is. |
| Q3 | **Coach `Sesi Ulasan` mini-stat tile in `ProfileAthleteCard`:** Active `0 Sesi` or Inactive `"Coming soon"`? | **Approved A3:** Honest UI — mark Coach `Sesi Ulasan` tile as inactive (`"Coming soon"`) since `ProfileOut.statistics` is `null` for coaches and does not expose reviewed-session count. |
| Q4 | **`ProfileCameraCard` visibility on Coach Profile:** Keep visible or hide for coaches? | **Approved A4:** Hide `ProfileCameraCard` when `role === "coach"` since only members record training videos. |

### Open Questions

None blocking.

---

## 12. Verification & Approval Checklist

### Automated Gates (Post-Approval Implementation):
```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm test
pnpm build
```

### Browser Checks at 390px & 1280px (Post-Approval Implementation):
1. **Coach Profile (`/profil` as Coach):** Renders inside `CoachLayout` (`CoachTopNav` + `CoachBottomNav` with `Profil` active), displays coach name, initials, email, handle, `Jabatan`, `Divisi`, inactive `"Coming soon"` badges on `Akurasi Tim`, `Sesi Ulasan`, and `Perangkat`, hides `Tingkatan Sabuk`, `NPM`, and `ProfileCameraCard`.
2. **Coach Biodata Mutation:** Edit `Nama Lengkap`, `Jabatan Pelatih`, and `Divisi / Perguruan` → click `Simpan Perubahan` → `PATCH /api/v1/coach/profile` succeeds → toast shown → `ProfileAthleteCard` immediately reflects updated name, initials, jabatan, and division (`read-your-own-write`).
3. **Coach Password Mutation:** Open `Ubah Kata Sandi` dialog → submit valid `currentPassword` + `newPassword` → `PATCH /api/v1/coach/password` returns `204` → toast shown, dialog closes, `passwordUpdatedLabel` updates.
4. **Member Regression (`/profil` as Member):** Renders inside `MemberLayout`, keeps `Total Sesi Latihan` active, `NPM` + `Email` read-only, `ProfileCameraCard` visible, and `PATCH /api/v1/member/profile` + `PATCH /api/v1/member/password` working.
5. **Layout Overflow:** `document.documentElement.scrollWidth <= window.innerWidth` at 390px and 1280px for both roles.

**PHASE 3 STOP:** Spec updated in `docs/integration/user-profile.md`. Waiting for approval before implementation.
