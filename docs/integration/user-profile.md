# User Profile — FE ↔ BE Integration Spec

- **Status:** Draft — aligned with general integration conventions (2026-11-03).
- **Date:** 2026-11-03
- **Scope:** `features/profile`, `app/(member)/profil`, and integration with generated SDK endpoints for Member & Coach Profile (`/api/v1/member/profile`, `/api/v1/coach/profile`, `/api/v1/member/password`, `/api/v1/coach/password`).
- **BE source of truth:** `https://silatsense-be.vercel.app/openapi.json` (fetched 2026-11-03).
- **FE baseline:** `development` with Next.js 16.3.8, TanStack Query 5.104.1, Zod 4.6.5, `@hey-api/openapi-ts` 0.99.0 generated client in `src/api/`.

---

## 0. TL;DR

The profile module currently runs on dummy stubs (`features/profile/data/profile-dummy.ts`). Data fetching uses Next.js 16 `'use cache'` returning hardcoded dummy data (`Aced Suryana`, `2307051`), and the mutation stub in `update-profile.ts` merely echoes user input.

The backend exposes four core REST endpoints under `Account profile`:
1. `GET /api/v1/member/profile` (returns `ProfileOut`)
2. `PATCH /api/v1/member/profile` (body `MemberProfilePatch`, returns `ProfileOut`)
3. `GET /api/v1/coach/profile` (returns `ProfileOut`)
4. `PATCH /api/v1/coach/profile` (body `CoachProfilePatch`, returns `ProfileOut`)
Additionally, two endpoints handle password changes:
5. `PATCH /api/v1/member/password` (body `PasswordChange`, returns `204`)
6. `PATCH /api/v1/coach/password` (body `PasswordChange`, returns `204`)

### Key Integration Realities & Discrepancy Policy:
- **Statistical Data Policy (Honest UI):**
  Per repo-wide conventions in [`docs/integration/README.md`](./README.md) §6, **the frontend never fabricates metrics, synthesizes fake averages, or guesses backend data**.
  - **Active BE Metric:** `completedSessionCount` (`statistics.completedSessionCount`) is fully provided by BE $\rightarrow$ rendered **active** in high contrast.
  - **Unsupported BE Metrics:** Overall average biomechanical accuracy (`avgAccuracyPct`), qualitative accuracy note (`accuracyNote`), posture detection counts (`totalPosturesLabel`), coach team accuracy (`teamAccuracyPct`), and coach reviewed sessions (`coachedSessionsLabel`) are **not provided by the BE** $\rightarrow$ rendered **visually inactive (greyed out)** with an explicit **"Coming soon"** badge.
- **Mutation Boundary Constraints:**
  - `MemberProfilePatch` **only permits updating `fullName` and `division`**.
  - `npm` is a permanent student identifier and is **immutable** $\rightarrow$ rendered as read-only.
  - `email` cannot be changed via profile PATCH (requires auth email linking/verification) $\rightarrow$ rendered as read-only.
  - `cameraDeviceId` is purely client-side browser hardware configuration, stored in `localStorage` rather than sent to the BE.
- **Cache Strategy:**
  - `getProfile` currently has `'use cache'` and `cacheLife('minutes')`. This **must be removed** for authenticated profile reads because token-dependent cookies violate Cache Components static pre-rendering rules. We switch to request-time fetching with React `cache()` and Next.js `<Suspense>`.

---

## 1. Backend Contract Snapshot

### 1.1 Endpoints

| # | Method + Path | Auth | Request Body | Success | Error Responses | Notes |
|---|---|---|---|---|---|---|
| 1 | `GET /api/v1/member/profile` | Bearer | — | `200 ProfileOut` | `401`, `403`, `422`, `500` (`DomainErrorOut`) | Returns authenticated member's profile & biomechanics statistics |
| 2 | `PATCH /api/v1/member/profile` | Bearer | `MemberProfilePatch` | `200 ProfileOut` | `401`, `403`, `422`, `500` (`DomainErrorOut`) | Updates member `fullName` and/or `division` |
| 3 | `GET /api/v1/coach/profile` | Bearer | — | `200 ProfileOut` | `401`, `403`, `422`, `500` (`DomainErrorOut`) | Returns authenticated coach's profile & roster stats |
| 4 | `PATCH /api/v1/coach/profile` | Bearer | `CoachProfilePatch` | `200 ProfileOut` | `401`, `403`, `422`, `500` (`DomainErrorOut`) | Updates coach `fullName`, `division`, and/or `title` |
| 5 | `PATCH /api/v1/member/password` | Bearer | `PasswordChange` | `204` (No content) | `401`, `403`, `422`, `500` (`DomainErrorOut`) | Re-authenticates old password and sets new password |
| 6 | `PATCH /api/v1/coach/password` | Bearer | `PasswordChange` | `204` (No content) | `401`, `403`, `422`, `500` (`DomainErrorOut`) | Coach password change |

