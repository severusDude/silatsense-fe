# Member Sesi Design — /latihan/[slug]/sesi (PSR-TBD, DEFERRED)

Date: 2026-10-10. Status: draft, approved as contract, implementation deferred. This spec is written now so the follow-up session starts cold-clean; execution happens via a continuation prompt AFTER the rekam move lands (rekam's dead `Selesai` TODO resolves to this route). Linear parent: TBD (`[member] Ship sesi review screen`), milestone `[Phase 7] Rekam dan ulas sesi`. Sibling spec: `2026-10-10-member-rekam-design.md` (implemented first).

## 1. Goal

Recording-review/upload frontend at `/latihan/[slug]/sesi`: playback of the just-recorded session (zero viewfinder chrome) + recording-info card + simulated upload with progress/% and a deterministic failure→retry path + destructive retake back to `/rekam`. Source is Figma `94:38849` ("Mulai latihan - Member") with explicit deltas (§2) — the badges belong to the live rekam screen; the two Figma CTAs are replaced per the capture→review pattern (freeze the result, review before upload, retake reachable).

## 2. Figma deltas (decision 2026-10-10, supersedes verbatim fidelity)

- DROPPED viewfinder chrome: `1080p @ 60 FPS`, `Ganti`, `COG 50:50 • Flx 132°`, `Pesilat Terdeteksi`, corner framing guides. Rationale: this viewport plays a recording, not a live feed; stale live badges would misreport state.
- DROPPED both CTAs: `Selesai` (capture already ended on `/rekam`) and `Lihat Evaluasi` as built buttons. `Lihat Evaluasi` returns only as a dead post-upload affordance (TODO → future `/evaluasi`).
- ADDED: `sesi-info-card` (7 fields, §4), `sesi-actions` island (Unggah + `role="progressbar"` + % + retry + retake), both stacked full-width in place of the CTAs.
- KEPT: top nav + trail pattern (trail `["Dashboard", "Latihan", "Ulasan Sesi"]`), portrait viewport frame, Latihan-active bottom nav.

## 3. Architecture

- Routes (thin RSC, no logic): `app/(member)/latihan/[slug]/sesi/page.tsx` → `SesiPage({ slug })` + `generateStaticParams` (4 slugs). Invalid slug → `notFound()`. Leaf layout `app/(member)/latihan/[slug]/sesi/layout.tsx` owns `activeTab="latihan"`, trail `["Dashboard", "Latihan", "Ulasan Sesi"]`.
- Composition: `features/member/pages/sesi-page.tsx` (static shell + three `<Suspense>` units: playback, info, actions).
- Client boundary (exactly one island): `sesi-actions.tsx` (`"use client"`) owns the upload state machine AND the retake link, so the retake guard (disabled while uploading) shares state without prop-drilling. `sesi-playback.tsx` and `sesi-info-card.tsx` stay server components (no live state in stub: placeholder + duration label + static rows).
- Components (`features/member/components/`): `sesi-playback.tsx`, `sesi-info-card.tsx`, `sesi-actions.tsx`. Shared `ImagePlaceholder` for the playback visual.
- Data: `features/member/data/get-sesi.ts` (server-only, `'use cache'` + `cacheLife('minutes')`, slug key, returns `TrainingSession | null`) + `features/member/data/sesi-dummy.ts` (pure). No `schemas/` (read-only). No `app/api/`. `@/` imports only.
- Rekam wiring: flip `rekam-selesai-cta.tsx` dead span to `Link href={/latihan/${slug}/sesi}` (resolves the rekam-move TODO).

## 4. Types / DTOs (expected backend shape)

```ts
type PersiapanSlug = "kuda-kuda" | "pukulan" | "tangkisan" | "tendangan"; // reused
// CameraDevice reused from features/member/types (id, label, resolution, fps, latencyMs)

type SesiUploadState = "idle" | "uploading" | "failed" | "success";

interface TrainingSession {
  slug: PersiapanSlug;
  trainingName: string; // e.g. "Kuda-kuda"
  eyebrow: string; // e.g. "ULASAN SESI"
  durationSec: number; // e.g. 47
  durationLabel: string; // e.g. "00:47"
  recordedAtLabel: string; // e.g. "10 Okt 2026 • 09.41"
  fileSizeLabel: string; // e.g. "18,2 MB"
  camera: CameraDevice; // label + resolution + fps rows
  videoStatus: "recorded"; // literal until the capture move binds a real blob
}
```

Info card renders exactly 7 rows: training name (+ eyebrow), duration, recorded-at, file size, camera label, resolution, fps. Upload contract: `POST /member/sessions` (multipart) — Server Actions cannot stream progress, so the real upload must use XHR (or `fetch` + reader) inside the client island calling `lib/api-client.ts`; this constraint is pinned in the shell test via the TODO string.

## 5. UI pattern

- Flex/grid layouts only — no `absolute` in new/modified UI files. Playback keeps the portrait `aspect-[3/4]` frame for visual continuity with rekam.
- Images: `ImagePlaceholder` (`role="img"`) + duration badge overlay (shared grid cell) + native `<video controls>` shell notes as TODO (no src in stub).
- Upload island: `Unggah Rekaman` button (red, `Upload` icon) → `role="progressbar"` + `aria-valuenow` + visible `%` text (native div bar, no new dep — repo has no `progress.tsx`) → deterministic machine: first attempt climbs to 72% then `failed` (`TriangleAlert` + "Unggah gagal — Coba lagi" retry button) → retry climbs to 100% → `success` (Sonner success + emerald `Terunggah` badge + dead `Lihat Evaluasi` affordance with `TODO → /evaluasi`). Sonner error on failure. Timer cleaned up on unmount.
- Retake: destructive-outline `Hapus & Latihan Ulang` (`Trash2`/`RotateCcw` icon) as `Link href={/latihan/${slug}/rekam}`, `aria-disabled` + click-guard while `uploading`. Icons lucide 1.x only.

## 6. Data / feedback

```ts
// features/member/data/get-sesi.ts
import "server-only";
import { cacheLife } from "next/cache";

export async function getSesi(slug: string): Promise<TrainingSession | null> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /member/sessions/:slug) — dummy for now
  return dummySesiBySlug[slug as PersiapanSlug] ?? null;
}
```

```tsx
// features/member/components/sesi-actions.tsx (upload stub shape)
// TODO: replace simulated timer with XHR upload via lib/api-client.ts (POST /member/sessions) reporting real progress
```

Static shell per Suspense unit; invalid slug → `notFound()`. Future contract (noted, not built): recorded blob lives in a short-lived client session store; direct-visit `/sesi` without a recording renders an empty state with a back-to-`/rekam` CTA.

## 7. Verification

- `tests/unit/member/sesi-data.test.ts`: 4 slugs resolve, Kuda-kuda 7 fields verbatim, unknown slug returns null.
- `tests/unit/member/sesi-shell.test.ts`: thin route (no `use client`, `generateStaticParams`, `notFound`), 3 Suspense units, flex-only, `role="progressbar"` + `%` + `Coba lagi` + `Terunggah` strings, XHR TODO present, retake href `/latihan/${slug}/rekam`, rekam `Selesai` links live to `/sesi`, no `absolute`.
- Green: `pnpm build` + `tsc --noEmit` + `eslint` + `pnpm test`.
- Browser (Playwright): `scrollWidth <= innerWidth` at 390px + desktop on `/latihan/kuda-kuda/sesi`; click-path rekam `Selesai` → sesi; drive upload to success (retry included); retake navigates to `/rekam`; invalid slug 404s.

## 8. Out of scope

Evaluasi route/results (`/evaluasi`, dead affordance only), real upload endpoint + auth headers, `MediaRecorder` blob capture + client session store (contract noted in §6), backend connect, countdown interactivity, real photos, chart library, E2E tests.
