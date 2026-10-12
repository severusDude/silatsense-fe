# Member Riwayat Design — /riwayat list (PSR-74)

Date: 2026-10-11. Status: draft, approved as contract (rev 0 approved 2026-10-11: gerakan-card deltas). Linear parent: PSR-74 (`[riwayat] Ship history screens`), milestone `[Phase 8] Riwayat history` (created JIT 2026-10-11 — Phase 7 closed at 100%, 1 open milestone). Subs: PSR-77 (data+DTOs), PSR-76 (list UI, this revision), PSR-78 (routes+nav), PSR-75 (detail UI, later move), PSR-79 (coach-note+drills, later move). Sibling spec: `2026-10-11-member-evaluasi-design.md` (Badge + Collapsible patterns reused). Figma `94:39929` (list), `94:39690` (card header), `94:39726` (expanded body).

## 1. Goal

Riwayat-list frontend at `/riwayat`: page header + 4 stat cards + `Daftar 4 Gerakan Utama` section with 4 gerakan cards, each independently collapsible (all collapsed by default) with an expanded body of 5 parameter chips + coach note + dual CTA. Source is Figma `94:39929` + `94:39690` + `94:39726` with explicit deltas (§2).

## 2. Figma deltas (decision 2026-10-11, supersedes verbatim fidelity)

- FLIPPED card header order: title on top (`Kuda Kuda (Pasang Rendah)`), session date below (`26 SEP 2026 • 09:15 WIB`). Applies to collapsed rows and expanded headers alike.
- DROPPED numbering (`1.` `2.` `3.` `4.`) and `• PILAR 0N` suffixes everywhere — subtitle carries date + hour only.
- DROPPED expanded-body header block (`RINGKASAN 5 PARAMETER POSTUR BIOMEKANIKA` + `MediaPipe 33-Keypoints`); the 5-chip grid renders without a header.
- DROPPED coach-note telemetry row (`15 Reps • 03:45 • 4.18 m/s`); the note keeps `Catatan Pelatih:` + verdict text only. Consistent with evaluasi's dropped `4.18 m/s` speed badge (decision 2026-10-11).
- REPLACED status pills with shadcn `Badge` (`@/components/ui/badge`, base-nova): `Sesuai Standar` → `<Badge variant="success">Sesuai</Badge>`, `Perlu Perbaikan` → `<Badge variant="warning">Perlu Koreksi</Badge>`. Title-case wording unifies with evaluasi (`Perlu Koreksi` everywhere; roadmap risk log closed by this decision).
- ICONS: one generic `lucide-react` icon per card as placeholder, each pinned with `TODO: replace with per-gerakan Lucide icon` (`PersonStanding` kuda-kuda / `Hand` pukulan / `Shield` tangkisan / `Footprints` tendangan).
- KEPT static: header + description copy, 4 stat cards copy, card summaries, score blocks (`91%` + `Kinematika IPSI` / `80%` + `Standar ≥85%`), 5 param chips, dual CTA copy. No interactivity beyond expand/collapse in stub (dead `Detail Evaluasi` carries a TODO).

## 3. Architecture

- Routes (thin RSC, no logic): `app/(member)/riwayat/page.tsx` → `RiwayatPage()` (PSR-78). Leaf layout owns `activeTab="riwayat"`, trail `["Dashboard", "Riwayat Latihan"]`.
- Composition: `features/member/pages/riwayat-page.tsx` (static shell + two `<Suspense>` units: header/stats, movement list).
- Client boundary: exactly one island type — `riwayat-movement-item.tsx` (`"use client"`, per-card `useState` open flag default `false`, serializable `HistoryEntry` props). List stays server, so toggles are independent (multiple cards may be open).
- Components (`features/member/components/`): `riwayat-stat-grid.tsx` (server, 4 cards), `riwayat-movement-list.tsx` (server: maps entries), `riwayat-movement-item.tsx` (client: `Collapsible` row + expanded body), `riwayat-param-chips.tsx` (server), `riwayat-coach-note.tsx` (server, no telemetry), `riwayat-card-actions.tsx` (server: live `Link` + dead stub). Full `Card` composition on section shells; CTAs live in `CardFooter`. Icons `lucide-react` 1.x only (placeholder set above + `ChevronDown`).
- Data: `features/member/data/get-riwayat.ts` (server-only, `'use cache'` + `cacheLife('minutes')`, returns `MemberHistory`) + `features/member/data/riwayat-dummy.ts` (pure). No `schemas/` (read-only). No `app/api/`. `@/` imports only.

## 4. Types / DTOs (expected backend shape, mirrored from `types`)

