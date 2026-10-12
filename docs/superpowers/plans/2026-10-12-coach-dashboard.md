# [Coach Dashboard] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the coach dashboard at `/coach` per `docs/superpowers/specs/2026-10-12-coach-dashboard-design.md` — header + 4-stat grid + 5-athlete Ringkasan list + 4-pilar monitor + posture grid inside a 4-tab coach shell, all on dummy data.

**Architecture:** New `features/coach/` role-domain mirroring `features/member/` (types + pure dummy + cached server fetcher + server components + Suspense-section page composition). Thin RSC routes under `app/(coach)/coach/`. Zero client components expected (read-only dashboard, dead CTAs carry TODOs).

**Tech Stack:** Next.js 16.3.8 App Router (Cache Components), React 19, shadcn base-nova (`Card`, `Badge`, `Button`, `Skeleton` via `@/components/ui/*`), Tailwind 4, `lucide-react`, Vitest.

## Global Constraints

- `app/**` files are React Server Components — never add `"use client"` under `app/`. Route files contain no logic; they call `features/coach/pages/*`.
- `features/coach/data/*` (except `*-dummy.ts`) and `actions/*` open with `import "server-only"` on line 1. Dummy modules are pure (no `server-only`) so Vitest can import them.
- Every `'use cache'` pairs with `cacheLife('minutes')`.
- Imports use `@/` alias only. Icons from `lucide-react` only. No Radix imports. No `next/image` with src (initials placeholders, `role="img"`).
- No `absolute` positioning in new/modified UI. Shell container `max-w-[448px]`.
- Every stub TODO names its exact endpoint: `TODO (GET /coach/overview)`, `TODO (GET /coach/report)`.
- Titles `[coach] Verb outcome`, ≤60 chars. Commits `<type>(<scope>): <summary>`, atomic, tree compiles (`tsc --noEmit` clean) per commit.
- Assignee `me`, exactly one label per issue, `feature` carries exactly one milestone.

---

## File Structure

| File | Responsibility |
|---|---|
| `features/coach/types.ts` | `CoachOverview` + sub-interfaces (single file; mirrors §4 of spec) |
| `features/coach/data/coach-overview-dummy.ts` | Pure dummy values mirroring Figma 94:37791 verbatim |
| `features/coach/data/get-coach-overview.ts` | Server-only cached fetcher returning the dummy |
| `features/coach/components/coach-stage.ts` | `stageBadgeVariant()` helper (mirrors `pillar-status.ts`) |
| `features/coach/components/coach-top-nav.tsx` | Server header: SILATSENSE mark + KF avatar + trail + sync Badge |
| `features/coach/components/coach-bottom-nav.tsx` | Server nav: Dasbor / Member List / Laporan / Profil (4 tabs) |
| `features/coach/components/coach-header.tsx` | Server H1 + desc + dead PDF Button |
| `features/coach/components/coach-stat-grid.tsx` | Server 2×2 `Card size="sm"` stat tiles (Users/Target/Clock/Wrench) |
| `features/coach/components/coach-athlete-list.tsx` | Server list Card: title + `5 Atlet` Badge + 5 rows (stage Badge, `lastGerakan`, score, dead detail link) |
| `features/coach/components/coach-pillar-monitor.tsx` | Server Card: 4 div progress bars + `≥85%` Badge |
| `features/coach/components/coach-posture-grid.tsx` | Server Card: 2×2 tiles + full-width warning banner |
| `features/coach/pages/coach-layout.tsx` | Server shell: top nav + `max-w-[448px]` main + bottom nav |
| `features/coach/pages/coach-dashboard-page.tsx` | Server composition: static shell + 4 `<Suspense>` units |
| `app/(coach)/layout.tsx` | Thin RSC passthrough layout |
| `app/(coach)/coach/layout.tsx` | Wraps children in `CoachLayout` (`activeTab="dasbor"`, trail `["Dashboard"]`) |
| `app/(coach)/coach/page.tsx` | Thin RSC: renders `CoachDashboardPage` |
| `tests/unit/coach/coach-overview-data.test.ts` | Pins dummy shape + Figma literals + stage mapping |
| `tests/unit/coach/coach-shell.test.ts` | Pins shell copy (no-badge absence, 4 tabs, `/profil` href) |

---

### Task 1: Linear scaffolding + task branch

**Files:**
- Create: none (Linear only)
- Test: `scripts/linear-roadmap-audit.mjs` advisory run

**Interfaces:**
- Consumes: spec `docs/superpowers/specs/2026-10-12-coach-dashboard-design.md`, roadmap mirror `docs/superpowers/roadmap-template.md`
- Produces: milestone ID `[Phase 10] Coach foundation`, parent issue ID + `gitBranchName` (Task 2+ branch from it)

