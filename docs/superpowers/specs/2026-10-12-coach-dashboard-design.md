# Coach Dashboard Design — /coach (Phase 10, dashboard only)

Date: 2026-10-12. Status: draft, approved as contract (rev 0 approved 2026-10-12: dashboard-only scope under shared Phase 10 milestone, semantic Badge mapping, shared `/profil` 4th nav, dead PDF CTA, Users/Target/Clock/Wrench icons, Ringkasan subtitle drop; rev 1 approved 2026-10-12: per-row detail CTAs, justify-between stat footers, badges-in-content, drill-text drop, Figma-verbatim stat labels — see §2). Linear: milestone `[Phase 10] Coach foundation` to be created JIT (shared with later members-list move); parent `[coach] Ship coach dashboard` + ~4 subs to be created after this spec. Sibling specs: `2026-10-08-member-dashboard-design.md` (Suspense-section + shell pattern reused), `2026-10-11-member-profile-design.md` (shared `/profil` role-prop contract reused). Figma `94:37791` (`Dashboard - Coach`, 390×1828; `get_design_context` timed out twice 2026-10-12 — contract pinned from screenshot + full metadata instead; pixel audit deferred to implementation).

## 1. Goal

Coach dashboard frontend at `/coach`: header (heading + desc + dead PDF CTA) + 4-stat grid + athlete Ringkasan list (5 cards) + 4-pilar monitor + 5-titik posture validation, inside a coach shell (top nav + 4-tab bottom nav). All data-backed elements render from dummy data behind a `TODO: connect backend` fetcher; all pills are shadcn `Badge`; all graphics are lucide icons. Source is Figma `94:37791` with explicit deltas (§2).

## 2. Figma deltas (user decisions 2026-10-12, supersede verbatim fidelity)

- DROPPED the `Portal pelatih…` eyebrow badge everywhere — header starts at H1 `Dashboard Pelatih` + desc (`Ringkasan performa latihan mandiri dan monitoring kinematika 5 atlet binaan UKM UNSIL.`).
- SHELL: coach bottom nav carries 4 items — `Dasbor` / `Member List` / `Laporan` / `Profil` (Profil → shared `/profil` with `role="coach"` per PSR-80 union DTO; no new coach-profile route this move). Top nav keeps `KF` avatar + `Dashboard` crumb + `Cloud Sinkron` pill.
- CARDS: every section uses full shadcn `Card` composition (`CardHeader` + `Title`/`Description`/`Action`, `CardContent`, `CardFooter`) per exa/context7 findings (base-nova, `size="sm"` on stat tiles); no hand-rolled bordered divs.
- DROPPED the subtitle in the Ringkasan Latihan section — list header is Title `Ringkasan Latihan Member` + count `Badge` (`5 Atlet`) only; the `Hasil inferensi pose MediaPipe 33-titik…` line is REMOVED.
- PILLS → `Badge` (semantic mapping, variant set `default|secondary|destructive|outline|success|warning`): `Siap Tanding` / `Lolos Standar` = `success`; `Tahap Remediasi` / `Deviasi` / posture warning = `warning`; counts (`5 Atlet`) = `secondary`; targets (`Target ≥ 85%`) = `outline`; scores stay numeric text (no Badge).
- MEMBER SUBTITLE → last practiced gerakan: each athlete row subtitle renders `lastGerakan` only (e.g. `Kuda-kuda`, `Tendangan`, `Pukulan`) — the Figma detail suffixes (`Tumpuan 100%`, `Recoil Poros Panggul 12cm`) are REMOVED.
- GRAPHICS → lucide only: stat icons `Users` (Total Atlet) / `Target` (Akurasi) / `Clock` (Antrean) / `Wrench` (Fokus); no SVG illustrations, no `next/image` src (avatar circles render initials `AS/SN/RM/FP/DW`, `role="img"`).
- CTA `Unduh Rapor Tim (PDF)` is a DEAD `Button` with `TODO (GET /coach/report)` — no download logic this move (member dead-CTA precedent).
- REV 1 (user review 2026-10-12, re-read of 94:37791 metadata — each `Article - Member N` owns its `HorizontalBorder + Button "Lihat Detail"`; stat pills sit inside the content container above the footer margin):
  - PER-ROW `Lihat Detail`: every athlete `<li>` is a mini-card (identity row + `border-t` + full-width dead CTA with Phase 11 TODO); the single list-level footer affordance is REMOVED (reverses the Task 4 one-affordance call — Figma fidelity governs).
  - STAT FOOTERS = `justify-between` pairs: `Ketuntasan | 60%`, `24 Sesi | +3.8%`, `Uji Dojo | 2 Okt 2026`; Fokus card has NO footer.
  - BADGES → `CardContent`: value + Badge (stats 1–2), value + queue note (stat 3), value only (stat 4).
  - DROPPED the Fokus drill text (`+8 cm sayap (142°) · Drill: Rib-Slide Punch`); `CoachStat.context` removed, replaced by `note?` + `footerLeft?`/`footerRight?`.
  - LABELS Figma-verbatim (prior draft had invented copy — corrected, no instruction had ordered those changes): `Akurasi Tim` (was `Rata-rata Akurasi Tim`), `Sidang Uji` (was `Antrean Sidang & Evaluasi`), `Fokus Utama` (was `Fokus Perbaikan Utama`). Separators/decimal punctuation intentionally left as-is (out of rev-1 scope).

