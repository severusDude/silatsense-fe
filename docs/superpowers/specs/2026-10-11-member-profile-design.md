# Member Profile Design — /profil (PSR-80)

Date: 2026-10-11. Status: draft, approved as contract (rev 0 approved 2026-10-11: logout-bottom + Batal-drop + placeholder + Save-icon deltas, role-prop sharing). Linear parent: PSR-80 (`[profile] Ship profile screen`), milestone `[Phase 9] Member profile` (created JIT 2026-10-11 — Phase 8 closed at 100%, 1 open milestone). Subs: PSR-81 (DTOs+tests), PSR-83 (cards+form), PSR-82 (route+nav). Sibling specs: `2026-10-11-member-riwayat-design.md` (Suspense-shell + placeholder patterns reused), `2026-10-09-member-persiapan-design.md` (`CameraDevice` DTO + Select pattern reused). Figma `94:41585` (`Profile - Member`, member-only node — no coach-profile node exists; coach sharing is a label-swap, §2).

## 1. Goal

Profile frontend at `/profil`: title section + athlete card (placeholder avatar + 3 attribute rows + 2 mini stats) + biodata form (RHF+Zod, 3 fields) + kamera select + keamanan card + single `Simpan Perubahan` (Save icon, mutation stub) + bottom outline logout. One shared implementation in `features/profile/` serves member now and coach at Phase 10 via a `role` prop. Source is Figma `94:41585` with explicit deltas (§2).

## 2. Figma deltas (user decisions 2026-10-11, supersede verbatim fidelity)

- DROPPED the `Batal` button everywhere — no reset affordance; dirty-state enables `Simpan` instead.
- MOVED logout to the very bottom of the page (below the keamanan card, after `Simpan`): full-width outline button, neutral border, destructive red text + `LogOut` lucide icon. The red primary logout inside the athlete card is REMOVED.
- REPLACED all images with placeholder elements (`role="img"`, no `next/image` src, no blob URLs): avatar circle renders initials `AS`, camera-badge button keeps the `Camera` icon only. Consistent with repo Not-list (no real photos).
- `Simpan Perubahan` is the single primary CTA with the `Save` lucide icon; its `useMutation` stub carries `TODO (PATCH /member/profile)` + `toast.promise` feedback.
- SHARED member+coach via `role: "member" | "coach"` prop on `ProfilePage` and cards. Coach copy = label swaps only (title `Pelatih Kepala UKM` instead of sabuk/NIM rows; placeholder values in §4, finalized at Phase 10) — no second Figma node, no invented coach layout. Coach route wiring is OUT (Phase 10, coach shell does not exist yet).
- KEPT static: title + description copy, `Aced Suryana` / `aced.suryana@student.unsil.ac.id` / `@aced_suryana • NIM 2307051`, 3 attribute rows, `91.4% (Optimal)`, `48 Sesi` / `1,240 Postur`, biodata field values (`Aced Suryana` / `2307051` / email), `FaceTime HD Camera` select, keamanan copy (`Terakhir diperbarui 2 bulan yang lalu`, `Ubah Kata Sandi` dead stub).

## 3. Architecture

- Route (thin RSC, no logic): `app/(member)/profil/page.tsx` → `ProfilePage({ role: "member" })` (PSR-82). Leaf layout owns `activeTab="profil"`, trail `["Dashboard", "Profil"]`.
- Composition: `features/profile/pages/profile-page.tsx` (static shell + two `<Suspense>` units: athlete card, editor island; follows `riwayat-page.tsx` pattern — biodata/kamera/keamanan/actions share one boundary because a single `FormProvider` cannot span split boundaries).
- Client boundary — exactly four islands: `profile-biodata-form.tsx` (`"use client"`, RHF + `zodResolver(profileSchema)`), `profile-camera-card.tsx` (`"use client"`, shadcn `Select` over `CameraDevice[]`), `profile-save-action.tsx` (`"use client"`, `useMutation` stub → server action, `Save` icon), `profile-logout-button.tsx` (`"use client"`, outline stub with `TODO: wire sign-out (auth session clear)`, `LogOut` icon). Form state is owned by `profile-editor.tsx` (`useForm` + `FormProvider`; server `ProfileSecurityCard` passed as `children`). Cards and shells stay server; props serializable.
- Components (`features/profile/components/`): `profile-athlete-card.tsx` (server: placeholder avatar + attribute rows + mini stats, NO logout), `profile-biodata-form.tsx` (client), `profile-camera-card.tsx` (client), `profile-security-card.tsx` (server: dead `Ubah Kata Sandi` stub with TODO), `profile-save-action.tsx` (client), `profile-logout-button.tsx` (client). Full `Card` composition on shells. Icons `lucide-react` only (`Save`, `LogOut`, `Camera`, `User`, `Medal`, `Gauge`, `ShieldCheck`).
- Data: `features/profile/data/get-profile.ts` (server-only, `'use cache'` + `cacheLife('minutes')`, `getProfile(role)`, returns `Profile`) + `features/profile/data/profile-dummy.ts` (pure). `CameraDevice` reused from `@/features/member/types` (no duplicate). `actions/update-profile.ts` (server-only, `profileSchema.parse()` first line, stub returns input, `TODO (PATCH /member/profile)`). `schemas.ts` holds `profileSchema`. No `app/api/`. `@/` imports only.

## 4. Types / DTOs (expected backend shape, mirrored from `types`)

