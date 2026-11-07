# Coach Member Detail Design — /coach/members/[id] (Phase 11, first move)

Date: 2026-10-14. Status: draft, design approved 2026-10-14; rev 2 (same day, user revisions: FE-derived initials + deferred initials issue, Standar IPSI→success, meta info stays Badge); pending file review to become contract. Linear: new milestone `[Phase 11] Coach member detail` (JIT) + parent `[coach] Ship member detail` + subs (DTOs+tests / sections UI / route+feedback+verify). Sibling specs: `2026-10-13-coach-members-design.md` (list patterns reused: Card composition, Badge mapping, shell, dummy+TODO contract), `2026-10-12-coach-dashboard-design.md` (stat/pillar/posture precedents). Figma `94:40427` (`Member detail - Coach`, 390×3125; `get_design_context` timed out 2026-10-14 incl. sub-nodes — contract pinned from screenshot + full metadata + user pill list; pixel audit deferred to implementation).

## 1. Goal

Coach member detail at `/coach/members/[id]`: athlete profile container + 4-pilar performance Card + latest evaluation container (Sec 2) + feedback Card (Sec 5) + session history log container (Sec 6), inside the coach shell (`activeTab="members"`, trail `["Dashboard", "Member List", "Detail"]`). Mixed shells per user decision (§2). Performance states are shadcn `Badge` in exactly 4 labels via the shared helper; meta info stays `Badge` with fixed slot variants (`Sesi` secondary, `Standar IPSI` success, dates/repetisi outline); initials derive FE-side via `getInitials`; all graphics are lucide icons or `ImagePlaceholder`; every image overlay is dropped. Source is Figma `94:40427` with explicit deltas (§2).

## 2. Figma deltas (user decisions 2026-10-14, supersede verbatim fidelity)

- ROUTE: new `/coach/members/[id]` detail route. `/coach/members` list (PSR-90) untouched; list CTA wiring to `[id]` lands in this move's route sub-issue (ghost → live `Link`).
- SHELLS (mixed): containers (plain `<section>`, no Card chrome) = athlete profile, hasil evaluasi (Sec 2), log riwayat (Sec 6). Cards (full `Card` composition) = 4-pilar performance (Sec 1), feedback (Sec 5). Reverses Figma's all-card look; fidelity loses to hierarchy.
- FOOTERS: pilar `CardFooter` = ghost full-width `Lihat semua` link (dead TODO to full-pillar view). Feedback `CardFooter` = two actions `Simpan Draft` (outline, stub) + `Kirim ke Member` (solid, stub `TODO POST /coach/feedback`). No other footers on this screen.
- BADGES (rev 2): performance states → exactly 4 bare labels, no suffixes: `Sesuai → success`; `Remediasi → warning`; `Tidak Sesuai → destructive`; `Evaluasi → secondary`. Labels derive from `badgeKey` via the shared helper (§5) — DTOs carry no performance-label strings, so drift is impossible. DROPPED: `Perlu Perbaikan`, `Perlu Poles`, `Lolos Standar`, `Siap Tanding`, `Tahap Remediasi`, `Bimbingan`, and every parenthetical suffix (`Sesuai (135°)`, `Tidak Sesuai (142°)`, `Perlu Poles (-2,6%)`, `Evaluasi (+0,15s)`). Scores/deltas render as separate numeric tabular-nums text, never inside a performance Badge. Meta info STAYS `Badge` with fixed slot variants: `Sesi N → secondary`, `Standar IPSI → success`, dates → `outline`, repetisi → `outline`, count (`4 Pilar`) → `secondary`. Slot→variant is hardcoded per slot (§5), never stored in DTOs.
- IMAGES → PLACEHOLDERS, OVERLAYS DROPPED: athlete avatar photo → initials block (`AS`, `role="img"`). Biomechanical skeletal tracking graphic → shared `ImagePlaceholder` 16:9; ALL HUD overlays deleted (`Keypoints: 33/33 Locked`, `Lintasan: 132cm`, `Kuda²: 135°`, bottom metric strip, crosshairs). No `next/image`, no remote src, no absolute-positioned overlays in new files.
- PLACEHOLDER MOVE: canonical `ImagePlaceholder` moves to `components/shared/image-placeholder.tsx` (new dir; same `ImageIcon` dashed API). Member copy becomes a thin `export *` re-export in the same move to avoid breakage; full member import migration is a follow-up, not this move.
- INITIALS FE-ONLY (rev 2): avatars derive initials via shared `getInitials(name)` (`"Aced Suryana" → "AS"`; first letters of first two words, uppercased; single word → first two letters). New detail DTOs carry NO `initials` field. Existing backend-expected `initials` (4 type fields, 12 dummy literals, 4 consumers — inventory: coach `CoachAthlete`/`TeamMember`, member `CoachNoteData`/session-coach, both coach dummies ×5, member dashboard + session-detail dummies, `coach-athlete-list`/`member-card-list`/`session-coach-card`/`weekly-progress`) stay untouched; migration is a DEFERRED Linear issue (§8), not this session.
- SHARED SLUGS (rev 1, single source): new `components/shared/silat-reference.ts` owns `PilarSlug` (`"kuda-kuda" | "pukulan" | "tangkisan" | "tendangan"`), `PostureParamId` (`"bahu" | "siku-kanan" | "pinggul" | "lutut" | "pergelangan"`), name maps, `getInitials`, and the Badge key/label/variant maps (§5). Member (`PillarStat`, `TrainingModule`, `PersiapanSlug`, `HistoryEntry`, `PostureAssessment`) and coach (`CoachPillar`, `PosturePoint`) switch their inline unions to `import type` from the shared module in the same move (type-only, no runtime change). New detail DTOs (§4) reference the shared types directly — no sixth copy.
- ICONS → lucide only (rev 1): every Figma `<vector>`/SVG maps to a named `lucide-react` icon, no inline SVG in new files. Mapping: pilar tiles `PersonStanding` (kuda-kuda) / `Hand` (pukulan) / `Shield` (tangkisan) / `Footprints` (tendangan) — riwayat precedent; posture rows `CircleCheck` (Sesuai) / `TriangleAlert` (Remediasi/Tidak Sesuai); evaluation header `Target`, metric tiles `Gauge`/`Timer`/`Move`/`Anchor` (or nearest fitting); feedback `MessageSquareText`, history `CalendarClock`, footer chevrons `ChevronRight`. Exact per-slot icon pinned in shell test.
- TRIMMED copy: posture one-liners + scores (aggregate 82.4, pilares 82/82/86/78, evaluasi 80) are screenshot-pinned placeholders, finalized against Figma at implementation and characterized in test; rich suffixes beyond the 5 params are OUT. History cards keep `Sesi N` + date + title + repetisi + single status Badge.