```ts
type RiwayatSlug = PersiapanSlug; // "kuda-kuda" | "pukulan" | "tangkisan" | "tendangan"

type HistoryStatus = "sesuai" | "perlu-koreksi";

interface RiwayatParam {
  id: "bahu" | "siku-kanan" | "pinggul" | "lutut" | "pergelangan";
  name: string; // e.g. "Siku Kanan"
  reading: string; // e.g. "Deviasi +8cm (142°)" | "Sesuai (Sejajar)"
  deviated: boolean; // true on siku-kanan + pergelangan (pukulan)
  actionLabel?: string; // e.g. "Koreksi Rotasi" — pergelangan only
}

interface HistoryEntry {
  slug: RiwayatSlug;
  techniqueName: string; // e.g. "Pukulan Lurus Depan" — no numbering
  dateLabel: string; // e.g. "28 SEP 2026"
  timeLabel: string; // e.g. "16:45 WIB"
  summary: string; // Figma card summary verbatim
  status: HistoryStatus;
  statusLabel: string; // "Sesuai" | "Perlu Koreksi" — title-case, status word only
  scorePct: number; // e.g. 80
  scoreCaption: string; // "Kinematika IPSI" | "Standar ≥85%"
  params: RiwayatParam[]; // length 5
  coachNote: string; // e.g. "Rapatkan siku kanan ke lintasan rusuk …" — verdict only
}

interface HistorySummary {
  totalSessionsLabel: string; // "24 Sesi"
  sessionsDeltaLabel: string; // "↗ +4 minggu ini"
  avgAccuracyPct: number; // 84.6
  accuracyNote: string; // "Mendekati IPSI ≥85%"
  dominantFocus: string; // "Kuda Kuda"
  dominantSessionsLabel: string; // "12 Sesi terekam"
  sensorHoursLabel: string; // "08j 45m"
  sensorNote: string; // "Telemetri aktif"
}

interface MemberHistory {
  summary: HistorySummary;
  entries: HistoryEntry[]; // length 4, order: kuda-kuda, pukulan, tangkisan, tendangan
}
```

Pukulan-verb pin (dummy): `80% / Standar ≥85% / Perlu Koreksi`, params bahu `Sesuai (Sejajar)` / siku-kanan `Deviasi +8cm (142°)` / pinggul `Sesuai (Terkunci)` / lutut `Sesuai (Fleksi 135°)` / pergelangan `Pronasi Lambat` + `Koreksi Rotasi`, coach note `Rapatkan siku kanan ke lintasan rusuk sebelum dilepaskan ke target untuk mengunci kinetik lurus.` Kuda-kuda `91% / Sesuai`, tangkisan `86% / Sesuai`, tendangan `76% / Perlu Koreksi`.

## 5. UI pattern

- Flex/grid layouts only — no `absolute` in new/modified UI files.
- Collapsed row = `CollapsibleTrigger` (whole row tappable, `min-h-[64px]`): icon chip + title + date line + summary + footer (`Badge` + score + rotating chevron, 200–300ms ease-out, `motion-reduce` guard). All cards render collapsed by default.
- Expanded body = `CollapsibleContent`: 5-chip grid (2-col, pergelangan full-width; deviated chips warning-tinted) + coach-note banner (icon + `Catatan Pelatih:` verdict) + dual CTA (`Latihan Ulang` live `Link href={/latihan/${slug}/rekam}`, `Detail Evaluasi` dead stub with TODO).
- Badges: `Badge` only (`success` / `warning` + `className` for size), never hand-rolled pills. Two strings pinned in shell test: `Sesuai`, `Perlu Koreksi`, plus `PILAR` / `Perlu Perbaikan` / `Sesuai Standar` / `15 Reps` negatively asserted.
- Copy: Figma Indonesian verbatim for header/stats/cards (see §4 + metadata 94:39929/94:39690/94:39726), minus the §2 deletions.

## 6. Data / feedback

```ts
// features/member/data/get-riwayat.ts
import "server-only";
import { cacheLife } from "next/cache";

export async function getRiwayat(): Promise<MemberHistory> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /member/history) — dummy for now
  return dummyMemberHistory;
}
```

```tsx
// features/member/components/riwayat-card-actions.tsx (stub shape)
// TODO: wire Detail Evaluasi to lib/api-client.ts (GET /member/history/:id) when the detail move lands — dead stub for now
```

Static shell per Suspense unit. `Latihan Ulang` reuses the existing `/latihan/[slug]/rekam` route (no new wiring).

## 7. Verification

- `tests/unit/member/riwayat-data.test.ts`: entries length 4, Figma literals (stats + titles + dates + scores + pukulan params/note), `HistoryStatus` union, no `pilar`/`speedLabel`/`telemetry` keys.
- `tests/unit/member/riwayat-shell.test.ts`: thin route (no `use client`), 2 Suspense units, flex-only, badge strings + negative assertions (§5), all-collapsed-by-default + independent toggle interaction, icon TODOs, live `Latihan Ulang` hrefs + dead `Detail Evaluasi` TODO, full Card composition, no `absolute`.
- Green: `pnpm build` + `tsc --noEmit` + `eslint` + `pnpm test`.
- Browser (Playwright): `scrollWidth <= innerWidth` at 390px + desktop on `/riwayat`; tap expands pukulan body (chips + note + dual CTA) while siblings stay collapsed.

## 8. Out of scope

`/riwayat/[id]` detail before/after (PSR-75), coach-note+drills shared cards as detail variants (PSR-79), real history endpoint + auth headers, video binding, chart library, E2E tests, sticky elements.
