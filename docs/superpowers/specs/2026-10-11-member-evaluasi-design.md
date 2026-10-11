# Member Evaluasi Design — /latihan/[slug]/evaluasi (PSR-63)

Date: 2026-10-11. Status: draft, approved as contract. Linear parent: PSR-63 (`[member] Ship evaluasi screen`), milestone `[Phase 7] Rekam dan ulas sesi` (reused — Phase 7 still open, max 2 open milestones; Phase 8 deferred until Phase 7 closes). Subs: PSR-65 (data+DTOs), PSR-64 (UI), PSR-66 (route+nav). Sibling specs: `2026-10-10-member-rekam-design.md`, `2026-10-10-member-sesi-design.md` (patterns reused). Figma `94:41288` ("Evaluasi hasil - Member").

## 1. Goal

Evaluasi-hasil frontend at `/latihan/[slug]/evaluasi`: session header + kinematic score hero + visualisasi postur (video placeholder + static scrubber) + 5 penilaian postur cards + action banner. Source is Figma `94:41288` with explicit deltas (§2).

## 2. Figma deltas (decision 2026-10-11, supersedes verbatim fidelity)

- REPLACED authentic video playback viewport (silat frame + MediaPipe 33-pt skeleton + trajectory/deviasi/kuda-kuda overlay badges + play button + HUD control bar) with a `<video controls>` shell placeholder (aspect-4/3, no src, flex-only, no `absolute` overlays). Rationale: user instruction — ship placeholder now, bind blob + pick library later. Two TODOs pinned in code (§6).
- REPLACED all pill/badge visuals with shadcn `Badge` (`@/components/ui/badge`, base-nova): `12 Repetisi Sah` → `success`, `3 Terdeviasi` → `warning`, `Perlu Perbaikan` → `warning`, `1080p@60FPS` → `outline`, `Sesuai*` → `success`, `Tidak Sesuai*` → `warning` (amber deviation tone, not destructive — decision 2026-10-11).
- KEPT static: scrubber timeline (buffer/progress/rep markers/playhead + labels as divs, no lib), hero progress bar + target marker, 5 posture cards copy, action banner copy. No interactivity in stub (dead CTAs carry TODOs).
- KEPT: top nav + breadcrumb trail pattern (trail `["Dashboard", "Latihan", "Evaluasi"]`), Latihan-active bottom nav.

## 3. Architecture

- Routes (thin RSC, no logic): `app/(member)/latihan/[slug]/evaluasi/page.tsx` → `EvaluasiPage({ slug })` + `generateStaticParams` (4 slugs). Invalid slug → `notFound()`. Leaf layout `app/(member)/latihan/[slug]/evaluasi/layout.tsx` owns `activeTab="latihan"`, trail `["Dashboard", "Latihan", "Evaluasi"]`.
- Composition: `features/member/pages/evaluasi-page.tsx` (static shell + four `<Suspense>` units: header/hero, visualisasi, posture list, banner).
- Client boundary: none in stub (all server components; banner CTAs are dead `Link`/span with TODOs). A client island is added only if a later move needs upload-like state — not this move.
- Components (`features/member/components/`): `evaluasi-header.tsx`, `evaluasi-score-card.tsx`, `evaluasi-playback.tsx`, `evaluasi-scrubber.tsx`, `evaluasi-posture-list.tsx`, `evaluasi-actions.tsx`. No shared `ImagePlaceholder` (video shell replaces it). Icons `lucide-react` 1.x only.
- Data: `features/member/data/get-evaluasi.ts` (server-only, `'use cache'` + `cacheLife('minutes')`, slug key, returns `EvaluationSession | null`) + `features/member/data/evaluasi-dummy.ts` (pure). No `schemas/` (read-only). No `app/api/`. `@/` imports only.
- Sesi wiring: flip `sesi-actions.tsx` dead `Lihat Evaluasi` affordance to `Link href={/latihan/${slug}/evaluasi}` (resolves the sesi-move TODO).

## 4. Types / DTOs (expected backend shape, mirrored from `types`)

