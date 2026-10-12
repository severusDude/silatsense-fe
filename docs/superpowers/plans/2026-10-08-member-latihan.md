# Member Latihan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Figma-faithful member training list at `/latihan` (Linear PSR-40, spec `docs/superpowers/specs/2026-10-08-member-latihan-design.md`).

**Architecture:** Mirror the dashboard move (PSR-32): thin RSC route → `LatihanPage` static shell with two `<Suspense>` units → presentational components fed by a cached dummy fetcher. Nav tabs become real links with an `activeTab` prop; card CTAs stay dead with a `TODO → /latihan/[slug]`.

**Tech Stack:** Next.js 16.3.8 App Router (Cache Components), React 19, Tailwind 4, shadcn base-nova (`Badge`, `buttonVariants`, `Card`, `Skeleton`), lucide-react 1.x, Vitest 3 (source-text characterization tests), Playwright MCP (browser checks).

## Global Constraints

- Every file under `app/` except `api/` handlers is a React Server Component — never add `"use client"` under `app/`.
- `features/member/data/*` is server-only: first line `import "server-only"`. Never import it from a client component.
- Dummy modules are pure (no `import "server-only"` in `*-dummy.ts`, keeps them Vitest-safe); the fetcher keeps `'use cache'` + `cacheLife("minutes")`.
- Every stub TODO names its endpoint: `TODO: connect backend via lib/api-client.ts (GET /member/training-modules)`; CTA TODOs name the detail route `/latihan/[slug]` (Figma 94:38628).
- Import with `@/` alias only. No relative imports across folders.
- Flex layouts only — the word `absolute` must not appear in new/modified UI files. Order badge is a stacked flex caption row, not an overlay.
- Images are `ImagePlaceholder` only. Icons are lucide-react 1.x only, never emoji.
- No sensor copy anywhere in UI or DTO (`estimateLabel?` replaces it; badge hidden when absent).
- Commits follow `<type>(<scope>): <summary>`; one task = one commit.

---

## File Structure

| File | Responsibility |
|---|---|
| `features/member/types.ts` (modify: append) | `TrainingModule`, `TrainingHero`, `MemberTraining` DTOs |
| `features/member/data/member-training-dummy.ts` (create) | Pure dummy payload, Figma-verbatim where exact |
| `features/member/data/get-training-modules.ts` (create) | Server-only cached fetcher with backend TODO |
| `tests/unit/member/training-data.test.ts` (create) | Pins dummy shape (order, verbatim copy, optional estimate) |
| `features/member/components/latihan-hero.tsx` (create) | Hero badges + title + subtitle + stats bar (presentational) |
| `features/member/components/module-card.tsx` (create) | One module card: placeholder, order caption, title row + estimate badge, dead CTA |
| `features/member/components/module-card-list.tsx` (create) | Vertical card list (presentational) |
| `tests/unit/member/latihan-shell.test.ts` (create) | Source-text tests for route thinness, Suspense, flex-only, dead CTAs, nav state |
| `features/member/components/member-bottom-nav.tsx` (modify) | `activeTab` prop; Dashboard/Latihan become real `Link`s; Riwayat/Profil stay dead |
| `features/member/components/member-top-nav.tsx` (modify) | `trail: string[]` prop for the breadcrumb (`Dashboard / Latihan`) |
| `features/member/pages/member-layout.tsx` (modify) | Accepts and forwards `activeTab` + `trail` (defaults preserve dashboard render) |
| `app/(member)/latihan/layout.tsx` (create) | Wraps latihan segment with `activeTab="latihan"`, trail `["Dashboard", "Latihan"]` |
| `app/(member)/latihan/page.tsx` (create) | Thin RSC calling `LatihanPage` |
| `features/member/pages/latihan-page.tsx` (create) | Static shell + two `<Suspense>` units fetching via `getTrainingModules` |

---

### Task 1: Data layer + DTO tests (PSR-42)

**Files:**
- Modify: `features/member/types.ts` (append at end)
- Create: `features/member/data/member-training-dummy.ts`
- Create: `features/member/data/get-training-modules.ts`
- Create: `tests/unit/member/training-data.test.ts`

