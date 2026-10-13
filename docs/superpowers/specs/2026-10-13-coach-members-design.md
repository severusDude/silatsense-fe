# Coach Members List Design — /coach/members (Phase 10, second move)

Date: 2026-10-13. Status: draft, approved as contract (user review 2026-10-13: NIM added to DTO, ghost CTA in CardFooter, trimmed movement pattern, Phase-10 same-milestone move). Linear: milestone `[Phase 10] Coach foundation` (shared with PSR-85 dashboard); parent `PSR-90 [coach] Ship members list` + subs PSR-92/PSR-91/PSR-93. Sibling spec: `2026-10-12-coach-dashboard-design.md` (patterns reused: Card composition, Badge mapping, shell, dummy+TODO contract). Figma `94:40178` (`Member List - Coach`, 390×1442; `get_design_context` timed out 2026-10-13 — contract pinned from screenshot + full metadata; pixel audit deferred to implementation).

## 1. Goal

Coach members list at `/coach/members`: breadcrumb + title + count Badge + 4-stat grid + client search island + 5 member cards, inside the coach shell (`activeTab="members"`, trail `["Dashboard", "Member List"]`). All pills are shadcn `Badge`; all graphics are lucide icons; every section uses full shadcn `Card` composition (`CardHeader` + `Title`/`Description`/`Action`, `CardContent`, `CardFooter`). Source is Figma `94:40178` with explicit deltas (§2).

## 2. Figma deltas (user decisions 2026-10-13, supersede verbatim fidelity)

- NIM: DTO gains `nim: string` (e.g. `2307051`); search placeholder keeps Figma copy `Cari nama atlet atau NIM…` and filters name OR nim client-side. Roadmap guess had no NIM — this extends it.
- TRIMMED movement pattern (reuses dashboard §2 decision): card subtitle renders `lastGerakan` only (`Kuda-kuda`, `Tendangan`, `Pukulan`, `Tangkisan`). Figma rich suffixes (`Tumpuan 100% Simetris`, `Recoil Poros Panggul 12cm`, `Siku Melebar 142°`) and per-card status pills (`Elevasi Siku`, `Fondasi Kokoh`) are REMOVED. Single stage Badge per card (`Tahap Remediasi` / `Siap Tanding` / `Lolos Standar`).
- CTA: per-athlete `Lihat Detail` is a GHOST dead `Button` in the card `CardFooter` (dashboard precedent, Phase 11 TODO), NOT Figma red solid. Reverses Figma color; fidelity loses to consistency.
- CARDS: outer list `Card` (Header Title `Monitoring Pose Kinematika` + Action count Badge `5 Atlet Aktif`, no Description — Figma section header is title-only) + per-athlete nested `Card` (`CardContent` identity row, `CardFooter` ghost CTA). Stat tiles = `Card size="sm"` (Header Title=label + Action=icon; Content value + Badge/note; no footers — member stats carry no footer pair, unlike dashboard rev-1).
- PILLS → `Badge` (variant set `default|secondary|destructive|outline|success|warning`): `5 Atlet Aktif` + `3 Siap • 2 Remidiasi` = `secondary`; `Target IPSI ≥ 85% (-0.4%)` = `outline`; `+3.8%` = `secondary`; `Tahap Remediasi` = `warning`; `Siap Tanding` / `Lolos Standar` = `success`. Scores stay numeric text.
- GRAPHICS → lucide only: stat icons `Users` (Total Binaan) / `Target` (Rata Akurasi) / `CircleCheckBig` (Kelulusan) / `Video` (Sesi Rekaman); search `Search`; avatars render initials (`AS/SN/RM/FP/DW`, `role="img"`). No SVG illustrations, no `next/image` src.
- DROPPED the `Portal Pelatih |` eyebrow prefix in the H1 block (dashboard precedent) — header is H1 `Member List` + desc; breadcrumb `Dashboard / Member List` + `Cloud Sinkron` pill stay (coach shell owns them).

## 3. Architecture