## 3. Architecture

- Route (thin RSC, no logic): `app/(coach)/coach/members/[id]/page.tsx` → `MemberDetailPage({ id })` with `generateStaticParams` from dummy ids (riwayat `[id]` precedent). Coach layout owns `activeTab="members"`.
- Composition: `features/coach/pages/member-detail-page.tsx` (static shell + 5 `<Suspense>` units with `Skeleton` fallbacks, one cached fetcher call per unit).
- Client boundary: `member-feedback-form.tsx` (`"use client"`, RHF + Zod stub, `useMutation` stub with `TODO (POST /coach/feedback)`, Sonner `toast.promise`). Other 4 sections are async server components receiving DTO props.
- Components (`features/coach/components/`, new): `member-detail-profile.tsx` (container), `pillar-performance-card.tsx` (Card), `latest-evaluation.tsx` (container) + `posture-param-row.tsx` (server row), `member-feedback-card.tsx` (Card shell) + `member-feedback-form.tsx` (client island), `session-history-log.tsx` (container + nested `Card size="sm"` rows). Shared (new dir `components/shared/`): `image-placeholder.tsx` (canonical) + `silat-reference.ts` (slugs, names, Badge key/label/variant maps; `coach-stage.ts` delegates to it, existing member/coach slug unions become `import type`). Icons `lucide-react` only, no inline SVG. No Radix. `@/` imports only.
- Data: `features/coach/data/get-member-detail.ts` (server-only, `'use cache'` + `cacheLife('minutes')`, `TODO (GET /coach/members/[id])`) + `features/coach/data/member-detail-dummy.ts` (pure). No `schemas/` beyond feedback stub (RHF+Zod client + `parse` at action boundary). No `app/api/`.

## 4. Types / DTOs (expected backend shape, mirrored from `types`)