**Interfaces:**
- Consumes: nothing new (extends existing `features/member/types.ts`).
- Produces: `TrainingModule`, `TrainingHero`, `MemberTraining` types; `dummyMemberTraining: MemberTraining`; `getTrainingModules(): Promise<MemberTraining>` — Tasks 2–3 consume all three by these exact names.

- [ ] **Step 1: Append the DTOs to `features/member/types.ts`**

Append exactly this block after the `MemberDashboard` interface (line 70):

```ts
export interface TrainingModule {
  slug: "kuda-kuda" | "pukulan" | "tangkisan" | "tendangan";
  order: number;
  orderLabel: string;
  name: string;
  levelLabel: string;
  description: string;
  estimateLabel?: string;
}

export interface TrainingHero {
  badges: string[];
  title: string;
  subtitle: string;
  sessionsLabel: string;
  accuracyLabel: string;
}

export interface MemberTraining {
  hero: TrainingHero;
  modules: TrainingModule[];
}
```

- [ ] **Step 2: Write the failing test `tests/unit/member/training-data.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { dummyMemberTraining } from "@/features/member/data/member-training-dummy";

describe("dummyMemberTraining", () => {
  it("carries the Figma hero title and subtitle verbatim", () => {
    // Arrange + Act
    const { hero } = dummyMemberTraining;

    // Assert
    expect(hero.title).toBe("Pilih Latihan Gerakan Dasar");
    expect(hero.subtitle).toBe(
      "Pilih salah satu dari 4 pilar teknik dasar pencak silat untuk memulai panduan gerak dan kalibrasi sensor biomekanika AI.",
    );
  });

  it("exposes four modules in Figma order", () => {
    // Arrange + Act
    const slugs = dummyMemberTraining.modules.map((m) => m.slug);

    // Assert
    expect(slugs).toEqual(["kuda-kuda", "pukulan", "tangkisan", "tendangan"]);
  });

  it("keeps slugs unique with the Figma-verbatim Kuda-kuda description", () => {
    // Arrange + Act
    const modules = dummyMemberTraining.modules;

    // Assert
    expect(new Set(modules.map((m) => m.slug)).size).toBe(4);
    expect(modules[0].description).toBe(
      "Fondasi utama stabilitas tubuh, distribusi bobot simetris 50:50, serta kekuatan tumpuan paha dan lutut sejajar 135°.",
    );
  });

  it("shows an estimate badge only where the Figma duration is legible", () => {
    // Arrange + Act
    const labels = dummyMemberTraining.modules.map((m) => m.estimateLabel);

    // Assert
    expect(labels[0]).toBe("10 Menit");
    expect(labels.slice(1)).toEqual([undefined, undefined, undefined]);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm test tests/unit/member/training-data.test.ts`
Expected: FAIL with "Failed to resolve import @/features/member/data/member-training-dummy".

- [ ] **Step 4: Create `features/member/data/member-training-dummy.ts` (minimal code to pass)**

```ts
import type { MemberTraining } from "@/features/member/types";

// Descriptions mirror Figma node 94:38430 verbatim. Order/level/estimate
// labels are best-effort transcriptions flagged "[transcribed — confirm]"
// in the spec; only the legible "10 Menit" estimate ships, the rest omit
// estimateLabel so no badge renders.
export const dummyMemberTraining: MemberTraining = {
  hero: {
    badges: ["MODUL LATIHAN", "Standar PB IPSI Resmi", "4 Pilar Teknik"],
    title: "Pilih Latihan Gerakan Dasar",
    subtitle:
      "Pilih salah satu dari 4 pilar teknik dasar pencak silat untuk memulai panduan gerak dan kalibrasi sensor biomekanika AI.",
    sessionsLabel: "26 Sesi Tersimpan",
    accuracyLabel: "Akurasi: 84.0%",
  },
  modules: [
    {
      slug: "kuda-kuda",
      order: 1,
      orderLabel: "Latihan 01 · Fondasi Inti",
      name: "Kuda-kuda",
      levelLabel: "Semua Tingkat Kemampuan",
      description:
        "Fondasi utama stabilitas tubuh, distribusi bobot simetris 50:50, serta kekuatan tumpuan paha dan lutut sejajar 135°.",
      estimateLabel: "10 Menit",
    },
    {
      slug: "pukulan",
      order: 2,
      orderLabel: "Latihan 02 · Serangan Tangan",
      name: "Pukulan",
      levelLabel: "Pukulan Dasar 3 Bentuk",
      description:
        "Melatih linearitas dorongan kepalan tangan segaris ulu hati, kekokohan Kuda Kuda (135°), dan efisiensi rotasi sendi panggul 45°.",
    },
    {
      slug: "tangkisan",
      order: 3,
      orderLabel: "Latihan 03 · Pertahanan",
      name: "Tangkisan",
      levelLabel: "Tangkisan Luar & Dalam",
      description:
        "Teknik menangkis serangan lawan dengan sudut perisai lengan 45° terhadap dahi serta menjaga elastisitas bahu dan leher tetap rileks.",
    },
    {
      slug: "tendangan",
      order: 4,
      orderLabel: "Latihan 04 · Serangan Kaki",
      name: "Tendangan",
      levelLabel: "Tendangan & Sabit",
      description:
        "Melatih daya dorong tumit/sabit, ketinggian lintasan ujung kaki, dan kelurusan sentakan sendi lutut tumpuan saat eksekusi.",
    },
  ],
};
```