```ts
type ProfileRole = "member" | "coach";

interface AthleteProfile {
  role: "member";
  name: string; // "Aced Suryana"
  handle: string; // "@aced_suryana"
  nim: string; // "2307051"
  email: string; // "aced.suryana@student.unsil.ac.id"
  roleLabel: string; // "Pesilat Binaan (Anggota Pemula)"
  division: string; // "UKM Pencak Silat Universitas Siliwangi"
  beltLabel: string; // "Sabuk Kuning (Ragam 2)"
  beltTargetLabel: string; // "Target Evaluasi: Sabuk Hijau (Q3 2025)"
  avgAccuracyPct: number; // 91.4
  accuracyNote: string; // "Optimal"
  totalSessionsLabel: string; // "48 Sesi"
  totalPosturesLabel: string; // "1,240 Postur"
  cameraDeviceLabel: string; // "FaceTime HD Camera (Ultra Wide …)"
  passwordUpdatedLabel: string; // "Terakhir diperbarui 2 bulan yang lalu"
}

interface CoachProfile {
  role: "coach";
  name: string; // "Kang Fauzan" (placeholder, finalized Phase 10)
  handle: string; // "@kang_fauzan"
  email: string; // "fauzan@unsil.ac.id" (placeholder)
  titleLabel: string; // "Pelatih Kepala UKM"
  division: string; // "UKM Pencak Silat Universitas Siliwangi"
  teamAccuracyPct: number; // 84.6 (placeholder, finalized Phase 10)
  coachedSessionsLabel: string; // "24 Sesi" (placeholder)
  cameraDeviceLabel: string; // "FaceTime HD Camera (Ultra Wide …)"
  passwordUpdatedLabel: string; // "Terakhir diperbarui 2 bulan yang lalu"
}

type Profile = AthleteProfile | CoachProfile;

interface UpdateProfileInput {
  name: string; // min 2 chars
  nim: string; // numeric
  email: string; // valid email
  cameraDeviceId: string;
}
// CameraDevice reused from @/features/member/types (PSR-49, no duplicate).
// dummyProfileCameras: CameraDevice[] (2 devices, FaceTime HD Camera default).
// Endpoints: TODO (GET /member/profile), TODO (GET /coach/profile), TODO (PATCH /member/profile).
```

Member pin (dummy): `Aced Suryana / 2307051 / aced.suryana@student.unsil.ac.id / Sabuk Kuning (Ragam 2) / 91.4% (Optimal) / 48 Sesi / 1,240 Postur`. Coach pin (dummy): `Kang Fauzan / Pelatih Kepala UKM / 84.6% / 24 Sesi` (placeholder values, finalized at Phase 10).

## 5. UI pattern

- Flex/grid layouts only — no `absolute` in new/modified UI files.
- Athlete card = `Card`: placeholder avatar (`role="img"`, initials `AS`, camera-badge `Button` with `Camera` icon, dead stub TODO) + name/email/handle + 3 attribute rows (icon chip + eyebrow + value + note) + 2 mini-stat tiles. NO logout inside the card.
- Biodata form = `Card` + RHF: three `Field`/`Input` rows (nama, NIM, email) with inline errors, `mode: "onChange"`; dirty-state enables `Simpan`.
- Kamera card = `Card` + shadcn `Select` (device list, `FaceTime HD Camera` default, probe-on-select deferred with TODO).
- Keamanan card = `Card`: `Kata Sandi Akun` row + dead `Ubah Kata Sandi` stub (TODO, no mutation this move).
- Page end = `profile-save-action` (primary, `Save` icon, `Simpan Perubahan`, `toast.promise` over stub) THEN `profile-logout-button` (full-width outline, neutral border, destructive text, `LogOut` icon, sign-out TODO). No `Batal`.
- Placeholders: every visual is a `div role="img"`; two strings pinned in shell test: `Aced Suryana`, `48 Sesi`; `Batal` negatively asserted.

## 6. Data flow

- RSC `ProfilePage({ role })` awaits `getProfile(role)` inside each `<Suspense>` unit (request-time fetch, static shell preserved per CODE_STANDARD §1).
- Client form `useMutation` calls `updateProfile(input)` server action (Zod `parse()` at boundary, stub echoes input); on success invalidates `["profile", role]` + `toast.promise` success; on error `toast` error. Read-your-own-write: re-read via `getProfile(role)` (or assert invalidation refetch) before `Done`.
- Roles: `role="member"` now; `role="coach"` flips labels only — same schema minus `nim` (coach `nim` unused; schema stays member-shaped this move, coach field mapping at Phase 10).

## 7. Verification

- `tests/unit/profile/profile-data.test.ts` pins dummy shape (member literals above, roles resolve, invalid role null).
- Gates green: `pnpm build` + `tsc --noEmit` + `eslint` + `pnpm test`.
- Browser: `document.documentElement.scrollWidth <= window.innerWidth` at 390px for `/profil` (paste result in review comment per CODE_STANDARD §6).

## 8. Tracking

- Milestone `[Phase 9] Member profile` (this move, JIT). Parent PSR-80 + subs PSR-81/PSR-82/PSR-83, all `feature`, assignee `me`.
- Branch `feature/psr-80-profile-ship-profile-screen` (Linear-generated, as-is).
- Next: writing-plans → PSR-81 (DTOs+tests) → PSR-83 (cards+form) → PSR-82 (route+nav). Coach route + `POST /coach/feedback`-style mutations stay Phase 10/11.