### 1.2 Generated Wire DTOs (from `src/api/types.gen.ts`)

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
  averageScore: number | null; // movement-specific score, NOT composite
  sampleCount: number;
};

export type MemberProfilePatch = {
  fullName?: string | null; // max 120 chars
  division?: string | null; // max 120 chars
};

export type CoachProfilePatch = {
  fullName?: string | null; // max 120 chars
  division?: string | null; // max 120 chars
  title?: string | null;    // max 120 chars
};

export type PasswordChange = {
  currentPassword: string; // 8..128 chars
  newPassword: string;     // 8..128 chars
};

export type DomainErrorOut = {
  detail: string;
  code: string;
  requestId: string;
  errors?: Array<ValidationIssue> | null;
};
```

---

## 2. Gap Analysis & Statistical Data Breakdown

### 2.1 Statistical Data Audit: Active vs Unsupported (Inactive / Coming Soon)

| Statistical Metric | Figma Display Assumed | BE Contract Reality | Integration Status | UI Visual Representation |
|---|---|---|---|---|
| **Total Sesi Latihan (Member)** | `"48 Sesi"` | Provided in `statistics.completedSessionCount` | **Active & Supported** | High contrast, bold text: `${completedSessionCount} Sesi`. |
| **Akurasi Rata-Rata Biomekanika (Member)** | `91.4% (Optimal)` | `statistics` only provides movement-specific `similarityGroups`, not an aggregate overall accuracy or qualitative score | **Not in BE** | **Inactive / Greyed out** (`opacity-60 bg-muted/20 border-dashed`). Displays `<Badge variant="outline">Coming soon</Badge>`. |
| **Pencatatan Sudut / Postur (Member)** | `"1,240 Postur"` | BE has duration seconds and duration samples, but no posture/angle detection count | **Not in BE** | **Inactive / Greyed out** (`opacity-60 bg-muted/20 border-dashed`). Displays `"Coming soon"` in place of fake number. |
| **Akurasi Tim (Coach)** | `84.6%` | Not present in `ProfileOut` | **Not in BE** | **Inactive / Greyed out** with `"Coming soon"` badge. |
| **Sesi Ulasan (Coach)** | `"24 Sesi"` | Not present in `ProfileOut` | **Not in BE** | **Inactive / Greyed out** with `"Coming soon"` value. |
| **Perangkat Kamera (Card Tile)** | `"FaceTime HD"` | Hardware is not tracked on the BE profile | **Not in BE** | **Inactive / Greyed out** with `"Coming soon"` or local camera name. |

### 2.2 Comprehensive Field Gap Table

| FE Need / Assumed Field | BE Endpoint / Field | Status | Notes & Field Details |
|---|---|---|---|
| **Identity & Account** | | | |
| `name` (string) | `fullName` (string) | **Mismatch** | Field name difference. Map `fullName` $\rightarrow$ `name` in ViewModel mapper. |
| `handle` (`@aced_suryana`) | None | **Missing in BE** | BE has no handle field. ViewModel derives `@` + slug from `fullName`. |
| `nim` (string, required) | `npm` (string \| null) | **Mismatch** | Terminology difference (UNSIL uses NPM). Nullable in BE; FE handles `null` as `"-"`. Rendered **read-only**. |
| `email` (string, required) | `email` (string \| null) | **Mismatch** | Nullable for legacy NPM-only accounts. Handled gracefully. Rendered **read-only**. |
| `division` ("UKM Silat...") | `division` (string \| null) | **Match** | Nullable in BE. Fallback to `"UKM Pencak Silat Universitas Siliwangi"`. |
| `beltLabel` | `belt` (string \| null) | **Match** | Fallback to `"Belum ditentukan"` if null. |
| `beltTargetLabel` | `beltTarget` (string \| null) | **Match** | Fallback to `"Belum ditentukan"` if null. |
| `passwordUpdatedLabel` | `passwordChangedAt` (string \| null) | **Match** | Formatted via `formatRelativeTime()`. If null: `"Belum pernah diperbarui"`. |
| Avatar image URL / Upload | None | **Missing in BE** | Initials placeholder (`AS`) preserved; camera button disabled with tooltip. |
| **Mutations** | | | |
| Update `fullName` | `MemberProfilePatch.fullName` | **Match** | Zod `z.string().min(2).max(120)`. |
| Update `division` | `MemberProfilePatch.division` | **Match (Optional)** | Supported in BE; can be exposed in form or kept server-default. |
| Update `nim` / `npm` | None | **Missing in BE** | Immutable student ID. Made **read-only** in form. |
| Update `email` | None | **Missing in BE** | Requires auth recovery flow. Made **read-only** in form. |
| Update `cameraDeviceId` | None | **Missing in BE** | Client-only hardware setting. Handled via `localStorage`. |
| Ubah Kata Sandi | `PATCH /api/v1/member/password` | **Match (BE ready)** | Body `PasswordChange { currentPassword, newPassword }` $\rightarrow$ `204`. |

---

## 3. Decisions (Adapt FE vs Request BE Change)

### D1 — Honest UI: Inactive Styling & "Coming soon" for Missing Stats
- **Decision:**
  - In `ProfileAthleteCard`:
    - **Total Sesi Latihan:** Active card tile showing real `statistics.completedSessionCount` (`48 Sesi` or `0 Sesi`).
    - **Akurasi Rata-Rata Biomekanika:** Inactive container (`opacity-60 bg-muted/20 border-dashed border-border/80`). Renders eyebrow `Akurasi Rata-Rata Biomekanika` + a distinct `<Badge variant="outline" className="text-[10px] text-muted-foreground uppercase font-semibold">Coming soon</Badge>`.
    - **Pencatatan Sudut:** Inactive container (`opacity-60 bg-muted/20 border-dashed border-border/80`). Renders eyebrow `Pencatatan Sudut` and value text `"Coming soon"`.
- **Why:** Avoids fabricating numbers, preserves design layout balance, and transparently signals upcoming backend analytics.

### D2 — Pure ViewModel & Mapper Pattern (`profile-mapper.ts`)
- **Decision:** Delete duplicate interfaces in `features/profile/types.ts`.
- Create `features/profile/data/profile-mapper.ts` with `toProfileViewModel(dto: ProfileOut): ProfileViewModel`.
- The mapper produces:
  - `name`: `dto.fullName`
  - `initials`: derived from words in `fullName`
  - `handle`: `@${dto.fullName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
  - `npm`: `dto.npm ?? "-"`
  - `email`: `dto.email ?? "Email belum ditautkan"`
  - `division`: `dto.division ?? "UKM Pencak Silat Universitas Siliwangi"`
  - `beltLabel`: `dto.belt ?? "Belum ditentukan"`
  - `beltTargetLabel`: `dto.beltTarget ? Target: ${dto.beltTarget} : "Belum ditentukan"`
  - `passwordUpdatedLabel`: formatted from `dto.passwordChangedAt` or `"Belum pernah diperbarui"`
  - `totalSessions`: `${dto.statistics?.completedSessionCount ?? 0} Sesi` (active)
  - `accuracyStat`: `{ isAvailable: false, label: "Akurasi Rata-Rata Biomekanika", badge: "Coming soon" }`
  - `postureStat`: `{ isAvailable: false, label: "Pencatatan Sudut", badge: "Coming soon" }`

### D3 — Read-Only Identity Fields in Biodata Form
- **Decision:**
  - `NPM` and `Email` in `ProfileBiodataForm` are rendered as disabled/read-only inputs with informative subtext:
    - NPM: `"Nomor Induk Mahasiswa terdaftar permanen"`
    - Email: `"Ubah email melalui menu verifikasi keamanan akun"`
  - Only `Nama Lengkap` (`fullName`) is editable and sent in `MemberProfilePatch`.

### D4 — Decouple Camera Selection to Client Storage
- **Decision:**
  - Remove `cameraDeviceId` from the backend profile mutation payload.
  - Store selected camera device in browser `localStorage.getItem('silatsense_preferred_camera')`.
  - `ProfileCameraCard` manages this state independently.

### D5 — Next.js 16 Request-Time Caching (Drop `'use cache'`)
- **Decision:**
  - Remove `'use cache'` and `cacheLife('minutes')` from `features/profile/data/get-profile.ts`.
  - Use React `cache()` for per-request memoization, passing `cache: "no-store"` to the generated SDK fetcher.
  - Server Components sit behind `<Suspense fallback={<Skeleton />}>`.

### D6 — Wire Password Change Dialog
- **Decision:**
  - Implement `changePasswordAction(input)` in `features/profile/actions/change-password.ts`.
  - Connect the "Ubah Kata Sandi" button in `ProfileSecurityCard` to open `ChangePasswordDialog`.
  - Calls `PATCH /api/v1/member/password` via generated SDK.

---

## 4. Target Architecture

```
Browser
  │
  ├─ [SSR Page Load: /profil]
  │    └─ app/(member)/profil/page.tsx
  │         └─ features/profile/pages/profile-page.tsx
  │              ├─ <Suspense fallback={<AthleteCardSkeleton />}>
  │              │    └─ AthleteSection -> getProfile("member")
  │              │         └─ React cache(getProfile) -> memberProfileApiV1MemberProfileGet()
  │              │              └─ [Headers: Authorization: Bearer <ss_at>]
  │              │                   └─ GET /api/v1/member/profile -> 200 ProfileOut
  │              │                        └─ toProfileViewModel(ProfileOut)
  │              │                             ├─ Active stats -> Total Sesi Latihan
  │              │                             └─ Inactive stats -> Akurasi & Postur ("Coming soon")
  │              └─ <Suspense fallback={<EditorSkeleton />}>
  │                   └─ EditorSection -> getProfile("member") (memoized)
  │                        └─ <ProfileEditor profile={viewModel}>
  │                             ├─ ProfileBiodataForm (fullName editable, npm/email read-only)
  │                             ├─ ProfileCameraCard (localStorage-backed)
  │                             └─ ProfileSecurityCard (ChangePasswordDialog trigger)
  │
  ├─ [Mutation: Simpan Perubahan]
  │    └─ ProfileSaveAction (Client)
  │         └─ useMutation() -> updateProfileAction({ fullName: "..." })
  │              └─ Server Action: "use server"
  │                   ├─ Validate Zod payload
  │                   ├─ updateMemberProfileApiV1MemberProfilePatch({ body: { fullName } })
  │                   └─ Return ActionResult<ProfileOut>
  │         └─ onSuccess:
  │              ├─ toast.success("Profil berhasil diperbarui")
  │              ├─ queryClient.invalidateQueries(memberProfileApiV1MemberProfileGetQueryKey())
  │              └─ router.refresh() (updates server-rendered athlete card)
  │
  └─ [Mutation: Ubah Kata Sandi]
       └─ ChangePasswordDialog (Client)
            └─ useMutation() -> changePasswordAction({ currentPassword, newPassword })
                 └─ Server Action -> memberPasswordApiV1MemberPasswordPatch()
```

---

## 5. Visual Styling Specification for Inactive / Coming Soon Metrics

```tsx
// Attribute Row Inactive Specification (Akurasi Rata-Rata)
<div className="flex items-start justify-between gap-3 rounded-xl border border-dashed border-border/80 bg-muted/20 p-2.5 opacity-60">
  <div className="flex items-start gap-3">
    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground/60">
      <Gauge className="size-4" aria-hidden="true" />
    </span>
    <span className="flex min-w-0 flex-col">
      <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
        Akurasi Rata-Rata Biomekanika
      </span>
      <span className="text-xs font-medium text-muted-foreground">Analisis gabungan belum tersedia</span>
    </span>
  </div>
  <Badge variant="outline" className="text-[9px] uppercase font-semibold text-muted-foreground">
    Coming soon
  </Badge>
</div>

// Card Tile Inactive Specification (Pencatatan Sudut)
<div className="flex flex-col rounded-xl border border-dashed border-border/80 bg-muted/20 p-3 opacity-60">
  <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
    Pencatatan Sudut
  </span>
  <span className="mt-1 text-xs font-semibold text-muted-foreground italic">
    Coming soon
  </span>
</div>

// Card Tile Active Specification (Total Sesi Latihan)
<div className="flex flex-col rounded-xl border bg-muted/40 p-3">
  <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
    Total Sesi Latihan
  </span>
  <span className="text-base font-bold text-foreground">
    {profile.totalSessionsLabel}
  </span>
</div>
```

---

## 6. FE File Changes

### 6.1 New Files

| Path | Purpose |
|---|---|
| `features/profile/data/profile-mapper.ts` | Pure mapper function: `ProfileOut` $\rightarrow$ `ProfileViewModel`. Categorizes active vs inactive stats and injects "Coming soon" state. |
| `features/profile/actions/change-password.ts` | Server action for `PATCH /api/v1/member/password` via generated SDK. |
| `features/profile/components/change-password-dialog.tsx` | Client dialog component for password change with current/new password inputs and RHF validation. |
| `tests/unit/profile/profile-mapper.test.ts` | Vitest unit tests for mapping logic, null handling, and inactive "Coming soon" flags. |
| `tests/unit/profile/profile-actions.test.ts` | Unit tests for `updateProfileAction` and `changePasswordAction`. |

### 6.2 Modified Files

| Path | Changes |
|---|---|
| `features/profile/types.ts` | Delete duplicate DTOs. Export `ProfileViewModel`, `StatItemViewModel`, and `ActionResult<T>`. |
| `features/profile/schemas.ts` | Update `profileSchema` to validate editable `fullName`. Add `passwordChangeFormSchema`. |
| `features/profile/data/get-profile.ts` | Drop `'use cache'`. Use React `cache()`, Bearer auth, and `toProfileViewModel()`. |
| `features/profile/actions/update-profile.ts` | Wire real server action calling `updateMemberProfileApiV1MemberProfilePatch`. |
| `features/profile/components/profile-athlete-card.tsx` | Render real initials, active session count, and inactive "Coming soon" metrics with dashed styling. |
| `features/profile/components/profile-biodata-form.tsx` | Render `NPM` and `Email` as read-only with explanatory captions. |
| `features/profile/components/profile-camera-card.tsx` | Persist to browser `localStorage` instead of backend form submit. |
| `features/profile/components/profile-security-card.tsx` | Wire "Ubah Kata Sandi" button to open `ChangePasswordDialog`. |
| `features/profile/components/profile-save-action.tsx` | Invalidate `memberProfileApiV1MemberProfileGetQueryKey()`, toast success, and call `router.refresh()`. |
| `tests/unit/profile/profile-data.test.ts` | Update tests to assert against `toProfileViewModel()`. |
| `tests/unit/profile/profile-shell.test.ts` | Update shell tests to assert inactive coming soon badges and real wiring. |

---

## 7. Generated SDK / Query / Mutation Mapping

| BE Endpoint | Generated SDK Function | Generated TanStack Artifact | Wire Zod Schema |
|---|---|---|---|
| `GET /api/v1/member/profile` | `memberProfileApiV1MemberProfileGet` | `memberProfileApiV1MemberProfileGetOptions()`<br>`memberProfileApiV1MemberProfileGetQueryKey()` | `zProfileOut` |
| `PATCH /api/v1/member/profile` | `updateMemberProfileApiV1MemberProfilePatch` | `updateMemberProfileApiV1MemberProfilePatchMutation()` | `zMemberProfilePatch` $\rightarrow$ `zProfileOut` |
| `GET /api/v1/coach/profile` | `coachProfileApiV1CoachProfileGet` | `coachProfileApiV1CoachProfileGetOptions()`<br>`coachProfileApiV1CoachProfileGetQueryKey()` | `zProfileOut` |
| `PATCH /api/v1/coach/profile` | `updateCoachProfileApiV1CoachProfilePatch` | `updateCoachProfileApiV1CoachProfilePatchMutation()` | `zCoachProfilePatch` $\rightarrow$ `zProfileOut` |
| `PATCH /api/v1/member/password` | `memberPasswordApiV1MemberPasswordPatch` | `memberPasswordApiV1MemberPasswordPatchMutation()` | `zPasswordChange` $\rightarrow$ `z.void()` (204) |
| `PATCH /api/v1/coach/password` | `coachPasswordApiV1CoachPasswordPatch` | `coachPasswordApiV1CoachPasswordPatchMutation()` | `zPasswordChange` $\rightarrow$ `z.void()` (204) |

---

## 8. Verification Plan

### Automated Gates:
```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm test
pnpm build
```

### Browser Checks (Playwright):
1. **Active Data Verification:** Inspect `/profil` as authenticated member $\rightarrow$ confirms real name, initials, belt, and active session count.
2. **Inactive Metrics Verification:** Confirms average accuracy row and posture count tile show dimmed styling (`opacity-60 border-dashed`) and display `"Coming soon"`.
3. **Read-Only Verification:** Confirms `NPM` and `Email` are disabled and cannot be edited.
4. **Mutation & Invalidation:** Edit `fullName` $\rightarrow$ Save $\rightarrow$ Toast success $\rightarrow$ Athlete card immediately reflects new name and initials.
5. **Password Change:** Trigger "Ubah Kata Sandi" modal $\rightarrow$ submit new password $\rightarrow$ verify success toast and dialog close.
6. **Responsiveness:** `document.documentElement.scrollWidth <= window.innerWidth` at 390px and 1280px.
