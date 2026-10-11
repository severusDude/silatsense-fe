# Member Session Detail Design — /riwayat/[id] before/after (PSR-75)

Date: 2026-10-11. Status: draft, approved as contract (rev 0 approved 2026-10-11: single route + state flag, badge mapping, drop drills + terverifikasi). Rev 1 (2026-10-11, minor revision): pillar stage badges → icon chips, video full-bleed + dropped HUD/eyebrow, posture count pill → ScoreRing. Linear: reuse PSR-75 (detail UI, this spec) + PSR-79 (shrunk via decision comment — drills section dropped, see §2). Milestone `[Phase 8] Riwayat history` (67% open, 1 open milestone — no new milestone). Sibling spec: `2026-10-11-member-riwayat-design.md` (list; `Badge` + `Card` + dummy/test patterns reused). Figma `94:38951` (before, without coach feedback) + `94:39232` (after, with coach feedback).

## 1. Goal

Session-detail frontend at `/riwayat/[id]`: page header + coach-decision card + kelayakan card (4 pillars) + kinematika video placeholder + posture validation list + bottom action stack. Before/after are one route driven by a state flag on a single `SessionDetail` DTO: before renders the posture empty state (`Belum ada catatan dari pelatih`), after renders 5 posture items with coach notes + the extra date/`TAHAP REMIDIASI TEKNIS` header box. Source is Figma `94:38951` + `94:39232` with explicit deltas (§2).

## 2. Figma deltas (decision 2026-10-11, supersedes verbatim fidelity)

- IMAGES → PLACEHOLDERS: coach avatar photo and video-frame photo render as placeholder elements (initials block + 16:9 HUD box). No `<img>`, no remote assets, each pinned with `TODO: replace with real asset when backend binds media`.
- DROPPED `Terverifikasi Resmi` pill everywhere (both states). Coach header keeps name (`Kang Fauzan Azhiim, S.Pd.`) + role (`Pelatih Kepala UKM Pencak Silat UNSIL`) only.
- BADGES via shadcn `Badge` (`@/components/ui/badge`, base-nova — variants `success`/`warning` already in repo, context7-confirmed): `Menunggu` → `<Badge variant="warning">`, `Lolos` (pillars 91%/86%) → `<Badge variant="success">`, `Fokus` (pukulan 80%, red tint) → `<Badge variant="destructive">`, `Remidi` (tendangan 76%, amber) → `<Badge variant="warning">`, `IPSI CLASS B` → `<Badge variant="outline">`. Posture items: `Sesuai` → `success`, non-sesuai → `destructive` (critical) / `warning` (warning) with unified label `Perlu Koreksi` (roadmap risk log closed — `Perlu Perbaikan` never appears).
- DROPPED Section 5 `Latihan Mandiri & Target` entirely (3 drill rows + `3 Drill Wajib` pill + schedule strip inside that section). PSR-79 shrinks to a decision-comment close; no drill components ship in this move. The kelayakan-card retest row (`Jadwal Uji Ulang: Jumat, 2 Okt 2026 • Dojo UNSIL`) is KEPT (different section).
- CLARIFIED state model: both frames are the same session (`Pukulan Lurus Depan (Tusuk/Lurus)`, score `80%` vs target `85%`, identical pillars/video/actions). `Lolos` is a pillar-stage word, not a keputusan banner — no `Lolos` decision banner is built. After-only extras: date row (`28 Sep 2026, 17:30`) + `TAHAP REMIDIASI TEKNIS / Fokus: Pukulan Lurus Depan` box inside the coach card.
- KEPT static: header + description copy, coach name/role, keputusan label, kelayakan copy + scores, pillar names/details/scores, all 5 posture catatan/koreksi verbatim, bottom callout + dual-button copy. No interactivity beyond dead stubs in this move.
- REV 1 (2026-10-11): pillar stage pills render as icon chips, not `Badge` text — `Check` (Lolos/success), `TriangleAlert` (Remidi/warning), `CircleAlert` (Fokus/destructive) in `size-6 rounded-full` containers at reduced alpha (`bg-{tone}/80`, white icon, `aria-label` + `title` = stage word). `Menunggu` + `IPSI CLASS B` stay `Badge` (decision banner + classification label have no icon equivalent).
- REV 1 (2026-10-11): video shell goes full-bleed — `-mx-(--card-spacing)` under `aspect-video`, no rounding, neutral `Video` icon only. Dropped: `OBJEK TINJAUAN KINEMATIKA` eyebrow, camera meta strip, quality pill, red crosshair. `techniqueName` is the `CardTitle`, `techniqueDesc` the `CardDescription`. `cameraLabel`/`qualityLabel` stay in the DTO contract (backend shape) but render nothing.
- REV 1 (2026-10-11): posture header count pill replaced by the shared `ScoreRing` (exported from `evaluasi-posture-list.tsx`, same SVG ring + `sesuai/total` shape as `/latihan/[slug]/evaluasi`); counts derive from `postures` (`total` falls back to 5 when empty, so before shows 0/5).