- Route (thin RSC, no logic): `app/(coach)/coach/members/page.tsx` → `MembersPage` (coach shell layout owns `activeTab="members"`). Follows `coach-dashboard-page.tsx` pattern — one cached fetcher, three `<Suspense>` units (stats, search+list).
- Composition: `features/coach/pages/coach-members-page.tsx` (static shell + `<Suspense>` units; search island is a client component receiving initial members as props).
- Client boundary: `member-search.tsx` (`"use client"`, `useState`/`useMemo` filter by name+nim, case-insensitive; `Input` + `Search` icon; empty state `Tidak ada atlet yang cocok.`). Cards stay RSC.
- Components (`features/coach/components/`, new): `member-stat-grid.tsx` (4 `StatCard`s), `member-search.tsx` (client island), `member-card-list.tsx` (outer Card + 5 nested Cards). Reuse `coach-stage.ts` (`stageBadgeVariant`), `CoachLayout`, `CoachTopNav`/`CoachBottomNav`. Icons `lucide-react` only. No Radix. `@/` imports only.
- Data: `features/coach/data/get-team-members.ts` (server-only, `'use cache'` + `cacheLife('minutes')`, returns `TeamMembers`) + `features/coach/data/team-members-dummy.ts` (pure). No `schemas/` (read-only). No `app/api/`.

## 4. Types / DTOs (expected backend shape, mirrored from `types`)

```ts
interface TeamMember {
  id: string; // "aced-suryana"
  initials: string; // "AS"
  name: string; // "Aced Suryana"
  nim: string; // "2307051" (new — enables NIM search)
  stage: AthleteStage; // "remediasi" (reuse "siap" | "remediasi" | "lolos")
  stageLabel: string; // "Tahap Remediasi"
  scorePct: number; // 80
  lastGerakan: string; // "Kuda-kuda" (trimmed subtitle)
}

interface TeamStats {
  stats: CoachStat[]; // length 4, no footers: Total Binaan "5 Atlet" (badge "3 Siap • 2 Remidiasi") / Rata Akurasi "84.6%" (badge "Target IPSI ≥ 85% (-0.4%)") / Kelulusan "60%" (note "Memenuhi Standar") / Sesi Rekaman "24 Sesi" (badge "+3.8%", note "Pekan Ini Tercatat")
}

interface TeamMembers {
  members: TeamMember[]; // length 5: AS 80 / SN 76 / RM 94 / FP 91 / DW 88 (nim 2307051–2307055)
  totalAktif: number; // 5
}
// Endpoints: TODO (GET /coach/members).
```

Dummy values mirror Figma verbatim except trimmed subtitles + invented NIMs (pinned in test). `CoachAthlete` stays untouched (dashboard contract); `TeamMember` is additive.

## 5. UI pattern

- Flex/grid layouts only — no `absolute` in new/modified UI files.
- Stat tiles = `Card size="sm"`: `CardHeader` (Title=label + Action=icon chip) + `CardContent` (value tabular-nums + Badge + note). No `CardFooter` (no footer pairs on this screen).
- Member cards: outer `Card` → `CardHeader` (Title + Action count Badge) → `CardContent` (`<ul>` of nested per-athlete `Card`s: `CardContent` identity row — initials avatar + name + stage Badge + `lastGerakan` + score — then `CardFooter` ghost full-width `Lihat Detail` + `ChevronRight`, dead TODO to `/coach/members/[id]` Phase 11).
- Search island: `Input` with leading `Search` icon + `aria-label="Cari nama atlet atau NIM"`; list filters live; empty state paragraph.
- Placeholders: every visual is a `div`/`span role="img"`; strings pinned in test: `Member List`, `5 Atlet Aktif`, `84.6%`, `Kuda-kuda`.

## 6. Data flow

```ts
// features/coach/data/get-team-members.ts
import "server-only";
import { cacheLife } from "next/cache";

export async function getTeamMembers(): Promise<TeamMembers> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /coach/members) — dummy for now
  return dummyTeamMembers;
}
```

Static shell calls it in each RSC `<Suspense>` unit (request-time fetch, static shell preserved per CODE_STANDARD §1). Search filters the fetched array in the client island (no backend query). No mutations this move (feedback `POST /coach/feedback` is Phase 11). Read-your-own-write N/A (read-only).

## 7. Verification

- `tests/unit/coach/team-members-data.test.ts`: dummy shape (5 members, 4 stats), Figma literals (`5 Atlet`, `84.6`, `Kelulusan`, `Kuda-kuda`), NIM present + searchable, stage→Badge mapping (`siap`→success, `remediasi`→warning, `lolos`→success). Arrange-act-assert, one behavior per test.
- Green: `pnpm build` + `tsc --noEmit` + `eslint` + `pnpm test`.
- Browser: `document.documentElement.scrollWidth <= window.innerWidth` at 390px for `/coach/members` (paste result in review comment per CODE_STANDARD §6); search filter + dead-CTA TODOs spot-checked.

## 8. Out of scope

Backend connect + `lib/api-client.ts`, member detail + feedback mutation (Phase 11), red solid CTA (rejected §2), rich movement suffixes + status pills (rejected §2), chart library, real photos, E2E tests.
