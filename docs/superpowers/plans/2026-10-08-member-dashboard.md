# Member Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Figma-faithful Member dashboard at `/dashboard` (Figma `94:38108`) as role-domain feature `features/member/` with dummy data behind a `TODO` fetch, placeholders for images, and lucide icons only.

**Architecture:** Thin RSC routes under `app/(member)/` call `features/member/pages/` compositions; presentational section components take DTO slices as props; async loader wrappers in `dashboard-page.tsx` fetch via cached `getMemberDashboard()` inside `<Suspense>` boundaries; pure modules (`types`, dummy, badge helper) carry the Vitest coverage.

**Tech Stack:** Next.js 16.3.8 App Router (Cache Components), React 19, shadcn `base-nova` (`Card`, `Badge`, `Button`, `Skeleton`), `lucide-react` 1.x (new names: `CircleCheck`, `TriangleAlert`, `ScrollText`), Vitest (node env, no JSX rendering — tests assert pure data + component source).

## Global Constraints

- Never add `"use client"` under `app/` (only `app/providers.tsx` has it); routes contain no logic, fetch, or validation.
- `features/member/data/` + `actions/` are server-only (`import "server-only"` first line); never import them from client components or Vitest (node env) — tests import the pure dummy module + helper only.
- Import with `@/` alias only; never relative imports across folders.
- shadcn Base UI only: no Radix imports, Radix docs do not apply.
- Flex layouts only — no `absolute`/hard placement in new components (verified by source-assertion tests). Chart bar heights use data-driven inline `%` styles, which is allowed.
- Lucide icons only, never emoji (Figma `💡` becomes `Lightbulb`).
- Per-task gates: targeted `vitest run` + `tsc --noEmit` + `eslint` on touched files. Full `pnpm build` + full suite + browser check in Task 5 only.
- One task = one commit = one review; commit format `<type>(<scope>): <summary>`.
- Run `pnpm exec next typegen` before `typecheck` whenever routes change (fresh checkouts lack `.next/types` — caught by CI on PR #3).

---

## File Structure

| File | Responsibility |
|---|---|
| `next.config.ts` (modify) | Add `cacheComponents: true` (CODE_STANDARD §1; required for `'use cache'`) |
| `features/member/types.ts` (create) | All DTO interfaces + `PillarStatus`/`DayState`/`ObservationTone` unions |
| `features/member/data/member-dashboard-dummy.ts` (create) | Pure dummy `MemberDashboard` mirroring Figma verbatim (no `server-only`, Vitest-safe) |
| `features/member/data/get-member-dashboard.ts` (create) | Server-only cached fetcher, `'use cache'` + `cacheLife("minutes")`, `TODO` backend |
| `tests/unit/member/dashboard-data.test.ts` (create) | DTO shape characterization from the dummy module |
| `features/member/components/shared/image-placeholder.tsx` (create) | Dashed placeholder (mirrors landing pattern; `ImageIcon` proven to compile) |
| `features/member/components/hero-greeting.tsx` (create) | Greeting + 2 dead CTAs (`buttonVariants` spans, `aria-disabled` + `TODO`) |
| `features/member/components/hero-visual-card.tsx` (create) | Dark pose card: placeholder + `Kamera Siap` pill + white accuracy metric box |
| `tests/unit/member/hero-visual.test.ts` (create) | Copy/icon/source assertions for hero files |
| `features/member/components/pillar-status.ts` (create) | Pure `pillarBadgeVariant(status)` helper (`perlu-koreksi` → `warning`, else `success`) |
| `features/member/components/pillar-grid.tsx` (create) | 2-col stat cards, Pukulan active ring, slug→icon map |
| `features/member/components/session-feedback.tsx` (create) | Score header + 3 tone rows + dead repeat button |
| `tests/unit/member/pillars-feedback.test.ts` (create) | Helper mapping + copy/icon/source assertions |
| `features/member/components/weekly-progress.tsx` (create) | Flex bar chart (7 days) + coach note `figure` |
| `tests/unit/member/weekly.test.ts` (create) | Source assertions for weekly file |
| `features/member/components/member-top-nav.tsx` (create) | Sticky top nav: logo + dead quick-start + avatar + breadcrumb + sync pill |
| `features/member/components/member-bottom-nav.tsx` (create) | Sticky bottom nav: 4 dead items, Dashboard active, Latihan badge `4` |
| `features/member/pages/member-layout.tsx` (create) | Flex column shell (`max-w-[448px]`, sticky navs) |
| `features/member/pages/dashboard-page.tsx` (create) | Static shell + 4 `Suspense` loaders fetching DTO slices |
| `app/(member)/layout.tsx` (create) | Thin RSC layout calling `MemberLayout` |
| `app/(member)/dashboard/page.tsx` (create) | Thin RSC route calling `DashboardPage` |
| `tests/unit/member/member-shell.test.ts` (create) | Route thinness + dead-nav + no-absolute assertions |

---

### Task 1: Data foundation + Cache Components config (PSR-33 data part)

**Files:**
- Modify: `next.config.ts`
- Create: `features/member/types.ts`
- Create: `features/member/data/member-dashboard-dummy.ts`
- Create: `features/member/data/get-member-dashboard.ts`
- Test: `tests/unit/member/dashboard-data.test.ts`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: `MemberDashboard` + slice interfaces from `@/features/member/types`; `dummyMemberDashboard: MemberDashboard` from `@/features/member/data/member-dashboard-dummy`; `getMemberDashboard(): Promise<MemberDashboard>` from `@/features/member/data/get-member-dashboard`. Later tasks import types + dummy slices; only `dashboard-page.tsx` (Task 5) imports the server fetcher.

- [ ] **Step 1: Enable Cache Components in `next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
};

export default nextConfig;
```

- [ ] **Step 2: Write the failing DTO test**

```ts
import { describe, expect, it } from "vitest";
import { dummyMemberDashboard } from "@/features/member/data/member-dashboard-dummy";

describe("dummyMemberDashboard", () => {
  it("greets Aced with a 2-day-old Pukulan Lurus focus", () => {
    // Arrange + Act
    const { greeting } = dummyMemberDashboard;

    // Assert
    expect(greeting).toEqual({ name: "Aced", lastSessionDaysAgo: 2, focusTechnique: "Pukulan Lurus" });
  });

  it("carries the Figma hero metric (82%, 14° vs <8°, 2.5m, camera ready)", () => {
    // Arrange + Act
    const { heroMetric } = dummyMemberDashboard;

    // Assert
    expect(heroMetric).toEqual({ accuracyPct: 82, elbowToleranceDeg: 14, targetDeg: 8, cameraDistanceM: 2.5, cameraReady: true });
  });

  it("exposes four pillars in Figma order with Figma averages", () => {
    // Arrange + Act
    const slugs = dummyMemberDashboard.pillars.map((p) => [p.slug, p.avgPct]);

    // Assert
    expect(slugs).toEqual([["kuda-kuda", 94.8], ["pukulan", 82.0], ["tangkisan", 89.5], ["tendangan", 76.0]]);
  });

  it("marks only Pukulan as the active focus card", () => {
    // Arrange + Act
    const active = dummyMemberDashboard.pillars.filter((p) => p.active).map((p) => p.slug);

    // Assert
    expect(active).toEqual(["pukulan"]);
  });

  it("covers a 7-day week with Kam highlighted and Rab resting", () => {
    // Arrange + Act
    const days = dummyMemberDashboard.weekly.days.map((d) => [d.label, d.state]);

    // Assert
    expect(days).toEqual([["Sen", "filled"], ["Sel", "filled"], ["Rab", "rest"], ["Kam", "active"], ["Jum", "empty"], ["Sab", "empty"], ["Min", "empty"]]);
  });

  it("keeps three Figma observations plus the Kang Fauzan note", () => {
    // Arrange + Act
    const { lastSession, coachNote } = dummyMemberDashboard;

    // Assert
    expect(lastSession.observations).toHaveLength(3);
    expect(coachNote.name).toBe("Kang Fauzan");
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm exec vitest run tests/unit/member/dashboard-data.test.ts`
Expected: FAIL with "Failed to resolve import" (dummy module does not exist yet).

- [ ] **Step 4: Create `features/member/types.ts`**

```ts
export type PillarStatus = "stabil" | "optimal" | "perlu-koreksi";
export type DayState = "filled" | "rest" | "empty" | "active";
export type ObservationTone = "good" | "warning" | "neutral";

export interface GreetingData {
  name: string;
  lastSessionDaysAgo: number;
  focusTechnique: string;
}

export interface HeroMetricData {
  accuracyPct: number;
  elbowToleranceDeg: number;
  targetDeg: number;
  cameraDistanceM: number;
  cameraReady: boolean;
}

export interface PillarStat {
  slug: "kuda-kuda" | "pukulan" | "tangkisan" | "tendangan";
  name: string;
  status: PillarStatus;
  statusLabel: string;
  detail: string;
  avgPct: number;
  active?: boolean;
}

export interface SessionObservation {
  tone: ObservationTone;
  title: string;
  body: string;
}

export interface LastSessionData {
  technique: string;
  time: string;
  reps: number;
  scorePct: number;
  scoreLabel: string;
  observations: SessionObservation[];
}

export interface WeekDay {
  label: string;
  value: number | null;
  state: DayState;
}

export interface WeeklyData {
  title: string;
  targetLabel: string;
  weekLabel: string;
  days: WeekDay[];
}

export interface CoachNoteData {
  initials: string;
  name: string;
  quote: string;
}

export interface MemberDashboard {
  greeting: GreetingData;
  heroMetric: HeroMetricData;
  pillars: PillarStat[];
  lastSession: LastSessionData;
  weekly: WeeklyData;
  coachNote: CoachNoteData;
}
```

- [ ] **Step 5: Create `features/member/data/member-dashboard-dummy.ts`**

```ts
import type { MemberDashboard } from "@/features/member/types";

// Placeholder values mirror Figma node 94:38108 verbatim until the backend lands.
export const dummyMemberDashboard: MemberDashboard = {
  greeting: { name: "Aced", lastSessionDaysAgo: 2, focusTechnique: "Pukulan Lurus" },
  heroMetric: { accuracyPct: 82, elbowToleranceDeg: 14, targetDeg: 8, cameraDistanceM: 2.5, cameraReady: true },
  pillars: [
    { slug: "kuda-kuda", name: "Kuda-kuda", status: "stabil", statusLabel: "Stabil", detail: "Tuntas 4/4 Variasi", avgPct: 94.8 },
    { slug: "pukulan", name: "Pukulan", status: "perlu-koreksi", statusLabel: "Perlu Koreksi", detail: "Pukulan Lurus", avgPct: 82.0, active: true },
    { slug: "tangkisan", name: "Tangkisan", status: "optimal", statusLabel: "Optimal", detail: "Tuntas 3/4 Variasi", avgPct: 89.5 },
    { slug: "tendangan", name: "Tendangan", status: "perlu-koreksi", statusLabel: "Perlu Koreksi", detail: "Harus Evaluasi", avgPct: 76.0 },
  ],
  lastSession: {
    technique: "Pukulan Lurus (Serangan Tangan)",
    time: "Kemarin, 16:40 WIB",
    reps: 30,
    scorePct: 82,
    scoreLabel: "Perlu Ditingkatkan",
    observations: [
      { tone: "good", title: "Keseimbangan Kaki & Kuda-kuda", body: "Pusat gravitasi stabil saat melepaskan serangan. Sudut lutut terjaga pada 135°." },
      { tone: "warning", title: "Ketinggian Siku Tangan", body: "Siku kanan turun 8 cm saat pelepasan pukulan, membuka celah di rusuk badan." },
      { tone: "neutral", title: "Rekomendasi Koreksi", body: "Pertahankan garis lurus dari bahu ke buku jari, putar pinggul 45° tepat saat benturan." },
    ],
  },
  weekly: {
    title: "Konsistensi Latihan",
    targetLabel: "Target: 4 dari 5 Hari Target",
    weekLabel: "Minggu Ke-3",
    days: [
      { label: "Sen", value: 88, state: "filled" },
      { label: "Sel", value: 92, state: "filled" },
      { label: "Rab", value: null, state: "rest" },
      { label: "Kam", value: 82, state: "active" },
      { label: "Jum", value: null, state: "empty" },
      { label: "Sab", value: null, state: "empty" },
      { label: "Min", value: null, state: "empty" },
    ],
  },
  coachNote: { initials: "KF", name: "Kang Fauzan", quote: "Postur kuda-kuda Aced sudah kokoh. Tingkatkan akselerasi pelepasan pukulan tanpa menurunkan siku pelindung." },
};
```

- [ ] **Step 6: Create `features/member/data/get-member-dashboard.ts`**

```ts
import "server-only";

import { cacheLife } from "next/cache";

import { dummyMemberDashboard } from "@/features/member/data/member-dashboard-dummy";
import type { MemberDashboard } from "@/features/member/types";

export async function getMemberDashboard(): Promise<MemberDashboard> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /member/dashboard) — dummy for now
  return dummyMemberDashboard;
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `pnpm exec vitest run tests/unit/member/dashboard-data.test.ts`
Expected: PASS, 6 passed.

- [ ] **Step 8: Typecheck touched scope**

Run: `pnpm typecheck`
Expected: exit 0, no errors.

- [ ] **Step 9: Lint touched files**

Run: `pnpm exec eslint next.config.ts features/member/types.ts features/member/data/member-dashboard-dummy.ts features/member/data/get-member-dashboard.ts tests/unit/member/dashboard-data.test.ts`
Expected: exit 0, no warnings/errors.

- [ ] **Step 10: Commit**

```bash
git add next.config.ts features/member/types.ts features/member/data tests/unit/member/dashboard-data.test.ts
git commit -m "feat(member): add dashboard data foundation and DTO tests"
```

---

### Task 2: Hero greeting + visual pose card (PSR-36)

**Files:**
- Create: `features/member/components/shared/image-placeholder.tsx`
- Create: `features/member/components/hero-greeting.tsx`
- Create: `features/member/components/hero-visual-card.tsx`
- Test: `tests/unit/member/hero-visual.test.ts`

**Interfaces:**
- Consumes: `GreetingData`, `HeroMetricData` from `@/features/member/types` (Task 1).
- Produces: `HeroGreeting({ greeting }: { greeting: GreetingData })`, `HeroVisualCard({ metric }: { metric: HeroMetricData })`, `ImagePlaceholder({ label, className })`. Task 5 renders them inside `Suspense` loaders.

- [ ] **Step 1: Write the failing test**

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("hero-greeting", () => {
  it("renders the Figma greeting copy with both CTAs", () => {
    // Arrange + Act
    const src = read("features/member/components/hero-greeting.tsx");

    // Assert
    expect(src).toContain("Halo,");
    expect(src).toContain("Mulai Sesi Latihan");
    expect(src).toContain("Lihat Panduan Biomekanik");
  });

  it("keeps CTAs dead with TODOs and lucide icons", () => {
    // Arrange + Act
    const src = read("features/member/components/hero-greeting.tsx");

    // Assert
    expect(src).toContain("aria-disabled");
    expect(src).toContain("TODO");
    expect(src).toContain("ArrowRight");
    expect(src).toContain("BookOpen");
  });
});

describe("hero-visual-card", () => {
  it("renders the Figma accuracy badge content", () => {
    // Arrange + Act
    const src = read("features/member/components/hero-visual-card.tsx");

    // Assert
    expect(src).toContain("Kamera Siap");
    expect(src).toContain("ImagePlaceholder");
    expect(src).toContain("Jarak");
  });

  it("uses flex layout with no hard placement or emoji", () => {
    // Arrange + Act
    const greeting = read("features/member/components/hero-greeting.tsx");
    const visual = read("features/member/components/hero-visual-card.tsx");

    // Assert
    expect(greeting).not.toContain("absolute");
    expect(visual).not.toContain("absolute");
    expect(visual).not.toContain("💡");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run tests/unit/member/hero-visual.test.ts`
Expected: FAIL with ENOENT (component files do not exist yet).

- [ ] **Step 3: Create the shared placeholder (mirrors landing pattern)**

```tsx
import { ImageIcon } from "lucide-react";

type ImagePlaceholderProps = {
  label: string;
  className?: string;
};

/** Dashed placeholder box until real pose photos land. */
export function ImagePlaceholder({ label, className }: ImagePlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={`${label} — placeholder`}
      className={`flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted p-4 text-center text-xs text-muted-foreground ${className ?? ""}`}
    >
      <ImageIcon className="size-5" />
      <span>{label} — placeholder</span>
    </div>
  );
}
```

- [ ] **Step 4: Create `hero-greeting.tsx`**

```tsx
import { ArrowRight, BookOpen } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { GreetingData } from "@/features/member/types";

export function HeroGreeting({ greeting }: { greeting: GreetingData }) {
  return (
    <section aria-labelledby="dashboard-greeting" className="flex flex-col gap-2">
      <h1 id="dashboard-greeting" className="text-2xl font-bold tracking-tight">
        Halo, {greeting.name}.
      </h1>
      <p className="text-sm font-bold">Siap melatih presisi gerakan hari ini?</p>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Sesi latihan mandiri terakhirmu {greeting.lastSessionDaysAgo} hari lalu. Fokus rekomendasi hari ini adalah
        mematangkan teknik <strong className="font-bold text-foreground">{greeting.focusTechnique}</strong> dan
        rotasi pinggul sebelum evaluasi mingguan.
      </p>
      <div className="flex flex-col gap-2 pt-1">
        {/* TODO: wire to /latihan session flow when the route lands */}
        <span aria-disabled="true" className={buttonVariants({ className: "w-full" })}>
          Mulai Sesi Latihan <ArrowRight data-icon="inline-end" />
        </span>
        {/* TODO: wire to /panduan biomekanik when the route lands */}
        <span aria-disabled="true" className={buttonVariants({ variant: "outline", className: "w-full" })}>
          <BookOpen data-icon="inline-start" /> Lihat Panduan Biomekanik
        </span>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Create `hero-visual-card.tsx`**

```tsx
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ImagePlaceholder } from "@/features/member/components/shared/image-placeholder";
import type { HeroMetricData } from "@/features/member/types";

