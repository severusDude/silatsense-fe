# Member Evaluasi Design — /latihan/[slug]/evaluasi (PSR-63)

Date: 2026-10-11. Status: draft, approved as contract (rev 2 approved 2026-10-11: posture revamp). Linear parent: PSR-63 (`[member] Ship evaluasi screen`), milestone `[Phase 7] Rekam dan ulas sesi` (reused — Phase 7 still open, max 2 open milestones; Phase 8 deferred until Phase 7 closes). Subs: PSR-65 (data+DTOs, done), PSR-64 (UI, done), PSR-66 (route+nav, done), PSR-67 (card shells, done), PSR-68 (posture revamp, this revision). Sibling specs: `2026-10-10-member-rekam-design.md`, `2026-10-10-member-sesi-design.md` (patterns reused). Figma `94:41288` ("Evaluasi hasil - Member").

## 1. Goal

Evaluasi-hasil frontend at `/latihan/[slug]/evaluasi`: session header + kinematic score hero + visualisasi postur (video placeholder + static scrubber) + 5 penilaian postur cards + action banner. Source is Figma `94:41288` with explicit deltas (§2).

## 2. Figma deltas (decision 2026-10-11, supersedes verbatim fidelity)

- DROPPED `⚡ 4.18 m/s` speed badge (decision 2026-10-11) — header shows 2 badges only (`12 Repetisi Sah`, `3 Terdeviasi`); no `speedLabel` in DTO.
- REPLACED authentic video playback viewport (silat frame + MediaPipe 33-pt skeleton + trajectory/deviasi/kuda-kuda overlay badges + play button + HUD control bar) with a `<video controls>` shell placeholder (aspect-4/3, no src, flex-only, no `absolute` overlays). Rationale: user instruction — ship placeholder now, bind blob + pick library later. Two TODOs pinned in code (§6).
- REPLACED all pill/badge visuals with shadcn `Badge` (`@/components/ui/badge`, base-nova): `12 Repetisi Sah` → `success`, `3 Terdeviasi` → `warning`, `Perlu Perbaikan` → `warning`, `1080p@60FPS` → `outline`, `Sesuai*` → `success`, `Tidak Sesuai*` → `warning` (amber deviation tone, not destructive — decision 2026-10-11).
- KEPT static: scrubber timeline (buffer/progress/rep markers/playhead + labels as divs, no lib), hero progress bar + target marker, 5 posture cards copy, action banner copy. No interactivity in stub (dead CTAs carry TODOs).
- KEPT: top nav + breadcrumb trail pattern (trail `["Dashboard", "Latihan", "Evaluasi"]`), Latihan-active bottom nav.

## 2b. Posture revamp deltas (decision 2026-10-11, PSR-68 — supersedes §2 posture rows)

- COMPRESSED rows: ~140px cards → `min-h-[64px]` Collapsible rows (filled chip + name/reading + status Badge + rotating chevron, whole row tappable); tap expands detail + cue (+ thumb stub on perlu-koreksi). Primitive: shadcn `collapsible` via CLI (Base UI backed, no new deps expected — abort to native `details` if the CLI wants anything beyond `@base-ui/react`); exactly one client island per row (`evaluasi-posture-item.tsx`), list stays server.
- PROBLEMS FIRST: stable render sort, `perlu-koreksi` above `sesuai`.
- SUMMARY HERO: tiny `3 Sesuai · 2 Perlu Koreksi` pill → inline-SVG progress ring (sesuai/total, `role="img"`, no chart dep) in the section `CardAction` slot.
- MEASURED VS TARGET: badges carry the status word only (`SESUAI` / `PERLU KOREKSI`); readings carry reference (`142° → target 130–138°`, `+0,15 dtk → target ≤ 0,05 dtk`). Target numbers are dummy constants awaiting backend confirmation.
- ACTIONABLE: every perlu-koreksi card carries a one-line `correctionCue` (`Tarik siku ~8 cm ke dalam.`).
- THUMB STUB: perlu-koreksi cards render `evaluasi-pose-thumb.tsx` (placeholder box + joint label + `TODO (GET /member/evaluations/:slug/pose/:id)`); real pose renders deferred.
- WORDING (one term): `Perlu Koreksi` everywhere — badges, header pill, hero alert (replaces `TIDAK SESUAI` / `PERLU PERBAIKAN`). Status union member renamed `tidak-sesuai` → `perlu-koreksi`.
- ICONS: `BadgeCheck` / `BadgeAlert` filled glyphs, enlarged chips (`size-8` chip, `size-5` icon), filled `bg-*-foreground` + white glyph (≥3:1, script-verified; fallback tinted chip + foreground glyph).
- BODY TEXT: detail copy `text-sm text-foreground` (muted-foreground ≈ 5.74:1 already AA, re-verified by script; muted kept for secondary labels only).
- FAILURE TONE: stays amber/green (no red) — failures use filled warning chips + warning badges.
- CARD DENSITY: inner rows `rounded-xl` tinted bands (`bg-success`/`bg-warning` + matching border tokens, `session-feedback` tone pattern); full `CardHeader/Title/Description/Action/Content/Footer` composition on all evaluasi cards (never CardContent-only); actions CTAs move to `CardFooter`.
- STICKY CTA: dropped by decision — footer keeps the two existing CTAs, no sticky element.