## 3. Architecture

- Routes (thin RSC, no logic): `app/(member)/riwayat/[id]/page.tsx` → `SessionDetailPage({ id })` + `generateStaticParams` over stub ids; unknown id → `notFound()`. Leaf inherits member shell with `activeTab="riwayat"`, trail `["Dashboard", "Riwayat Latihan", "Evaluasi"]`.
- Composition: `features/member/pages/session-detail-page.tsx` (static shell + four `<Suspense>` units: coach-decision, kelayakan, video+posture, actions).
- Client boundary: none — detail is fully static server UI in stub (no expand/collapse, no form). Any future feedback textarea is Phase 11, not here.
- Components (`features/member/components/`): `session-coach-card.tsx` (server: placeholder avatar + name/role + keputusan `Badge` + conditional remidiasi box), `session-kelayakan-card.tsx` (server: header + `IPSI CLASS B` `Badge` + callout + `session-pillar-grid.tsx` 2×2 + notes + retest row), `session-video-placeholder.tsx` (server: `techniqueName` title + desc + full-bleed 16:9 placeholder, no HUD), `session-posture-list.tsx` (server: header + shared `ScoreRing` + empty-vs-items switch), `session-posture-item.tsx` (server: `Badge` + `Catatan:` + conditional koreksi box), `session-detail-actions.tsx` (server: callout + dead `Konfirmasi` + stub `Mulai Remedial` with TODO). Full `Card` composition on section shells; CTAs live in `CardFooter`. Icons `lucide-react` 1.x only.
- Data: `features/member/data/get-session-detail.ts` (server-only, `'use cache'` + `cacheLife('minutes')`, `TODO (GET /member/history/:id)`) + `features/member/data/session-detail-dummy.ts` (pure, exports `beforeSessionDetail` + `afterSessionDetail`). No `schemas/` (read-only). No `app/api/`. `@/` imports only.

## 4. Types / DTOs (expected backend shape, mirrored from `types`)

```ts
type SessionDecision = "menunggu" | "remidiasi";

interface SessionPillar {
  id: "kuda-kuda" | "tangkisan" | "pukulan" | "tendangan";
  name: string; // e.g. "Pukulan"
  detail: string; // e.g. "Lurus Depan"
  scorePct: number; // e.g. 80
  stageLabel: "Lolos" | "Fokus" | "Remidi";
  badge: "success" | "destructive" | "warning"; // Lolos→success, Fokus→destructive, Remidi→warning
}

interface SessionVideo {
  status: "placeholder"; // literal until the video-bind move
  cameraLabel: string; // "Kamera 01: Multi-Axis Front (Rep 11/15)"
  qualityLabel: string; // "30 FPS • 1080p"
}

interface SessionDetail {
  id: string; // e.g. "pukulan-lurus-depan"
  techniqueName: string; // "Pukulan Lurus Depan (Tusuk/Lurus)"
  techniqueDesc: string; // "Jurusan Serang Lurus Lintasan Ulu Hati"
  coach: { initials: string; name: string; role: string };
  decision: SessionDecision;
  decisionLabel: string; // "Menunggu"
  decidedAtLabel?: string; // after only: "28 Sep 2026, 17:30"
  focusTechnique?: string; // after only: "Pukulan Lurus Depan"
  scorePct: number; // 80
  targetPct: number; // 85
  pillars: SessionPillar[]; // length 4, order: kuda-kuda, tangkisan, pukulan, tendangan
  video: SessionVideo;
  postures: PostureAssessment[]; // 0 (before) | 5 (after) — reuses evaluasi PostureAssessment shape incl. thumbnailSrc: null literal + thumbnailLabel placeholder text
  retestLabel: string; // "Jadwal Uji Ulang:"
  retestValue: string; // "Jumat, 2 Okt 2026 • Dojo UNSIL"
}
```

