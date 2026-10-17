# Coach Member Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/coach/members/[id]` (Figma 94:40427) with mixed container/Card shells, 4-label Badge standard, FE-derived initials, and shared pilar/posture slugs.

**Architecture:** Thin RSC `[id]` route → `MemberDetailPage` composition with 5 Suspense units over one cached fetcher; 4 server sections + 1 client feedback island; new `components/shared/` domain module owns slugs, Badge maps, initials helper, and the canonical placeholder.

**Tech Stack:** Next.js 16.3.8 App Router (Cache Components), React 19, shadcn base-nova on @base-ui/react (Card, Badge, Button, Textarea, Field), lucide-react 1.52, RHF 7 + Zod 4 + TanStack Query 5 + Sonner for the feedback island, Vitest 3.

## Global Constraints

- `next.config.ts` keeps `cacheComponents: true`; every `'use cache'` pairs with `cacheLife('minutes')`; dynamic reads sit behind `<Suspense>` with `Skeleton` fallbacks.
- No `"use client"` under `app/`; route files contain no logic; `actions/` + `data/` start with `import "server-only"` and are never imported from client components.
- `@/` imports only; `lucide-react` icons only — no `next/image`, no inline `<svg>`, no `absolute` positioning in new/modified UI files; no HUD overlays.
- Performance Badges carry only `Sesuai|Remediasi|Tidak Sesuai|Evaluasi` (labels derived from `badgeKey`); meta Badges use fixed slot variants (sesi→secondary, standar→success, date→outline, repetisi→outline, count→secondary); every stub TODO names its endpoint (`GET /coach/members/[id]`, `POST /coach/feedback`).
- Every task ends green for its scope; the move ends with `pnpm build` + `pnpm typecheck` + `pnpm lint` + `pnpm test` zero-error plus a 390px `scrollWidth <= innerWidth` browser check pasted in the review comment.

---

## File Structure

- Create `components/shared/silat-reference.ts` — single source: `PilarSlug`, `PostureParamId`, name maps, performance/meta Badge key→label→variant maps, `getInitials(name)`.
- Create `components/shared/image-placeholder.tsx` — canonical placeholder (moved verbatim from the member copy).
- Modify `features/member/components/shared/image-placeholder.tsx` — thin `export *` re-export (no behavior change).
- Modify `features/member/types.ts` — slug/id unions become `import type` from shared (type-only).
- Modify `features/coach/types.ts` — same unification + new `MemberDetail` family + `FeedbackInput`/`FeedbackResult` (no `initials` anywhere new).
- Modify `features/coach/data/coach-overview-dummy.ts` — posture `id`s switch to shared ids (names/scores/labels untouched).
- Modify `tests/unit/coach/coach-overview-data.test.ts` — flagged-ids pin switches to shared ids (one line).
- Create `features/coach/data/member-detail-dummy.ts` (pure) + `features/coach/data/get-member-detail.ts` (server-only fetcher + `memberDetailIds`).
- Create `features/coach/schemas.ts` — `feedbackSchema` + `FeedbackInput` type.
- Create `features/coach/components/member-detail-profile.tsx` (container), `pillar-performance-card.tsx` (Card), `latest-evaluation.tsx` (container), `posture-param-row.tsx` (row), `member-feedback-card.tsx` (server shell), `member-feedback-form.tsx` (client island), `session-history-log.tsx` (container).
- Create `features/coach/pages/member-detail-page.tsx` — static shell + 5 Suspense units.
- Create `app/(coach)/coach/members/[id]/page.tsx` (thin RSC + `generateStaticParams`) + `app/(coach)/coach/members/[id]/layout.tsx` (trail extension).
- Modify `features/coach/components/member-card-list.tsx` — ghost dead CTA becomes a live `Link` to `/coach/members/[id]` (riwayat `buttonVariants` precedent).
- Create `tests/unit/shared/silat-reference.test.ts`, `tests/unit/coach/member-detail-data.test.ts`, `tests/unit/coach/member-detail-sections.test.ts`, `tests/unit/coach/member-detail-route.test.ts`.

## Task 1: Setup — branch, Linear issues, spec commit

**Files:**
- Modify: `docs/superpowers/specs/2026-10-14-coach-member-detail-design.md` (already written, commit only)
- Create (via Linear): milestone `[Phase 11] Coach member detail`, parent + 3 subs + 1 deferred chore issue

**Interfaces:**
- Consumes: spec doc (§8 issue scaffolds, §9 deferred inventory)
- Produces: task branch name (parent `gitBranchName`, used verbatim by all later tasks); parent issue id (subs link it); milestone name

- [ ] **Step 1: Load the linear-tracking skill**

Use the skill tool with `{"name": "linear-tracking"}` and follow it for every Linear write below (assignee `me`, exactly one label per issue, `feature` carries the new milestone, chore carries none, no cycle assignment in this move).

- [ ] **Step 2: Confirm fewer than 2 open milestones, then create the Phase-11 milestone**

Call `list_milestones` with `{"project": "P-PSR-1"}` and count non-completed milestones. If 2 are already open, stop and ask the user which to close — do not create a third. Otherwise call `save_milestone` with `{"project": "P-PSR-1", "name": "[Phase 11] Coach member detail"}`. Expected: response contains the milestone with that exact name.

- [ ] **Step 3: Create the parent issue (no subs yet — the branch name comes from it)**

Call `save_issue` with exactly:

```json
{
  "team": "Personal",
  "title": "[coach] Ship member detail",
  "description": "Goal: /coach/members/[id] renders Figma 94:40427 detail inside coach shell.\nScope:\n- shared slugs+badges+initials, detail DTOs+dummy+fetcher+tests, 5 sections, route+CTA wiring+verify\n- Out: backend connect, list-label migration, initials migration (§9 deferred)\nAcceptance:\n- [ ] 5 sections render with mixed shells, no overflow 390px\n- [ ] gates green + scrollWidth check pasted in review comment\nLinks: docs/superpowers/specs/2026-10-14-coach-member-detail-design.md",
  "assignee": "me",
  "labels": ["feature"],
  "milestone": "[Phase 11] Coach member detail"
}
```

Expected: response contains `id` (e.g. `PSR-9x`) and `gitBranchName`. Record both verbatim — the branch name is used in Step 4, the id in Step 5.

- [ ] **Step 4: Cut the task branch from development using the Linear name verbatim**

Run (substituting the exact `gitBranchName` value recorded from Step 3 — use it verbatim, do not invent or reformat it):

```bash
git fetch origin development && git checkout -b feature/psr-94-coach-ship-member-detail origin/development
```

Expected: `git branch --show-current` prints that exact name; `git status --short` shows only `?? docs/superpowers/specs/2026-10-14-coach-member-detail-design.md` (plus pre-existing `.superpowers/` if present — leave it alone).

- [ ] **Step 5: Create the 3 subs under the parent plus the deferred chore issue**

Call `save_issue` four times, substituting the real parent id for `PSR-PARENT`:

```json
{"team": "Personal", "title": "[coach] Add detail DTOs+tests", "description": "Goal: detail DTOs + dummy fetcher + data tests green.\nScope:\n- shared silat-reference, types+dummy+fetcher, data+helper tests\n- Out: UI components, routes\nAcceptance:\n- [ ] dummy pins 4 pilares + 5 postures + 4 history, pnpm test green\nLinks: PSR-PARENT", "assignee": "me", "labels": ["feature"], "milestone": "[Phase 11] Coach member detail", "parentId": "PSR-PARENT"}
{"team": "Personal", "title": "[coach] Build detail sections UI", "description": "Goal: 5 detail sections render per Figma deltas.\nScope:\n- profile container + pilar Card + evaluasi container + feedback Card + history container\n- Out: route wiring, CTA live-wire\nAcceptance:\n- [ ] mixed shells + 4-label Badges + placeholders, lucide only, no absolute\nLinks: PSR-PARENT", "assignee": "me", "labels": ["feature"], "milestone": "[Phase 11] Coach member detail", "parentId": "PSR-PARENT"}
{"team": "Personal", "title": "[coach] Wire detail route+verify", "description": "Goal: [id] route live with CTA wiring + full verify.\nScope:\n- page+layout+generateStaticParams, list CTA live-wire, shell/route tests, gates+browser\n- Out: backend connect\nAcceptance:\n- [ ] invalid id 404s, CTA reaches [id], gates green + 390px check\nLinks: PSR-PARENT", "assignee": "me", "labels": ["feature"], "milestone": "[Phase 11] Coach member detail", "parentId": "PSR-PARENT"}
{"team": "Personal", "title": "[coach] Derive initials FE-side everywhere", "description": "Goal: drop backend initials, derive via shared getInitials.\nScope:\n- 4 type fields + 12 dummy literals + 4 consumers (§9 inventory)\n- Out: worked later, not this session\nAcceptance:\n- [ ] no initials in types/dummies, all consumers call helper, tests green\nLinks: PSR-PARENT", "assignee": "me", "labels": ["chore"]}
```

Expected: 4 issue ids returned. The chore has no milestone and no parent by design (later session).

- [ ] **Step 6: Commit the spec on the task branch**

Run:

```bash
git add docs/superpowers/specs/2026-10-14-coach-member-detail-design.md && git commit -m "docs(coach): add member detail spec rev2"
```

Expected: `git log --oneline -1` shows the docs commit; `git status --short` is clean (except pre-existing `.superpowers/` if present).

## Task 2: Shared reference — slugs, badges, initials, placeholder

**Files:**
- Create: `components/shared/silat-reference.ts`
- Create: `components/shared/image-placeholder.tsx`
- Modify: `features/member/components/shared/image-placeholder.tsx` (re-export only)
- Modify: `features/member/types.ts` (slug/id unions → shared imports)
- Modify: `features/coach/types.ts` (slug/id unions → shared imports; statuses untouched)
- Modify: `features/coach/data/coach-overview-dummy.ts` (posture ids only)
- Modify: `tests/unit/coach/coach-overview-data.test.ts` (flagged-ids pin only)
- Test: `tests/unit/shared/silat-reference.test.ts`

**Interfaces:**
- Consumes: existing unions (`PillarStat.slug`, `PersiapanSlug`, `PostureAssessment.id`, `CoachPillar.slug`, `PosturePoint.id`)
- Produces: `PilarSlug`, `PostureParamId`, `PILAR_NAMES`, `POSTURE_PARAM_NAMES`, `PerformanceBadgeKey`, `performanceBadgeLabel(key)`, `performanceBadgeVariant(key)`, `MetaBadgeSlot`, `META_BADGE_VARIANT`, `getInitials(name)` — imported by Tasks 3–6

- [ ] **Step 1: Write the failing shared-module test**

Create `tests/unit/shared/silat-reference.test.ts` with exactly:

```ts
import { describe, expect, it } from "vitest";
import {
  META_BADGE_VARIANT,
  getInitials,
  performanceBadgeLabel,
  performanceBadgeVariant,
} from "@/components/shared/silat-reference";

describe("silat-reference", () => {
  it("derives initials from the first two words", () => {
    // Arrange + Act + Assert
    expect(getInitials("Aced Suryana")).toBe("AS");
    expect(getInitials("Kang Fauzan Azhiim")).toBe("KF");
    expect(getInitials("  siti   nurhaliza  ")).toBe("SN");
    expect(getInitials("Aced")).toBe("AC");
  });

  it("maps each performance key to its single label and variant", () => {
    // Arrange + Act + Assert
    expect([performanceBadgeLabel("sesuai"), performanceBadgeVariant("sesuai")]).toEqual(["Sesuai", "success"]);
    expect([performanceBadgeLabel("remediasi"), performanceBadgeVariant("remediasi")]).toEqual(["Remediasi", "warning"]);
    expect([performanceBadgeLabel("tidak-sesuai"), performanceBadgeVariant("tidak-sesuai")]).toEqual(["Tidak Sesuai", "destructive"]);
    expect([performanceBadgeLabel("evaluasi"), performanceBadgeVariant("evaluasi")]).toEqual(["Evaluasi", "secondary"]);
  });

  it("pins fixed meta slot variants with Standar IPSI on success", () => {
    // Arrange + Act + Assert
    expect(META_BADGE_VARIANT).toEqual({ sesi: "secondary", standar: "success", date: "outline", repetisi: "outline", count: "secondary" });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm exec vitest run tests/unit/shared/silat-reference.test.ts`
Expected: FAIL with `Failed to resolve import "@/components/shared/silat-reference"`.

- [ ] **Step 3: Write the shared module (minimal code to pass)**

Create `components/shared/silat-reference.ts` with exactly:

```ts
export type PilarSlug = "kuda-kuda" | "pukulan" | "tangkisan" | "tendangan";

export const PILAR_NAMES: Record<PilarSlug, string> = {
  "kuda-kuda": "Kuda-kuda",
  pukulan: "Pukulan Lurus",
  tangkisan: "Tangkisan",
  tendangan: "Tendangan",
};

export type PostureParamId = "bahu" | "siku-kanan" | "pinggul" | "lutut" | "pergelangan";

export const POSTURE_PARAM_NAMES: Record<PostureParamId, string> = {
  bahu: "Bahu",
  "siku-kanan": "Siku Kanan",
  pinggul: "Pinggul",
  lutut: "Lutut",
  pergelangan: "Pergelangan",
};

export type PerformanceBadgeKey = "sesuai" | "remediasi" | "tidak-sesuai" | "evaluasi";

const PERFORMANCE_BADGE_LABEL: Record<PerformanceBadgeKey, string> = {
  sesuai: "Sesuai",
  remediasi: "Remediasi",
  "tidak-sesuai": "Tidak Sesuai",
  evaluasi: "Evaluasi",
};

const PERFORMANCE_BADGE_VARIANT = {
  sesuai: "success",
  remediasi: "warning",
  "tidak-sesuai": "destructive",
  evaluasi: "secondary",
} as const;

export function performanceBadgeLabel(key: PerformanceBadgeKey): string {
  return PERFORMANCE_BADGE_LABEL[key];
}

export function performanceBadgeVariant(key: PerformanceBadgeKey): "success" | "warning" | "destructive" | "secondary" {
  return PERFORMANCE_BADGE_VARIANT[key];
}

export type MetaBadgeSlot = "sesi" | "standar" | "date" | "repetisi" | "count";

export const META_BADGE_VARIANT: Record<MetaBadgeSlot, "secondary" | "success" | "outline"> = {
  sesi: "secondary",
  standar: "success",
  date: "outline",
  repetisi: "outline",
  count: "secondary",
};

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
```