- [ ] **Step 1: Create the Phase 10 milestone just-in-time**

  Verify Phases 8+9 are at 100% (done 2026-10-12) and no Phase 10 exists, then create milestone `[Phase 10] Coach foundation` (shared with the later members-list move — do NOT pre-create Phase 11). Apply the `linear-tracking` skill on every write.

- [ ] **Step 2: Create parent + 4 sub-issues (max 1 level, each sub <4h)**

  Parent (label `feature`, milestone Phase 10, assignee `me`):
  - Title: `[coach] Ship coach dashboard`
  - Description (4-field header, ≤15 lines):
    ```
    Goal: /coach renders Figma 94:37791 dashboard-only inside 4-tab coach shell.
    Scope:
    - types+dummy+fetcher+test, shell+routes, header+stats, athlete list, pillars+posture
    - Out: members list (94:40178, next move), detail+feedback (Phase 11), backend connect, PDF export
    Acceptance:
    - [ ] /coach renders header + 4 stats + 5 athletes + 4 pillars + posture, no overflow 390px
    - [ ] gates green + scrollWidth check pasted in review comment
    Links: docs/superpowers/specs/2026-10-12-coach-dashboard-design.md
    ```

  Subs (each label `feature`, same milestone, `parentId` = parent, assignee `me`):
  - `[coach] Add overview DTOs+tests` — types + dummy + fetcher + data test.
  - `[coach] Build shell+routes` — layout/navs + `(coach)` routes + shell test.
  - `[coach] Build header+stats+athletes` — header, stat grid, athlete list.
  - `[coach] Build pillars+posture+verify` — pillars, posture, page wiring, full gates + browser check.

- [ ] **Step 3: Run the advisory audit, fix violations by hand**

  Run: `node scripts/linear-roadmap-audit.mjs issues.json` (build `issues.json` from the 5 new issues: `{ id, title, labels[], projectMilestone, parentId }`)
  Expected: exit 0. Never blocks `In Review`, but fix violations by hand now.

- [ ] **Step 4: Cut the task branch from development**

  ```bash
  git fetch origin development && git checkout -b <parent-gitBranchName-as-is> origin/development
  ```
  Use the Linear-generated branch verbatim. Leave `experiment/coach-dashboard-design` behind (spec commit `2e75239` stays there; do not merge it — the plan + implementation land on the task branch). Delete the experiment branch after merge.

---

### Task 2: Overview DTOs + dummy + fetcher + data test (TDD)

**Files:**
- Create: `features/coach/types.ts`, `features/coach/data/coach-overview-dummy.ts`, `features/coach/data/get-coach-overview.ts`
- Test: `tests/unit/coach/coach-overview-data.test.ts`

**Interfaces:**
- Consumes: nothing (first code task)
- Produces: `CoachOverview` type, `dummyCoachOverview` const, `getCoachOverview(): Promise<CoachOverview>` (Tasks 3–6 import these exact names)

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { dummyCoachOverview } from "@/features/coach/data/coach-overview-dummy";