```ts
// Shared (components/shared/silat-reference.ts) — single source, member + coach import:
type PilarSlug = "kuda-kuda" | "pukulan" | "tangkisan" | "tendangan";
type PostureParamId = "bahu" | "siku-kanan" | "pinggul" | "lutut" | "pergelangan";
type PerformanceBadgeKey = "sesuai" | "remediasi" | "tidak-sesuai" | "evaluasi";
// Labels derive from keys: sesuai → "Sesuai", remediasi → "Remediasi",
// tidak-sesuai → "Tidak Sesuai", evaluasi → "Evaluasi". Variants: sesuai →
// success, remediasi → warning, tidak-sesuai → destructive, evaluasi → secondary.

interface PilarPerformance {
  slug: PilarSlug;
  name: string; // "Kuda-kuda" | "Pukulan Lurus" | "Tangkisan" | "Tendangan"
  scorePct: number; // 82 | 82 | 86 | 78
  badgeKey: PerformanceBadgeKey; // label derived, never stored
}

interface PostureParam {
  id: PostureParamId;
  name: string; // "Bahu" | "Siku Kanan" | "Pinggul" | "Lutut" | "Pergelangan"
  badgeKey: PerformanceBadgeKey;
  note: string; // "Sejajar horizontal, rileks saat dorong."
}

interface LatestEvaluation {
  technique: string; // "Pukulan Lurus Depan"
  metaLabel: string; // "28 Sep 2026, 16:45 WIB • Sesi Mandiri Sasana • 15 Repetisi" (plain text)
  bigScorePct: number; // 80
  targetValue: string; // "85%"
  deltaValue: string; // "-5%" (plain text beside the score, never in a Badge)
  metrics: { label: string; value: string; sub: string }[]; // length 4
  quickStats: { label: string; value: string; sub: string }[]; // length 4, plain text
  postures: PostureParam[]; // length 5
}

interface HistorySession {
  id: string; // "sesi-24"
  sesiLabel: string; // "Sesi 24" (Badge secondary per slot)
  dateLabel: string; // "28 Sep 2026"
  title: string; // "Pukulan Lurus Depan"
  repetisiLabel: string; // "Repetisi: 42/50 (84%)"
  scorePct: number; // 80
  badgeKey: PerformanceBadgeKey;
}

interface MemberDetail {
  id: string; // "aced-suryana"
  name: string; // "Aced Suryana" (avatar initials derived FE-side via getInitials — no initials field)
  nim: string; // "2307051"
  stateKey: PerformanceBadgeKey; // e.g. "evaluasi" — the ONE state Badge on the profile
  beltLabel: string; // "Sabuk Kuning"
  attendanceLabel: string; // "48 Sesi"
  aggregatePct: number; // 82.4
  aggregateKey: PerformanceBadgeKey; // e.g. "remediasi"
  pilares: PilarPerformance[]; // length 4
  evaluation: LatestEvaluation;
  history: HistorySession[]; // length 4: sesi-24..21
}
// Endpoints: TODO (GET /coach/members/[id]), TODO (POST /coach/feedback).
```

Dummy values mirror Figma screenshot/metadata (pinned in test). `TeamMember`/`CoachAthlete` stay untouched; `MemberDetail` family is additive.

## 5. UI pattern

- Flex/grid layouts only — no `absolute` in new/modified UI files. No `next/image`. No inline SVG. No HUD overlays.
- Profile container: `<section>` + `getInitials(name)` avatar (`role="img"`, e.g. `AS`) + H1 name + NIM text + ONE state Badge (`Evaluasi`) + belt/attendance trio (plain text) + aggregate score block (value text + ONE Badge, e.g. `Remediasi`). No Card chrome.
- Pilar Card: `Card` → `CardHeader` (Title `Performa 4 Pilar Dasar` + Description + Action count Badge `4 Pilar` secondary) → `CardContent` (2×2 grid of `Card size="sm"` tiles: lucide icon chip + ONE status Badge [`Sesuai`|`Remediasi`] + name + score text) → `CardFooter` (ghost full-width `Lihat semua` + `ChevronRight`, dead TODO).
- Evaluation container: `<section>` + header Badge row (`Sesi 24` secondary + `Standar IPSI` success) + H2 technique + meta text line + big-score row (value text + target/delta plain text) + 4 metric tiles (plain text) + shared `ImagePlaceholder` (`label="Visual tracking Pukulan Lurus Depan"`) + 4 quick plain-text stats + 5 posture rows (name + ONE Badge [`Sesuai`|`Remediasi`|`Tidak Sesuai`] + note + lucide `CircleCheck`/`TriangleAlert`).
- Feedback Card: `Card` → `CardHeader` (Title `Feedback Koreksi Pelatih` + Description) → `CardContent` (`Textarea` with Figma placeholder copy) → `CardFooter` (`Simpan Draft` outline stub + `Kirim ke Member` solid stub with TODOs).
- History container: `<section>` + H3 `Riwayat Sesi Terkini` + `<ul>` of 4 `Card size="sm"` rows (`CardHeader`: `Sesi N` Badge secondary + date Badge outline + title + score Action text; `CardContent`: repetisi Badge outline + ONE status Badge) → footer link `Buku Semua Riwayat Atlet`.
- Badge helper (`components/shared/silat-reference.ts`): `performanceBadgeLabel(key)` → the single label; `performanceBadgeVariant(key)` → `"success" | "warning" | "destructive" | "secondary"`; `getInitials(name)` → FE-derived initials. Performance Badges carry only the 4 labels; meta Badges use fixed slot variants (§2). `coach-stage.ts` keeps its list-screen labels untouched (migration follow-up, §8).
- Placeholders + icons: every visual is `ImagePlaceholder` or `role="img"` initials; every graphic icon is a named `lucide-react` export per §2 mapping; strings pinned in test: `Aced Suryana`, `Performa 4 Pilar Dasar`, `Pukulan Lurus Depan`, `Riwayat Sesi Terkini`.