- [ ] **Step 5: Create `features/member/data/get-training-modules.ts`**

```ts
import "server-only";

import { cacheLife } from "next/cache";

import { dummyMemberTraining } from "@/features/member/data/member-training-dummy";
import type { MemberTraining } from "@/features/member/types";

export async function getTrainingModules(): Promise<MemberTraining> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /member/training-modules) — dummy for now
  return dummyMemberTraining;
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `pnpm test tests/unit/member/training-data.test.ts`
Expected: 4 passed.

- [ ] **Step 7: Commit**

```bash
git add features/member/types.ts features/member/data/member-training-dummy.ts features/member/data/get-training-modules.ts tests/unit/member/training-data.test.ts
git commit -m "feat(member): add training DTO dummy fetch and tests (PSR-42)"
```

---

### Task 2: Hero + module cards (PSR-43)

**Files:**
- Create: `features/member/components/latihan-hero.tsx`
- Create: `features/member/components/module-card.tsx`
- Create: `features/member/components/module-card-list.tsx`
- Create: `tests/unit/member/latihan-shell.test.ts` (source-text tests; route/page assertions in this file fail until Task 3 — see Step 2 note)

**Interfaces:**
- Consumes: `TrainingHero`, `TrainingModule` (Task 1); `Badge`, `buttonVariants`, `Card`/`CardContent`, `ImagePlaceholder` (existing).
- Produces: `LatihanHero({ hero })`, `ModuleCard({ module })`, `ModuleCardList({ modules })` — Task 3 consumes all three by these exact names and prop shapes.

- [ ] **Step 1: Create `features/member/components/latihan-hero.tsx`**

```tsx
import { Badge } from "@/components/ui/badge";
import type { TrainingHero } from "@/features/member/types";

