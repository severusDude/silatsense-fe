# Coach Member History Design — /coach/members/[id]/riwayat (Phase 12, first move)

Date: 2026-10-19. Status: draft, design approved 2026-10-19; pending file review to become contract. Linear: new milestone `[Phase 12] Coach member history` (JIT) + parent `[coach] Ship member history` + subs (DTOs+pagination / list UI / route+links). Sibling specs: `2026-10-14-coach-member-detail-design.md` (athlete profile component reused verbatim, coach shell, shared Badge helper), `2026-10-13-coach-members-design.md` (Card composition, dummy+TODO contract). Figma `94:40907` (`Daftar Riwayat sesi - Coach`, 390×2040; `get_design_context` timed out 2026-10-19 incl. sub-nodes — contract pinned from full-frame screenshot + full metadata, Phase 11 precedent). Note: isolated sub-node screenshots render component-default text ("Kemarin, 16:45 WIB"), while the full-frame render shows the instance overrides ("06 Mar 2026, 15:45 WIB") — the full-frame render is authoritative for dummy literals; pixel text audit deferred to implementation.

## 1. Goal

Coach member history at `/coach/members/[id]/riwayat`: the reused athlete profile section + a `Daftar Riwayat Sesi` section listing 24 dummy sessions paginated 10/page via the `?page=N` URL param, inside the coach shell (`activeTab="members"`, trail `["Dashboard", "Member List", "Daftar Riwayat Sesi Member"]`). Cards are static rows. Every card badge is a bare shared-helper Badge (`Sesuai`/`Remediasi`/`Tidak Sesuai`), never the Figma badge strings. The dead `Buku Semua Riwayat Atlet` link on the member detail screen goes live to this route.

## 2. Figma deltas (user decisions 2026-10-19, supersede verbatim fidelity)

