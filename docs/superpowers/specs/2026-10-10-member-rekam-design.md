# Member Rekam Design — /latihan/[slug]/rekam (PSR-TBD)

Date: 2026-10-10. Status: draft, pending review (rev.1: viewport chrome rescoped per reviewer). Linear parent: TBD (`[member] Ship rekam screen`), milestone `[Phase 7] Rekam dan ulas sesi`. Subs: route+nav, data/DTOs, viewport+CTA. Sibling spec: `2026-10-10-member-sesi-design.md` (review/upload, deferred to a follow-up session via continuation prompt).

## 1. Goal

Live-recording frontend at `/latihan/[slug]/rekam` (Figma `94:38849`, "Mulai latihan - Member", adapted per §2 deltas). Role-domain feature `features/member/` (extends the persiapan move PSR-45). The viewport carries only two overlays: a hardware-driven `Resolution@FPS` badge (probed from the live track exactly like the persiapan screen) and a badge-styled camera `Select` for switching devices. `Selesai` ships dead with a `TODO → sesi` affordance; the sesi move wires it live. The persiapan dead CTA becomes a real link to this route.

## 2. Figma source (verified via screenshot + metadata) with deltas (decision 2026-10-10, rev.1)

- Top nav (reused, verbatim): `SILATSENSE` logo + red quick-start button + avatar `AS` + breadcrumb `Dashboard / ... / Mulai Latihan` + `Cloud Sinkron` pill. Trail becomes `["Dashboard", "Latihan", "Mulai Latihan"]`.
- Viewport (358×454 portrait): photo visual kept.
- DROPPED: dead `Ganti` affordance (superseded by the camera Select) and emerald `● Pesilat Terdeteksi` badge (pose-detection overlay belongs to the analysis layer, not this move).
- CHANGED: bottom `COG 50:50 • Flx 132°` static badge becomes a shadcn `Select` listing available cameras — trigger styled to keep the overlay-badge look (`bg-background/80 backdrop-blur-sm`, compact text). Selecting a device swaps the live preview to that camera.
- CHANGED: top `1080p @ 60 FPS` hardcoded badge becomes hardware-driven: `qualityLabel(trackWidth, trackHeight, trackFps)` from the open stream's `getSettings()`, `"Siaga"` fallback while idle — identical semantics to `persiapan-viewport` via `CameraExperience`.
- Addition (flagged, not in Figma): REC red dot + `mm:ss` elapsed timer, top-inline next to the quality badge — a live-recording screen without a timer misleads about capture state (camera-capture pattern: recording timer visible at a glance).
- CTA: big-red `Selesai` with Zap (lightning) icon. `Lihat Evaluasi` is NOT built here — nothing is recorded yet; it belongs to the post-upload state in the sesi move.
- Bottom nav (reused): Latihan active.

## 3. Architecture

- Routes (thin RSC, no logic): `app/(member)/latihan/[slug]/rekam/page.tsx` → `RekamPage({ slug })` + `generateStaticParams` (4 slugs). Invalid slug → `notFound()`. Leaf layout `app/(member)/latihan/[slug]/rekam/layout.tsx` owns `activeTab="latihan"`, trail `["Dashboard", "Latihan", "Mulai Latihan"]`.
- Composition: `features/member/pages/rekam-page.tsx` (static shell + two `<Suspense>` units: viewport, CTA).
- Client components: `rekam-viewport.tsx` (`"use client"`) owns the elapsed timer, the camera `Select`, and the lazy live-probe — mirroring the `CameraExperience` probe-on-interaction pattern (enumerate + `getSettings` probe on first select interaction, never on mount; denial falls back to the dummy list + `"Siaga"` badge; tracks stopped on unmount). `rekam-selesai-cta.tsx` (dead span, `aria-disabled`, session TODO). No other client state.
- Components (`features/member/components/`): `rekam-viewport.tsx`, `rekam-selesai-cta.tsx`. Shared `ImagePlaceholder` for the viewport visual; `Select` primitives from `@/components/ui/select` (same `items=`/`onValueChange` contract as `camera-source-card`).
- Data: `features/member/data/get-rekam.ts` (server-only, `'use cache'` + `cacheLife('minutes')`, slug is the cache key, returns `RekamSession | null`) + `features/member/data/rekam-dummy.ts` (pure). Camera list reuses `getCameras()`/`dummyCameras` (no new camera fetcher). No `schemas/` (read-only). No `app/api/`. `@/` imports only.
- Persiapan wiring: `persiapan-cta.tsx` dead span becomes `Link href={/latihan/${slug}/rekam}` (resolves the PSR-45 TODO); needs `slug` prop — signature change pinned by test.
- Shell dedup: `app/(member)/latihan/[slug]/layout.tsx` becomes a pass-through fragment; the persiapan shell moves to `app/(member)/latihan/[slug]/(persiapan)/layout.tsx` (route group, URL unchanged) so each leaf owns exactly one `MemberLayout` — no double top/bottom nav.

## 4. Types / DTOs (expected backend shape)

