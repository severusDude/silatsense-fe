# Member Evaluasi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/latihan/[slug]/evaluasi` per `docs/superpowers/specs/2026-10-11-member-evaluasi-design.md` (PSR-63).

**Architecture:** Thin RSC route + leaf layout call `features/member/pages/evaluasi-page.tsx` (4 Suspense units); server-only `get-evaluasi` over a pure dummy module; 6 server components, no client island; shadcn `Badge` for all pills; `<video controls>` placeholder shell with 2 TODOs.

**Tech Stack:** Next.js 16.3.8 App Router (Cache Components), React 19, Tailwind 4, shadcn base-nova `Badge` via `@/components/ui/badge`, `Card` via `@/components/ui/card`, `Skeleton`, `lucide-react`, Vitest file-content characterization tests.

## Global Constraints

- `app/**` (except `app/api/` and `app/providers.tsx`) are React Server Components — never add `"use client"` under `app/`.
- Route files contain no business logic, fetch, or validation — they call `features/member/pages/evaluasi-page.tsx`.
- `features/member/data/` + `features/member/actions/` are server-only: first line `import "server-only"`; never imported from client components.
- Every `'use cache'` pairs with a `cacheLife(...)`.
- Dummy lives in a pure module `features/member/data/evaluasi-dummy.ts` with no `import "server-only"`.
- Every stub TODO names the exact endpoint, e.g. `TODO: connect backend via lib/api-client.ts (GET /member/evaluations/:slug)`.
- Import with `@/` alias only, never relative across folders.
- Flex/grid layouts only — no `absolute` in new/modified UI files; `lucide-react` icons only.
- Header shows 2 badges only — `12 Repetisi Sah`, `3 Terdeviasi`; no `speedLabel`, no `⚡ 4.18 m/s` anywhere.
- Badge mapping: `12 Repetisi Sah` → `success`, `3 Terdeviasi` → `warning`, `Perlu Perbaikan` → `warning`, `1080p@60FPS` → `outline`, `Sesuai*` → `success`, `Tidak Sesuai*` → `warning`.
- Video shell keeps Figma `aspect-[4/3]` (not sesi `3/4`), `<video controls>`, no `src`.
- Copy is Figma Indonesian verbatim (see Task 1 dummy values).
- Each commit leaves the tree compiling (`tsc --noEmit` clean); behavior change + its characterization test may share a commit; full gates run before `In Review`.

---

## File Structure

Created:

- `features/member/data/evaluasi-dummy.ts` — pure dummy map `dummyEvaluasiBySlug` + `evaluasiSlugs` re-export source (4 slugs, pukulan verbatim).
- `features/member/data/get-evaluasi.ts` — server-only cached fetcher `getEvaluasi(slug): Promise<EvaluationSession | null>`.
- `features/member/components/evaluasi-header.tsx` — title + date + 2 Badges.
- `features/member/components/evaluasi-score-card.tsx` — 80% hero + warning Badge + progress + note.
- `features/member/components/evaluasi-playback.tsx` — `<video controls>` shell + 2 TODOs.
- `features/member/components/evaluasi-scrubber.tsx` — static timeline divs + labels.
- `features/member/components/evaluasi-posture-list.tsx` — 5 posture cards with Badges.
- `features/member/components/evaluasi-actions.tsx` — dead `Selesai dan Simpan` + live `Latihan Ulang` Link.
- `features/member/pages/evaluasi-page.tsx` — 4 Suspense units calling `getEvaluasi` + `notFound()`.
- `app/(member)/latihan/[slug]/evaluasi/page.tsx` — thin route + `generateStaticParams`.
- `app/(member)/latihan/[slug]/evaluasi/layout.tsx` — `MemberLayout activeTab="latihan"` + trail.
- `tests/unit/member/evaluasi-data.test.ts` — dummy shape characterization.
- `tests/unit/member/evaluasi-shell.test.ts` — file-content shell characterization.

Modified:

- `features/member/types.ts` — append `PostureStatus`, `PostureAssessment`, `KinematicScore`, `EvaluationSession` (no `speedLabel`).
- `features/member/components/sesi-actions.tsx` — flip dead `Lihat Evaluasi` span to live `Link` (resolves sesi TODO).

