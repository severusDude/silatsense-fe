# Member Persiapan Design — /latihan/[slug] (PSR-45)

Date: 2026-10-09. Status: approved. Linear parent: PSR-45 (`[member] Ship persiapan screen`), milestone `[Phase 6] Persiapan latihan`. Subs: PSR-47 data/DTOs, PSR-48 components, PSR-46 route/nav.

## 1. Goal

Figma-faithful member persiapan (pre-training) frontend at `/latihan/[slug]` (Figma `94:38628`, "Persiapan latihan - Member"). Role-domain feature `features/member/` (extends the latihan list move PSR-40). All data-backed elements render from dummy data behind a `TODO: connect backend` fetch function keyed by slug; the viewport is a placeholder (no live camera); all graphics are lucide icons. CTA stays dead with a `TODO → session route` until the session move lands. `ModuleCard` dead CTAs become real links to this route.

## 2. Figma source (verified via design context, verbatim unless flagged)

- Top nav (reused): `SILATSENSE` logo + red quick-start button + avatar `AS` + breadcrumb `Dashboard / ... / Persiapan Latihan` + `Cloud Sinkron` pill. Trail becomes `["Dashboard", "Latihan", "Persiapan Latihan"]`.
- Viewport: badges `1080p @ 60 FPS` + dead `Ganti` affordance + `● Pesilat Terdeteksi`; corner framing guides (bordered spans, flex/grid only).
- Camera-source card: heading `PILIH SUMBER KAMERA` + dead `Pindai Ulang` button + selected device row `Logitech Brio 4K Ultra HD` (Figma truncates `(Utama - S...` — dropped, flagged) + status `Terhubung (1080p @ 60 FPS) • Latensi Ultra-Rendah 18ms`.
- Coach card: red icon tile + `INSTRUKSI PELATIH SILAT` + `Wajib` badge + per-slug quote (Kuda-kuda verbatim: `"Buka kedua kaki selebar dua kali bahu, rendahkan panggul sejajar, pastikan lutut menekan ke luar dan punggung tetap tegak saat mengambil posisi Kuda Kuda."`).
- Calibration card: eyebrow `KUDA-KUDA` + `Target Akurasi: ≥ 88%` + title `Kuda-kuda` + desc `Kalibrasi Pra-Latihan Biomekanika untuk mengukur simetri tumpuan kaki (50:50 COG), sudut fleksi lutut (130°–135°), dan tegak lurus sumbu aksial tulang belakang.` + `KESIAPAN SENSOR & AI` / `100% SIAP` + 4 checks (`Izin & Sensor Kamera` / `Logitech Brio 4K / WebCam HD` / `Aktif`; `Pencahayaan Ruangan` / `540 Lux optimal & bebas backlight` / `Optimal`; `Jarak Pesilat` / `2.48 meter dari sensor` / `2.5m Terkalibrasi`; `Visibilitas Tubuh Penuh` / `33 titik persendian utuh` / `Terkunci`) + `PANDUAN POSTUR KUNCI KUDA-KUDA:` 3 bullets (`Lebar Kaki:` `Buka 2x lebar bahu simetris.` / `Fleksi Lutut:` `Tekan keluar 130° – 135°.` / `Poros Tubuh:` `Sumbu tulang belakang tegak 90°.`).
- CTA: dead big-red `Mulai Analisis Gerakan` + `3s Mundur` badge (decision 2026-10-09: dead affordance with session TODO, no countdown state).
- Bottom nav (reused): Latihan active.

## 3. Architecture

- Routes (thin RSC, no logic): `app/(member)/latihan/[slug]/page.tsx` → `PersiapanPage({ slug })` + `generateStaticParams` (4 slugs). Invalid slug → `notFound()`. Leaf layout `app/(member)/latihan/[slug]/layout.tsx` owns `activeTab="latihan"`, trail `["Dashboard", "Latihan", "Persiapan Latihan"]`.
- Compositions: `features/member/pages/persiapan-page.tsx` (static shell + five `<Suspense>` units: viewport, source, coach, calibration, CTA).
- Client components: none — viewport is a placeholder, source selector is a static selected row, CTA is dead (decisions 2026-10-09).
- Components (`features/member/components/`): `persiapan-viewport.tsx`, `camera-source-card.tsx`, `coach-instruction-card.tsx`, `calibration-card.tsx`, `persiapan-cta.tsx`. Shared `ImagePlaceholder` for the viewport visual.
- Data: `features/member/data/get-persiapan.ts` (server-only, `'use cache'` + `cacheLife('minutes')`, slug is the cache key, returns `PersiapanDetail | null`) + `features/member/data/persiapan-dummy.ts` (pure). No `schemas/` (read-only). No `app/api/`. `@/` imports only.
- List wiring: `module-card.tsx` dead span becomes `Link href={/latihan/${module.slug}}` (resolves the PSR-40 TODO).