## 3. Architecture

- Routes (thin RSC, no logic): `app/(member)/latihan/[slug]/evaluasi/page.tsx` → `EvaluasiPage({ slug })` + `generateStaticParams` (4 slugs). Invalid slug → `notFound()`. Leaf layout `app/(member)/latihan/[slug]/evaluasi/layout.tsx` owns `activeTab="latihan"`, trail `["Dashboard", "Latihan", "Evaluasi"]`.
- Composition: `features/member/pages/evaluasi-page.tsx` (static shell + four `<Suspense>` units: header/hero, visualisasi, posture list, banner).
- Client boundary: exactly one island type — `evaluasi-posture-item.tsx` (`"use client"`, per-row Collapsible open state, serializable `PostureAssessment` props). Everything else server components. Banner CTAs stay dead `Link`/span with TODOs.
- Components (`features/member/components/`): `evaluasi-header.tsx`, `evaluasi-score-card.tsx`, `evaluasi-playback.tsx`, `evaluasi-scrubber.tsx`, `evaluasi-posture-list.tsx` (server: ring + sorted list), `evaluasi-posture-item.tsx` (client: Collapsible row), `evaluasi-pose-thumb.tsx` (server stub), `evaluasi-actions.tsx`. Cards use full composition (`CardHeader/Title/Description/Action/Content/Footer`); CTAs live in `CardFooter`. Shared primitives via `@/components/ui/*` only (`collapsible` installed via CLI). Icons `lucide-react` 1.x only (`BadgeCheck`, `BadgeAlert`, `ChevronDown`, existing set).
- Data: `features/member/data/get-evaluasi.ts` (server-only, `'use cache'` + `cacheLife('minutes')`, slug key, returns `EvaluationSession | null`) + `features/member/data/evaluasi-dummy.ts` (pure). No `schemas/` (read-only). No `app/api/`. `@/` imports only.
- Sesi wiring: flip `sesi-actions.tsx` dead `Lihat Evaluasi` affordance to `Link href={/latihan/${slug}/evaluasi}` (resolves the sesi-move TODO).

## 4. Types / DTOs (expected backend shape, mirrored from `types`)