---

### Task 1: Evaluasi DTOs + dummy + fetcher (PSR-65)

**Files:**
- Modify: `features/member/types.ts`
- Create: `features/member/data/evaluasi-dummy.ts`
- Create: `features/member/data/get-evaluasi.ts`
- Create: `tests/unit/member/evaluasi-data.test.ts`

**Interfaces:**
- Consumes: `PersiapanSlug` (existing, `features/member/types.ts`), Figma copy from spec §4.
- Produces: `EvaluationSession`, `PostureAssessment`, `KinematicScore`, `PostureStatus`, `EvaluasiSlug`, `dummyEvaluasiBySlug: Record<EvaluasiSlug, EvaluationSession>`, `evaluasiSlugs: readonly EvaluasiSlug[]`, `getEvaluasi(slug: string): Promise<EvaluationSession | null>`.

- [ ] **Step 1: Append DTO types to `features/member/types.ts`**

Append after the `TrainingSession` interface (end of file):

```ts
export type EvaluasiSlug = PersiapanSlug;

export type PostureStatus = "sesuai" | "tidak-sesuai";

export interface PostureAssessment {
  id: "bahu" | "siku-kanan" | "pinggul" | "lutut" | "pergelangan";
  name: string;
  status: PostureStatus;
  statusLabel: string;
  detail: string;
}

export interface KinematicScore {
  value: number;
  unit: "%";
  targetPct: number;
  targetLabel: string;
  deltaLabel: string;
  alertLabel: string;
  summary: string;
}

export interface EvaluationSession {
  slug: EvaluasiSlug;
  techniqueName: string;
  evaluatedAtLabel: string;
  validReps: number;
  deviatedReps: number;
  qualityLabel: string;
  score: KinematicScore;
  postures: PostureAssessment[];
  videoStatus: "placeholder";
}
```

- [ ] **Step 2: Write the failing data test**

Create `tests/unit/member/evaluasi-data.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { EvaluationSession } from "@/features/member/types";
import { dummyEvaluasiBySlug } from "@/features/member/data/evaluasi-dummy";

describe("dummyEvaluasiBySlug", () => {
  it("resolves all four module slugs", () => {
    // Arrange + Act
    const slugs = Object.keys(dummyEvaluasiBySlug).sort();

    // Assert
    expect(slugs).toEqual(["kuda-kuda", "pukulan", "tangkisan", "tendangan"]);
    for (const slug of slugs) {
      expect(dummyEvaluasiBySlug[slug as keyof typeof dummyEvaluasiBySlug].slug).toBe(slug);
    }
  });

  it("carries the pukulan evaluation verbatim with no speedLabel", () => {
    // Arrange + Act
    const detail = dummyEvaluasiBySlug["pukulan"];

    // Assert
    expect(detail.techniqueName).toBe("Pukulan Lurus Depan");
    expect(detail.evaluatedAtLabel).toBe("28 Sep 2026, 16:45 WIB");
    expect(detail.validReps).toBe(12);
    expect(detail.deviatedReps).toBe(3);
    expect(detail.qualityLabel).toBe("1080p@60FPS");
    expect(detail.score.value).toBe(80);
    expect(detail.score.targetPct).toBe(85);
    expect(detail.score.deltaLabel).toBe("Selisih -5%");
    expect(detail.score.alertLabel).toBe("PERLU PERBAIKAN");
    expect(detail.postures).toHaveLength(5);
    expect(detail.postures.map((posture) => posture.name)).toEqual([
      "Bahu",
      "Siku Kanan",
      "Pinggul",
      "Lutut",
      "Pergelangan",
    ]);
    expect(detail.postures[1]?.statusLabel).toBe("TIDAK SESUAI (142°)");
    expect(detail.videoStatus).toBe("placeholder");
    expect(detail).not.toHaveProperty("speedLabel");
  });

  it("falls back to null for an unknown slug", () => {
    // Arrange + Act
    const lookup: Record<string, EvaluationSession | undefined> =
      dummyEvaluasiBySlug;
    const detail = lookup["jurus-tak-bernama"] ?? null;

    // Assert
    expect(detail).toBeNull();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/member/evaluasi-data.test.ts`