- [ ] **Step 4: Move the placeholder and re-export the member copy**

Create `components/shared/image-placeholder.tsx` as a verbatim copy of `features/member/components/shared/image-placeholder.tsx` (same `ImageIcon` dashed box, same `label`/`className` props). Then replace the entire body of `features/member/components/shared/image-placeholder.tsx` with exactly:

```tsx
export * from "@/components/shared/image-placeholder";
```

- [ ] **Step 5: Unify the slug/id unions (type-only, statuses untouched)**

In `features/member/types.ts`: add `import type { PilarSlug, PostureParamId } from "@/components/shared/silat-reference";` and change `PillarStat.slug`, `TrainingModule.slug` to `PilarSlug`; `export type PersiapanSlug = PilarSlug;` (keep the alias name so all consumers compile); `PostureAssessment.id`, `RiwayatParam.id` to `PostureParamId`. `SessionPillar.id` to `PilarSlug`. `PillarStatus`, `PostureStatus`, `HistoryStatus` stay exactly as-is. In `features/coach/types.ts`: add the same type import; `CoachPillar.slug` to `PilarSlug`; `PosturePoint.id` to `PostureParamId`. `AthleteStage`, `PillarStatus`, `CoachAthlete`, `TeamMember` (incl. their `initials`) stay exactly as-is. In `features/coach/data/coach-overview-dummy.ts` change only the five posture `id`s (`bahu-leher`→`bahu`, `torsi-pinggul`→`pinggul`, `fleksi-lutut`→`lutut`, `pronasi-pergelangan`→`pergelangan`; `siku-kanan` unchanged) — names, scores, statusLabels untouched. In `tests/unit/coach/coach-overview-data.test.ts` change line 72 to `expect(flagged).toEqual(["siku-kanan", "pergelangan"]);` and nothing else.

- [ ] **Step 6: Run the scope tests plus typecheck**

Run: `pnpm exec vitest run tests/unit/shared/silat-reference.test.ts && pnpm exec vitest run tests/unit/coach/coach-overview-data.test.ts && pnpm typecheck`
Expected: both suites PASS, `tsc --noEmit` exits 0 with no output.

- [ ] **Step 7: Commit**

Run: `git add components/shared features/member/types.ts features/member/components/shared/image-placeholder.tsx features/coach/types.ts features/coach/data/coach-overview-dummy.ts tests/unit/coach/coach-overview-data.test.ts tests/unit/shared/silat-reference.test.ts && git commit -m "feat(shared): add silat-reference with slugs badges initials"`
Expected: `tsc --noEmit` clean on the committed tree (verified in Step 6).

## Task 3: Detail data layer — types, dummy, fetcher, data test

**Files:**
- Modify: `features/coach/types.ts` (append `MemberDetail` family + feedback DTOs)
- Create: `features/coach/data/member-detail-dummy.ts`
- Create: `features/coach/data/get-member-detail.ts`
- Test: `tests/unit/coach/member-detail-data.test.ts`

**Interfaces:**
- Consumes: `PilarSlug`, `PostureParamId`, `PerformanceBadgeKey` from Task 2
- Produces: `MemberDetail`, `getMemberDetail(id)`, `memberDetailIds: string[]`, `FeedbackInput`, `FeedbackResult` — consumed by Tasks 4–6

- [ ] **Step 1: Write the failing data test**

Create `tests/unit/coach/member-detail-data.test.ts` with exactly:

```ts
import { describe, expect, it } from "vitest";
import { dummyMemberDetail } from "@/features/coach/data/member-detail-dummy";
import { performanceBadgeLabel, performanceBadgeVariant } from "@/components/shared/silat-reference";

describe("dummyMemberDetail", () => {
  it("pins the Aced Suryana detail with Figma scores and no initials field", () => {
    // Arrange + Act
    const detail = dummyMemberDetail["aced-suryana"];

    // Assert
    expect(detail.name).toBe("Aced Suryana");
    expect(detail.nim).toBe("2307051");
    expect(detail).not.toHaveProperty("initials");
    expect(detail.aggregatePct).toBe(82.4);
    expect(detail.pilares.map((p) => [p.slug, p.scorePct])).toEqual([
      ["kuda-kuda", 82],
      ["pukulan", 82],
      ["tangkisan", 86],
      ["tendangan", 78],
    ]);
  });

  it("covers five posture params with siku-kanan not Sesuai", () => {
    // Arrange + Act
    const rows = dummyMemberDetail["aced-suryana"].evaluation.postures.map((p) => [p.id, p.badgeKey]);

    // Assert
    expect(rows).toEqual([
      ["bahu", "sesuai"],
      ["siku-kanan", "tidak-sesuai"],
      ["pinggul", "sesuai"],
      ["lutut", "sesuai"],
      ["pergelangan", "remediasi"],
    ]);
  });

  it("covers four history sessions newest-first with bare badge keys", () => {
    // Arrange + Act
    const rows = dummyMemberDetail["aced-suryana"].history.map((h) => [h.id, h.scorePct, h.badgeKey]);

    // Assert
    expect(rows).toEqual([
      ["sesi-24", 80, "remediasi"],
      ["sesi-23", 88, "sesuai"],
      ["sesi-22", 91, "sesuai"],
      ["sesi-21", 70, "tidak-sesuai"],
    ]);
  });

  it("derives every badge label from its key with no label strings stored", () => {
    // Arrange + Act
    const raw = JSON.stringify(dummyMemberDetail["aced-suryana"]);

    // Assert
    expect(performanceBadgeLabel("remediasi")).toBe("Remediasi");
    expect(performanceBadgeVariant("tidak-sesuai")).toBe("destructive");
    expect(raw).not.toContain("Perlu Poles");
    expect(raw).not.toContain("Perlu Perbaikan");
    expect(raw).not.toContain("Tahap Remediasi");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm exec vitest run tests/unit/coach/member-detail-data.test.ts`
Expected: FAIL with `Failed to resolve import "@/features/coach/data/member-detail-dummy"`.

- [ ] **Step 3: Append the DTOs to coach types (no initials, keys only)**

Append to `features/coach/types.ts` (add `import type { PerformanceBadgeKey, PilarSlug, PostureParamId } from "@/components/shared/silat-reference";` at the top if Task 2 did not already add it) exactly:

```ts
export interface PilarPerformance {
  slug: PilarSlug;
  name: string;
  scorePct: number;
  badgeKey: PerformanceBadgeKey;
}

export interface PostureParam {
  id: PostureParamId;
  name: string;
  badgeKey: PerformanceBadgeKey;
  note: string;
}

export interface LatestEvaluation {
  technique: string;
  metaLabel: string;
  bigScorePct: number;
  targetValue: string;
  deltaValue: string;
  metrics: { label: string; value: string; sub: string }[];
  quickStats: { label: string; value: string; sub: string }[];
  postures: PostureParam[];
}

export interface HistorySession {
  id: string;
  sesiLabel: string;
  dateLabel: string;
  title: string;
  repetisiLabel: string;
  scorePct: number;
  badgeKey: PerformanceBadgeKey;
}

export interface MemberDetail {
  id: string;
  name: string;
  nim: string;
  stateKey: PerformanceBadgeKey;
  beltLabel: string;
  attendanceLabel: string;
  aggregatePct: number;
  aggregateKey: PerformanceBadgeKey;
  pilares: PilarPerformance[];
  evaluation: LatestEvaluation;
  history: HistorySession[];
}

export interface FeedbackInput {
  memberId: string;
  message: string;
}

export interface FeedbackResult {
  memberId: string;
  status: "draft" | "sent";
}
```

- [ ] **Step 4: Write the dummy (screenshot-pinned values, finalized here)**

Create `features/coach/data/member-detail-dummy.ts` with exactly:

```ts
import type { MemberDetail } from "@/features/coach/types";

// Placeholder values mirror Figma node 94:40427 (screenshot + metadata; pixel
// audit deferred) until the backend lands.
export const dummyMemberDetail: Record<string, MemberDetail> = {
  "aced-suryana": {
    id: "aced-suryana",
    name: "Aced Suryana",
    nim: "2307051",
    stateKey: "evaluasi",
    beltLabel: "Sabuk Kuning",
    attendanceLabel: "48 Sesi",
    aggregatePct: 82.4,
    aggregateKey: "remediasi",
    pilares: [
      { slug: "kuda-kuda", name: "Kuda-kuda", scorePct: 82, badgeKey: "sesuai" },
      { slug: "pukulan", name: "Pukulan Lurus", scorePct: 82, badgeKey: "remediasi" },
      { slug: "tangkisan", name: "Tangkisan", scorePct: 86, badgeKey: "sesuai" },
      { slug: "tendangan", name: "Tendangan", scorePct: 78, badgeKey: "remediasi" },
    ],
    evaluation: {
      technique: "Pukulan Lurus Depan",
      metaLabel: "28 Sep 2026, 16:45 WIB • Sesi Mandiri Sasana • 15 Repetisi",
      bigScorePct: 80,
      targetValue: "85%",
      deltaValue: "-5%",
      metrics: [
        { label: "Target IPSI", value: "85%", sub: "Selisih -5%" },
        { label: "Repetisi Sah", value: "12", sub: "dari 15 repetisi" },
        { label: "Kecepatan Puncak", value: "4,18", sub: "m/s saat impak" },
        { label: "Kestabilan Kuda-kuda", value: "88%", sub: "Sumbu terkunci" },
      ],
      quickStats: [
        { label: "Lintasan", value: "132cm", sub: "Tepat" },
        { label: "Sudut Siku", value: "142°", sub: "Melebar" },
        { label: "Rotasi Pinggul", value: "45°", sub: "Terkunci" },
        { label: "Fleksi Lutut", value: "135°", sub: "Kokoh" },
      ],
      postures: [
        { id: "bahu", name: "Bahu", badgeKey: "sesuai", note: "Sejajar horizontal, rileks saat dorong." },
        { id: "siku-kanan", name: "Siku Kanan", badgeKey: "tidak-sesuai", note: "Elevasi melebar keluar +8 cm sebelum ekstensi penuh." },
        { id: "pinggul", name: "Pinggul", badgeKey: "sesuai", note: "Rotasi panggul mengunci sejajar poros kuda-kuda." },
        { id: "lutut", name: "Lutut", badgeKey: "sesuai", note: "Fleksi lutut kokoh, tumpuan merata 50:50." },
        { id: "pergelangan", name: "Pergelangan", badgeKey: "remediasi", note: "Rotasi pronasi kepalan terlambat sebelum fase impak." },
      ],
    },
    history: [
      { id: "sesi-24", sesiLabel: "Sesi 24", dateLabel: "28 Sep 2026", title: "Pukulan Lurus Depan", repetisiLabel: "Repetisi: 42/50 (84%)", scorePct: 80, badgeKey: "remediasi" },
      { id: "sesi-23", sesiLabel: "Sesi 23", dateLabel: "21 Sep 2026", title: "Tangkisan Atas", repetisiLabel: "Repetisi: 38/40 (95%)", scorePct: 88, badgeKey: "sesuai" },
      { id: "sesi-22", sesiLabel: "Sesi 22", dateLabel: "14 Sep 2026", title: "Kuda-kuda", repetisiLabel: "Repetisi: 60/60 (100%)", scorePct: 91, badgeKey: "sesuai" },
      { id: "sesi-21", sesiLabel: "Sesi 21", dateLabel: "7 Sep 2026", title: "Tendangan Sabit", repetisiLabel: "Repetisi: 28/40 (70%)", scorePct: 70, badgeKey: "tidak-sesuai" },
    ],
  },
};
```

- [ ] **Step 5: Write the fetcher (get-team-members.ts pattern)**

Create `features/coach/data/get-member-detail.ts` with exactly:

```ts
import "server-only";

import { cacheLife } from "next/cache";

import { dummyMemberDetail } from "@/features/coach/data/member-detail-dummy";
import type { MemberDetail } from "@/features/coach/types";

export const memberDetailIds = Object.keys(dummyMemberDetail);

export async function getMemberDetail(id: string): Promise<MemberDetail | null> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /coach/members/[id]) — dummy for now
  return dummyMemberDetail[id] ?? null;
}
```

- [ ] **Step 6: Run the data test plus typecheck**

Run: `pnpm exec vitest run tests/unit/coach/member-detail-data.test.ts && pnpm typecheck`
Expected: 4 tests PASS, `tsc --noEmit` exits 0.

- [ ] **Step 7: Commit**

Run: `git add features/coach/types.ts features/coach/data/member-detail-dummy.ts features/coach/data/get-member-detail.ts tests/unit/coach/member-detail-data.test.ts && git commit -m "feat(coach): add member detail DTOs dummy fetcher"`
Expected: commit succeeds; tree still compiles (Step 6).

## Task 4: Profile container + pilar performance Card

**Files:**
- Create: `features/coach/components/member-detail-profile.tsx`
- Create: `features/coach/components/pillar-performance-card.tsx`

**Interfaces:**
- Consumes: `MemberDetail` (Task 3); `getInitials`, `performanceBadgeLabel`, `performanceBadgeVariant`, `META_BADGE_VARIANT`, `PILAR_NAMES` (Task 2); `Card*`/`Badge` primitives
- Produces: `MemberDetailProfile({ detail })`, `PilarPerformanceCard({ pilares })` — consumed by Task 6 page

- [ ] **Step 1: Create the profile container**

Create `features/coach/components/member-detail-profile.tsx` with exactly:

```tsx
import { Badge } from "@/components/ui/badge";
import { getInitials, performanceBadgeLabel, performanceBadgeVariant } from "@/components/shared/silat-reference";
import type { MemberDetail } from "@/features/coach/types";

export function MemberDetailProfile({ detail }: { detail: MemberDetail }) {
  return (
    <section aria-labelledby="member-detail-name" className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span
          role="img"
          aria-label={`Avatar ${detail.name}`}
          className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-secondary text-lg font-bold text-secondary-foreground"
        >
          {getInitials(detail.name)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Badge variant={performanceBadgeVariant(detail.stateKey)}>{performanceBadgeLabel(detail.stateKey)}</Badge>
          <h1 id="member-detail-name" className="truncate text-lg font-bold">
            {detail.name}
          </h1>
          <p className="text-xs text-muted-foreground">NIM {detail.nim}</p>
        </div>
      </div>
      <dl className="grid grid-cols-3 gap-2.5">
        <div className="flex flex-col items-center gap-0.5 rounded-2xl border p-2.5 text-center">
          <dt className="text-[11px] text-muted-foreground">Sabuk</dt>
          <dd className="text-xs font-bold">{detail.beltLabel}</dd>
        </div>
        <div className="flex flex-col items-center gap-0.5 rounded-2xl border p-2.5 text-center">
          <dt className="text-[11px] text-muted-foreground">Kehadiran</dt>
          <dd className="text-xs font-bold">{detail.attendanceLabel}</dd>
        </div>
        <div className="flex flex-col items-center gap-0.5 rounded-2xl border p-2.5 text-center">
          <dt className="text-[11px] text-muted-foreground">Agregat</dt>
          <dd className="text-xs font-bold tabular-nums">{detail.aggregatePct}%</dd>
        </div>
      </dl>
      <div className="flex items-center justify-between gap-3 rounded-2xl border p-3">
        <p className="text-xs text-muted-foreground">Skor agregat biomekanika</p>
        <Badge variant={performanceBadgeVariant(detail.aggregateKey)}>{performanceBadgeLabel(detail.aggregateKey)}</Badge>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create the pilar Card (member-stat-grid.tsx pattern)**

Create `features/coach/components/pillar-performance-card.tsx` with exactly:

```tsx
import { ChevronRight, Footprints, Hand, PersonStanding, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { META_BADGE_VARIANT, performanceBadgeLabel, performanceBadgeVariant } from "@/components/shared/silat-reference";
import type { PilarPerformance } from "@/features/coach/types";

const pilarIcons = {
  "kuda-kuda": PersonStanding,
  pukulan: Hand,
  tangkisan: Shield,
  tendangan: Footprints,
} as const;

export function PilarPerformanceCard({ pilares }: { pilares: PilarPerformance[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performa 4 Pilar Dasar</CardTitle>
        <CardDescription>Penilaian per gerakan pokok pencak silat</CardDescription>
        <CardAction>
          <Badge variant={META_BADGE_VARIANT.count}>4 Pilar</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2.5">
        {pilares.map((pilar) => {
          const Icon = pilarIcons[pilar.slug];
          return (
            <Card key={pilar.slug} size="sm" className="gap-0">
              <CardHeader>
                <span className="flex size-7 items-center justify-center rounded-xl bg-muted">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <Badge variant={performanceBadgeVariant(pilar.badgeKey)}>{performanceBadgeLabel(pilar.badgeKey)}</Badge>
              </CardHeader>
              <CardContent className="flex flex-col items-start gap-1">
                <p className="text-xs font-bold">{pilar.name}</p>
                <p className="text-lg font-bold tabular-nums">{pilar.scorePct}%</p>
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
      <CardFooter className="p-0">
        {/* TODO: wire to full pillar breakdown when the backend lands */}
        <span
          aria-disabled="true"
          className={buttonVariants({ variant: "ghost", size: "sm", className: "w-full" })}
        >
          Lihat semua <ChevronRight data-icon="inline-end" />
        </span>
      </CardFooter>
    </Card>
  );
}
```

Notes (do not change): the outer `CardHeader` uses `CardAction` for the count Badge (top-right slot per shadcn composition); nested tile `CardHeader`s carry icon chip + status Badge without `CardTitle`, mirroring the icon-chip slot of `member-stat-grid.tsx`.

- [ ] **Step 3: Typecheck the two components**

Run: `pnpm typecheck`
Expected: exits 0. (Behavioral assertions land in the Task 6 shell test; this task's gate is compile + review.)

- [ ] **Step 4: Commit**

Run: `git add features/coach/components/member-detail-profile.tsx features/coach/components/pillar-performance-card.tsx && git commit -m "feat(coach): build detail profile and pilar cards"`
Expected: commit succeeds.

## Task 5: Evaluation container + feedback Card + client island

**Files:**
- Create: `features/coach/schemas.ts`
- Create: `features/coach/components/posture-param-row.tsx`
- Create: `features/coach/components/latest-evaluation.tsx`
- Create: `features/coach/components/member-feedback-card.tsx`
- Create: `features/coach/components/member-feedback-form.tsx`

**Interfaces:**
- Consumes: `LatestEvaluation`, `PostureParam`, `FeedbackInput`, `FeedbackResult` (Task 3); shared helpers + `ImagePlaceholder` (Task 2); `Textarea`, `Field*`, `Card*`, `Badge`, `Button`
- Produces: `LatestEvaluationSection({ evaluation })`, `MemberFeedbackCard({ memberId, memberName })` — consumed by Task 6 page

- [ ] **Step 1: Create the feedback schema (profile schemas.ts pattern)**

Create `features/coach/schemas.ts` with exactly:

```ts
import { z } from "zod";

export const feedbackSchema = z.object({
  message: z.string().min(10, "Pesan minimal 10 karakter").max(1000, "Pesan maksimal 1000 karakter"),
});

export type FeedbackFormInput = z.infer<typeof feedbackSchema>;
```

- [ ] **Step 2: Create the posture row (server, no client code)**

Create `features/coach/components/posture-param-row.tsx` with exactly:

```tsx
import { CircleCheck, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { performanceBadgeLabel, performanceBadgeVariant } from "@/components/shared/silat-reference";
import type { PostureParam } from "@/features/coach/types";

export function PostureParamRow({ param }: { param: PostureParam }) {
  const ok = param.badgeKey === "sesuai";
  const Icon = ok ? CircleCheck : TriangleAlert;
  return (
    <li className="flex items-start gap-2.5 rounded-2xl border p-3">
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-xs font-bold">{param.name}</p>
          <Badge variant={performanceBadgeVariant(param.badgeKey)}>{performanceBadgeLabel(param.badgeKey)}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{param.note}</p>
      </div>
    </li>
  );
}
```

- [ ] **Step 3: Create the evaluation container (no Card chrome, ImagePlaceholder, no overlays)**

Create `features/coach/components/latest-evaluation.tsx` with exactly:

```tsx
import { Badge } from "@/components/ui/badge";
import { ImagePlaceholder } from "@/components/shared/image-placeholder";
import { META_BADGE_VARIANT } from "@/components/shared/silat-reference";
import { PostureParamRow } from "@/features/coach/components/posture-param-row";
import type { LatestEvaluation } from "@/features/coach/types";

export function LatestEvaluationSection({ evaluation }: { evaluation: LatestEvaluation }) {
  return (
    <section aria-labelledby="latest-evaluation-heading" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant={META_BADGE_VARIANT.sesi}>Sesi 24</Badge>
        <Badge variant={META_BADGE_VARIANT.standar}>Standar IPSI</Badge>
      </div>
      <div className="flex flex-col gap-0.5">
        <h2 id="latest-evaluation-heading" className="text-sm font-bold">
          {evaluation.technique}
        </h2>
        <p className="text-[11px] text-muted-foreground">{evaluation.metaLabel}</p>
      </div>
      <div className="flex items-end justify-between gap-3 rounded-2xl border p-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-[11px] text-muted-foreground">Skor kinematika</p>
          <p className="text-2xl font-bold tabular-nums">{evaluation.bigScorePct}%</p>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <p className="text-xs tabular-nums">Target {evaluation.targetValue}</p>
          <p className="text-[11px] text-muted-foreground tabular-nums">Selisih {evaluation.deltaValue}</p>
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-2.5">
        {evaluation.metrics.map((metric) => (
          <li key={metric.label} className="flex flex-col gap-0.5 rounded-2xl border p-2.5">
            <p className="text-[11px] text-muted-foreground">{metric.label}</p>
            <p className="text-sm font-bold tabular-nums">{metric.value}</p>
            <p className="text-[11px] text-muted-foreground">{metric.sub}</p>
          </li>
        ))}
      </ul>
      <ImagePlaceholder label="Visual tracking Pukulan Lurus Depan" />
      <ul className="grid grid-cols-4 gap-2">
        {evaluation.quickStats.map((stat) => (
          <li key={stat.label} className="flex flex-col items-center gap-0.5 rounded-2xl border p-2 text-center">
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            <p className="text-xs font-bold tabular-nums">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-1">
        <h3 className="text-xs font-bold">Penilaian Postur Anatomis</h3>
        <ul className="flex flex-col gap-2">
          {evaluation.postures.map((param) => (
            <PostureParamRow key={param.id} param={param} />
          ))}
        </ul>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create the feedback server shell (Header lives here, form island inside)**

Create `features/coach/components/member-feedback-card.tsx` with exactly:

```tsx
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MemberFeedbackForm } from "@/features/coach/components/member-feedback-form";

export function MemberFeedbackCard({ memberId, memberName }: { memberId: string; memberName: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedback Koreksi Pelatih</CardTitle>
        <CardDescription>Tuliskan instruksi teknis langsung ke aplikasi atlet {memberName}.</CardDescription>
      </CardHeader>
      <MemberFeedbackForm memberId={memberId} memberName={memberName} />
    </Card>
  );
}
```

- [ ] **Step 5: Create the feedback client island (owns CardContent + CardFooter inside its form)**

Create `features/coach/components/member-feedback-form.tsx` with exactly:

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { feedbackSchema, type FeedbackFormInput } from "@/features/coach/schemas";
import type { FeedbackResult } from "@/features/coach/types";

export function MemberFeedbackForm({ memberId, memberName }: { memberId: string; memberName: string }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState } = useForm<FeedbackFormInput>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { message: "" },
  });
  const mutation = useMutation<FeedbackResult, Error, FeedbackFormInput>({
    // TODO: connect backend via lib/api-client.ts (POST /coach/feedback) — stub for now
    mutationFn: async (values) => ({ memberId, status: "sent" as const, echo: values.message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-detail", memberId] });
      reset();
    },
  });

  const onDraft = () =>
    toast("Draf tersimpan di perangkat ini (stub)", { description: `Untuk ${memberName}. TODO: POST /coach/feedback.` });
  const onSend = (values: FeedbackFormInput) =>
    toast.promise(mutation.mutateAsync(values), {
      loading: "Mengirim feedback…",
      success: "Feedback terkirim (stub)",
      error: (e) => (e instanceof Error ? e.message : "Gagal mengirim"),
    });

  return (
    <form onSubmit={handleSubmit(onSend)} className="flex flex-col gap-(--card-spacing)">
      <CardContent>
        <Field data-invalid={formState.errors.message !== undefined}>
          <FieldLabel htmlFor="coach-feedback-message">Pesan koreksi</FieldLabel>
          <Textarea
            id="coach-feedback-message"
            {...register("message")}
            placeholder="Tulis arahan teknis atau instruksi khusus… (misal: kunci ketiak kanan pada saat dorong pukulan lurus)"
            aria-invalid={formState.errors.message !== undefined}
          />
          {formState.errors.message !== undefined && <FieldError errors={[formState.errors.message]} />}
        </Field>
      </CardContent>
      <CardFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onDraft} className="flex-1">
          Simpan Draft
        </Button>
        <Button type="submit" disabled={mutation.isPending} className="flex-1">
          <Send data-icon="inline-start" /> Kirim ke Member
        </Button>
      </CardFooter>
    </form>
  );
}
```

Note: the stub `mutationFn` below returns an `echo` field, so FIRST extend `FeedbackResult` in `features/coach/types.ts` with one additive line (`echo: string;`) before creating the form — otherwise `tsc` fails on the excess property. If `Field`/`FieldError`/`FieldLabel` props differ from profile usage, match `profile-biodata-form.tsx` exactly (it is the repo precedent).

- [ ] **Step 6: Typecheck**

Run: `pnpm typecheck`
Expected: exits 0. (Behavioral assertions land in the Task 6 shell test.)

- [ ] **Step 7: Commit**

Run: `git add features/coach/schemas.ts features/coach/types.ts features/coach/components/posture-param-row.tsx features/coach/components/latest-evaluation.tsx features/coach/components/member-feedback-card.tsx features/coach/components/member-feedback-form.tsx && git commit -m "feat(coach): build evaluation and feedback sections"`
Expected: commit succeeds.

## Task 6: History + page + routes + CTA wiring + full verify

**Files:**
- Create: `features/coach/components/session-history-log.tsx`
- Create: `features/coach/pages/member-detail-page.tsx`
- Create: `app/(coach)/coach/members/[id]/page.tsx`
- Create: `app/(coach)/coach/members/[id]/layout.tsx`
- Modify: `features/coach/components/member-card-list.tsx` (ghost CTA → live Link)
- Test: `tests/unit/coach/member-detail-sections.test.ts`
- Test: `tests/unit/coach/member-detail-route.test.ts`
- Possibly modify: `features/coach/components/pillar-performance-card.tsx` (only if adding the `4 Pilar` count Badge: insert `<Badge variant={META_BADGE_VARIANT.count}>4 Pilar</Badge>` in its `CardHeader`; the import already exists)

**Interfaces:**
- Consumes: everything from Tasks 2–5; `CoachLayout` (`activeTab="members"`, `trail`), `Skeleton`, `notFound`, `buttonVariants` + `Link` (riwayat precedent)
- Produces: live `/coach/members/[id]` route; `Done` progress comment on the parent issue

- [ ] **Step 1: Create the history log container**

Create `features/coach/components/session-history-log.tsx` with exactly:

```tsx
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { META_BADGE_VARIANT, performanceBadgeLabel, performanceBadgeVariant } from "@/components/shared/silat-reference";
import type { HistorySession } from "@/features/coach/types";

export function SessionHistoryLog({ history }: { history: HistorySession[] }) {
  return (
    <section aria-labelledby="session-history-heading" className="flex flex-col gap-2.5">
      <h2 id="session-history-heading" className="text-sm font-bold">
        Riwayat Sesi Terkini
      </h2>
      <ul className="flex flex-col gap-2.5">
        {history.map((session) => (
          <li key={session.id}>
            <Card size="sm">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant={META_BADGE_VARIANT.sesi}>{session.sesiLabel}</Badge>
                  <Badge variant={META_BADGE_VARIANT.date}>{session.dateLabel}</Badge>
                </div>
                <p className="text-xs font-bold">{session.title}</p>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-2">
                <Badge variant={META_BADGE_VARIANT.repetisi}>{session.repetisiLabel}</Badge>
                <Badge variant={performanceBadgeVariant(session.badgeKey)}>{performanceBadgeLabel(session.badgeKey)}</Badge>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
      {/* TODO: wire to full history when the backend lands */}
      <Link href="/coach/members" className={buttonVariants({ variant: "ghost", size: "sm", className: "w-full" })}>
        Buku Semua Riwayat Atlet <ChevronRight data-icon="inline-end" />
      </Link>
    </section>
  );
}
```

- [ ] **Step 2: Create the page composition (coach-members-page.tsx pattern, 5 Suspense units)**

Create `features/coach/pages/member-detail-page.tsx` with exactly:

```tsx
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getMemberDetail } from "@/features/coach/data/get-member-detail";
import { LatestEvaluationSection } from "@/features/coach/components/latest-evaluation";
import { MemberDetailProfile } from "@/features/coach/components/member-detail-profile";
import { MemberFeedbackCard } from "@/features/coach/components/member-feedback-card";
import { PilarPerformanceCard } from "@/features/coach/components/pillar-performance-card";
import { SessionHistoryLog } from "@/features/coach/components/session-history-log";

export function MemberDetailPage({ id }: { id: string }) {
  return (
    <div className="flex flex-col gap-5">
      <Suspense fallback={<Skeleton className="h-44 w-full rounded-3xl" />}>
        <ProfileSection id={id} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
        <PilarSection id={id} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
        <EvaluationSection id={id} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-56 w-full rounded-3xl" />}>
        <FeedbackSection id={id} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
        <HistorySection id={id} />
      </Suspense>
    </div>
  );
}

async function ProfileSection({ id }: { id: string }) {
  const detail = await getMemberDetail(id);
  if (detail === null) notFound();
  return <MemberDetailProfile detail={detail} />;
}

async function PilarSection({ id }: { id: string }) {
  const detail = await getMemberDetail(id);
  if (detail === null) notFound();
  return <PilarPerformanceCard pilares={detail.pilares} />;
}

async function EvaluationSection({ id }: { id: string }) {
  const detail = await getMemberDetail(id);
  if (detail === null) notFound();
  return <LatestEvaluationSection evaluation={detail.evaluation} />;
}

async function FeedbackSection({ id }: { id: string }) {
  const detail = await getMemberDetail(id);
  if (detail === null) notFound();
  return <MemberFeedbackCard memberId={detail.id} memberName={detail.name} />;
}

async function HistorySection({ id }: { id: string }) {
  const detail = await getMemberDetail(id);
  if (detail === null) notFound();
  return <SessionHistoryLog history={detail.history} />;
}
```

- [ ] **Step 3: Create the thin route + layout (riwayat [id] + members layout patterns)**

Create `app/(coach)/coach/members/[id]/page.tsx` with exactly:

```tsx
import { memberDetailIds } from "@/features/coach/data/get-member-detail";
import { MemberDetailPage } from "@/features/coach/pages/member-detail-page";

export function generateStaticParams() {
  return memberDetailIds.map((id) => ({ id }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MemberDetailPage id={id} />;
}
```

Create `app/(coach)/coach/members/[id]/layout.tsx` with exactly:

```tsx
import type { ReactNode } from "react";
import { CoachLayout } from "@/features/coach/pages/coach-layout";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <CoachLayout activeTab="members" trail={["Dashboard", "Member List", "Detail"]}>
      {children}
    </CoachLayout>
  );
}
```

- [ ] **Step 4: Live-wire the list CTA (riwayat-card-actions.tsx Link precedent)**

In `features/coach/components/member-card-list.tsx`: add `import Link from "next/link";` and `import { buttonVariants } from "@/components/ui/button";`, delete the now-unused `import { Button } from "@/components/ui/button";` line, and replace the dead ghost `Button` block plus its `TODO` comment with exactly (the route is live as of Step 3, so no TODO remains):

```tsx
<Link
  href={`/coach/members/${member.id}`}
  className={buttonVariants({ variant: "ghost", size: "sm", className: "h-auto w-full justify-center gap-1 rounded-none border-0 px-2.5 py-2 text-xs font-bold text-primary" })}
>
  Lihat Detail <ChevronRight className="size-3.5" aria-hidden="true" />
</Link>
```

Run `pnpm typecheck` after. Expected: exits 0.

- [ ] **Step 5: Update the existing list sections test for the live CTA**

The live `Link` replaces the dead `Button`, so three source-text pins in `tests/unit/coach/team-members-sections.test.ts` go stale. Apply exactly three edits: `expect(cardList).toContain("<Button");` → `expect(cardList).toContain("buttonVariants");`; `expect(cardList).toContain('variant="ghost"');` → `expect(cardList).toContain('variant: "ghost"');`; `expect(cardList).toContain("/coach/members/[id]");` → ``expect(cardList).toContain("`/coach/members/${member.id}`");``. Then run `pnpm exec vitest run tests/unit/coach/team-members-sections.test.ts`. Expected: PASS (the suite still pins `Lihat Detail`, `stageBadgeVariant`, `role="img"`, and the no-`absolute` negatives).

- [ ] **Step 6: Write the sections shell test (team-members-sections.test.ts pattern)**

Create `tests/unit/coach/member-detail-sections.test.ts` with exactly:

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const profile = readFileSync("features/coach/components/member-detail-profile.tsx", "utf8");
const pilar = readFileSync("features/coach/components/pillar-performance-card.tsx", "utf8");
const evaluasi = readFileSync("features/coach/components/latest-evaluation.tsx", "utf8");
const posture = readFileSync("features/coach/components/posture-param-row.tsx", "utf8");
const feedbackCard = readFileSync("features/coach/components/member-feedback-card.tsx", "utf8");
const feedbackForm = readFileSync("features/coach/components/member-feedback-form.tsx", "utf8");
const history = readFileSync("features/coach/components/session-history-log.tsx", "utf8");
const all = [profile, pilar, evaluasi, posture, feedbackCard, feedbackForm, history].join("\n");

describe("member detail sections", () => {
  it("keeps profile, evaluation, and history out of Card chrome", () => {
    // Arrange + Act + Assert
    expect(profile).toContain("<section");
    expect(profile).not.toContain("<Card");
    expect(evaluasi).toContain("<section");
    expect(evaluasi).not.toContain("<Card");
    expect(history).toContain("<section");
    expect(history).toContain("Riwayat Sesi Terkini");
  });

  it("builds pilar and feedback as full Cards with footers", () => {
    // Arrange + Act + Assert
    expect(pilar).toContain("<CardHeader");
    expect(pilar).toContain("<CardAction");
    expect(pilar).toContain("4 Pilar");
    expect(pilar).toContain("<CardContent");
    expect(pilar).toContain("<CardFooter");
    expect(pilar).toContain("Performa 4 Pilar Dasar");
    expect(pilar).toContain("Lihat semua");
    expect(feedbackCard).toContain("<CardHeader");
    expect(feedbackCard).toContain("<CardTitle");
    expect(feedbackCard).toContain("Feedback Koreksi Pelatih");
    expect(feedbackForm).toContain("<CardContent");
    expect(feedbackForm).toContain("<CardFooter");
    expect(feedbackForm).toContain("Simpan Draft");
    expect(feedbackForm).toContain("Kirim ke Member");
  });

  it("restricts Badges to the allowlist with bare performance labels", () => {
    // Arrange + Act + Assert
    expect(all).toContain("performanceBadgeLabel");
    expect(all).toContain("Standar IPSI");
    expect(all).not.toContain("Perlu Poles");
    expect(all).not.toContain("Perlu Perbaikan");
    expect(all).not.toContain("Tahap Remediasi");
    expect(all).not.toContain("Bimbingan");
    expect(all).not.toContain("Siap Tanding");
    expect(all).not.toContain("Lolos Standar");
    expect(posture).not.toContain("(135");
    expect(posture).not.toContain("(142");
  });

  it("derives avatar initials via helper with placeholders and lucide only", () => {
    // Arrange + Act + Assert
    expect(profile).toContain("getInitials");
    expect(profile).toContain('role="img"');
    expect(evaluasi).toContain("ImagePlaceholder");
    expect(evaluasi).toContain("Visual tracking Pukulan Lurus Depan");
    expect(pilar).toContain("PersonStanding");
    expect(pilar).toContain("Footprints");
    expect(all).toContain("lucide-react");
    expect(all).not.toContain("<svg");
    expect(all).not.toContain("absolute");
    expect(all).not.toContain("next/image");
  });

  it("stubs feedback against POST /coach/feedback with read-your-own-write", () => {
    // Arrange + Act + Assert
    expect(feedbackForm).toContain('"use client"');
    expect(feedbackForm).toContain("POST /coach/feedback");
    expect(feedbackForm).toContain('["member-detail", memberId]');
    expect(feedbackForm).toContain("toast.promise");
  });
});
```

- [ ] **Step 7: Write the route test (team-members-route.test.ts pattern)**

Create `tests/unit/coach/member-detail-route.test.ts` with exactly:

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const page = readFileSync("app/(coach)/coach/members/[id]/page.tsx", "utf8");
const layout = readFileSync("app/(coach)/coach/members/[id]/layout.tsx", "utf8");
const detailPage = readFileSync("features/coach/pages/member-detail-page.tsx", "utf8");
const cardList = readFileSync("features/coach/components/member-card-list.tsx", "utf8");

describe("member detail route", () => {
  it("wires the thin RSC [id] route with static params and no client code", () => {
    // Arrange + Act + Assert
    expect(page).toContain("MemberDetailPage");
    expect(page).toContain("generateStaticParams");
    expect(page).toContain("memberDetailIds");
    expect(page).not.toContain('"use client"');
    expect(page).not.toContain("getMemberDetail");
  });

  it("renders the detail route inside the coach shell members tab with Detail trail", () => {
    // Arrange + Act + Assert
    expect(layout).toContain("CoachLayout");
    expect(layout).toContain('activeTab="members"');
    expect(layout).toContain("Detail");
  });

  it("streams five sections behind Suspense units with 404 on unknown id", () => {
    // Arrange + Act + Assert
    expect(detailPage).toContain("MemberDetailProfile");
    expect(detailPage).toContain("PilarPerformanceCard");
    expect(detailPage).toContain("LatestEvaluationSection");
    expect(detailPage).toContain("MemberFeedbackCard");
    expect(detailPage).toContain("SessionHistoryLog");
    expect(detailPage).toContain("<Suspense");
    expect(detailPage).toContain("notFound");
    expect(detailPage).not.toContain('"use client"');
  });

  it("links every list card to its live detail route", () => {
    // Arrange + Act + Assert
    expect(cardList).toContain("`/coach/members/${member.id}`");
    expect(cardList).toContain("Lihat Detail");
    expect(cardList).not.toContain("TODO");
  });
});
```

- [ ] **Step 8: Run the new suites plus the full unit suite**

Run: `pnpm exec vitest run tests/unit/coach/member-detail-sections.test.ts && pnpm exec vitest run tests/unit/coach/member-detail-route.test.ts && pnpm test`
Expected: new suites PASS and the full `vitest run` exits 0 (no regressions in list/dashboard/member suites).

- [ ] **Step 9: Run the full gates**

Run: `pnpm build && pnpm typecheck && pnpm lint && pnpm test`
Expected: all four exit 0. Read the full output — zero errors required. If `pnpm build` fails on Cache Components (e.g. a cookie/session read outside Suspense), move the offending read behind the nearest Suspense unit and re-run.

- [ ] **Step 10: Verify in a real browser at 390px (AGENTS.md Playwright procedure)**

Start detached on a fresh port (never foreground): first free port 3101 with `Get-NetTCPConnection -LocalPort 3101` → `taskkill` leftovers, confirm `curl.exe --max-time 3` returns `000`, then `Invoke-CimMethod -ClassName Win32_Process -MethodName Create` with `cmd.exe /c pnpm dev --port 3101` logging to `C:\Users\Lutfi\AppData\Local\Temp\opencode\next-dev-3101.log`. Check readiness (`Get-Content -Tail 5` for `Ready in`, max ~3 re-checks). Open via tab-new first, navigate to `http://localhost:3101/coach/members/aced-suryana`, evaluate `document.documentElement.scrollWidth <= window.innerWidth` (expect `true`), spot-check the feedback stub toast and the list→detail link. Stop with `taskkill /PID <pid> /T /F`, confirm the port is free, delete `.playwright-mcp/` and the temp log, verify `git status --short` shows only intended files.

- [ ] **Step 11: Commit, comment progress, open the PR**

Run: `git add features/coach/components/session-history-log.tsx features/coach/pages/member-detail-page.tsx "app/(coach)/coach/members/[id]" features/coach/components/member-card-list.tsx features/coach/components/pillar-performance-card.tsx tests/unit/coach/member-detail-sections.test.ts tests/unit/coach/member-detail-route.test.ts && git commit -m "feat(coach): wire detail route history and verify"`
Then post a `Done` comment on the parent issue (`Done [coach] Ship member detail sections, next In Review.`), move it to `In Review` with the PR URL + 2–4 test steps (route resolves, invalid id 404s, feedback stub toasts, 390px scrollWidth result), and open the PR to `development` with squash by running `gh pr create --base development --title "feat(coach): ship member detail" --body "Parent: <parent-id>. Spec: docs/superpowers/specs/2026-10-14-coach-member-detail-design.md. Test: (1) /coach/members/aced-suryana renders 5 sections; (2) unknown id 404s; (3) feedback stub toasts; (4) 390px scrollWidth<=innerWidth true."` (substitute the real parent id; one squashed commit per AGENTS.md).
Expected: PR URL returned; working tree clean except the PR branch.