- PROFILE CARD: REUSE `MemberDetailProfile` unchanged (import as-is, same `MemberDetail` data via existing `getMemberDetail`). Figma extras DROPPED: dual identity badges (`UKM SILAT UNSIL`, `NPM: 2307051`), `Terakhir aktif` line, 3 meta boxes with sub-lines (`Tingkatan/Selesai/Kehadiran` + `Ragam 2`/`Terarsip`/`Sasana Prima`), aggregate status pill (`Perlu Poles (-2.6%)`), 3 mini metrics (`24 Total Sesi`, `14j Jam Terbang`, `91% Kestabilan Kuda²`). The shipped component already carries avatar + ONE state Badge + name/NIM + belt/attendance/aggregate trio + aggregate Badge.
- BADGES (user rule, supersedes Figma text): every session card renders exactly ONE bare `Badge` from `performanceBadgeLabel/badgeVariant` — no icons, no suffixes. DROPPED Figma strings: `Sesuai Skor Kualitas (80.0%)`, `Sesuai Standar IPSI`, `Optimal (Posisi 135°)`, `Timing Tendangan Terlambat (-6.5°)`, `Kecepatan Pukul Kurang (Tinggi)`, `Tembus Dorong Kuda² Kuat (98%)`, `Sudut Tolakan & Kuat (95%)`, `Kaki Lurus Tenggelam Kedalam (0.2)`, `Lintasan Linear Bagus (Sore)`, `Distribusi Beban 40 Kombinasi`, `Sayap Siku Kanan (+8cm)`, `Sudut Lengan Tepat 45°`. Tone map fixed from Figma card color: amber → `remediasi` (warning), green → `sesuai` (success), red → `tidak-sesuai` (destructive); `evaluasi` never appears on this screen.
- CARDS STATIC: no deep links, chevrons, or CTAs (user decision). A coach session-detail route stays out (roadmap not-list — no distinct Figma node).
- PAGINATION FUNCTIONAL VIA URL (user decision): `?page=N`, 10/page, 3 pages (10/10/4). Absent/invalid/out-of-range values clamp to `1..totalPages`. Figma page 1 = 10 of 24 sessions.
- SCORE BLOCK: score rendered 1 decimal (`82.0%`) in the tone color of the badge key; caption `Skor AI` (from close-up). Dot before the technique title uses the same tone color.
- SECTION HEADER: H2 `Daftar Riwayat Sesi` + count Badge via `META_BADGE_VARIANT.count` = `{shown} / {totalSessions} Sesi` (slice-derived, e.g. `10 / 24 Sesi` on page 1, `4 / 24 Sesi` on page 3) + muted description `Catatan telemetri repetisi dan akurasi sensorik MediaPipe.`
- DATES/SUBTITLES: dummy literals pinned from the full-frame render where legible (first 10 cards listed in §5); remaining 14 are plausible placeholder cycles (weekly/biweekly before 24 Jan 2026). Characterization test pins only the stable subset (card #24 literals, counts, order, tone sequence, badge-key subset) — not the garbled literals.

## 3. Architecture

- Routes — restructure `app/(coach)/coach/members/[id]/` with the repo's route-group precedent (`(list)`, `(persiapan)`) so the two screens get distinct shells:
  - `[id]/(detail)/layout.tsx` + `[id]/(detail)/page.tsx` — MOVED from `[id]/layout.tsx` + `[id]/page.tsx`, same content (`activeTab="members"`, trail `["Dashboard", "Member List", "Detail"]`).
  - `[id]/(history)/riwayat/layout.tsx` — new: `CoachLayout activeTab="members"` trail `["Dashboard", "Member List", "Daftar Riwayat Sesi Member"]`.
  - `[id]/(history)/riwayat/page.tsx` — new thin RSC: `generateStaticParams` from `memberHistoryIds`, awaits `params` (id), passes the `searchParams` Promise down (URL data must stay inside `<Suspense>`; never await it in the route body or inside `'use cache'`), calls `MemberHistoryPage({ id, searchParams })`. No client code, no fetch, no validation.
  - `tests/unit/coach/member-detail-route.test.ts` paths updated for the group move.
- Composition: `features/coach/pages/member-history-page.tsx` — static shell + 2 `<Suspense>` units with `Skeleton` fallbacks:
  - `ProfileSection` (async): `getMemberDetail(id)` → null → `notFound()`; renders `<MemberDetailProfile detail={detail} />` unchanged.
  - `HistorySection` (async): `Promise.all([getMemberHistory(id), searchParams])` → null → `notFound()`; `parseHistoryPage(query.page)` + pure `paginateHistory(history.sessions, page, history.pageSize)`; renders `<MemberHistorySection … />`.
- Components (`features/coach/components/`, new, all server unless noted):
  - `member-history-section.tsx` — `<section aria-labelledby>`: header row (H2 + count Badge), `<ul>` of `history-session-card`, then `history-pagination`.
  - `history-session-card.tsx` — one `<Card size="sm">` row (`<li>` wrapper).
  - `history-pagination.tsx` — range text + `<nav aria-label>` controls: prev / numbered pages / next, all `next/link` + `buttonVariants` (no Pagination primitive exists in `components/ui/`); disabled at edges.
  - Reused unchanged: `member-detail-profile.tsx`.
  - Updated: `session-history-log.tsx` — add `memberId` prop, `Buku Semua Riwayat Atlet` href → `` `/coach/members/${memberId}/riwayat` ``, drop the dead-TODO comment; `member-detail-page.tsx` passes `memberId={detail.id}`.
- Data (`features/coach/data/`): `member-history-dummy.ts` (pure, 24 entries), `get-member-history.ts` (server-only, `'use cache'` + `cacheLife('minutes')`, `TODO (GET /coach/members/[id]/history?page=N)`, exports `memberHistoryIds`), `paginate-history.ts` (pure: `parseHistoryPage` + `paginateHistory`; Vitest-safe).
- Icons: `ChevronLeft` / `ChevronRight` (lucide) only. No inline SVG, no `absolute`, no `next/image`. `@/` imports only.

## 4. Types / DTOs (expected backend shape, mirrored from `types`)

```ts
// features/coach/types.ts — additive; HistorySession (member-detail log, 4 rows) stays untouched.
export interface HistoryPageSession {
  id: string;            // "sesi-24"
  sesiLabel: string;     // "Sesi #24" (Figma hash style, differs from log's "Sesi 24")
  dateLabel: string;     // "06 Mar 2026, 15:45 WIB"
  title: string;         // "Pukulan Lurus Depan"
  subtitle: string;      // "Penetapan Sasaran Target"
  repetisiLabel: string; // "Repetisi: 42/50 (84%)"
  scorePct: number;      // 82
  badgeKey: PerformanceBadgeKey; // sesuai | remediasi | tidak-sesuai only (never evaluasi)
}

export interface MemberHistory {
  memberId: string;               // "aced-suryana"
  totalSessions: number;          // 24
  pageSize: number;               // 10
  sessions: HistoryPageSession[]; // 24, newest first (sesi-24 .. sesi-01)
}
// Endpoint: TODO (GET /coach/members/[id]/history?page=N)
```

Dummy first-page literals (Figma full-frame render, page 1 — tone from card color):

| # | dateLabel | title | subtitle | repetisi | score | key |
|---|---|---|---|---|---|---|
| 24 | 06 Mar 2026, 15:45 WIB | Pukulan Lurus Depan | Penetapan Sasaran Target | 42/50 (84%) | 82.0 | remediasi |
| 23 | 03 Mar 2026, 15:30 WIB | Tangkisan Lurus & Kuda-Kuda | Kombinasi Dokter Posisi (3) | 36/40 (90%) | 86.4 | sesuai |
| 22 | 28 Feb 2026, 15:10 WIB | Kuda-kuda | Pertahanan Statis (Freestyle) | 40/40 (100%) | 92.0 | sesuai |
| 21 | 27 Feb 2026, 16:00 WIB | Tendangan | Serangan Pukulan | 36/40 (90%) | 76.5 | tidak-sesuai |
| 20 | 20 Feb 2026, 15:45 WIB | Pukulan Lurus Depan | Penetapan Sasaran Target | 38/40 (95%) | 81.2 | remediasi |
| 19 | 17 Feb 2026, 10:00 WIB | Kuda-kuda | Pertahanan Statis (Front) | 40/40 (100%) | 94.5 | sesuai |
| 18 | 09 Feb 2026, 15:00 WIB | Tangkisan Lurus & Terkait | Kuda-Kuda Terkunci | 35/39 (89%) | 88.0 | sesuai |
| 17 | 27 Jan 2026, 14:45 WIB | Tendangan & Kelincahan | Kelincahan Gerak dan Otot | 35/40 (87%) | 76.0 | tidak-sesuai |
| 16 | 28 Jan 2026, 15:30 WIB | Pukulan Tungkai & Passer Siku | Perisai Serangan | 40/40 (95%) | 85.5 | sesuai |
| 15 | 24 Jan 2026, 15:30 WIB | Kuda-kuda | Kekuatan Tumpuan | 50/50 (100%) | 95.5 | sesuai |

Sub-lines marked above are screenshot-read approximations (`18`, `17`, `16`, `15`, `23` subtitles) — verification note §2; test pins only row 24 + tone sequence. Tones for #14..01: mixed subset of the same 3 keys; dates continue roughly biweekly descending from Jan 2026; ids `sesi-14`..`sesi-01`.

## 5. UI pattern

- Flex/grid only — no `absolute`, no `next/image`, no inline SVG. Badges bare (no icons).
- Section: `<section aria-labelledby="member-history-heading" className="flex flex-col gap-2.5">`; header row `flex items-center justify-between gap-2` → H2 `text-lg font-bold` `Daftar Riwayat Sesi` + `<Badge variant={META_BADGE_VARIANT.count}>{shown} / {totalSessions} Sesi</Badge>`; description `<p className="text-xs text-muted-foreground">`.
- Card (`<li>` → `Card size="sm"`):
  - `CardHeader` → row 1 `flex items-start justify-between gap-2`: left `flex flex-wrap items-baseline gap-1` (`{sesiLabel}` `text-xs font-bold` + `• {dateLabel}` `text-[10px] text-muted-foreground`); right `flex flex-col items-end` (`{scorePct.toFixed(1)}%` `text-sm font-bold` tone-colored + `Skor AI` `text-[9px] text-muted-foreground`).
  - row 2 `flex items-center gap-1.5`: tone dot `<span aria-hidden className="size-1.5 rounded-full bg-success|bg-warning|bg-destructive" />` + `{title}` `text-sm font-bold`.
  - row 3: `{subtitle}` `text-[10px] text-muted-foreground`.
  - `CardContent className="flex items-center justify-between gap-2 border-t pt-2.5"`: repetisi text (`text-[10px] text-muted-foreground`, `Repetisi:` prefix + bold fraction) + `<Badge variant={performanceBadgeVariant(session.badgeKey)}>{performanceBadgeLabel(session.badgeKey)}</Badge>`.
  - Tone → classes map local to `history-session-card.tsx`: variant key from `performanceBadgeVariant` → `{ success: "text-success" / "bg-success", warning: "text-warning" / "bg-warning", destructive: "text-destructive" / "bg-destructive" }` (tokens exist in `app/globals.css`).
- Pagination (`history-pagination.tsx`): `<nav aria-label="Navigasi halaman riwayat sesi">`; range line `Menampilkan {rangeStart} - {rangeEnd} dari {totalSessions} total sesi biomekanika` (numbers `font-bold`); controls `flex items-center justify-between gap-2`:
  - prev: page 1 → disabled `<Button variant="outline" size="sm" disabled>` (`ChevronLeft` + `Sebelumnya`); else `<Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`/coach/members/${memberId}/riwayat?page=${page - 1}`}>`; next mirrored (`ChevronRight` + `Selanjutnya`), disabled on last page. Explicit hrefs (not relative `?page=`) keep links source-testable.
  - pages: `1..totalPages` links with the same explicit href pattern; active page → `buttonVariants({ variant: "default", size: "sm" })` + `aria-current="page"`; inactive → outline Link.
- Badge allowlist on this screen: performance labels `Sesuai | Remediasi | Tidak Sesuai` + count badge only. No other Badge usage.
- Strings pinned in test: `Daftar Riwayat Sesi`, the description line, `Menampilkan`, `total sesi biomekanika`, `Sebelumnya`, `Selanjutnya`, `Skor AI`, `Sesi #24`, `Pukulan Lurus Depan`, `Repetisi:`.

## 6. Data flow

```ts
// features/coach/data/get-member-history.ts
import "server-only";
import { cacheLife } from "next/cache";
import { dummyMemberHistory } from "@/features/coach/data/member-history-dummy";
import type { MemberHistory } from "@/features/coach/types";

export const memberHistoryIds = Object.keys(dummyMemberHistory);

export async function getMemberHistory(id: string): Promise<MemberHistory | null> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /coach/members/[id]/history?page=N) — dummy for now
  return dummyMemberHistory[id] ?? null;
}
```

```ts
// features/coach/data/paginate-history.ts — pure, Vitest-safe
export function parseHistoryPage(value: string | string[] | undefined): number; // invalid → 1
export interface HistoryPageSlice {
  sessions: HistoryPageSession[];
  page: number;        // clamped 1..totalPages
  totalPages: number;  // max(1, ceil(n / pageSize))
  rangeStart: number;  // 1-based; 0 when empty
  rangeEnd: number;
}
export function paginateHistory(sessions: HistoryPageSession[], page: number, pageSize: number): HistoryPageSlice;
```

- URL data rule (verified locally + context7): `searchParams` is URL data — it must not be read inside `'use cache'` (pass as arg or read outside) and must be awaited inside a `<Suspense>`-wrapped child so the static shell stays URL-independent. The route forwards the Promise; `HistorySection` awaits it.
- Invalid member id → `notFound()` from both sections' null reads.

## 7. Verification

- `tests/unit/coach/member-history-data.test.ts`: dummy shape (24 sessions, ids `sesi-24`..`sesi-01` descending, `pageSize` 10, `totalSessions` 24, memberId `aced-suryana`); card #24 Figma literals (`Sesi #24`, `06 Mar 2026, 15:45 WIB`, `Pukulan Lurus Depan`, `Penetapan Sasaran Target`, `Repetisi: 42/50 (84%)`, 82, `remediasi`); first-10 tone sequence `[remediasi, sesuai, sesuai, tidak-sesuai, remediasi, sesuai, sesuai, tidak-sesuai, sesuai, sesuai]`; badge keys ⊆ `{sesuai, remediasi, tidak-sesuai}` (never `evaluasi`); `paginateHistory` math (page 1 → 10 items range 1-10; page 2 → 10, 11-20; page 3 → 4, 21-24; clamps 0→1, 4→3, NaN→1); `parseHistoryPage` (number, array, junk, undefined); `get-member-history.ts` source carries the TODO endpoint and no `"use client"`.
- `tests/unit/coach/member-history-sections.test.ts` (source-text pattern, `readFileSync`): section root `<section>` + heading string; cards `Card size="sm"`; badges only via `performanceBadgeLabel` / `performanceBadgeVariant` with negatives for every Figma badge string family (`Sesuai Skor Kualitas`, `Optimal (`, `Sayap Siku`, `Skor Kualitas`, `Standar IPSI`, `Perlu Poles`, `(-6.5`, `(+8cm)`); pagination strings + `` `?page=` `` href pattern + `aria-current`; range text; reused `MemberDetailProfile` present in page composition; no `next/image`, no `absolute`, no `<svg`; lucide `ChevronLeft`/`ChevronRight`; `session-history-log.tsx` links `` `/coach/members/${memberId}/riwayat` `` with no TODO.
- `tests/unit/coach/member-history-route.test.ts`: thin RSC route (`MemberHistoryPage`, `generateStaticParams`, `memberHistoryIds`, no `"use client"`, no direct `getMemberHistory` call, `searchParams` passed not awaited); history layout trail strings + `activeTab="members"`; router restructure sanity (`(detail)` layout still carries the `Detail` trail). Update `member-detail-route.test.ts` paths to the `(detail)` group.
- Green: `pnpm build` + `tsc --noEmit` + `eslint` + `pnpm test`.
- Browser: `/coach/members/aced-suryana/riwayat` (+ `?page=2`, `?page=3`, `?page=99`) at 390px — `document.documentElement.scrollWidth <= window.innerWidth` pasted in the review comment; prev disabled on page 1 / next on page 3; member-detail `Buku Semua Riwayat Atlet` navigates to the new screen.

## 8. Out of scope

Card deep links / coach session-detail route, Figma profile extras (dual badges, last-active, mini metrics, status pill), backend connect + `lib/api-client.ts` wiring, member-side screens, `prefetch={true}` tuning, chart library, real photos/video, E2E tests, Badge-label migration of other screens.

## 9. Linear + roadmap sync (same task)

- JIT milestone `[Phase 12] Coach member history` (check open-milestone cap first); parent `[coach] Ship member history` (label `feature`, milestone, assignee `me`, 4-field header, Links → this spec + roadmap Doc) + subs `[coach] Add history DTOs+pagination`, `[coach] Build history list UI`, `[coach] Wire history route+links`; cut the task branch from the parent's `gitBranchName` off `development`.
- Update Linear Doc `[Roadmap] SilatSense FE — Member closeout + Coach` + mirror `docs/superpowers/roadmap-template.md`: Now/Next/Later row for Phase 12, phase-table row (outcome, Figma `94:40907`, spec path, issue guard), Figma index entry 8 (`94:40907` → `/coach/members/[id]/riwayat`, DTO `MemberHistory`, `TODO (GET /coach/members/[id]/history?page=N)`), risk note (card badge tone rule is a user override; isolated-node screenshots are not authoritative).
- Spec doc committed as its own `docs` commit on the task branch; progress `save_comment` per completed move.