```ts
type PersiapanSlug = "kuda-kuda" | "pukulan" | "tangkisan" | "tendangan"; // reused
// CameraDevice reused from features/member/types (id, label, resolution, fps, latencyMs)

interface RekamSession {
  slug: PersiapanSlug;
  trainingName: string; // e.g. "Kuda-kuda"
  eyebrow: string; // e.g. "MULAI LATIHAN"
  countdownSec: number; // 3 — mirrors the persiapan "3s Mundur" badge
  targetDurationSec: number; // e.g. 60 — stub recording target
  camera: CameraDevice; // default-selected device; full list via getCameras()
}
```

No static badge strings in the DTO: the top badge is derived at runtime (`qualityLabel(live) ?? "Siaga"`), and the bottom overlay is a live `Select` over `getCameras()`. `trainingName`/`eyebrow` are per-slug; Kuda-kuda values pinned verbatim in tests.

## 5. UI pattern

- Flex/grid layouts only — the word `absolute` must not appear in new/modified UI files. Overlays layer over the placeholder via a shared grid cell (`col-start-1 row-start-1`, same technique as `persiapan-viewport`).
- Portrait viewport: `aspect-[3/4]` on the grid cell to match Figma 358×454 (deviation from the `aspect-video` placeholders elsewhere — flagged, aspect-ratio only, still no `absolute`).
- Images: `ImagePlaceholder` (`role="img"`) for the viewport visual only.
- Camera `Select`: Bottom-inline-start overlay position (where the COG badge sat); trigger keeps badge look (`bg-background/80 backdrop-blur-sm`, `text-xs`); `aria-label="Pilih kamera"`; items = camera labels. Follows the `camera-source-card` Select contract (`items=`, `onValueChange`).
- Icons (lucide 1.x, never emoji): `Camera` (select affordance), `Zap` (Selesai CTA), `Timer` (elapsed readout), `Video` (skeleton hint). REC dot is a plain span (`bg-destructive`, pulsing via `animate-pulse`), not an icon. Tints: destructive red for REC + CTA, emerald dot inside the live quality badge.
- `Selesai` renders as a dead affordance (`aria-disabled="true"`, `TODO: wire to /latihan/[slug]/sesi (sesi move)`); bottom-nav stays Latihan-active.

## 6. Data / feedback

```ts
// features/member/data/get-rekam.ts
import "server-only";
import { cacheLife } from "next/cache";

export async function getRekam(slug: string): Promise<RekamSession | null> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /member/record-config/:slug) — dummy for now
  return dummyRekamBySlug[slug as PersiapanSlug] ?? null;
}
```

```tsx
// features/member/components/rekam-viewport.tsx (recording-control TODO)
// TODO: bind timer + Selesai to a recording control when the capture move lands.
// Evaluated candidate (2026-10-10, via exa + context7): `react-media-recorder`
// `useReactMediaRecorder({ video: { deviceId }, audio: false, askPermissionOnMount: false,
// onStop: (blobUrl, blob) => hand to sesi store, stopStreamsOnStop: true })` —
// `previewStream` feeds this viewport, `status` drives the timer/REC dot, `mediaBlobUrl`
// feeds sesi playback. Caveats: must live in a dynamically imported (`ssr: false`)
// client island (Worker/Blob SSR crash); StrictMode double-mount encoder error on
// 1.6.6+ (fixed upstream in 1.7.1 — pin ≥1.7.1). Alternative: hand-rolled native
// MediaRecorder hook (repo already owns half via CameraExperience probing).
```

Static shell calls `getRekam`/`getCameras` per Suspense unit; invalid slug → `notFound()`. Elapsed timer counts up from `00:00` on mount (stub simplification — binds to recorder `status` when the control lands). Live probe is lazy (first select interaction), denial → dummy + `"Siaga"`. No mutations this move.

## 7. Verification

- `tests/unit/member/rekam-data.test.ts`: 4 slugs resolve, Kuda-kuda name/eyebrow verbatim, unknown slug returns null, default camera field present. Arrange-act-assert, one behavior per test.
- `tests/unit/member/rekam-shell.test.ts`: thin route (no `use client`, `generateStaticParams`, `notFound`), 2 Suspense units, flex-only, `Selesai` dead with sesi TODO, `PersiapanCta` links to `/rekam` (exact `/latihan/${slug}/rekam` href, no `aria-disabled`), REC dot + timer present, camera `Select` present (`items={`, `onValueChange`, badge-look classes, `aria-label`), `Siaga` fallback present, recording-control TODO names `react-media-recorder`, and `Ganti` / `Pesilat Terdeteksi` / `COG 50:50` / `Lihat Evaluasi` strings appear nowhere in rekam files.
- Green: `pnpm build` + `tsc --noEmit` + `eslint` + `pnpm test`.
- Browser (Playwright): `document.documentElement.scrollWidth <= window.innerWidth` at 390px + desktop on `/latihan/kuda-kuda/rekam` (+ spot-check second slug); exactly 1 viewport `role="img"`; select swaps listed cameras; invalid slug 404s; persiapan CTA navigates to rekam.

## 8. Out of scope

Sesi/review route (`/latihan/[slug]/sesi`, sibling spec), `Lihat Evaluasi`, recording-control install + lib decision (TODO only — capture move), pose-detection overlay (the dropped `Terdeteksi` badge returns with the analysis layer), backend connect + `lib/api-client.ts`, 3-second countdown gate (timer starts on mount as a stub simplification), session/cookie handling, real photos, chart library, E2E tests.