## 3. Architecture

- Route (thin RSC, no logic): `app/(coach)/coach/page.tsx` → `CoachDashboardPage` (coach shell layout owns `activeTab="dasbor"`, trail `["Dashboard"]`). Members list (`/coach/members`, node 94:40178) is OUT — same milestone, separate move.
- Composition: `features/coach/pages/coach-dashboard-page.tsx` (static shell + four `<Suspense>` units: stats, athlete list, pillars, posture; follows `dashboard-page.tsx` pattern — one cached fetcher, four boundaries for streaming).
- Client boundary: none expected — dashboard is read-only; `Lihat Detail` links to `/coach/members/[id]` (Phase 11 route, dead TODO href this move); if a filter/search appears it lives in `components/` with `"use client"` (not planned).
- Components (`features/coach/components/`): `coach-layout.tsx` (top + bottom nav), `coach-header.tsx` (H1 + desc + dead CTA), `coach-stat-grid.tsx` (4 `StatCard`s), `coach-athlete-list.tsx` (list Card + 5 rows), `coach-pillar-monitor.tsx` (4 div progress bars), `coach-posture-grid.tsx` (2×2 tiles + alert banner). Shared placeholder mirrors member pattern. Icons `lucide-react` only (`Users`, `Target`, `Clock`, `Wrench`, `LayoutDashboard`, `UsersRound`, `FileText`, `User`, `Download`, `ChevronRight`). No Radix. `@/` imports only.
- Data: `features/coach/data/get-coach-overview.ts` (server-only, `'use cache'` + `cacheLife('minutes')`, returns `CoachOverview`) + `features/coach/data/coach-overview-dummy.ts` (pure). No `schemas/` (read-only). No `app/api/`.

## 4. Types / DTOs (expected backend shape, mirrored from `types`)

```ts
type AthleteStage = "siap" | "remediasi" | "lolos";

interface CoachAthlete {
  id: string; // "aced-suryana"
  initials: string; // "AS"
  name: string; // "Aced Suryana"
  stage: AthleteStage; // "remediasi"
  stageLabel: string; // "Tahap Remediasi"
  scorePct: number; // 80
  lastGerakan: string; // "Kuda-kuda" (subtitle — detail suffixes removed per §2)
}

type PillarStatus = "stabil" | "optimal" | "deviasi" | "remediasi";

interface CoachPillar {
  slug: string; // "kuda-kuda"
  name: string; // "Kuda-kuda"
  avgPct: number; // 94.8
  status: PillarStatus; // "stabil"
  statusLabel: string; // "Stabil"
}

interface CoachStat {
  id: "total-atlet" | "akurasi-tim" | "sidang-uji" | "fokus";
  label: string; // "Total Atlet" | "Akurasi Tim" | "Sidang Uji" | "Fokus Utama" (Figma-verbatim, rev 1)
  value: string; // "5 Atlet"
  badge?: string; // content pill: "3 Siap 2 Remediasi" | "Target ≥ 85% (-0.4%)"
  note?: string; // content third line: "Aced S., Siti N." (stat 3)
  footerLeft?: string; // "Ketuntasan" | "24 Sesi" | "Uji Dojo" (absent on fokus)
  footerRight?: string; // "60%" | "+3.8%" | "2 Okt 2026" (absent on fokus)
}

interface PosturePoint {
  id: string; // "bahu-leher"
  name: string; // "1. Bahu & Leher"
  scorePct: number; // 92
  statusLabel: string; // "Sesuai" | "Deviasi" | "Terdeteksi"
  warning?: boolean; // true for Siku Kanan + Pronasi banner
}

interface CoachOverview {
  stats: CoachStat[]; // length 4: 5 Atlet / 84.6% / 2 Sesi / Elevasi Siku
  athletes: CoachAthlete[]; // length 5: AS 80 / SN 76 / RM 94 / FP 91 / DW 88
  pillars: CoachPillar[]; // length 4: 94.8 / 89.0 / 82.0 / 78.0
  posture: PosturePoint[]; // length 5: 92 / 64 / 88 / 91 / 58
  reviewQueue: string[]; // ["Aced S.", "Siti N."]
  teamAccuracyPct: number; // 84.6
  accuracyTargetPct: number; // 85
}
// Endpoints: TODO (GET /coach/overview), TODO (GET /coach/report).
```