Expected: FAIL with "Failed to resolve import … evaluasi-dummy" (module does not exist yet).

- [ ] **Step 4: Write the dummy module**

Create `features/member/data/evaluasi-dummy.ts` (pure — no `import "server-only"`):

```ts
import type {
  EvaluasiSlug,
  EvaluationSession,
  PostureAssessment,
} from "@/features/member/types";

const pukulanPostures: PostureAssessment[] = [
  {
    id: "bahu",
    name: "Bahu",
    status: "sesuai",
    statusLabel: "SESUAI",
    detail:
      "Sejajar horizontal, rileks, dan stabil mengalirkan tenaga linear tanpa ketegangan trapezius.",
  },
  {
    id: "siku-kanan",
    name: "Siku Kanan",
    status: "tidak-sesuai",
    statusLabel: "TIDAK SESUAI (142°)",
    detail:
      "Elevasi siku terlalu melebar keluar (sayap terbuka) sejauh +8 cm dari sumbu sagital tubuh.",
  },
  {
    id: "pinggul",
    name: "Pinggul",
    status: "sesuai",
    statusLabel: "SESUAI",
    detail:
      "Rotasi panggul mengunci sejajar poros kuda-kuda, pusat gravitasi simetris dan seimbang.",
  },
  {
    id: "lutut",
    name: "Lutut",
    status: "sesuai",
    statusLabel: "SESUAI (135°)",
    detail:
      "Fleksi lutut 135° kokoh, tumpuan kaki terdistribusi merata 50:50 tanpa pergeseran poros.",
  },
  {
    id: "pergelangan",
    name: "Pergelangan",
    status: "tidak-sesuai",
    statusLabel: "TIDAK SESUAI (+0.15S)",
    detail:
      "Pronasi kepalan terlambat +0.15 detik sebelum fase impak titik sasaran pada ulu hati.",
  },
];

function evaluasiSession(
  slug: EvaluasiSlug,
  techniqueName: string,
): EvaluationSession {
  return {
    slug,
    techniqueName,
    evaluatedAtLabel: "28 Sep 2026, 16:45 WIB",
    validReps: 12,
    deviatedReps: 3,
    qualityLabel: "1080p@60FPS",
    score: {
      value: 80,
      unit: "%",
      targetPct: 85,
      targetLabel: "Target Lulus Standar : ≥ 85%",
      deltaLabel: "Selisih -5%",
      alertLabel: "PERLU PERBAIKAN",
      summary:
        "2 dari 5 parameter anatomis membutuhkan penyesuaian: elevasi siku kanan (sayap terbuka) dan rotasi kepalan pergelangan tangan.",
    },
    postures: pukulanPostures.map((posture) => ({ ...posture })),
    videoStatus: "placeholder",
  };
}

export const evaluasiSlugs: readonly EvaluasiSlug[] = [
  "kuda-kuda",
  "pukulan",
  "tangkisan",
  "tendangan",
];

export const dummyEvaluasiBySlug: Record<EvaluasiSlug, EvaluationSession> = {
  "kuda-kuda": evaluasiSession("kuda-kuda", "Kuda-kuda"),
  pukulan: evaluasiSession("pukulan", "Pukulan Lurus Depan"),
  tangkisan: evaluasiSession("tangkisan", "Tangkisan"),
  tendangan: evaluasiSession("tendangan", "Tendangan"),
};
```

- [ ] **Step 5: Write the server fetcher**

Create `features/member/data/get-evaluasi.ts` (first line `import "server-only"`):