## 4. Types / DTOs (expected backend shape)

```ts
type PersiapanSlug = "kuda-kuda" | "pukulan" | "tangkisan" | "tendangan";

interface CalibrationCheck {
  title: string;
  detail: string;
  stateLabel: string;
}

interface PostureGuide {
  term: string;
  detail: string;
}

interface PersiapanDetail {
  slug: PersiapanSlug;
  eyebrow: string; // e.g. "KUDA-KUDA"
  accuracyLabel: string; // e.g. "Target Akurasi: ≥ 88%"
  title: string; // e.g. "Kuda-kuda"
  description: string; // calibration paragraph (§2)
  coachQuote: string; // coach card quote (§2)
  readinessLabel: string; // "100% SIAP"
  checks: CalibrationCheck[]; // 4 items (§2)
  guides: PostureGuide[]; // 3 items (§2)
}
```

Sensor checks are identical across slugs (device state, not module content); everything else is per-slug. Kuda-kuda values are Figma-verbatim; other slugs' quote/desc/guides/accuracy are `[transcribed — confirm]` derivations from list-move copy, pinned in tests for reviewer confirmation. Shared chrome (viewport badges, camera device row, CTA labels) renders as static component strings.

## 5. UI pattern

- Flex/grid layouts only — the word `absolute` must not appear in new/modified UI files. Viewfinder badges layer over the placeholder via a shared grid cell (same technique as the list-move order badge).
- Images: `ImagePlaceholder` (`role="img"`) for the viewport visual only.
- Icons (lucide 1.x, never emoji): `Video` (viewport/skeleton hint), `Camera`/`RefreshCw` (source card), `Megaphone` (coach tile), `Check`/`BadgeCheck` (checklist), `Play`/`Timer` (CTA). Tints: emerald for ready states, destructive red for coach tile + CTA.
- Checklist rows: icon + title/detail stacked at inline-start, state label at inline-end (mirrors module-card title row pattern).
- CTAs render as dead affordances with `TODO: wire to /latihan/[slug]/sesi (session move)` comments; bottom-nav stays Latihan-active.

## 6. Data / feedback

```ts
// features/member/data/get-persiapan.ts
import "server-only";
import { cacheLife } from "next/cache";

export async function getPersiapan(slug: string): Promise<PersiapanDetail | null> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /member/training-prep/:slug) — dummy for now
  return dummyPersiapanBySlug[slug as PersiapanSlug] ?? null;
}
```

Static shell calls it per Suspense unit; invalid slug → `notFound()` in the page. `generateStaticParams` returns the 4 slugs (Cache Components requires ≥1 param). No mutations this move.

## 7. Verification

- `tests/unit/member/persiapan-data.test.ts`: 4 slugs resolve, Kuda-kuda quote/desc verbatim, checks length 4 + guides length 3 per slug, unknown slug returns null. Arrange-act-assert, one behavior per test.
- `tests/unit/member/persiapan-shell.test.ts` (append pattern from latihan-shell): thin route (no `use client`, `generateStaticParams`, `notFound`), 5 Suspense units, flex-only, dead CTAs with session TODO, ModuleCard links live.
- Green: `pnpm build` + `tsc --noEmit` + `eslint` + `pnpm test`.
- Browser (Playwright): `document.documentElement.scrollWidth <= window.innerWidth` at 390px + desktop on `/latihan/kuda-kuda` (+ spot-check second slug); exactly 1 viewport `role="img"`; invalid slug 404s; list CTA navigates to detail.

## 8. Out of scope

Session/analysis route (`/latihan/[slug]/sesi`), live camera feed + `getUserMedia`, backend connect + `lib/api-client.ts`, countdown interactivity, session/cookie handling, real photos, chart library, E2E tests.