Pinned verbs (dummy): coach `Kang Fauzan Azhiim, S.Pd.` / `Pelatih Kepala UKM Pencak Silat UNSIL`; pillars kuda-kuda `91% / Lolos / Tengah`, tangkisan `86% / Lolos / Atas`, pukulan `80% / Fokus / Lurus Depan`, tendangan `76% / Remidi / Lurus`; after postures 5 (bahu Sesuai, siku-kanan CRITICAL + koreksi `Siku wajib menempel bidang koronal rusuk hingga 80% lintasan pukulan.`, pinggul/lutut Sesuai, pergelangan warning); before postures `[]` with empty-state copy `Belum ada catatan dari pelatih`.

## 5. UI pattern

- Flex/grid layouts only — no `absolute` in new/modified UI files.
- Coach card: placeholder avatar block (initials `KF`, no image) + name/role stack; keputusan row (`KEPUTUSAN SIDANG PELATIH` + `Menunggu` `Badge`); after-only date row + TAHAP REMIDIASI box (conditional on `decision === "remidiasi"`).
- Kelayakan card: title + `IPSI CLASS B` `Badge` header; amber callout (`80%`/`85%` bold); 2×2 pillar tiles (stage icon chip + detail + score); syarat/catatan bullets; retest row.
- Video: full-bleed 16:9 placeholder div (`-mx-(--card-spacing)`, neutral icon, no HUD/meta/crosshair) — never an image element.
- Posture list: header (`Catatan Pelatih` + shared `ScoreRing`, 0/5 before → 3/5 after); before body is the single empty-state row `Belum ada catatan dari pelatih`, after body is the 5 items. Item = `Badge` + title + `Catatan:` text + conditional koreksi box (icon + `Koreksi:` + cue). Critical item carries left-border accent via border utilities, not absolute.
- Badges: `Badge` only (variants §2 + `className` for size), never hand-rolled pills. Strings pinned in shell test: `Menunggu`, `Lolos`, `Fokus`, `Remidi`, `IPSI CLASS B`, `Sesuai`, `Perlu Koreksi`, plus `Terverifikasi Resmi` / `Latihan Mandiri` / `Drill Wajib` negatively asserted.
- Copy: Figma Indonesian verbatim (see §4 + nodes 94:38951/94:39232), minus the §2 deletions.

## 6. Data / feedback

```ts
// features/member/data/get-session-detail.ts
import "server-only";
import { cacheLife } from "next/cache";

export async function getSessionDetail(id: string): Promise<SessionDetail> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /member/history/:id) — dummy for now
  return id === afterSessionDetail.id ? afterSessionDetail : beforeSessionDetail;
}
```

```tsx
// features/member/components/session-detail-actions.tsx (stub shape)
// TODO: wire Konfirmasi + Mulai Remedial to lib/api-client.ts (POST /member/remedial) when the mutation move lands — dead stubs for now
// Latihan Ulang path reuses /latihan/pukulan/rekam as live Link where shown
```

Static shell per Suspense unit. No mutation, no prefetch beyond dummy.

## 7. Verification

- `tests/unit/member/session-detail-data.test.ts`: before/after ids, Figma literals (coach, 80/85, pillar scores/stages, video meta, retest, 5 posture catatan/koreksi, static count `3 Sesuai • 2 Koreksi`), `postures` 0-vs-5, `SessionDecision` union, `thumbnailSrc: null` literal on postures, no `terverifikasi`/`latihan-mandiri`/`drill` keys.
- `tests/unit/member/session-detail-shell.test.ts`: thin route (no `use client`, `generateStaticParams` + `notFound` path), 4 Suspense units, flex-only, badge strings + negative assertions (§5), placeholder asserts (no `<img>`), empty-vs-full posture switch, dead-CTA TODOs, full Card composition, no `absolute`.
- Green: `pnpm build` + `tsc --noEmit` + `eslint` + `pnpm test`.
- Browser (Playwright): `scrollWidth <= innerWidth` at 390px + desktop on `/riwayat/[id]` before + after; no horizontal overflow in any card.

## 8. Out of scope

Riwayat list (shipped, sibling spec), `Latihan Mandiri` drill section (dropped — PSR-79 decision-comment close), real history endpoint + auth headers, video binding/playback, chart library, feedback textarea + mutation (Phase 11), E2E tests, sticky elements.