Dummy values mirror Figma verbatim (5 Atlet, 84.6% vs 85%, 2 Sesi Sidang Uji, Elevasi Siku value-only, 5 athletes with scores above, 4 pillars, 5 posture points with KF-coach context). Single `types.ts` file until 2+ types force directory form.

## 5. UI pattern

- Flex/grid layouts only — no `absolute` in new/modified UI files.
- Stat tiles = `Card size="sm"`: `CardHeader` (Title=label + Action=icon) + `CardContent` (value tabular-nums + Badge + note) + `CardFooter` (`justify-between` footer pair; omitted on Fokus). Stat 1 `5 Atlet` + `3 Siap 2 Remediasi` secondary Badge, footer `Ketuntasan | 60%`; stat 2 `84.6%` + `Target ≥ 85% (-0.4%)` outline Badge, footer `24 Sesi | +3.8%`; stat 3 `2 Sesi` + `Aced S., Siti N.` note, footer `Uji Dojo | 2 Okt 2026`; stat 4 `Elevasi Siku` value-only, no footer.
- Athlete rows = mini-cards: initials avatar (`role="img"`) + name + stage Badge + `lastGerakan` subtitle + score, then `border-t` + full-width dead `Lihat Detail` CTA per row (TODO to Phase 11 detail). No per-row MediaPipe copy.
- Pillars = div progress bars (no chart dep, roadmap Not-list) + header `target ≥ 85%` outline Badge; status text colored via Badge (`Stabil` success, `Optimal` secondary, `Deviasi Siku` warning, `Remediasi` warning).
- Posture = 2×2 tiles + full-width warning banner (`5. Pronasi Pergelangan — 58% Terdeteksi (+10.5°)`); tiles carry score + status Badge, no invented copy.
- Placeholders: every visual is a `div role="img"`; strings pinned in test: `Dashboard Pelatih`, `5 Atlet`, `Kuda-kuda`, `84.6%`.

## 6. Data flow

```ts
// features/coach/data/get-coach-overview.ts
import "server-only";
import { cacheLife } from "next/cache";

export async function getCoachOverview(): Promise<CoachOverview> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /coach/overview) — dummy for now
  return dummyCoachOverview;
}
```

Static shell calls it directly in each RSC `<Suspense>` unit (request-time fetch, static shell preserved per CODE_STANDARD §1). No mutations this move (feedback `POST /coach/feedback` is Phase 11). Read-your-own-write N/A (read-only).

## 7. Verification

- `tests/unit/coach/coach-overview-data.test.ts`: dummy shape (5 athletes, 4 pillars, 5 posture points), Figma literals (`5 Atlet`, `84.6`, `Elevasi Siku`, `Kuda-kuda`), stage→Badge mapping (`siap`→success, `remediasi`→warning, `lolos`→success). Arrange-act-assert, one behavior per test.
- Green: `pnpm build` + `tsc --noEmit` + `eslint` + `pnpm test`.
- Browser: `document.documentElement.scrollWidth <= window.innerWidth` at 390px for `/coach` (paste result in review comment per CODE_STANDARD §6); dead-CTA TODOs spot-checked.

## 8. Out of scope

Backend connect + `lib/api-client.ts`, members list (`/coach/members`, node 94:40178 — same milestone, next move), member detail + feedback mutation (Phase 11), real PDF export, session/cookie handling, real photos, chart library, E2E tests.