export function LatihanHero({ hero }: { hero: TrainingHero }) {
  return (
    <section aria-labelledby="latihan-heading" className="flex flex-col gap-2">
      <ul className="flex flex-wrap gap-1.5" aria-label="Kategori modul">
        {hero.badges.map((badge) => (
          <li key={badge} className="flex">
            <Badge variant="secondary">{badge}</Badge>
          </li>
        ))}
      </ul>
      <h1 id="latihan-heading" className="text-2xl font-bold tracking-tight">
        {hero.title}
      </h1>
      <p className="text-xs leading-relaxed text-muted-foreground">{hero.subtitle}</p>
      <div className="flex items-center justify-between gap-3 border-t pt-2 text-xs text-muted-foreground">
        <span>{hero.sessionsLabel}</span>
        <span>{hero.accuracyLabel}</span>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `features/member/components/module-card.tsx`**

```tsx
import { ArrowRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ImagePlaceholder } from "@/features/member/components/shared/image-placeholder";
import type { TrainingModule } from "@/features/member/types";

export function ModuleCard({ module }: { module: TrainingModule }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex flex-col gap-1.5">
          <ImagePlaceholder label={module.name} />
          <Badge variant="secondary">{module.orderLabel}</Badge>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-sm font-bold">{module.name}</h2>
            <p className="text-xs text-muted-foreground">{module.levelLabel}</p>
          </div>
          {module.estimateLabel ? (
            <Badge variant="outline" className="shrink-0">
              <Clock className="size-3" aria-hidden="true" /> {module.estimateLabel}
            </Badge>
          ) : null}
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{module.description}</p>
        {/* TODO: wire to /latihan/[slug] Persiapan detail (Figma 94:38628) when the route lands */}
        <span aria-disabled="true" className={buttonVariants({ className: "w-full" })}>
          Mulai Latihan <ArrowRight data-icon="inline-end" />
        </span>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Create `features/member/components/module-card-list.tsx`**

```tsx
import { ModuleCard } from "@/features/member/components/module-card";
import type { TrainingModule } from "@/features/member/types";

export function ModuleCardList({ modules }: { modules: TrainingModule[] }) {
  return (
    <section aria-labelledby="modul-heading" className="flex flex-col gap-3">
      <h2 id="modul-heading" className="sr-only">
        Modul latihan
      </h2>
      <ul className="flex flex-col gap-3">
        {modules.map((module) => (
          <li key={module.slug} className="flex flex-col">
            <ModuleCard module={module} />
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 4: Write the component half of `tests/unit/member/latihan-shell.test.ts`**

Write the file with ONLY these two tests for now (route assertions arrive in Task 3 — adding them now would fail with missing files, which is expected red, not plan red):

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("latihan components", () => {
  it("renders the estimate badge inline-end only when the label exists", () => {
    // Arrange + Act
    const src = read("features/member/components/module-card.tsx");

    // Assert
    expect(src).toContain("items-start justify-between");
    expect(src).toContain("estimateLabel ?");
    expect(src).toContain("variant=\"outline\"");
  });

  it("keeps cards flex-only with placeholders and dead CTAs", () => {
    // Arrange + Act
    const card = read("features/member/components/module-card.tsx");
    const list = read("features/member/components/module-card-list.tsx");
    const hero = read("features/member/components/latihan-hero.tsx");

    // Assert
    for (const src of [card, list, hero]) {
      expect(src).not.toContain("absolute");
    }
    expect(card).toContain("ImagePlaceholder");
    expect(card).toContain("TODO");
    expect(card).toContain("/latihan/[slug]");
    expect(card).toContain("aria-disabled");
    expect(card).not.toContain("Sensor Siap");
    expect(list).toContain("ModuleCard");
  });
});
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm test tests/unit/member/latihan-shell.test.ts tests/unit/member/training-data.test.ts`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add features/member/components/latihan-hero.tsx features/member/components/module-card.tsx features/member/components/module-card-list.tsx tests/unit/member/latihan-shell.test.ts
git commit -m "feat(member): build latihan hero and module cards (PSR-43)"
```

---

### Task 3: Route + nav wiring + gates (PSR-41)

**Files:**
- Modify: `features/member/components/member-bottom-nav.tsx` (full rewrite below)
- Modify: `features/member/components/member-top-nav.tsx` (one prop + one line)
- Modify: `features/member/pages/member-layout.tsx` (full rewrite below)
- Create: `app/(member)/latihan/layout.tsx`
- Create: `app/(member)/latihan/page.tsx`
- Create: `features/member/pages/latihan-page.tsx`
- Modify: `tests/unit/member/latihan-shell.test.ts` (append route tests)

**Interfaces:**
- Consumes: `LatihanHero`, `ModuleCardList`, `getTrainingModules` (Tasks 1–2).
- Produces: `/latihan` route; nothing downstream this move.

- [ ] **Step 1: Rewrite `features/member/components/member-bottom-nav.tsx` with the `activeTab` prop**

Replace the whole file with:

```tsx
import Link from "next/link";
import { Dumbbell, LayoutDashboard, ScrollText, User } from "lucide-react";

export type MemberTab = "dashboard" | "latihan";

const itemClass = "flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-medium";
const linkInner = "flex flex-col items-center gap-0.5";

export function MemberBottomNav({ activeTab = "dashboard" }: { activeTab?: MemberTab }) {
  const dashboardActive = activeTab === "dashboard";
  const latihanActive = activeTab === "latihan";
  return (
    <nav aria-label="Navigasi member" className="sticky bottom-0 z-40 border-t bg-background/95 backdrop-blur">
      <ul className="mx-auto flex w-full max-w-[448px] px-4 py-2">
        <li className={`${itemClass} ${dashboardActive ? "text-primary" : "text-muted-foreground"}`}>
          {dashboardActive ? (
            <span aria-current="page" className={linkInner}>
              <LayoutDashboard className="size-4" aria-hidden="true" />
              Dashboard
            </span>
          ) : (
            <Link href="/dashboard" className={linkInner}>
              <LayoutDashboard className="size-4" aria-hidden="true" />
              Dashboard
            </Link>
          )}
        </li>
        <li className={`${itemClass} ${latihanActive ? "text-primary" : "text-muted-foreground"}`}>
          {latihanActive ? (
            <span aria-current="page" className={linkInner}>
              <span className="flex items-center gap-1">
                <Dumbbell className="size-4" aria-hidden="true" />
                <span className="rounded-full bg-destructive px-1 text-[9px] font-bold text-white">4</span>
              </span>
              Latihan
            </span>
          ) : (
            <Link href="/latihan" className={linkInner}>
              <span className="flex items-center gap-1">
                <Dumbbell className="size-4" aria-hidden="true" />
                <span className="rounded-full bg-destructive px-1 text-[9px] font-bold text-white">4</span>
              </span>
              Latihan
            </Link>
          )}
        </li>
        {/* TODO: link to /riwayat when the route lands */}
        <li className={`${itemClass} text-muted-foreground`}>
          <span aria-disabled="true" className={linkInner}>
            <ScrollText className="size-4" aria-hidden="true" />
            Riwayat
          </span>
        </li>
        {/* TODO: link to /profil when the route lands */}
        <li className={`${itemClass} text-muted-foreground`}>
          <span aria-disabled="true" className={linkInner}>
            <User className="size-4" aria-hidden="true" />
            Profil
          </span>
        </li>
      </ul>
    </nav>
  );
}
```

- [ ] **Step 2: Add the `trail` prop to `features/member/components/member-top-nav.tsx`**

Change line 5 `export function MemberTopNav() {` to:

```tsx
export function MemberTopNav({ trail = ["Dashboard"] }: { trail?: string[] }) {
```

and change line 30 `<p className="text-xs font-bold text-primary">Dashboard</p>` to:

```tsx
<p className="text-xs font-bold text-primary">{trail.join(" / ")}</p>
```

- [ ] **Step 3: Rewrite `features/member/pages/member-layout.tsx` with prop passthrough**

Replace the whole file with:

```tsx
import type { ReactNode } from "react";
import { MemberBottomNav, type MemberTab } from "@/features/member/components/member-bottom-nav";
import { MemberTopNav } from "@/features/member/components/member-top-nav";

export function MemberLayout({
  children,
  activeTab = "dashboard",
  trail = ["Dashboard"],
}: {
  children: ReactNode;
  activeTab?: MemberTab;
  trail?: string[];
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MemberTopNav trail={trail} />
      <main className="mx-auto flex w-full max-w-[448px] flex-1 flex-col gap-5 px-4 pt-4 pb-8">
        {children}
      </main>
      <MemberBottomNav activeTab={activeTab} />
    </div>
  );
}
```

- [ ] **Step 4: Create `features/member/pages/latihan-page.tsx`**

```tsx
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getTrainingModules } from "@/features/member/data/get-training-modules";
import { LatihanHero } from "@/features/member/components/latihan-hero";
import { ModuleCardList } from "@/features/member/components/module-card-list";

export function LatihanPage() {
  return (
    <div className="flex flex-col gap-5">
      <Suspense fallback={<Skeleton className="h-48 w-full rounded-3xl" />}>
        <HeroSection />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
        <ModulesSection />
      </Suspense>
    </div>
  );
}

async function HeroSection() {
  const data = await getTrainingModules();
  return <LatihanHero hero={data.hero} />;
}

async function ModulesSection() {
  const data = await getTrainingModules();
  return <ModuleCardList modules={data.modules} />;
}
```

- [ ] **Step 5: Create the thin route files**

`app/(member)/latihan/page.tsx`:

```tsx
import { LatihanPage } from "@/features/member/pages/latihan-page";

export default function Page() {
  return <LatihanPage />;
}
```

`app/(member)/latihan/layout.tsx`:

```tsx
import type { ReactNode } from "react";
import { MemberLayout } from "@/features/member/pages/member-layout";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <MemberLayout activeTab="latihan" trail={["Dashboard", "Latihan"]}>
      {children}
    </MemberLayout>
  );
}
```

- [ ] **Step 6: Append the route tests to `tests/unit/member/latihan-shell.test.ts`**

Append this block at the end of the file:

```ts
describe("latihan route", () => {
  it("keeps the latihan route thin with no client boundary", () => {
    // Arrange + Act
    const layout = read("app/(member)/latihan/layout.tsx");
    const page = read("app/(member)/latihan/page.tsx");

    // Assert
    expect(layout).not.toContain("use client");
    expect(page).not.toContain("use client");
    expect(page).toContain("@/features/member/pages/latihan-page");
    expect(page).toContain("LatihanPage");
  });

  it("suspends hero and modules behind skeleton fallbacks", () => {
    // Arrange + Act
    const src = read("features/member/pages/latihan-page.tsx");

    // Assert
    expect(src).toContain("Suspense");
    expect(src).toContain("Skeleton");
    expect(src).toContain("getTrainingModules");
    expect(src).toContain("LatihanHero");
    expect(src).toContain("ModuleCardList");
  });

  it("marks Latihan active with real links and keeps dead TODOs for the rest", () => {
    // Arrange + Act
    const bottom = read("features/member/components/member-bottom-nav.tsx");

    // Assert
    expect(bottom).toContain("activeTab");
    expect(bottom).toContain('href="/latihan"');
    expect(bottom).toContain("aria-current");
    expect(bottom).toContain("TODO");
    expect(bottom).toContain("aria-disabled");
  });
});
```

- [ ] **Step 7: Run the full verification gates**

Run each, zero errors required:

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Expected: `vitest run` all suites pass (including the untouched `member-shell.test.ts` — Latihan/Riwayat/Profil labels, `aria-disabled`, `TODO`, and `aria-current` are all still present); `tsc --noEmit` clean; eslint clean; Next build succeeds.

- [ ] **Step 8: Verify in a real browser via Playwright MCP**

Start the dev server (`pnpm dev`), then in the browser: open `/latihan` at 390px width and desktop width, open `/dashboard` to confirm the Latihan tab now links over, and evaluate:

```js
document.documentElement.scrollWidth <= window.innerWidth
```

Expected: `true` on `/latihan` (390px + desktop) and `/dashboard` (both widths, both nav states). Also confirm: exactly 4 `role="img"` placeholders, Latihan tab carries `aria-current="page"` on `/latihan`, card buttons are non-links (no 404 reachable). Paste the check results into the review comment.

- [ ] **Step 9: Commit**

```bash
git add features/member/components/member-bottom-nav.tsx features/member/components/member-top-nav.tsx features/member/pages/member-layout.tsx features/member/pages/latihan-page.tsx "app/(member)/latihan/layout.tsx" "app/(member)/latihan/page.tsx" tests/unit/member/latihan-shell.test.ts
git commit -m "feat(member): wire latihan route with active nav state (PSR-41)"
```

---

## Self-Review

**1. Spec coverage:** §2 hero (Task 2 hero) + cards incl. optional estimate badge + dead CTAs (Task 2 card) + reused navs with Latihan active (Task 3) ✓; §3 routes/compositions/components/data (Tasks 1–3) ✓; §4 DTOs verbatim in Task 1 ✓; §5 flex-only, placeholders, lucide, badge tints, dead-CTA TODOs (Task 2 + source-text tests) ✓; §6 fetcher shape + Suspense (Tasks 1, 3) ✓; §7 unit tests + gates + Playwright (Tasks 1–3) ✓; §8 detail/backend/riwayat/profil untouched ✓.

**2. Placeholder scan:** No TBD/TODO-as-plan; every code step ships complete file contents. The only TODOs are the intentional in-code stub markers required by the spec.

**3. Type consistency:** `TrainingModule`/`TrainingHero`/`MemberTraining`, `dummyMemberTraining`, `getTrainingModules`, `LatihanHero({ hero })`, `ModuleCard({ module })`, `ModuleCardList({ modules })`, `MemberTab`, `activeTab`, `trail` — identical names/signatures across all tasks.