```ts
import "server-only";

import { cacheLife } from "next/cache";

import {
  dummyEvaluasiBySlug,
  evaluasiSlugs,
} from "@/features/member/data/evaluasi-dummy";
import type {
  EvaluasiSlug,
  EvaluationSession,
} from "@/features/member/types";

export { evaluasiSlugs };

function isEvaluasiSlug(slug: string): slug is EvaluasiSlug {
  return (evaluasiSlugs as string[]).includes(slug);
}

export async function getEvaluasi(
  slug: string,
): Promise<EvaluationSession | null> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /member/evaluations/:slug) — dummy for now
  if (!isEvaluasiSlug(slug)) return null;
  return dummyEvaluasiBySlug[slug];
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/member/evaluasi-data.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 7: Typecheck**

Run: `pnpm typecheck`
Expected: zero errors.

- [ ] **Step 8: Commit**

```bash
git add features/member/types.ts features/member/data/evaluasi-dummy.ts features/member/data/get-evaluasi.ts tests/unit/member/evaluasi-data.test.ts
git commit -m "feat(member): add evaluasi data+DTOs (PSR-65)"
```

---

### Task 2: Header + score card (PSR-64a)

**Files:**
- Create: `features/member/components/evaluasi-header.tsx`
- Create: `features/member/components/evaluasi-score-card.tsx`

**Interfaces:**
- Consumes: `EvaluationSession` (Task 1), `Badge` from `@/components/ui/badge`, `Card, CardContent` from `@/components/ui/card`.
- Produces: `EvaluasiHeader({ session }: { session: EvaluationSession })`, `EvaluasiScoreCard({ session }: { session: EvaluationSession })`.

- [ ] **Step 1: Write `evaluasi-header.tsx`**

```tsx
import { Badge } from "@/components/ui/badge";
import type { EvaluationSession } from "@/features/member/types";