## 6. Data flow

```ts
// features/coach/data/get-member-detail.ts
import "server-only";
import { cacheLife } from "next/cache";

export async function getMemberDetail(id: string): Promise<MemberDetail | null> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /coach/members/[id]) — dummy for now
  return dummyMemberDetail[id] ?? null;
}
```

Static shell calls it in each RSC `<Suspense>` unit (request-time fetch, static shell preserved per CODE_STANDARD §1). Invalid id → `notFound()`. Feedback form stubs `TODO (POST /coach/feedback)` with Sonner pending/success; on success invalidates `["member-detail", id]` (read-your-own-write: re-read via `getMemberDetail` before Done).

## 7. Verification

- `tests/unit/coach/member-detail-data.test.ts`: dummy shape (4 pilares, 5 postures, 4 history), Figma literals (`Aced Suryana`, `82.4`, `Pukulan Lurus Depan`, `Sesi 24`), shared-slug pins (pilar slugs ⊆ `PilarSlug`, posture ids ⊆ `PostureParamId`), Badge map pins (sesuai→`Sesuai`/success, remediasi→`Remediasi`/warning, tidak-sesuai→`Tidak Sesuai`/destructive, evaluasi→`Evaluasi`/secondary; labels derive from keys, no performance-label strings in DTOs), DTO-has-no-`initials` assertion. Arrange-act-assert, one behavior per test.
- `tests/unit/shared/silat-reference.test.ts`: `getInitials` (`Aced Suryana→AS`, single word, extra spaces, three words take first two) + Badge key→label→variant table (incl. meta slot variants: sesi→secondary, standar-ipsi→success, date/repetisi→outline).
- `tests/unit/coach/member-detail-shell.test.ts`: containers vs Cards (profile/evaluasi/history NOT `data-slot="card"` root; pilar/feedback ARE Cards with Header+Footer), avatar uses helper (no `initials` prop from data), Badge allowlist (performance: `Sesuai|Remediasi|Tidak Sesuai|Evaluasi`; meta: `Sesi N|Standar IPSI|date|repetisi|count` with slot variants; negative: no `Perlu Poles`, `Perlu Perbaikan`, `Lolos`, `Siap`, `Tahap`, `Bimbingan`, no `(` suffix inside any performance Badge), `ImagePlaceholder` present, no `<img>`, no `absolute`, no inline `<svg>`, TODO endpoints present, feedback stubs present, per-slot lucide icons pinned.
- Green: `pnpm build` + `tsc --noEmit` + `eslint` + `pnpm test`.
- Browser: `document.documentElement.scrollWidth <= window.innerWidth` at 390px for `/coach/members/aced-suryana` (paste result in review comment per CODE_STANDARD §6); feedback stub toasts + dead-CTA TODOs spot-checked.

## 8. Out of scope

Backend connect + `lib/api-client.ts` wiring, list CTA live-wire beyond TODO (lands in route sub-issue), red solid CTA, skeletal HUD/telemetry retention (rejected §2), chart library, real photos/video binding, PDF export, E2E tests, member placeholder import migration beyond re-export, existing list/member Badge-label migration to the 4-label set (list screens keep current labels until a dedicated consistency move), initials-from-backend migration (DEFERRED issue below — not this session).

## 9. Deferred follow-up: initials-from-backend migration (later session, NOT this move)

New Linear issue (title `[coach] Derive initials FE-side everywhere`, ≤60 chars; label `chore`; NO milestone/cycle commitment until triaged): drop `initials` from backend-expected DTOs and derive via shared `getInitials(name)` at render. Inventory (20 matches, all untouched by this move): types — coach `CoachAthlete.initials`, coach `TeamMember.initials`, member `CoachNoteData.initials`, member session-coach `initials`; dummies — `team-members-dummy.ts` ×5, `coach-overview-dummy.ts` ×5, `member-dashboard-dummy.ts` ×1, `session-detail-dummy.ts` ×1; consumers — `coach-athlete-list.tsx`, `member-card-list.tsx`, `session-coach-card.tsx`, `weekly-progress.tsx`. Acceptance: no `initials` field in any `features/*/types.ts` or dummy; all four consumers call `getInitials`; characterization tests updated; gates green. To be created at implementation setup (with the Phase-11 issues) and worked in a later session.