```ts
type EvaluasiSlug = "kuda-kuda" | "pukulan" | "tangkisan" | "tendangan"; // == PersiapanSlug

type PostureStatus = "sesuai" | "perlu-koreksi";

interface PostureAssessment {
  id: "bahu" | "siku-kanan" | "pinggul" | "lutut" | "pergelangan";
  name: string; // e.g. "Siku Kanan"
  status: PostureStatus;
  statusLabel: string; // "SESUAI" | "PERLU KOREKSI" — status word only, never measurements
  reading: string; // e.g. "142° → target 130–138°" | "+0,15 dtk → target ≤ 0,05 dtk" | "135° (target 130–138°)"
  detail: string; // Figma card body verbatim
  correctionCue: string; // e.g. "Tarik siku ~8 cm ke dalam." — empty on sesuai
  thumbnailLabel: string; // e.g. "Siku kanan" — joint tag for the stub thumb
  thumbnailSrc: null; // literal until the pose-render move binds a real asset
}

interface KinematicScore {
  value: number; // e.g. 80
  unit: "%";
  targetPct: number; // e.g. 85
  targetLabel: string; // e.g. "Target Lulus Standar : ≥ 85%"
  deltaLabel: string; // e.g. "Selisih -5%"
  alertLabel: string; // e.g. "PERLU KOREKSI"
  summary: string; // e.g. "2 dari 5 parameter anatomis membutuhkan penyesuaian…"
}

interface EvaluationSession {
  slug: EvaluasiSlug;
  techniqueName: string; // e.g. "Pukulan Lurus Depan"
  evaluatedAtLabel: string; // e.g. "28 Sep 2026, 16:45 WIB"
  validReps: number; // e.g. 12
  deviatedReps: number; // e.g. 3
  qualityLabel: string; // e.g. "1080p@60FPS"
  score: KinematicScore;
  postures: PostureAssessment[]; // length 5, order: bahu, siku-kanan, pinggul, lutut, pergelangan
  videoStatus: "placeholder"; // literal until the playback move binds a real source
}
```

Pukulan-verb pin (dummy): technique `Pukulan Lurus Depan`, hero `80% / ≥85% / -5%`, quality `1080p@60FPS`, 5 postures (names + `reading` + `correctionCue` per §2b) with perlu-koreksi on `siku-kanan` + `pergelangan`. Render order is problems-first (stable sort at render; dummy keeps canonical bahu→pergelangan order). Other slugs reuse shape with their technique names.

## 5. UI pattern

- Flex/grid layouts only — no `absolute` in new/modified UI files. Video shell keeps Figma `aspect-[4/3]` landscape frame (differs from sesi portrait `3/4` — intentional, matches Figma 94:41342).
- Badges: `Badge` only (`success` / `warning` / `outline` + `className` for size), never hand-rolled pills. Six strings pinned in shell test: `12 Repetisi Sah`, `3 Terdeviasi`, `Perlu Koreksi`, `1080p@60FPS`, `Sesuai`, plus `TIDAK SESUAI`/`PERLU PERBAIKAN` negatively asserted (removed wording). Badge labels are status words only.
- Posture rows: `min-h-[64px]` whole-row triggers (chevron rotates 180°, 200–300ms ease-out, `motion-reduce` guard); expanded panel holds `text-sm text-foreground` detail + tinted cue row + thumb stub (perlu-koreksi only).
- Pose stub: gray `aspect-video` box + joint `thumbnailLabel` + `TODO: bind pose render via lib/api-client.ts (GET /member/evaluations/:slug/pose/:id)`.
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

- `tests/unit/member/evaluasi-data.test.ts`: 4 slugs resolve, pukulan 5 postures verbatim (names + readings + cues), `perlu-koreksi` union member, no `speedLabel` key, unknown slug returns null.
- `tests/unit/member/evaluasi-shell.test.ts`: thin route (no `use client`, `generateStaticParams`, `notFound`), 4 Suspense units, flex-only, badge strings + `PERLU KOREKSI` unification (`not.toContain("TIDAK SESUAI")`, `not.toContain("PERLU PERBAIKAN")`), video shell + TODOs + `Lihat Evaluasi` live href, Collapsible rows + ring + thumb stub, full CardHeader–Footer composition, no `absolute`.
- Contrast script: implementation recomputes token pairs (muted ≈ 5.74, warning pair ≈ 8.28, success pair ≈ 4.47 — body uses `text-foreground`, chips need ≥3:1) and fails the task on regression.
- Green: `pnpm build` + `tsc --noEmit` + `eslint` + `pnpm test`.
- Browser (Playwright): `scrollWidth <= innerWidth` at 390px + desktop on `/latihan/pukulan/evaluasi`; rows measure ≈64px collapsed; tap expands detail + cue + thumb stub; ring reads 3/5; invalid slug 404s.

## 8. Out of scope

Video library install + interactive scrubber/frame-stepping/slow-mo, skeleton/trajectory overlay rendering, real evaluation endpoint + auth headers, blob session store, pose-render assets (`thumbnailSrc`), chart library, E2E tests, sticky bottom CTA (dropped by decision 2026-10-11), Phase 8 milestone creation (deferred until Phase 7 closes).