```ts
type EvaluasiSlug = "kuda-kuda" | "pukulan" | "tangkisan" | "tendangan"; // == PersiapanSlug

type PostureStatus = "sesuai" | "tidak-sesuai";

interface PostureAssessment {
  id: "bahu" | "siku-kanan" | "pinggul" | "lutut" | "pergelangan";
  name: string; // e.g. "Siku Kanan"
  status: PostureStatus;
  statusLabel: string; // e.g. "SESUAI" | "TIDAK SESUAI (142°)"
  detail: string; // Figma card body verbatim
}

interface KinematicScore {
  value: number; // e.g. 80
  unit: "%";
  targetPct: number; // e.g. 85
  targetLabel: string; // e.g. "Target Lulus Standar : ≥ 85%"
  deltaLabel: string; // e.g. "Selisih -5%"
  alertLabel: string; // e.g. "PERLU PERBAIKAN"
  summary: string; // e.g. "2 dari 5 parameter anatomis membutuhkan penyesuaian…"
}

interface EvaluationSession {
  slug: EvaluasiSlug;
  techniqueName: string; // e.g. "Pukulan Lurus Depan"
  evaluatedAtLabel: string; // e.g. "28 Sep 2026, 16:45 WIB"
  validReps: number; // e.g. 12
  deviatedReps: number; // e.g. 3
  speedLabel: string; // e.g. "⚡ 4.18 m/s"
  qualityLabel: string; // e.g. "1080p@60FPS"
  score: KinematicScore;
  postures: PostureAssessment[]; // length 5, order: bahu, siku-kanan, pinggul, lutut, pergelangan
  videoStatus: "placeholder"; // literal until the playback move binds a real source
}
```

Pukulan-verb pin (dummy): technique `Pukulan Lurus Depan`, hero `80% / ≥85% / -5%`, quality `1080p@60FPS`, 5 posture names + statuses above. Other slugs reuse shape with their technique names.

## 5. UI pattern

- Flex/grid layouts only — no `absolute` in new/modified UI files. Video shell keeps Figma `aspect-[4/3]` landscape frame (differs from sesi portrait `3/4` — intentional, matches Figma 94:41342).
- Badges: `Badge` only (`success` / `warning` / `outline` + `className` for size), never hand-rolled pills. Six strings pinned in shell test: `12 Repetisi Sah`, `3 Terdeviasi`, `Perlu Perbaikan`, `1080p@60FPS`, `Sesuai`, `Tidak Sesuai`.
- Playback: native `<video controls>` shell, no `src` in stub; caption track omitted. Scrubber: native divs (`role="img"` + `aria-label` summary, no slider semantics until interactive).
- Banner: `Selesai dan Simpan` (primary, dead TODO → future save endpoint) + `Latihan Ulang` (outline, live `Link` to `/latihan/${slug}/rekam`, mirrors sesi retake).
- Copy: Figma Indonesian verbatim for hero/posture/banner (see §4 + metadata 94:41288).

## 6. Data / feedback

```ts
// features/member/data/get-evaluasi.ts
import "server-only";
import { cacheLife } from "next/cache";

export async function getEvaluasi(slug: string): Promise<EvaluationSession | null> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /member/evaluations/:slug) — dummy for now
  return dummyEvaluasiBySlug[slug as EvaluasiSlug] ?? null;
}
```

```tsx
// features/member/components/evaluasi-playback.tsx (stub shape)
// TODO: bind recorded blob via lib/api-client.ts (GET /member/evaluations/:slug/video) when blob store lands — no src in stub
// TODO(spike): evaluate video playback lib for frame-accurate scrub + 0.5x slow-mo + overlay markers (candidates: vplayer-react, video.js, @saran-ign/video-annotation-tool, @remotion/player) then replace shell — see exa 2026-10-11
```

Static shell per Suspense unit; invalid slug → `notFound()`. Upload/save contract (noted, not built): future `POST /member/evaluations/:slug/ack` for `Selesai dan Simpan`.

## 7. Verification

- `tests/unit/member/evaluasi-data.test.ts`: 4 slugs resolve, pukulan 5 postures verbatim (names + statuses), unknown slug returns null.
- `tests/unit/member/evaluasi-shell.test.ts`: thin route (no `use client`, `generateStaticParams`, `notFound`), 4 Suspense units, flex-only, 6 badge strings + video shell + 2 TODO strings + `Lihat Evaluasi` live href, no `absolute`.
- Green: `pnpm build` + `tsc --noEmit` + `eslint` + `pnpm test`.
- Browser (Playwright): `scrollWidth <= innerWidth` at 390px + desktop on `/latihan/pukulan/evaluasi`; click-path sesi `Lihat Evaluasi` → evaluasi; invalid slug 404s.

## 8. Out of scope

Video library install + interactive scrubber/frame-stepping/slow-mo, skeleton/trajectory overlay rendering, real evaluation endpoint + auth headers, blob session store, chart library, E2E tests, Phase 8 milestone creation (deferred until Phase 7 closes).