export function EvaluasiHeader({ session }: { session: EvaluationSession }) {
  return (
    <section aria-label="Identitas sesi" className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold tracking-tight">
        {session.techniqueName}
      </h1>
      <p className="text-[11px] text-muted-foreground">
        {session.evaluatedAtLabel}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="success">{session.validReps} Repetisi Sah</Badge>
        <Badge variant="warning">{session.deviatedReps} Terdeviasi</Badge>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Write `evaluasi-score-card.tsx`**

```tsx
import { TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { EvaluationSession } from "@/features/member/types";

export function EvaluasiScoreCard({
  session,
}: {
  session: EvaluationSession;
}) {
  const { score } = session;
  const widthPct = `${score.value}%`;
  const targetLeftPct = `${score.targetPct}%`;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              Akurasi Kinematika
            </p>
            <p className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">{score.value}</span>
              <span className="text-xl font-bold text-muted-foreground">
                {score.unit}
              </span>
            </p>
          </div>
          <Badge variant="warning" className="uppercase">
            <TriangleAlert aria-hidden="true" /> {score.alertLabel}
          </Badge>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold text-muted-foreground">
              {score.targetLabel}
            </p>
            <p className="text-[10px] font-bold text-destructive">
              {score.deltaLabel}
            </p>
          </div>
          <div
            role="img"
            aria-label={`${score.value}% dari target ${score.targetPct}%`}
            className="flex h-2.5 w-full overflow-hidden rounded-full bg-secondary"
          >
            <div className="h-full rounded-full bg-warning" style={{ width: widthPct }} />
            <div
              aria-hidden="true"
              className="h-full w-0.5 shrink-0 bg-foreground"
              style={{ marginLeft: `calc(${targetLeftPct} - ${widthPct} - 1px)` }}
            />
          </div>
        </div>
        <p className="rounded-xl bg-secondary/50 p-2.5 text-[11px] leading-relaxed">
          {score.summary}
        </p>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add features/member/components/evaluasi-header.tsx features/member/components/evaluasi-score-card.tsx
git commit -m "feat(member): add evaluasi header+score card (PSR-64)"
```

---

### Task 3: Playback shell + static scrubber (PSR-64b)

**Files:**
- Create: `features/member/components/evaluasi-playback.tsx`
- Create: `features/member/components/evaluasi-scrubber.tsx`

**Interfaces:**
- Consumes: `EvaluationSession` (Task 1), `Badge` from `@/components/ui/badge`.
- Produces: `EvaluasiPlayback({ session })`, `EvaluasiScrubber()` (static, no props).

- [ ] **Step 1: Write `evaluasi-playback.tsx`**

```tsx
import { Badge } from "@/components/ui/badge";
import type { EvaluationSession } from "@/features/member/types";

export function EvaluasiPlayback({ session }: { session: EvaluationSession }) {
  return (
    <section aria-label="Visualisasi postur" className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold">Visualisasi Postur & Freeze-Frame</h2>
        <Badge variant="outline">{session.qualityLabel}</Badge>
      </div>
      {/* TODO: bind recorded blob via lib/api-client.ts (GET /member/evaluations/:slug/video) when blob store lands — no src in stub */}
      {/* TODO(spike): evaluate video playback lib for frame-accurate scrub + 0.5x slow-mo + overlay markers (candidates: vplayer-react, video.js, @saran-ign/video-annotation-tool, @remotion/player) then replace shell — see exa 2026-10-11 */}
      <video
        controls
        aria-label={`${session.techniqueName} — visualisasi postur`}
        className="aspect-[4/3] w-full rounded-2xl border bg-black"
      />
    </section>
  );
}
```

- [ ] **Step 2: Write `evaluasi-scrubber.tsx` (static, Figma labels verbatim)**

```tsx
export function EvaluasiScrubber() {
  return (
    <div
      role="img"
      aria-label="Linimasa ulangan 1 sampai 15, puncak pada ulangan 11 bingkai 245"
      className="flex flex-col gap-1.5"
    >
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary" style={{ width: "65%" }} />
      </div>
      <div className="flex items-center justify-between gap-2 text-[9px] font-medium text-muted-foreground">
        <span>00:00 (Rep #1)</span>
        <span className="font-bold text-warning-foreground">
          Puncak: Rep #11 (Frame 245 - 02:18)
        </span>
        <span>03:45 (Rep #15)</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add features/member/components/evaluasi-playback.tsx features/member/components/evaluasi-scrubber.tsx
git commit -m "feat(member): add evaluasi playback shell+scrubber (PSR-64)"
```

---

### Task 4: Posture list + actions (PSR-64c)

**Files:**
- Create: `features/member/components/evaluasi-posture-list.tsx`
- Create: `features/member/components/evaluasi-actions.tsx`

**Interfaces:**
- Consumes: `EvaluationSession` (Task 1), `Badge`, `Card`, `buttonVariants`, `Link` from `next/link`, icons `CheckCircle2, AlertTriangle, Save, RotateCcw` from `lucide-react`.
- Produces: `EvaluasiPostureList({ session })`, `EvaluasiActions({ session })`.

- [ ] **Step 1: Write `evaluasi-posture-list.tsx`**

```tsx
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { EvaluationSession } from "@/features/member/types";

export function EvaluasiPostureList({
  session,
}: {
  session: EvaluationSession;
}) {
  return (
    <section aria-label="Penilaian postur anatomis" className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <h2 className="text-sm font-bold">Penilaian Postur Anatomis</h2>
          <p className="text-[10px] text-muted-foreground">
            Evaluasi 5 parameter biomekanika pukulan lurus
          </p>
        </div>
        <Badge variant="outline">3 Sesuai · 2 Perlu Koreksi</Badge>
      </div>
      <div className="flex flex-col gap-2">
        {session.postures.map((posture) => {
          const ok = posture.status === "sesuai";
          const Icon = ok ? CheckCircle2 : AlertTriangle;
          return (
            <Card key={posture.id}>
              <CardContent className="flex flex-col gap-1.5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-xs font-bold">
                    <Icon
                      aria-hidden="true"
                      className={ok ? "size-4 text-success" : "size-4 text-warning"}
                    />
                    {posture.name}
                  </p>
                  <Badge variant={ok ? "success" : "warning"}>
                    {posture.statusLabel}
                  </Badge>
                </div>
                <p className="pl-6 text-[11px] leading-relaxed text-muted-foreground">
                  {posture.detail}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Write `evaluasi-actions.tsx`**

```tsx
import Link from "next/link";
import { RotateCcw, Save } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { EvaluationSession } from "@/features/member/types";

export function EvaluasiActions({ session }: { session: EvaluationSession }) {
  return (
    <section aria-label="Tindak lanjut evaluasi" className="flex flex-col gap-2">
      <h2 className="text-sm font-bold">Siap Memperbaiki Deviasi Gerakan?</h2>
      <p className="text-[11px] text-muted-foreground">
        Targetkan akurasi ≥ 85% untuk lulus standar uji.
      </p>
      {/* TODO: connect backend via lib/api-client.ts (POST /member/evaluations/:slug/ack) — dead CTA for now */}
      <span
        aria-disabled="true"
        className={buttonVariants({ size: "lg", className: "w-full rounded-full" })}
      >
        <Save data-icon="inline-start" /> Selesai dan Simpan
      </span>
      <Link
        href={`/latihan/${session.slug}/rekam`}
        className={buttonVariants({
          variant: "outline",
          size: "lg",
          className: "w-full rounded-full",
        })}
      >
        <RotateCcw data-icon="inline-start" /> Latihan Ulang
      </Link>
    </section>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add features/member/components/evaluasi-posture-list.tsx features/member/components/evaluasi-actions.tsx
git commit -m "feat(member): add evaluasi posture list+actions (PSR-64)"
```

---

### Task 5: Composition + route + nav + shell tests (PSR-66)

**Files:**
- Create: `features/member/pages/evaluasi-page.tsx`
- Create: `app/(member)/latihan/[slug]/evaluasi/page.tsx`
- Create: `app/(member)/latihan/[slug]/evaluasi/layout.tsx`
- Create: `tests/unit/member/evaluasi-shell.test.ts`
- Modify: `features/member/components/sesi-actions.tsx` (flip dead `Lihat Evaluasi` to live `Link`)

**Interfaces:**
- Consumes: `getEvaluasi` + `evaluasiSlugs` (Task 1), all 6 components (Tasks 2–4), `MemberLayout` (`features/member/pages/member-layout`), `Skeleton`, `notFound`.
- Produces: `EvaluasiPage({ slug }: { slug: string })`, thin route with `generateStaticParams`, leaf layout with trail `["Dashboard", "Latihan", "Evaluasi"]`.

- [ ] **Step 1: Write `features/member/pages/evaluasi-page.tsx`**

```tsx
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getEvaluasi } from "@/features/member/data/get-evaluasi";
import { EvaluasiHeader } from "@/features/member/components/evaluasi-header";
import { EvaluasiScoreCard } from "@/features/member/components/evaluasi-score-card";
import { EvaluasiPlayback } from "@/features/member/components/evaluasi-playback";
import { EvaluasiScrubber } from "@/features/member/components/evaluasi-scrubber";
import { EvaluasiPostureList } from "@/features/member/components/evaluasi-posture-list";
import { EvaluasiActions } from "@/features/member/components/evaluasi-actions";

export function EvaluasiPage({ slug }: { slug: string }) {
  return (
    <div className="flex flex-col gap-3.5">
      <Suspense fallback={<Skeleton className="h-24 w-full rounded-2xl" />}>
        <HeaderSection slug={slug} />
      </Suspense>
      <Suspense fallback={<Skeleton className="aspect-[4/3] w-full rounded-2xl" />}>
        <VisualSection slug={slug} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <PostureSection slug={slug} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-12 w-full rounded-full" />}>
        <ActionsSection slug={slug} />
      </Suspense>
    </div>
  );
}

async function HeaderSection({ slug }: { slug: string }) {
  const session = await getEvaluasi(slug);
  if (!session) notFound();
  return (
    <>
      <EvaluasiHeader session={session} />
      <EvaluasiScoreCard session={session} />
    </>
  );
}

async function VisualSection({ slug }: { slug: string }) {
  const session = await getEvaluasi(slug);
  if (!session) notFound();
  return (
    <>
      <EvaluasiPlayback session={session} />
      <EvaluasiScrubber />
    </>
  );
}

async function PostureSection({ slug }: { slug: string }) {
  const session = await getEvaluasi(slug);
  if (!session) notFound();
  return <EvaluasiPostureList session={session} />;
}

async function ActionsSection({ slug }: { slug: string }) {
  const session = await getEvaluasi(slug);
  if (!session) notFound();
  return <EvaluasiActions session={session} />;
}
```

- [ ] **Step 2: Write the thin route `app/(member)/latihan/[slug]/evaluasi/page.tsx`**

```tsx
import { evaluasiSlugs } from "@/features/member/data/get-evaluasi";
import { EvaluasiPage } from "@/features/member/pages/evaluasi-page";

export function generateStaticParams() {
  return evaluasiSlugs.map((slug) => ({ slug }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <EvaluasiPage slug={slug} />;
}
```

- [ ] **Step 3: Write the leaf layout `app/(member)/latihan/[slug]/evaluasi/layout.tsx`**

```tsx
import type { ReactNode } from "react";
import { MemberLayout } from "@/features/member/pages/member-layout";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <MemberLayout activeTab="latihan" trail={["Dashboard", "Latihan", "Evaluasi"]}>
      {children}
    </MemberLayout>
  );
}
```

- [ ] **Step 4: Flip sesi `Lihat Evaluasi` to a live Link**

In `features/member/components/sesi-actions.tsx`, replace:

```tsx
      {status === "success" ? (
        /* TODO → /evaluasi when the results route lands */
        <span
          aria-disabled="true"
          className={buttonVariants({ size: "lg", className: "w-full rounded-full" })}
        >
          Lihat Evaluasi
        </span>
      ) : null}
```

with:

```tsx
      {status === "success" ? (
        <Link
          href={`/latihan/${session.slug}/evaluasi`}
          className={buttonVariants({ size: "lg", className: "w-full rounded-full" })}
        >
          Lihat Evaluasi
        </Link>
      ) : null}
```

(`Link` is already imported in that file.)

- [ ] **Step 5: Write the failing shell test**

Create `tests/unit/member/evaluasi-shell.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("evaluasi components", () => {
  it("renders the video placeholder shell with two TODOs and no overlays", () => {
    // Arrange + Act
    const src = read("features/member/components/evaluasi-playback.tsx");

    // Assert
    expect(src).not.toContain("absolute");
    expect(src).toContain("aspect-[4/3]");
    expect(src).toContain("<video");
    expect(src).toContain("controls");
    expect(src).not.toContain("src=");
    expect(src).toContain(
      "TODO: bind recorded blob via lib/api-client.ts (GET /member/evaluations/:slug/video)",
    );
    expect(src).toContain("TODO(spike)");
    expect(src).toContain("vplayer-react");
    expect(src).not.toContain("4.18");
  });

  it("uses shadcn Badge for all six pill strings with no speed badge", () => {
    // Arrange + Act
    const files = [
      "features/member/components/evaluasi-header.tsx",
      "features/member/components/evaluasi-score-card.tsx",
      "features/member/components/evaluasi-playback.tsx",
      "features/member/components/evaluasi-posture-list.tsx",
    ];
    const src = files.map(read).join("\n");

    // Assert
    expect(src).toContain("@/components/ui/badge");
    expect(src).toContain("12 Repetisi Sah");
    expect(src).toContain("3 Terdeviasi");
    expect(src).toContain("PERLU PERBAIKAN");
    expect(src).toContain("1080p@60FPS");
    expect(src).toContain("SESUAI");
    expect(src).toContain("TIDAK SESUAI");
    expect(src).not.toContain("4.18");
    expect(src).not.toContain("speedLabel");
  });

  it("keeps all evaluasi UI flex-only with lucide icons", () => {
    // Arrange + Act
    const files = [
      "features/member/components/evaluasi-header.tsx",
      "features/member/components/evaluasi-score-card.tsx",
      "features/member/components/evaluasi-playback.tsx",
      "features/member/components/evaluasi-scrubber.tsx",
      "features/member/components/evaluasi-posture-list.tsx",
      "features/member/components/evaluasi-actions.tsx",
    ];

    // Assert
    for (const file of files) {
      expect(read(file)).not.toContain("absolute");
    }
    expect(
      read("features/member/components/evaluasi-score-card.tsx"),
    ).toContain("lucide-react");
  });

  it("links Latihan Ulang to rekam and keeps Selesai dead with a TODO", () => {
    // Arrange + Act
    const src = read("features/member/components/evaluasi-actions.tsx");

    // Assert
    expect(src).toContain("Selesai dan Simpan");
    expect(src).toContain("/latihan/${session.slug}/rekam");
    expect(src).toContain("Latihan Ulang");
    expect(src).toContain("POST /member/evaluations/:slug/ack");
    expect(src).toContain("TODO");
  });
});

describe("evaluasi route", () => {
  it("keeps the evaluasi route thin with static params and no client boundary", () => {
    // Arrange + Act
    const layout = read("app/(member)/latihan/[slug]/evaluasi/layout.tsx");
    const page = read("app/(member)/latihan/[slug]/evaluasi/page.tsx");

    // Assert
    expect(layout).not.toContain("use client");
    expect(page).not.toContain("use client");
    expect(page).toContain("generateStaticParams");
    expect(page).toContain("evaluasiSlugs");
    expect(page).toContain("@/features/member/pages/evaluasi-page");
    expect(page).toContain("EvaluasiPage");
  });

  it("suspends four units behind skeleton fallbacks", () => {
    // Arrange + Act
    const src = read("features/member/pages/evaluasi-page.tsx");

    // Assert
    expect(src).toContain("Suspense");
    expect(src).toContain("Skeleton");
    expect(src).toContain("notFound");
    expect(src).toContain("getEvaluasi");
    expect(src).toContain("EvaluasiHeader");
    expect(src).toContain("EvaluasiScoreCard");
    expect(src).toContain("EvaluasiPlayback");
    expect(src).toContain("EvaluasiScrubber");
    expect(src).toContain("EvaluasiPostureList");
    expect(src).toContain("EvaluasiActions session");
    expect(src.match(/Suspense/g)?.length).toBeGreaterThanOrEqual(4);
  });

  it("owns one member shell per leaf with the Evaluasi trail", () => {
    // Arrange + Act
    const slug = read("app/(member)/latihan/[slug]/layout.tsx");
    const detail = read("app/(member)/latihan/[slug]/evaluasi/layout.tsx");

    // Assert
    expect(slug).not.toContain("MemberLayout");
    expect(detail).toContain("MemberLayout");
    expect(detail).toContain('activeTab="latihan"');
    expect(detail).toContain("Evaluasi");
  });

  it("links the sesi Lihat Evaluasi affordance live to the evaluasi route", () => {
    // Arrange + Act
    const src = read("features/member/components/sesi-actions.tsx");

    // Assert
    expect(src).toContain("Lihat Evaluasi");
    expect(src).toContain("/latihan/${session.slug}/evaluasi");
    expect(src).toContain("Link");
  });
});
```

- [ ] **Step 6: Run both evaluasi suites**

Run: `pnpm vitest run tests/unit/member/evaluasi-data.test.ts tests/unit/member/evaluasi-shell.test.ts`
Expected: PASS (all tests).

- [ ] **Step 7: Typecheck + lint the touched files**

Run: `pnpm typecheck`
Expected: zero errors.
Run: `pnpm eslint features/member/components/evaluasi-*.tsx features/member/pages/evaluasi-page.tsx features/member/data/evaluasi-*.ts "app/(member)/latihan/[slug]/evaluasi/*.tsx" tests/unit/member/evaluasi-*.test.ts`
Expected: zero warnings/errors.

- [ ] **Step 8: Commit**

```bash
git add features/member/pages/evaluasi-page.tsx "app/(member)/latihan/[slug]/evaluasi/page.tsx" "app/(member)/latihan/[slug]/evaluasi/layout.tsx" tests/unit/member/evaluasi-shell.test.ts features/member/components/sesi-actions.tsx
git commit -m "feat(member): wire evaluasi route+nav (PSR-66)"
```

---

### Task 6: Full gates + browser overflow check

**Files:** none (verification only).

- [ ] **Step 1: Run the full gates**

Run: `pnpm build`
Expected: compiles successfully, no errors.
Run: `pnpm typecheck`
Expected: zero errors.
Run: `pnpm lint`
Expected: zero errors/warnings.
Run: `pnpm test`
Expected: all suites green (`vitest run`).

- [ ] **Step 2: Browser check at 390px + desktop**

Follow `AGENTS.md` § Dev server (WMI-detached start, bounded readiness checks, Playwright tab-new first, kill server + delete artifacts after). Visit `/latihan/pukulan/evaluasi`, confirm `document.documentElement.scrollWidth <= window.innerWidth` at 390px and desktop, click-path sesi `Lihat Evaluasi` → evaluasi, invalid slug 404s. Paste the check result in the review comment.

- [ ] **Step 3: Post progress comments + move to In Review**

On PSR-65/64/66: `Done <scope>, next <scope>.` On PSR-63: summary + PR URL + 2–4 test steps (`review` comment type), status `In Review`. Grid: exactly one label, assignee `me`, milestone `[Phase 7]` — no new milestone in this move.