export function HeroVisualCard({ metric }: { metric: HeroMetricData }) {
  return (
    <section aria-label="Akurasi terkini" className="flex flex-col">
      <Card className="gap-0 overflow-hidden border-stone-800 bg-stone-950 py-0">
        <ImagePlaceholder label="Visual pose pesilat" className="rounded-none border-0" />
        <div className="flex items-center justify-between px-4 pt-3">
          <Badge variant="success">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-success-foreground" />
            {metric.cameraReady ? "Kamera Siap" : "Kamera Mati"}
          </Badge>
        </div>
        <CardContent className="flex flex-col gap-2 p-4">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3 text-stone-950">
            <div className="flex flex-col gap-0.5">
              <p className="flex flex-wrap items-baseline gap-x-1.5">
                <span className="text-xl font-bold">{metric.accuracyPct}%</span>
                <span className="text-[10px] font-bold tracking-widest text-stone-500 uppercase">
                  Akurasi terkini
                </span>
              </p>
              <p className="text-xs text-stone-600">
                Toleransi sudut siku:{" "}
                <strong className="font-bold text-amber-700">{metric.elbowToleranceDeg}°</strong>{" "}
                (Target: &lt;{metric.targetDeg}°)
              </p>
            </div>
            <span className="shrink-0 rounded-lg bg-stone-100 px-2 py-1 text-[10px] font-bold text-stone-700 ring-1 ring-stone-200 ring-inset">
              Jarak {metric.cameraDistanceM}m
            </span>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm exec vitest run tests/unit/member/hero-visual.test.ts`
Expected: PASS, 4 passed.

- [ ] **Step 7: Typecheck**

Run: `pnpm typecheck`
Expected: exit 0.

- [ ] **Step 8: Lint touched files**

Run: `pnpm exec eslint features/member/components/shared/image-placeholder.tsx features/member/components/hero-greeting.tsx features/member/components/hero-visual-card.tsx tests/unit/member/hero-visual.test.ts`
Expected: exit 0.

- [ ] **Step 9: Commit**

```bash
git add features/member/components tests/unit/member/hero-visual.test.ts
git commit -m "feat(member): add hero greeting and visual pose card"
```

---

### Task 3: Pillar grid + session feedback (PSR-34)

**Files:**
- Create: `features/member/components/pillar-status.ts`
- Create: `features/member/components/pillar-grid.tsx`
- Create: `features/member/components/session-feedback.tsx`
- Test: `tests/unit/member/pillars-feedback.test.ts`

**Interfaces:**
- Consumes: `PillarStat`, `LastSessionData` from `@/features/member/types` (Task 1).
- Produces: `pillarBadgeVariant(status: PillarStatus): "success" | "warning"`; `PillarGrid({ pillars }: { pillars: PillarStat[] })`; `SessionFeedback({ session }: { session: LastSessionData })`. Task 5 renders them inside `Suspense` loaders.

- [ ] **Step 1: Write the failing test**

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { pillarBadgeVariant } from "@/features/member/components/pillar-status";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("pillarBadgeVariant", () => {
  it("maps stabil to the success tint", () => {
    expect(pillarBadgeVariant("stabil")).toBe("success");
  });

  it("maps optimal to the success tint", () => {
    expect(pillarBadgeVariant("optimal")).toBe("success");
  });

  it("maps perlu-koreksi to the warning tint", () => {
    expect(pillarBadgeVariant("perlu-koreksi")).toBe("warning");
  });
});

describe("pillar-grid", () => {
  it("renders the Figma section header with active-card affordance", () => {
    // Arrange + Act
    const src = read("features/member/components/pillar-grid.tsx");

    // Assert
    expect(src).toContain("Kategori Gerakan Dasar");
    expect(src).toContain("ChevronRight");
    expect(src).toContain("border-primary");
  });
});

describe("session-feedback", () => {
  it("renders all three observation tones with lucide icons, never emoji", () => {
    // Arrange + Act
    const src = read("features/member/components/session-feedback.tsx");

    // Assert
    expect(src).toContain("Ulangi Latihan Gerakan Ini");
    expect(src).toContain("CircleCheck");
    expect(src).toContain("TriangleAlert");
    expect(src).toContain("Lightbulb");
    expect(src).not.toContain("💡");
    expect(src).not.toContain("absolute");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run tests/unit/member/pillars-feedback.test.ts`
Expected: FAIL with "Failed to resolve import" (helper does not exist yet).

- [ ] **Step 3: Create `pillar-status.ts`**

```ts
import type { PillarStatus } from "@/features/member/types";

export function pillarBadgeVariant(status: PillarStatus): "success" | "warning" {
  return status === "perlu-koreksi" ? "warning" : "success";
}
```

- [ ] **Step 4: Create `pillar-grid.tsx`**

```tsx
import { ChevronRight, Footprints, Hand, Shield, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { pillarBadgeVariant } from "@/features/member/components/pillar-status";
import type { PillarStat } from "@/features/member/types";

const pillarIcons = {
  "kuda-kuda": Footprints,
  pukulan: Hand,
  tangkisan: Shield,
  tendangan: Zap,
} as const;

export function PillarGrid({ pillars }: { pillars: PillarStat[] }) {
  return (
    <section aria-labelledby="pillar-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <h2 id="pillar-heading" className="text-sm font-bold tracking-tight">
            Kategori Gerakan Dasar
          </h2>
          <p className="text-xs text-muted-foreground">4 pilar kurikulum baku pesilat pemula UNSIL</p>
        </div>
        <Badge variant="secondary">Gasal 2024</Badge>
      </div>
      <ul className="grid grid-cols-2 gap-2.5">
        {pillars.map((pillar) => {
          const Icon = pillarIcons[pillar.slug];
          return (
            <li key={pillar.slug} className="flex">
              <Card
                size="sm"
                className={`flex-1 gap-0 ${pillar.active ? "border-2 border-primary" : ""}`}
              >
                <CardContent className="flex flex-1 flex-col gap-2 p-3">
                  <div className="flex items-center justify-between">
                    <span className="flex size-7 items-center justify-center rounded-xl bg-muted">
                      <Icon className="size-4" />
                    </span>
                    <Badge variant={pillarBadgeVariant(pillar.status)}>{pillar.statusLabel}</Badge>
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-xs font-bold">{pillar.name}</h3>
                    <p className={`text-[11px] ${pillar.active ? "text-primary" : "text-muted-foreground"}`}>
                      {pillar.detail}
                    </p>
                  </div>
                  <div className="mt-auto flex items-end justify-between border-t pt-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8px] font-bold tracking-widest text-muted-foreground uppercase">
                        Rata-rata
                      </span>
                      <span className={`text-sm font-bold ${pillar.active ? "text-primary" : ""}`}>
                        {pillar.avgPct.toFixed(1)}%
                      </span>
                    </div>
                    {pillar.active ? (
                      /* TODO: wire to /latihan pukulan flow when the route lands */
                      <span aria-disabled="true" className="flex items-center gap-0.5 text-xs font-bold text-primary">
                        Lanjut <ChevronRight className="size-3.5" />
                      </span>
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
```

- [ ] **Step 5: Create `session-feedback.tsx`**

```tsx
import { CircleCheck, Lightbulb, RotateCcw, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { LastSessionData, ObservationTone } from "@/features/member/types";

const toneConfig: Record<ObservationTone, { icon: typeof CircleCheck; row: string; title: string; body: string }> = {
  good: {
    icon: CircleCheck,
    row: "border-success-border bg-success",
    title: "text-success-foreground",
    body: "text-success-foreground",
  },
  warning: {
    icon: TriangleAlert,
    row: "border-warning-border bg-warning",
    title: "text-warning-foreground",
    body: "text-warning-foreground",
  },
  neutral: {
    icon: Lightbulb,
    row: "border-border bg-muted",
    title: "text-foreground",
    body: "text-muted-foreground",
  },
};

export function SessionFeedback({ session }: { session: LastSessionData }) {
  return (
    <section aria-labelledby="feedback-heading" className="flex flex-col">
      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] font-bold tracking-widest text-primary uppercase">Evaluasi sesi mandiri</p>
              <h2 id="feedback-heading" className="text-sm font-bold">
                {session.technique}
              </h2>
              <p className="text-xs text-muted-foreground">
                {session.time} • {session.reps} Repetisi
              </p>
            </div>
            <Badge variant="warning">
              {session.scorePct}% — {session.scoreLabel}
            </Badge>
          </div>
          <ul className="flex flex-col gap-2">
            {session.observations.map((observation) => {
              const tone = toneConfig[observation.tone];
              const Icon = tone.icon;
              return (
                <li
                  key={observation.title}
                  className={`flex items-start gap-2.5 rounded-xl border p-3 ${tone.row}`}
                >
                  <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <div className="flex flex-col gap-0.5">
                    <p className={`text-xs font-bold ${tone.title}`}>{observation.title}</p>
                    <p className={`text-xs leading-relaxed ${tone.body}`}>{observat
...[truncated 7371 chars]