describe("dummyCoachOverview", () => {
  it("pins team totals (5 athletes, 84.6% vs 85% target, 2-session queue)", () => {
    // Arrange + Act
    const { teamAccuracyPct, accuracyTargetPct, reviewQueue } = dummyCoachOverview;

    // Assert
    expect(teamAccuracyPct).toBe(84.6);
    expect(accuracyTargetPct).toBe(85);
    expect(reviewQueue).toEqual(["Aced S.", "Siti N."]);
  });

  it("exposes five athletes with Figma scores and last-gerakan subtitles", () => {
    // Arrange + Act
    const rows = dummyCoachOverview.athletes.map((a) => [a.name, a.scorePct, a.lastGerakan]);

    // Assert
    expect(rows).toEqual([
      ["Aced Suryana", 80, "Kuda-kuda"],
      ["Siti Nurhaliza", 76, "Tendangan"],
      ["Rian Mahendra", 94, "Kuda-kuda"],
      ["Fajar Pratama", 91, "Pukulan"],
      ["Dimas Wicaksono", 88, "Tangkisan"],
    ]);
  });

  it("exposes four pillars in Figma order with Figma averages", () => {
    // Arrange + Act
    const slugs = dummyCoachOverview.pillars.map((p) => [p.slug, p.avgPct]);

    // Assert
    expect(slugs).toEqual([["kuda-kuda", 94.8], ["tangkisan", 89.0], ["pukulan", 82.0], ["tendangan", 78.0]]);
  });

  it("covers five posture points with Siku Kanan and Pronasi flagged", () => {
    // Arrange + Act
    const flagged = dummyCoachOverview.posture.filter((p) => p.warning).map((p) => p.id);

    // Assert
    expect(dummyCoachOverview.posture).toHaveLength(5);
    expect(flagged).toEqual(["siku-kanan", "pronasi-pergelangan"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/coach/coach-overview-data.test.ts`
Expected: FAIL with "Failed to resolve import @/features/coach/data/coach-overview-dummy"

- [ ] **Step 3: Write `types.ts` (verbatim from spec §4)**

```ts
export type AthleteStage = "siap" | "remediasi" | "lolos";

export interface CoachAthlete {
  id: string;
  initials: string;
  name: string;
  stage: AthleteStage;
  stageLabel: string;
  scorePct: number;
  lastGerakan: string;
}

export type PillarStatus = "stabil" | "optimal" | "deviasi" | "remediasi";

export interface CoachPillar {
  slug: "kuda-kuda" | "tangkisan" | "pukulan" | "tendangan";
  name: string;
  avgPct: number;
  status: PillarStatus;
  statusLabel: string;
}

export interface CoachStat {
  id: "total-atlet" | "akurasi-tim" | "antrean" | "fokus";
  label: string;
  value: string;
  context: string;
  badge?: string;
}

export interface PosturePoint {
  id: "bahu-leher" | "siku-kanan" | "torsi-pinggul" | "fleksi-lutut" | "pronasi-pergelangan";
  name: string;
  scorePct: number;
  statusLabel: string;
  warning?: boolean;
}

export interface CoachOverview {
  stats: CoachStat[];
  athletes: CoachAthlete[];
  pillars: CoachPillar[];
  posture: PosturePoint[];
  reviewQueue: string[];
  teamAccuracyPct: number;
  accuracyTargetPct: number;
}
```

- [ ] **Step 4: Write the dummy (pure module, no `server-only`)**

```ts
import type { CoachOverview } from "@/features/coach/types";

// Placeholder values mirror Figma node 94:37791 verbatim until the backend lands.
export const dummyCoachOverview: CoachOverview = {
  stats: [
    { id: "total-atlet", label: "Total Atlet", value: "5 Atlet", context: "Ketuntasan 60%", badge: "3 Siap 2 Remediasi" },
    { id: "akurasi-tim", label: "Rata-rata Akurasi Tim", value: "84.6%", context: "24 Sesi · +3.8%", badge: "Target ≥ 85% (-0.4%)" },
    { id: "antrean", label: "Antrean Sidang & Evaluasi", value: "2 Sesi", context: "Uji Baca Gerakan" },
    { id: "fokus", label: "Fokus Perbaikan Utama", value: "Elevasi Siku", context: "+8 cm sayap (142°) · Drill: Rib-Slide Punch" },
  ],
  athletes: [
    { id: "aced-suryana", initials: "AS", name: "Aced Suryana", stage: "remediasi", stageLabel: "Tahap Remediasi", scorePct: 80, lastGerakan: "Kuda-kuda" },
    { id: "siti-nurhaliza", initials: "SN", name: "Siti Nurhaliza", stage: "remediasi", stageLabel: "Tahap Remediasi", scorePct: 76, lastGerakan: "Tendangan" },
    { id: "rian-mahendra", initials: "RM", name: "Rian Mahendra", stage: "siap", stageLabel: "Siap Tanding", scorePct: 94, lastGerakan: "Kuda-kuda" },
    { id: "fajar-pratama", initials: "FP", name: "Fajar Pratama", stage: "siap", stageLabel: "Siap Tanding", scorePct: 91, lastGerakan: "Pukulan" },
    { id: "dimas-wicaksono", initials: "DW", name: "Dimas Wicaksono", stage: "lolos", stageLabel: "Lolos Standar", scorePct: 88, lastGerakan: "Tangkisan" },
  ],
  pillars: [
    { slug: "kuda-kuda", name: "Kuda-kuda", avgPct: 94.8, status: "stabil", statusLabel: "Stabil" },
    { slug: "tangkisan", name: "Tangkisan", avgPct: 89.0, status: "optimal", statusLabel: "Optimal" },
    { slug: "pukulan", name: "Pukulan", avgPct: 82.0, status: "deviasi", statusLabel: "Deviasi Siku" },
    { slug: "tendangan", name: "Tendangan", avgPct: 78.0, status: "remediasi", statusLabel: "Remediasi" },
  ],
  posture: [
    { id: "bahu-leher", name: "1. Bahu & Leher", scorePct: 92, statusLabel: "Sesuai" },
    { id: "siku-kanan", name: "2. Siku Kanan", scorePct: 64, statusLabel: "Deviasi", warning: true },
    { id: "torsi-pinggul", name: "3. Torsi Pinggul", scorePct: 88, statusLabel: "Sesuai" },
    { id: "fleksi-lutut", name: "4. Fleksi Lutut", scorePct: 91, statusLabel: "Sesuai" },
    { id: "pronasi-pergelangan", name: "5. Pronasi Pergelangan", scorePct: 58, statusLabel: "Terdeteksi (+10.5°)", warning: true },
  ],
  reviewQueue: ["Aced S.", "Siti N."],
  teamAccuracyPct: 84.6,
  accuracyTargetPct: 85,
};
```

- [ ] **Step 5: Write the fetcher (server-only, cache pair, endpoint TODO)**

```ts
import "server-only";

import { cacheLife } from "next/cache";

import { dummyCoachOverview } from "@/features/coach/data/coach-overview-dummy";
import type { CoachOverview } from "@/features/coach/types";

export async function getCoachOverview(): Promise<CoachOverview> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /coach/overview) — dummy for now
  return dummyCoachOverview;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/coach/coach-overview-data.test.ts`
Expected: PASS (4/4)

- [ ] **Step 7: Commit**

```bash
git add features/coach/types.ts features/coach/data/coach-overview-dummy.ts features/coach/data/get-coach-overview.ts tests/unit/coach/coach-overview-data.test.ts && git commit -m "feat(coach): add overview DTOs and dummy fetcher"
```

---

### Task 3: Coach shell + routes + shell test (TDD)

**Files:**
- Create: `features/coach/components/coach-stage.ts`, `features/coach/components/coach-top-nav.tsx`, `features/coach/components/coach-bottom-nav.tsx`, `features/coach/pages/coach-layout.tsx`, `app/(coach)/layout.tsx`, `app/(coach)/coach/layout.tsx`, `app/(coach)/coach/page.tsx`
- Test: `tests/unit/coach/coach-shell.test.ts`

**Interfaces:**
- Consumes: `getCoachOverview` (not called here — shell is static)
- Produces: `CoachLayout({ children, activeTab, trail })`, `CoachTopNav({ trail })`, `CoachBottomNav({ activeTab })`, `CoachTab` type (Task 6 uses `CoachLayout` in the route layout)

- [ ] **Step 1: Write the failing shell test**

```tsx
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const bottomNav = readFileSync("features/coach/components/coach-bottom-nav.tsx", "utf8");
const topNav = readFileSync("features/coach/components/coach-top-nav.tsx", "utf8");
const header = readFileSync("features/coach/components/coach-header.tsx", "utf8");

describe("coach shell", () => {
  it("exposes four tabs with Profil linking to the shared /profil route", () => {
    // Arrange + Act + Assert
    expect(bottomNav).toContain('href="/coach"');
    expect(bottomNav).toContain('href="/coach/members"');
    expect(bottomNav).toContain("Laporan");
    expect(bottomNav).toContain('href="/profil"');
  });

  it("shows the KF coach avatar with Cloud Sinkron (no Portal badge in shell)", () => {
    // Arrange + Act + Assert
    expect(topNav).toContain("KF");
    expect(topNav).toContain("Cloud Sinkron");
    expect(topNav).not.toContain("Portal");
  });

  it("drops the Portal pelatih eyebrow badge from the dashboard header", () => {
    // Arrange + Act + Assert
    expect(header).toContain("Dashboard Pelatih");
    expect(header).not.toContain("Portal");
  });
});
```

Note: this test reads `coach-header.tsx` (written in Task 4) — Task 3 lands the shell + routes; the header assertion passes once Task 4 lands. If running green-per-task strictly, split: commit shell with the first two tests, add the header assertion in Task 4's commit.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/coach/coach-shell.test.ts`
Expected: FAIL with ENOENT (files not found)

- [ ] **Step 3: Write `coach-stage.ts` + navs + layout + routes**

```ts
import type { AthleteStage } from "@/features/coach/types";

export function stageBadgeVariant(stage: AthleteStage): "success" | "warning" {
  return stage === "remediasi" ? "warning" : "success";
}
```

```tsx
import { CloudCheck } from "lucide-react";

export function CoachTopNav({ trail = ["Dashboard"] }: { trail?: string[] }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[448px] flex-col px-4 pt-3 pb-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="font-heading flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm">
              S
            </span>
            <span className="font-heading text-base font-bold tracking-tight">SILATSENSE</span>
          </div>
          <span className="flex items-center gap-1.5">
            <span
              role="img"
              aria-label="Avatar pelatih Kang Fauzan"
              className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground ring-1 ring-border ring-inset"
            >
              KF
            </span>
            <span aria-hidden="true" className="size-2 rounded-full bg-success" />
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="min-w-0 flex-1 truncate text-xs font-bold text-primary">{trail.join(" / ")}</p>
          <span className="inline-flex w-fit shrink-0 items-center gap-1 rounded-full bg-success px-2.5 py-1 text-xs font-semibold text-success-foreground">
            <CloudCheck className="size-3" /> Cloud Sinkron
          </span>
        </div>
      </div>
    </header>
  );
}
```

Keep the sync pill as a `span` (static, non-interactive). If `Badge variant="success"` renders identically, prefer `Badge` + icon — match `member-top-nav.tsx` precedent.

```tsx
import Link from "next/link";
import { FileText, LayoutDashboard, User, UsersRound } from "lucide-react";

export type CoachTab = "dasbor" | "members" | "laporan" | "profil";

const itemClass = "flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-medium";
const linkInner = "flex flex-col items-center gap-0.5";

const tabs: { id: CoachTab; label: string; href: string; Icon: typeof LayoutDashboard }[] = [
  { id: "dasbor", label: "Dasbor", href: "/coach", Icon: LayoutDashboard },
  { id: "members", label: "Member List", href: "/coach/members", Icon: UsersRound },
  { id: "laporan", label: "Laporan", href: "/coach/laporan", Icon: FileText },
  { id: "profil", label: "Profil", href: "/profil", Icon: User },
];

export function CoachBottomNav({ activeTab = "dasbor" }: { activeTab?: CoachTab }) {
  return (
    <nav aria-label="Navigasi pelatih" className="sticky bottom-0 z-40 border-t bg-background/95 backdrop-blur">
      <ul className="mx-auto flex w-full max-w-[448px] px-4 py-2">
        {tabs.map(({ id, label, href, Icon }) =>
          activeTab === id ? (
            <li key={id} className={`${itemClass} text-primary`}>
              <span aria-current="page" className={linkInner}>
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </span>
            </li>
          ) : (
            <li key={id} className={`${itemClass} text-muted-foreground`}>
              {/* TODO: wire members + laporan routes when their moves land (Phase 10/11) */}
              <Link href={href} className={linkInner}>
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </Link>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
```

`Member List` and `Laporan` hrefs are forward links to routes that do not exist yet — they 404 until their moves land. Keep the TODO so the dead-link precedent is explicit.

```tsx
import type { ReactNode } from "react";
import { CoachBottomNav, type CoachTab } from "@/features/coach/components/coach-bottom-nav";
import { CoachTopNav } from "@/features/coach/components/coach-top-nav";

export function CoachLayout({
  children,
  activeTab = "dasbor",
  trail = ["Dashboard"],
}: {
  children: ReactNode;
  activeTab?: CoachTab;
  trail?: string[];
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CoachTopNav trail={trail} />
      <main className="mx-auto flex w-full max-w-[448px] flex-1 flex-col gap-5 px-4 pt-4 pb-8">
        {children}
      </main>
      <CoachBottomNav activeTab={activeTab} />
    </div>
  );
}
```

```tsx
import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
```

```tsx
import type { ReactNode } from "react";
import { CoachLayout } from "@/features/coach/pages/coach-layout";

export default function Layout({ children }: { children: ReactNode }) {
  return <CoachLayout>{children}</CoachLayout>;
}
```

```tsx
import { CoachDashboardPage } from "@/features/coach/pages/coach-dashboard-page";

export default function Page() {
  return <CoachDashboardPage />;
}
```

`coach-dashboard-page.tsx` does not exist until Task 6 — the route 404s/compile-fails until then. To keep every commit compiling, land a temporary stub page in this task (`export function CoachDashboardPage() { return null; }`) and replace it in Task 6. Alternatively merge Tasks 3+6 routing at the end — but the skill requires compiling commits, so the stub is mandatory if routes land before sections.

- [ ] **Step 4: Run tests + typecheck**

Run: `pnpm vitest run tests/unit/coach/coach-shell.test.ts` (first two tests PASS; header assertion pending Task 4 — see note in Step 1), then `pnpm tsc --noEmit`
Expected: PASS + zero type errors

- [ ] **Step 5: Commit**

```bash
git add features/coach/components/coach-stage.ts features/coach/components/coach-top-nav.tsx features/coach/components/coach-bottom-nav.tsx features/coach/pages/coach-layout.tsx "app/(coach)/layout.tsx" "app/(coach)/coach/layout.tsx" "app/(coach)/coach/page.tsx" features/coach/pages/coach-dashboard-page.tsx tests/unit/coach/coach-shell.test.ts && git commit -m "feat(coach): add coach shell and routes"
```

---

### Task 4: Header + stat grid + athlete list

**Files:**
- Create: `features/coach/components/coach-header.tsx`, `features/coach/components/coach-stat-grid.tsx`, `features/coach/components/coach-athlete-list.tsx`

**Interfaces:**
- Consumes: `CoachOverview` types, `stageBadgeVariant()` (Task 3)
- Produces: `CoachHeader()`, `CoachStatGrid({ stats })`, `CoachAthleteList({ athletes })` (Task 6 composes them)

- [ ] **Step 1: Extend the shell test with component copy pins**

Add to `tests/unit/coach/coach-shell.test.ts` (or a new `coach-sections.test.ts` if preferred — one file per behavior, keep shell test shell-only):

```tsx
// pins (read-file style, consistent with shell test):
// coach-header.tsx contains "Dashboard Pelatih" + "Unduh Rapor Tim (PDF)" + TODO (GET /coach/report), not "Portal"
// coach-stat-grid.tsx contains "5 Atlet" + "84.6%" + "2 Sesi" + "Elevasi Siku"
// coach-athlete-list.tsx contains "Ringkasan Latihan Member" + "5 Atlet" + "Lihat Detail", not "MediaPipe"
```

Write the assertions first; watch them fail (ENOENT).

- [ ] **Step 2: Write `coach-header.tsx` (no eyebrow badge, dead CTA)**

```tsx
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CoachHeader() {
  return (
    <section aria-labelledby="coach-heading" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h1 id="coach-heading" className="text-xl font-bold tracking-tight">
          Dashboard Pelatih
        </h1>
        <p className="text-xs text-muted-foreground">
          Ringkasan performa latihan mandiri dan monitoring kinematika 5 atlet binaan UKM UNSIL.
        </p>
      </div>
      {/* TODO: wire report export (GET /coach/report) when the backend lands */}
      <Button aria-disabled="true" title="Unduh rapor (TODO)">
        <Download className="size-4" /> Unduh Rapor Tim (PDF)
      </Button>
    </section>
  );
}
```

- [ ] **Step 3: Write `coach-stat-grid.tsx` (full Card composition, Lucide actions)**

```tsx
import { Clock, Target, Users, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { CoachStat } from "@/features/coach/types";

const statIcons = {
  "total-atlet": Users,
  "akurasi-tim": Target,
  antrean: Clock,
  fokus: Wrench,
} as const;

export function CoachStatGrid({ stats }: { stats: CoachStat[] }) {
  return (
    <section aria-label="Statistik tim" className="grid grid-cols-2 gap-2.5">
      {stats.map((stat) => {
        const Icon = statIcons[stat.id];
        return (
          <Card key={stat.id} size="sm" className="gap-0">
            <CardHeader>
              <CardTitle className="text-xs">{stat.label}</CardTitle>
              <CardAction>
                <span className="flex size-7 items-center justify-center rounded-xl bg-muted">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
              </CardAction>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold tabular-nums">{stat.value}</p>
            </CardContent>
            <CardFooter className="flex-col items-start gap-1">
              <p className="text-[11px] text-muted-foreground">{stat.context}</p>
              {stat.badge ? (
                <Badge variant={stat.id === "akurasi-tim" ? "outline" : "secondary"}>{stat.badge}</Badge>
              ) : null}
            </CardFooter>
          </Card>
        );
      })}
    </section>
  );
}
```

- [ ] **Step 4: Write `coach-athlete-list.tsx` (no subtitle, last-gerakan, stage Badge)**

```tsx
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { stageBadgeVariant } from "@/features/coach/components/coach-stage";
import type { CoachAthlete } from "@/features/coach/types";

export function CoachAthleteList({ athletes }: { athletes: CoachAthlete[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ringkasan Latihan Member</CardTitle>
        <CardAction>
          <Badge variant="secondary">5 Atlet</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2.5">
          {athletes.map((athlete) => (
            <li key={athlete.id} className="flex items-center gap-2.5 rounded-2xl border p-2.5">
              <span
                role="img"
                aria-label={`Avatar ${athlete.name}`}
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground"
              >
                {athlete.initials}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h3 className="truncate text-xs font-bold">{athlete.name}</h3>
                  <Badge variant={stageBadgeVariant(athlete.stage)}>{athlete.stageLabel}</Badge>
                </div>
                <p className="truncate text-[11px] text-muted-foreground">{athlete.lastGerakan}</p>
              </div>
              <span className="shrink-0 text-sm font-bold tabular-nums">{athlete.scorePct}%</span>
            </li>
          ))}
        </ul>
      </CardContent>
      {/* TODO: wire to /coach/members/[id] when the Phase 11 detail move lands */}
      <div className="flex flex-col gap-2 px-(--card-spacing) pb-(--card-spacing)">
        <span aria-disabled="true" className="flex items-center justify-center gap-1 text-xs font-bold text-primary">
          Lihat Detail <ChevronRight className="size-3.5" />
        </span>
      </div>
    </Card>
  );
}
```

Per-row `Lihat Detail` vs single footer link: Figma shows a button per card. If per-row links are truer to Figma, move the link inside each `<li>` pointing at `/coach/members/${athlete.id}` with the same TODO. Decide at implementation time; keep one dead-link pattern total.

- [ ] **Step 5: Run tests + typecheck, commit**

Run: `pnpm vitest run tests/unit/coach/ && pnpm tsc --noEmit`
Expected: PASS + zero errors

```bash
git add features/coach/components/coach-header.tsx features/coach/components/coach-stat-grid.tsx features/coach/components/coach-athlete-list.tsx tests/unit/coach/coach-shell.test.ts && git commit -m "feat(coach): build header, stat grid, and athlete list"
```

---

### Task 5: Pillars + posture + page composition

**Files:**
- Create: `features/coach/components/coach-pillar-monitor.tsx`, `features/coach/components/coach-posture-grid.tsx`
- Modify: `features/coach/pages/coach-dashboard-page.tsx` (replace Task 3 stub with the 4-unit Suspense composition)

**Interfaces:**
- Consumes: `CoachHeader`, `CoachStatGrid`, `CoachAthleteList` (Task 4), `getCoachOverview` (Task 2)
- Produces: full `/coach` render (Task 6 verifies)

- [ ] **Step 1: Write `coach-pillar-monitor.tsx` (div bars, no chart dep)**

```tsx
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CoachPillar } from "@/features/coach/types";

function pillarBadgeVariant(status: CoachPillar["status"]): "success" | "secondary" | "warning" {
  if (status === "stabil") return "success";
  if (status === "optimal") return "secondary";
  return "warning";
}

export function CoachPillarMonitor({ pillars }: { pillars: CoachPillar[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monitoring 4 Pilar Gerakan</CardTitle>
        <CardAction>
          <Badge variant="outline">Target ≥ 85%</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-3">
          {pillars.map((pillar) => (
            <li key={pillar.slug} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold">{pillar.name}</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-xs font-bold tabular-nums">{pillar.avgPct.toFixed(1)}%</span>
                  <Badge variant={pillarBadgeVariant(pillar.status)}>{pillar.statusLabel}</Badge>
                </span>
              </div>
              <div role="img" aria-label={`${pillar.name} ${pillar.avgPct.toFixed(1)} persen`} className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pillar.avgPct}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Write `coach-posture-grid.tsx` (2×2 tiles + banner)**

```tsx
import { TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PosturePoint } from "@/features/coach/types";

export function CoachPostureGrid({ posture }: { posture: PosturePoint[] }) {
  const [tiles, banner] = [posture.slice(0, 4), posture[4]];
  return (
    <Card>
      <CardHeader>
        <CardTitle>5 Titik Validasi Postur Tim</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        <ul className="grid grid-cols-2 gap-2.5">
          {tiles.map((point) => (
            <li key={point.id} className={`flex flex-col gap-1 rounded-2xl border p-2.5 ${point.warning ? "border-warning" : ""}`}>
              <span className="text-[11px] font-bold">{point.name}</span>
              <span className="text-sm font-bold tabular-nums">{point.scorePct}%</span>
              <Badge variant={point.warning ? "warning" : "success"}>{point.statusLabel}</Badge>
            </li>
          ))}
        </ul>
        {banner ? (
          <p className="flex items-center gap-2 rounded-2xl border border-warning bg-warning/10 p-2.5 text-[11px] font-medium">
            <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
            {banner.name} — {banner.scorePct}% {banner.statusLabel}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Replace the page stub with the Suspense composition**

```tsx
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getCoachOverview } from "@/features/coach/data/get-coach-overview";
import { CoachHeader } from "@/features/coach/components/coach-header";
import { CoachStatGrid } from "@/features/coach/components/coach-stat-grid";
import { CoachAthleteList } from "@/features/coach/components/coach-athlete-list";
import { CoachPillarMonitor } from "@/features/coach/components/coach-pillar-monitor";
import { CoachPostureGrid } from "@/features/coach/components/coach-posture-grid";

export function CoachDashboardPage() {
  return (
    <div className="flex flex-col gap-5">
      <CoachHeader />
      <Suspense fallback={<Skeleton className="h-44 w-full rounded-3xl" />}>
        <StatSection />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-80 w-full rounded-3xl" />}>
        <AthleteSection />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
        <PillarSection />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-56 w-full rounded-3xl" />}>
        <PostureSection />
      </Suspense>
    </div>
  );
}

async function StatSection() {
  const data = await getCoachOverview();
  return <CoachStatGrid stats={data.stats} />;
}

async function AthleteSection() {
  const data = await getCoachOverview();
  return <CoachAthleteList athletes={data.athletes} />;
}

async function PillarSection() {
  const data = await getCoachOverview();
  return <CoachPillarMonitor pillars={data.pillars} />;
}

async function PostureSection() {
  const data = await getCoachOverview();
  return <CoachPostureGrid posture={data.posture} />;
}
```

- [ ] **Step 4: Run tests + typecheck + lint, commit**

Run: `pnpm vitest run tests/unit/coach/ && pnpm tsc --noEmit && pnpm eslint features/coach "app/(coach)" tests/unit/coach`
Expected: PASS + zero errors + zero warnings

```bash
git add features/coach/components/coach-pillar-monitor.tsx features/coach/components/coach-posture-grid.tsx features/coach/pages/coach-dashboard-page.tsx && git commit -m "feat(coach): build pillars, posture, and dashboard composition"
```

---

### Task 6: Full gates + browser check + In Review

**Files:**
- Modify: none (verification only; fix fallout in place with `fix(coach):` commits)

**Interfaces:**
- Consumes: complete `/coach` render (Tasks 2–5)
- Produces: green gates evidence + PR to `development` + Linear `In Review` status

- [ ] **Step 1: Run the full gate suite**

Run in order, read full output, fix to zero:
```bash
pnpm build
pnpm tsc --noEmit
pnpm eslint
pnpm test
```
Expected: all green, zero errors. `pnpm test` runs `vitest run` (verify `package.json` script exists; adding it is part of this task if missing).

- [ ] **Step 2: Browser overflow check (Playwright, detached server per AGENTS.md)**

  1. Kill leftovers on a fresh port (e.g. 3105): `Get-NetTCPConnection -LocalPort 3105` → `taskkill /PID <pid> /T /F`; confirm `curl.exe --max-time 3` returns `000`.
  2. Start detached via WMI (returns instantly, never foreground `pnpm dev`).
  3. Bounded readiness checks only (≤3 re-checks, then report instead of hanging).
  4. Open via tab-new first, then evaluate `document.documentElement.scrollWidth <= window.innerWidth` at 390px on `/coach`.
  5. Stop the server (`taskkill /PID <pid> /T /F`), confirm port free, delete `.playwright-mcp/` + temp logs, verify `git status --short` clean of artifacts.
  Expected: check returns `true`; paste the result in the review comment.

- [ ] **Step 3: Progress comments per completed move**

  On the parent issue: `Done <sub-id>, next <sub-id>.` after each sub lands. `decision` comments only if Scope/Acceptance changed (kept in sync per linear-tracking).

- [ ] **Step 4: Open PR to development (squash) + move to In Review**

  PR carries the task's single squashed commit. Set parent to `In Review` with PR URL + 2–4 test steps (e.g. open `/coach`, confirm 4 stats + 5 athletes + pillars + posture, resize 390px, click Profil → `/profil`). Delete the task branch after merge. Members list (`94:40178`) stays a separate move under the same Phase 10 milestone.

---

## Self-Review

**1. Spec coverage:** §2 deltas → Task 3 (shell/navs, no Portal), Task 4 (header no badge, dead CTA, stat Cards, athlete list no-subtitle + last-gerakan + stage Badge), Task 5 (pillars + target Badge, posture + banner). §3 architecture → Tasks 3+5 (routes, layout, composition). §4 DTOs → Task 2 (types + dummy + test pins). §6 data flow → Task 5 (cached fetcher per Suspense unit). §7 verification → Task 6 (gates + browser). §8 out-of-scope explicitly excluded (members list, detail/feedback, PDF export, backend).

**2. Placeholder scan:** No TBD/TODO-without-endpoint — every TODO names `(GET /coach/…)`. No "similar to Task N" — code repeated per task. No missing types — all interfaces defined in Task 2 before use.

**3. Type consistency:** `CoachStat.id` union (`total-atlet|akurasi-tim|antrean|fokus`) matches `statIcons` keys (Task 4). `AthleteStage` (`siap|remediasi|lolos`) matches dummy values + `stageBadgeVariant` signature (Tasks 2–4). `PosturePoint.id` union includes `pronasi-pergelangan` for the banner index (Tasks 2+5). `CoachTab` (`dasbor|members|laporan|profil`) used consistently in nav + layout (Task 3).
