# Session Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/riwayat/[id]` session-detail before/after screens on one `SessionDetail` DTO with a state flag.

**Architecture:** Single thin RSC route with `generateStaticParams` over two stub ids; static `SessionDetailPage` composition with four `Suspense` units; six server components under `features/member/components/`; pure dummy module plus cached server fetcher; source-contract Vitest tests following the repo's existing `riwayat-*.test.ts` pattern (no DOM env).

**Tech Stack:** Next.js 16.3.8 App Router (`cacheComponents`, `'use cache'` + `cacheLife`), React 19 RSC, shadcn base-nova `Badge`/`Card`/`buttonVariants`, `lucide-react` 1.x, Vitest 3.

## Global Constraints

- `app/**` (except `app/api/` and `app/providers.tsx`) are React Server Components — never add `"use client"` under `app/` or in any new detail file (detail is fully static; no client islands).
- `features/*/actions/` and `features/*/data/` are server-only: first line `import "server-only"`. Never import them from a client component.
- Import with `@/` alias only (`@/features/member/types`, `@/components/ui/badge`). Never relative imports across folders.
- shadcn is Base UI: primitives from `@base-ui/react/*` via `@/components/ui/*` only. No Radix imports.
- Flex/grid layouts only — no `absolute` in new/modified UI files.
- Badges: `Badge` only (`success` / `warning` / `destructive` / `outline` + `className` for size), never hand-rolled pills.
- Copy is Figma Indonesian verbatim minus spec §2 deletions; unified wording `Perlu Koreksi` (never `Perlu Perbaikan`); dropped strings `Terverifikasi Resmi`, `Latihan Mandiri`, `Drill Wajib` must not appear in new files.
- Images: no `<img>` in new files — placeholder divs only, each with its endpoint TODO comment where media will bind.
- Every stub TODO names its exact endpoint: `(GET /member/history/:id)` for reads, `(POST /member/remedial)` for the dead CTA.
- Atomic commits on branch `feature/psr-75-riwayat-build-session-detail-ui`: one logical change per commit, tree compiles (`tsc --noEmit` clean) after each.

---

## File Structure

New files and their single responsibility:

- `features/member/types.ts` (modify: append) — owns `SessionDecision`, `SessionPillar`, `SessionVideo`, `SessionDetail` DTOs. Reuses existing `PostureAssessment`.
- `features/member/data/session-detail-dummy.ts` (create, pure — no `server-only`) — owns `beforeSessionDetail` (postures `[]`) + `afterSessionDetail` (postures 5, Figma verbs) + `sessionDetailIds`.
- `features/member/data/get-session-detail.ts` (create, server-only) — owns cached fetch `getSessionDetail(id)` returning the dummy or `null`.
- `features/member/components/session-coach-card.tsx` (create, server) — owns coach header (placeholder avatar, name/role) + keputusan `Badge` + conditional remidiasi box.
- `features/member/components/session-kelayakan-card.tsx` (create, server) — owns kelayakan header + `IPSI CLASS B` badge + score callout + 2×2 pillar grid + syarat/catatan + retest row.
- `features/member/components/session-video-placeholder.tsx` (create, server) — owns kinematika header + 16:9 placeholder + HUD meta strip.
- `features/member/components/session-posture-list.tsx` (create, server) — owns posture `Card` shell + empty-vs-items switch + static count pill.
- `features/member/components/session-posture-item.tsx` (create, server) — owns one static posture row (`Badge` + catatan + conditional koreksi box).
- `features/member/components/session-detail-actions.tsx` (create, server) — owns bottom callout `Card` + dead `Konfirmasi` stub + live `Mulai Remedial` link.
- `features/member/pages/session-detail-page.tsx` (create, server) — owns static shell + four `Suspense` units + `notFound()` on unknown id.
- `app/(member)/riwayat/[id]/page.tsx` (create, thin RSC) — owns `generateStaticParams` + `<SessionDetailPage id={id} />`. Inherits `app/(member)/riwayat/layout.tsx` (no new layout).
- `tests/unit/member/session-detail-data.test.ts` (create) — pins dummy shape.
- `tests/unit/member/session-detail-shell.test.ts` (create, extended across Task 2→4) — source-contract UI assertions.

Task boundaries: Task 1 (data layer + data test) is independently shippable and testable. Task 2 (coach + kelayakan cards + first shell describes) renders two cards standalone. Task 3 (video + posture + actions + shell describes) completes the component set. Task 4 (page + route + route describes + full gates) wires everything and verifies end-to-end. A reviewer could reject any task without invalidating its neighbor's contract because interfaces (DTO names, component prop names) are locked below.

---

### Task 1: SessionDetail DTOs + dummy + fetcher + data test

**Files:**
- Modify: `features/member/types.ts` (append at end)
- Create: `features/member/data/session-detail-dummy.ts`
- Create: `features/member/data/get-session-detail.ts`
- Test: `tests/unit/member/session-detail-data.test.ts`

**Interfaces:**
- Consumes: existing `PostureAssessment` from `@/features/member/types` (fields `id`, `name`, `status`, `statusLabel`, `reading`, `detail`, `correctionCue`, `thumbnailLabel`, `thumbnailSrc`).
- Produces: `SessionDetail`, `SessionDecision`, `SessionPillar`, `SessionVideo` types; `beforeSessionDetail`, `afterSessionDetail`, `sessionDetailIds` values; `getSessionDetail(id: string): Promise<SessionDetail | null>`. Tasks 2–4 import exactly these names.

- [ ] **Step 1: Append DTOs to types.ts**

Append this block at the end of `features/member/types.ts` (after `MemberHistory`):

```ts
export type SessionDecision = "menunggu" | "remidiasi";

export interface SessionPillar {
  id: "kuda-kuda" | "tangkisan" | "pukulan" | "tendangan";
  name: string;
  detail: string;
  scorePct: number;
  stageLabel: "Lolos" | "Fokus" | "Remidi";
  badge: "success" | "destructive" | "warning";
}

export interface SessionVideo {
  status: "placeholder";
  cameraLabel: string;
  qualityLabel: string;
}

export interface SessionDetail {
  id: string;
  techniqueName: string;
  techniqueDesc: string;
  coach: { initials: string; name: string; role: string };
  decision: SessionDecision;
  decisionLabel: string;
  decidedAtLabel?: string;
  focusTechnique?: string;
  scorePct: number;
  targetPct: number;
  pillars: SessionPillar[];
  video: SessionVideo;
  postures: PostureAssessment[];
  retestLabel: string;
  retestValue: string;
}
```

- [ ] **Step 2: Write the failing data test**

Create `tests/unit/member/session-detail-data.test.ts` with this exact content:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  afterSessionDetail,
  beforeSessionDetail,
  sessionDetailIds,
} from "@/features/member/data/session-detail-dummy";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("session-detail dummy", () => {
  it("exposes two stub ids for before/after states", () => {
    // Arrange + Act
    const ids = [...sessionDetailIds];

    // Assert
    expect(ids).toEqual(["pukulan-menunggu", "pukulan-remidiasi"]);
    expect(beforeSessionDetail.id).toBe("pukulan-menunggu");
    expect(afterSessionDetail.id).toBe("pukulan-remidiasi");
  });

  it("shares coach, technique, score, pillars, video, and retest verbatim", () => {
    // Arrange + Act
    const pair = [beforeSessionDetail, afterSessionDetail];

    // Assert
    for (const session of pair) {
      expect(session.techniqueName).toBe("Pukulan Lurus Depan (Tusuk/Lurus)");
      expect(session.techniqueDesc).toBe("Jurusan Serang Lurus Lintasan Ulu Hati");
      expect(session.coach.name).toBe("Kang Fauzan Azhiim, S.Pd.");
      expect(session.coach.role).toBe("Pelatih Kepala UKM Pencak Silat UNSIL");
      expect(session.decisionLabel).toBe("Menunggu");
      expect(session.scorePct).toBe(80);
      expect(session.targetPct).toBe(85);
      expect(session.pillars.map((pillar) => pillar.scorePct)).toEqual([91, 86, 80, 76]);
      expect(session.pillars.map((pillar) => pillar.stageLabel)).toEqual([
        "Lolos",
        "Lolos",
        "Fokus",
        "Remidi",
      ]);
      expect(session.pillars.map((pillar) => pillar.badge)).toEqual([
        "success",
        "success",
        "destructive",
        "warning",
      ]);
      expect(session.video.status).toBe("placeholder");
      expect(session.video.cameraLabel).toBe("Kamera 01: Multi-Axis Front (Rep 11/15)");
      expect(session.video.qualityLabel).toBe("30 FPS • 1080p");
      expect(session.retestValue).toBe("Jumat, 2 Okt 2026 • Dojo UNSIL");
    }
  });

  it("renders empty postures before and five assessed postures after", () => {
    // Arrange + Act
    const { postures: beforePostures } = beforeSessionDetail;
    const { postures: afterPostures } = afterSessionDetail;

    // Assert
    expect(beforeSessionDetail.decision).toBe("menunggu");
    expect(beforePostures).toHaveLength(0);
    expect(beforeSessionDetail.decidedAtLabel).toBeUndefined();
    expect(afterSessionDetail.decision).toBe("remidiasi");
    expect(afterSessionDetail.decidedAtLabel).toBe("28 Sep 2026, 17:30");
    expect(afterSessionDetail.focusTechnique).toBe("Pukulan Lurus Depan");
    expect(afterPostures).toHaveLength(5);
    expect(afterPostures.map((posture) => posture.id)).toEqual([
      "bahu",
      "siku-kanan",
      "pinggul",
      "lutut",
      "pergelangan",
    ]);
    expect(afterPostures.filter((posture) => posture.status === "sesuai")).toHaveLength(3);
    const critical = afterPostures.find((posture) => posture.id === "siku-kanan");
    expect(critical?.correctionCue).toContain("koronal rusuk");
    for (const posture of afterPostures) {
      expect(posture.thumbnailSrc).toBeNull();
    }
  });

  it("routes ids through the cached fetcher with null fallback", () => {
    // Arrange + Act (no DOM/Next runtime in repo — fetcher covered via source contract)
    const src = read("features/member/data/get-session-detail.ts");

    // Assert
    expect(src).toContain('import "server-only"');
    expect(src).toContain('"use cache"');
    expect(src).toContain("cacheLife");
    expect(src).toContain("afterSessionDetail.id");
    expect(src).toContain("beforeSessionDetail.id");
    expect(src).toContain("return null");
    expect(src).toContain("GET /member/history/:id");
    expect(src).toContain("TODO");
  });

  it("carries no dropped copy and no backend-bound keys", () => {
    // Arrange + Act
    const raw = JSON.stringify([beforeSessionDetail, afterSessionDetail]);

    // Assert
    expect(raw).not.toContain("Terverifikasi Resmi");
    expect(raw).not.toContain("Latihan Mandiri");
    expect(raw).not.toContain("Drill Wajib");
    expect(raw).not.toContain("Perlu Perbaikan");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test tests/unit/member/session-detail-data.test.ts`

Expected: FAIL with "Failed to resolve import @/features/member/data/session-detail-dummy" (neither module exists yet).

- [ ] **Step 4: Write minimal dummy + fetcher to make the test pass**

Create `features/member/data/session-detail-dummy.ts` with this exact content:

```ts
import type { SessionDetail } from "@/features/member/types";

const sharedPillars: SessionDetail["pillars"] = [
  { id: "kuda-kuda", name: "Kuda-kuda", detail: "Tengah", scorePct: 91, stageLabel: "Lolos", badge: "success" },
  { id: "tangkisan", name: "Tangkisan", detail: "Atas", scorePct: 86, stageLabel: "Lolos", badge: "success" },
  { id: "pukulan", name: "Pukulan", detail: "Lurus Depan", scorePct: 80, stageLabel: "Fokus", badge: "destructive" },
  { id: "tendangan", name: "Tendangan", detail: "Lurus", scorePct: 76, stageLabel: "Remidi", badge: "warning" },
];

function baseSession(): Omit<SessionDetail, "id" | "decision" | "postures" | "decidedAtLabel" | "focusTechnique"> {
  return {
    techniqueName: "Pukulan Lurus Depan (Tusuk/Lurus)",
    techniqueDesc: "Jurusan Serang Lurus Lintasan Ulu Hati",
    coach: {
      initials: "KF",
      name: "Kang Fauzan Azhiim, S.Pd.",
      role: "Pelatih Kepala UKM Pencak Silat UNSIL",
    },
    decisionLabel: "Menunggu",
    scorePct: 80,
    targetPct: 85,
    pillars: sharedPillars.map((pillar) => ({ ...pillar })),
    video: {
      status: "placeholder",
      cameraLabel: "Kamera 01: Multi-Axis Front (Rep 11/15)",
      qualityLabel: "30 FPS • 1080p",
    },
    retestLabel: "Jadwal Uji Ulang:",
    retestValue: "Jumat, 2 Okt 2026 • Dojo UNSIL",
  };
}

export const beforeSessionDetail: SessionDetail = {
  ...baseSession(),
  id: "pukulan-menunggu",
  decision: "menunggu",
  postures: [],
};

export const afterSessionDetail: SessionDetail = {
  ...baseSession(),
  id: "pukulan-remidiasi",
  decision: "remidiasi",
  decidedAtLabel: "28 Sep 2026, 17:30",
  focusTechnique: "Pukulan Lurus Depan",
  postures: [
    {
      id: "bahu",
      name: "Bahu",
      status: "sesuai",
      statusLabel: "Sesuai",
      reading: "Sejajar (target netral)",
      detail: "Bahu sudah bagus, sejajar dan rileks. Tenaga linear tersalur lancar tanpa tegang di leher.",
      correctionCue: "",
      thumbnailLabel: "Bahu",
      thumbnailSrc: null,
    },
    {
      id: "siku-kanan",
      name: "Siku Kanan",
      status: "perlu-koreksi",
      statusLabel: "Perlu Koreksi",
      reading: "142° → target 130–138°",
      detail: "Siku masih terbuka (flaring out 142°, melebar +8 cm). Tenaga pukulan buyar ke samping dan rawan diserang balik.",
      correctionCue: "Siku wajib menempel bidang koronal rusuk hingga 80% lintasan pukulan.",
      thumbnailLabel: "Siku kanan",
      thumbnailSrc: null,
    },
    {
      id: "pinggul",
      name: "Pinggul",
      status: "sesuai",
      statusLabel: "Sesuai",
      reading: "Terkunci (target simetris)",
      detail: "Rotasi panggul mengunci pas saat impak, pertahankan kuncian torsi ini.",
      correctionCue: "",
      thumbnailLabel: "Pinggul",
      thumbnailSrc: null,
    },
    {
      id: "lutut",
      name: "Lutut",
      status: "sesuai",
      statusLabel: "Sesuai",
      reading: "135° (target 130–138°)",
      detail: "Kuda-kuda tumpuan seimbang 50:50, fleksi lutut kokoh.",
      correctionCue: "",
      thumbnailLabel: "Lutut",
      thumbnailSrc: null,
    },
    {
      id: "pergelangan",
      name: "Pergelangan",
      status: "perlu-koreksi",
      statusLabel: "Perlu Koreksi",
      reading: "+0,15 dtk → target ≤ 0,05 dtk",
      detail: "Rotasi pronasi kepalan terlambat 0.15 detik. Titik impak harus tepat di ulu hati dengan jemari terkunci rapat.",
      correctionCue: "Kunci kepalan 0,1 dtk lebih awal.",
      thumbnailLabel: "Pergelangan",
      thumbnailSrc: null,
    },
  ],
};

export const sessionDetailIds: readonly string[] = [
  beforeSessionDetail.id,
  afterSessionDetail.id,
];
```

Create `features/member/data/get-session-detail.ts` with this exact content:

```ts
import "server-only";

import { cacheLife } from "next/cache";

import {
  afterSessionDetail,
  beforeSessionDetail,
  sessionDetailIds,
} from "@/features/member/data/session-detail-dummy";
import type { SessionDetail } from "@/features/member/types";

export { sessionDetailIds };

export async function getSessionDetail(
  id: string,
): Promise<SessionDetail | null> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /member/history/:id) — dummy for now
  if (id === afterSessionDetail.id) return afterSessionDetail;
  if (id === beforeSessionDetail.id) return beforeSessionDetail;
  return null;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test tests/unit/member/session-detail-data.test.ts`

Expected: PASS, 5 passed.

- [ ] **Step 6: Typecheck + commit**

Run: `pnpm typecheck`

Expected: clean, no errors.

```bash
git add features/member/types.ts features/member/data/session-detail-dummy.ts features/member/data/get-session-detail.ts tests/unit/member/session-detail-data.test.ts
git commit -m "feat(member): add session detail DTOs and dummy fetcher"
```

---

### Task 2: Coach card + kelayakan card + shell test foundation

**Files:**
- Create: `features/member/components/session-coach-card.tsx`
- Create: `features/member/components/session-kelayakan-card.tsx`
- Test: `tests/unit/member/session-detail-shell.test.ts` (create with coach + kelayakan describes)

**Interfaces:**
- Consumes: `SessionDetail` type from Task 1; `Badge`, `Card*` from `@/components/ui/*`; icons `BadgeCheck`, `CalendarDays`, `ClipboardCheck`, `TriangleAlert` from `lucide-react`.
- Produces: `SessionCoachCard({ session })`, `SessionKelayakanCard({ session })` server components taking the full `SessionDetail` prop. Task 4 composes them; shell test asserts their source contract.

- [ ] **Step 1: Write the failing shell test (coach + kelayakan)**

Create `tests/unit/member/session-detail-shell.test.ts` with this exact content:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("session coach card", () => {
  it("uses Badge Menunggu without Terverifikasi pill and without images", () => {
    // Arrange + Act
    const src = read("features/member/components/session-coach-card.tsx");

    // Assert
    expect(src).toContain("@/components/ui/badge");
    expect(src).toContain('variant="warning"');
    expect(src).toContain("Menunggu");
    expect(src).toContain("KEPUTUSAN SIDANG PELATIH");
    expect(src).toContain("TAHAP REMIDIASI TEKNIS");
    expect(src).toContain("coach.initials");
    expect(src).not.toContain("Terverifikasi Resmi");
    expect(src).not.toContain("<img");
  });

  it("keeps the coach card flex-only", () => {
    // Arrange + Act + Assert
    expect(read("features/member/components/session-coach-card.tsx")).not.toContain("absolute");
  });
});

describe("session kelayakan card", () => {
  it("badges IPSI CLASS B outline plus Lolos/Fokus/Remidi pillar stages", () => {
    // Arrange + Act
    const src = read("features/member/components/session-kelayakan-card.tsx");

    // Assert
    expect(src).toContain("@/components/ui/badge");
    expect(src).toContain("IPSI CLASS B");
    expect(src).toContain('variant="outline"');
    expect(src).toContain("stageLabel");
    expect(src).toContain("80%");
    expect(src).toContain("85%");
    expect(src).toContain("Jadwal Uji Ulang:");
    expect(src).toContain("Syarat Kelulusan:");
    expect(src).toContain("Catatan Penguji:");
    expect(src).not.toContain("Latihan Mandiri");
    expect(src).not.toContain("Perlu Perbaikan");
  });

  it("keeps the kelayakan card flex-only", () => {
    // Arrange + Act + Assert
    expect(read("features/member/components/session-kelayakan-card.tsx")).not.toContain("absolute");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/member/session-detail-shell.test.ts`

Expected: FAIL with "ENOENT: no such file or directory, open ... session-coach-card.tsx".

- [ ] **Step 3: Write minimal coach card implementation**

Create `features/member/components/session-coach-card.tsx` with this exact content:

```tsx
import { BadgeCheck, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { SessionDetail } from "@/features/member/types";

export function SessionCoachCard({ session }: { session: SessionDetail }) {
  const isRemidiasi = session.decision === "remidiasi";

  return (
    <section aria-label="Pelatih penilai" className="flex flex-col gap-2">
      <Card>
        <CardHeader className="flex flex-row items-start gap-3">
          {/* TODO: replace with real coach photo when backend binds media (GET /member/history/:id) */}
          <span
            aria-hidden="true"
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-secondary text-lg font-bold text-foreground"
          >
            {session.coach.initials}
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-sm font-bold text-foreground">
              {session.coach.name}
            </span>
            <span className="text-[11px] leading-snug text-muted-foreground">
              {session.coach.role}
            </span>
          </span>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 rounded-xl bg-warning/10 px-3 py-2">
            <p className="text-[10px] font-bold tracking-widest text-warning-foreground uppercase">
              Keputusan sidang pelatih
            </p>
            <Badge variant="warning">Menunggu</Badge>
          </div>
          {isRemidiasi ? (
            <div className="flex flex-col gap-1.5 rounded-xl border p-3">
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <CalendarDays aria-hidden="true" className="size-3.5 shrink-0" />
                {session.decidedAtLabel}
              </p>
              <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase">
                <BadgeCheck aria-hidden="true" className="size-4 shrink-0 text-warning-foreground" />
                Tahap remidiasi teknis
              </p>
              <p className="text-[11px] text-muted-foreground">
                Fokus: <span className="font-bold text-foreground">{session.focusTechnique}</span>
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
```

- [ ] **Step 4: Write minimal kelayakan card implementation**

Create `features/member/components/session-kelayakan-card.tsx` with this exact content:

```tsx
import { CalendarDays, ClipboardCheck, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SessionDetail } from "@/features/member/types";

const pillarBadgeVariant = {
  success: "success",
  destructive: "destructive",
  warning: "warning",
} as const;

export function SessionKelayakanCard({ session }: { session: SessionDetail }) {
  return (
    <section aria-label="Status kelayakan tanding" className="flex flex-col gap-2">
      <Card>
        <CardHeader>
          <CardTitle>Status Kelayakan Tanding</CardTitle>
          <CardDescription>Standar Kualifikasi UKM Silat UNSIL</CardDescription>
          <CardAction>
            <Badge variant="outline">IPSI CLASS B</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-start gap-2 rounded-xl border-l-4 border-warning bg-warning/10 p-2.5">
            <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning-foreground" />
            <p className="text-[11px] leading-relaxed text-foreground">
              <span className="font-bold">Perlu remidiasi sebelum uji tanding. </span>
              Skor akumulatif biomekanika saat ini{" "}
              <span className="font-bold">{session.scorePct}%</span>. Batas minimum
              lolos adalah <span className="font-bold">{session.targetPct}%</span>.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {session.pillars.map((pillar) => (
              <div
                key={pillar.id}
                className="flex flex-col gap-1 rounded-xl border p-2.5"
              >
                <p className="flex items-center justify-between gap-1.5">
                  <span className="text-[11px] font-semibold text-foreground">
                    {pillar.name}
                  </span>
                  <Badge variant={pillarBadgeVariant[pillar.badge]}>
                    {pillar.stageLabel}
                  </Badge>
                </p>
                <p className="flex items-baseline justify-between gap-1.5">
                  <span className="text-[10px] text-muted-foreground">{pillar.detail}</span>
                  <span className="text-base font-bold">{pillar.scorePct}%</span>
                </p>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-1.5 border-t pt-2.5">
            <p className="flex items-start gap-1.5 text-[11px] leading-relaxed">
              <ClipboardCheck aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
              <span>
                <span className="font-bold">Syarat Kelulusan:</span>{" "}
                <span className="text-muted-foreground">
                  Minimal seluruh 4 pilar dasar mencapai skor ≥ 85% serta
                  verifikasi langsung pelatih di dojo.
                </span>
              </span>
            </p>
            <p className="flex items-start gap-1.5 text-[11px] leading-relaxed">
              <ClipboardCheck aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
              <span>
                <span className="font-bold">Catatan Penguji:</span>{" "}
                <span className="text-muted-foreground">
                  Wajib selesaikan paket drill mandiri sebelum mendaftar sesi
                  tatap muka.
                </span>
              </span>
            </p>
          </div>
          <p className="flex items-center justify-between gap-2 rounded-xl bg-secondary/50 px-3 py-2">
            <span className="text-[11px] text-muted-foreground">{session.retestLabel}</span>
            <span className="flex items-center gap-1.5 text-xs font-semibold">
              <CalendarDays aria-hidden="true" className="size-3.5 shrink-0" />
              {session.retestValue}
            </span>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test tests/unit/member/session-detail-shell.test.ts`

Expected: PASS, 4 passed.

- [ ] **Step 6: Typecheck + commit**

Run: `pnpm typecheck`

Expected: clean, no errors.

```bash
git add features/member/components/session-coach-card.tsx features/member/components/session-kelayakan-card.tsx tests/unit/member/session-detail-shell.test.ts
git commit -m "feat(member): add session coach and kelayakan cards"
```

---

### Task 3: Video placeholder + posture list/item + actions

**Files:**
- Create: `features/member/components/session-video-placeholder.tsx`
- Create: `features/member/components/session-posture-item.tsx`
- Create: `features/member/components/session-posture-list.tsx`
- Create: `features/member/components/session-detail-actions.tsx`
- Test: `tests/unit/member/session-detail-shell.test.ts` (append video + posture + actions describes)

**Interfaces:**
- Consumes: `SessionDetail`, `PostureAssessment` types; `SessionCoachCard`/`SessionKelayakanCard` file conventions (server, `Card` shells, `Badge` only); `buttonVariants` + `Link` pattern from `RiwayatCardActions`/`EvaluasiActions`.
- Produces: `SessionVideoPlaceholder({ session })`, `SessionPostureItem({ posture })`, `SessionPostureList({ session })`, `SessionDetailActions()` server components. Task 4 composes all six.

- [ ] **Step 1: Append failing describes to the shell test**

Append this block at the end of `tests/unit/member/session-detail-shell.test.ts`:

```ts
describe("session video placeholder", () => {
  it("renders HUD copy with a placeholder and no images", () => {
    // Arrange + Act
    const src = read("features/member/components/session-video-placeholder.tsx");

    // Assert
    expect(src).toContain("OBJEK TINJAUAN KINEMATIKA");
    expect(src).toContain("techniqueName");
    expect(src).toContain("cameraLabel");
    expect(src).toContain("qualityLabel");
    expect(src).toContain("TODO");
    expect(src).not.toContain("<img");
    expect(src).not.toContain("absolute");
  });
});

describe("session posture list", () => {
  it("switches empty state versus five items with unified wording", () => {
    // Arrange + Act
    const list = read("features/member/components/session-posture-list.tsx");
    const item = read("features/member/components/session-posture-item.tsx");

    // Assert
    expect(list).toContain("Catatan Pelatih");
    expect(list).toContain("3 Sesuai • 2 Koreksi");
    expect(list).toContain("Belum ada catatan dari pelatih");
    expect(list).toContain("postures.length === 0");
    expect(item).toContain("@/components/ui/badge");
    expect(item).toContain("Perlu Koreksi");
    expect(item).toContain("Catatan:");
    expect(item).toContain("Koreksi:");
    expect(item).toContain("correctionCue");
    expect(list).not.toContain("absolute");
    expect(item).not.toContain("absolute");
    expect(item).not.toContain("<img");
    expect(item + list).not.toContain("Perlu Perbaikan");
  });
});

describe("session detail actions", () => {
  it("keeps Konfirmasi dead with endpoint TODO and links remedial to rekam", () => {
    // Arrange + Act
    const src = read("features/member/components/session-detail-actions.tsx");

    // Assert
    expect(src).toContain("Siap Melakukan Remediasi?");
    expect(src).toContain("Konfirmasi Telah Membaca");
    expect(src).toContain("Mulai Remedial Pukulan Sekarang");
    expect(src).toContain("/latihan/pukulan/rekam");
    expect(src).toContain("POST /member/remedial");
    expect(src).toContain("TODO");
    expect(src).not.toContain("absolute");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/member/session-detail-shell.test.ts`

Expected: FAIL with "ENOENT ... session-video-placeholder.tsx".

- [ ] **Step 3: Write video placeholder implementation**

Create `features/member/components/session-video-placeholder.tsx` with this exact content:

```tsx
import { Crosshair, Video } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { SessionDetail } from "@/features/member/types";

export function SessionVideoPlaceholder({ session }: { session: SessionDetail }) {
  return (
    <section aria-label="Objek tinjauan kinematika" className="flex flex-col gap-2">
      <Card>
        <CardHeader className="flex flex-col gap-0.5">
          <p className="text-[10px] font-bold tracking-widest text-destructive uppercase">
            Objek tinjauan kinematika
          </p>
          <p className="text-base font-bold text-foreground">{session.techniqueName}</p>
          <p className="text-[11px] text-muted-foreground">{session.techniqueDesc}</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {/* TODO: bind real telemetry frame when backend serves media (GET /member/history/:id) — placeholder shell only */}
          <div className="flex aspect-video w-full flex-col justify-between gap-2 overflow-hidden rounded-2xl bg-foreground p-2.5">
            <p className="flex items-center gap-1.5 text-[10px] text-background/80">
              <Video aria-hidden="true" className="size-3.5 shrink-0" />
              {session.video.cameraLabel}
            </p>
            <p className="flex items-center justify-center">
              <span className="flex size-16 items-center justify-center rounded-full border border-dashed border-destructive/70">
                <Crosshair aria-hidden="true" className="size-5 text-destructive" />
              </span>
            </p>
            <p className="flex items-center justify-end">
              <span className="rounded-md bg-background/20 px-1.5 py-0.5 text-[9px] text-background/80">
                {session.video.qualityLabel}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
```

- [ ] **Step 4: Write posture item + list implementations**

Create `features/member/components/session-posture-item.tsx` with this exact content:

```tsx
import { BadgeAlert, BadgeCheck, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PostureAssessment } from "@/features/member/types";

export function SessionPostureItem({ posture }: { posture: PostureAssessment }) {
  const needsFix = posture.status === "perlu-koreksi";
  const critical = posture.id === "siku-kanan" && needsFix;
  const Icon = needsFix ? BadgeAlert : BadgeCheck;

  return (
    <div
      className={`flex flex-col gap-1.5 rounded-xl border p-3 ${
        critical
          ? "border-l-4 border-destructive border-l-destructive bg-destructive/5"
          : needsFix
            ? "border-warning-border bg-warning/10"
            : "border-success-border bg-success/10"
      }`}
    >
      <p className="flex items-center gap-2">
        <span
          className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
            needsFix ? "bg-warning-foreground text-white" : "bg-success-foreground text-white"
          }`}
        >
          <Icon aria-hidden="true" className="size-4" />
        </span>
        <span className="min-w-0 flex-1 text-xs font-bold text-foreground">
          {posture.name}
        </span>
        <Badge variant={critical ? "destructive" : needsFix ? "warning" : "success"}>
          {posture.statusLabel}
        </Badge>
      </p>
      <p className="text-[11px] leading-relaxed text-foreground">
        <span className="font-bold">Catatan: </span>
        <span className="text-muted-foreground">{posture.detail}</span>
      </p>
      {needsFix && posture.correctionCue ? (
        <p className="flex items-start gap-1.5 rounded-xl border border-warning-border bg-warning/10 p-2 text-[11px] font-semibold">
          <Lightbulb aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span>
            <span className="font-bold">Koreksi: </span>
            {posture.correctionCue}
          </span>
        </p>
      ) : null}
    </div>
  );
}
```

Create `features/member/components/session-posture-list.tsx` with this exact content:

```tsx
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SessionPostureItem } from "@/features/member/components/session-posture-item";
import type { SessionDetail } from "@/features/member/types";

export function SessionPostureList({ session }: { session: SessionDetail }) {
  const empty = session.postures.length === 0;

  return (
    <section aria-label="Catatan pelatih" className="flex flex-col gap-2">
      <Card>
        <CardHeader>
          <CardTitle>Catatan Pelatih</CardTitle>
          <CardDescription>Evaluasi biomekanika kinetik oleh pelatih</CardDescription>
          <CardAction>
            <Badge variant="secondary">3 Sesuai • 2 Koreksi</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {empty ? (
            <p className="rounded-xl border bg-secondary/30 p-3 text-xs font-semibold text-foreground">
              Belum ada catatan dari pelatih
            </p>
          ) : (
            session.postures.map((posture) => (
              <SessionPostureItem key={posture.id} posture={posture} />
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}
```

- [ ] **Step 5: Write actions implementation**

Create `features/member/components/session-detail-actions.tsx` with this exact content:

```tsx
import Link from "next/link";
import { ArrowRight, CheckCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SessionDetailActions() {
  return (
    <section aria-label="Tindak lanjut remediasi" className="flex flex-col gap-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold">Siap Melakukan Remediasi?</CardTitle>
          <CardDescription>
            Konfirmasi telah membaca arahan, lalu mulai remedial pukulan.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex-col items-stretch gap-2">
          {/* TODO: connect backend via lib/api-client.ts (POST /member/remedial) — dead CTA for now */}
          <span
            aria-disabled="true"
            className={buttonVariants({ variant: "outline", size: "lg", className: "w-full rounded-full" })}
          >
            <CheckCheck data-icon="inline-start" /> Konfirmasi Telah Membaca
          </span>
          <Link
            href="/latihan/pukulan/rekam"
            className={buttonVariants({ size: "lg", className: "w-full rounded-full" })}
          >
            Mulai Remedial Pukulan Sekarang <ArrowRight data-icon="inline-end" />
          </Link>
        </CardFooter>
      </Card>
    </section>
  );
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm test tests/unit/member/session-detail-shell.test.ts`

Expected: PASS, 7 passed.

- [ ] **Step 7: Typecheck + commit**

Run: `pnpm typecheck`

Expected: clean, no errors.

```bash
git add features/member/components/session-video-placeholder.tsx features/member/components/session-posture-item.tsx features/member/components/session-posture-list.tsx features/member/components/session-detail-actions.tsx tests/unit/member/session-detail-shell.test.ts
git commit -m "feat(member): add session video posture and actions cards"
```

---

### Task 4: Page composition + [id] route + full gates

**Files:**
- Create: `features/member/pages/session-detail-page.tsx`
- Create: `app/(member)/riwayat/[id]/page.tsx`
- Test: `tests/unit/member/session-detail-shell.test.ts` (append route describe)

**Interfaces:**
- Consumes: `getSessionDetail`, `sessionDetailIds` (Task 1); all six components (Tasks 2–3) with `{ session }` props (`SessionDetailActions` takes no props).
- Produces: `SessionDetailPage({ id: string })` composition; `generateStaticParams()` route. Browser check `scrollWidth <= innerWidth` at 390px + desktop on both stub ids.

- [ ] **Step 1: Append failing route describe to the shell test**

Append this block at the end of `tests/unit/member/session-detail-shell.test.ts`:

```ts
describe("session detail route and page", () => {
  it("keeps the [id] route thin with static params and inherited nav", () => {
    // Arrange + Act
    const route = read("app/(member)/riwayat/[id]/page.tsx");
    const layout = read("app/(member)/riwayat/layout.tsx");
    const page = read("features/member/pages/session-detail-page.tsx");

    // Assert
    expect(route).not.toContain('"use client"');
    expect(route).toContain("generateStaticParams");
    expect(route).toContain("sessionDetailIds");
    expect(route).toContain("<SessionDetailPage");
    expect(layout).toContain('activeTab="riwayat"');
    expect(page).not.toContain('"use client"');
    expect(page).toContain("Suspense");
    expect(page).toContain("notFound");
    expect(page).toContain("SessionCoachCard");
    expect(page).toContain("SessionKelayakanCard");
    expect(page).toContain("SessionVideoPlaceholder");
    expect(page).toContain("SessionPostureList");
    expect(page).toContain("SessionDetailActions");
    expect(page).not.toContain("absolute");
    expect(page).not.toContain("Terverifikasi Resmi");
    expect(page).not.toContain("Latihan Mandiri");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/member/session-detail-shell.test.ts`

Expected: FAIL with "ENOENT ... app/(member)/riwayat/[id]/page.tsx".

- [ ] **Step 3: Write page composition implementation**

Create `features/member/pages/session-detail-page.tsx` with this exact content:

```tsx
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionDetail } from "@/features/member/data/get-session-detail";
import { SessionCoachCard } from "@/features/member/components/session-coach-card";
import { SessionKelayakanCard } from "@/features/member/components/session-kelayakan-card";
import { SessionVideoPlaceholder } from "@/features/member/components/session-video-placeholder";
import { SessionPostureList } from "@/features/member/components/session-posture-list";
import { SessionDetailActions } from "@/features/member/components/session-detail-actions";

export function SessionDetailPage({ id }: { id: string }) {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1.5 pt-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Evaluasi &amp; Arahan Pelatih
        </h1>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Ulasan berkala, catatan teknis, dan verifikasi kelayakan jurus dari
          tim pelatih UKM Pencak Silat UNSIL berbasis data telemetri AI.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-44 w-full rounded-2xl" />}>
        <CoachSection id={id} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <KelayakanSection id={id} />
      </Suspense>
      <Suspense fallback={<Skeleton className="aspect-video w-full rounded-2xl" />}>
        <VisualSection id={id} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <PostureSection id={id} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-24 w-full rounded-full" />}>
        <ActionsSection />
      </Suspense>
    </div>
  );
}

async function CoachSection({ id }: { id: string }) {
  const session = await getSessionDetail(id);
  if (!session) notFound();
  return <SessionCoachCard session={session} />;
}

async function KelayakanSection({ id }: { id: string }) {
  const session = await getSessionDetail(id);
  if (!session) notFound();
  return <SessionKelayakanCard session={session} />;
}

async function VisualSection({ id }: { id: string }) {
  const session = await getSessionDetail(id);
  if (!session) notFound();
  return <SessionVideoPlaceholder session={session} />;
}

async function PostureSection({ id }: { id: string }) {
  const session = await getSessionDetail(id);
  if (!session) notFound();
  return <SessionPostureList session={session} />;
}

function ActionsSection() {
  return <SessionDetailActions />;
}
```

- [ ] **Step 4: Write thin [id] route implementation**

Create `app/(member)/riwayat/[id]/page.tsx` with this exact content:

```tsx
import { sessionDetailIds } from "@/features/member/data/get-session-detail";
import { SessionDetailPage } from "@/features/member/pages/session-detail-page";

export function generateStaticParams() {
  return sessionDetailIds.map((id) => ({ id }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SessionDetailPage id={id} />;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test tests/unit/member/session-detail-shell.test.ts tests/unit/member/session-detail-data.test.ts`

Expected: PASS, 13 passed (5 data + 8 shell).

- [ ] **Step 6: Run full gates**

Run in order, each must be zero-error before continuing:

```bash
pnpm typecheck
```

Expected: clean.

```bash
pnpm lint
```

Expected: no warnings or errors.

```bash
pnpm test
```

Expected: all suites pass (no new failures; note pre-existing unrelated failures if any must be reported, not hidden).

```bash
pnpm build
```

Expected: build succeeds, both `/riwayat/pukulan-menunggu` and `/riwayat/pukulan-remidiasi` prerender as static paths.

- [ ] **Step 7: Browser overflow check (Playwright, per CODE_STANDARD §6)**

Follow `AGENTS.md` dev-server protocol (fresh port, WMI-detached start, ≤3 readiness re-checks, Playwright tab-new first, kill tree + delete artifacts after). On `/riwayat/pukulan-menunggu` and `/riwayat/pukulan-remidiasi` at 390px + desktop, run in page context:

```js
document.documentElement.scrollWidth <= window.innerWidth
```

Expected: `true` on both ids at both widths. Paste the four results into the review comment. Screenshot only if a check fails.

- [ ] **Step 8: Commit**

```bash
git add features/member/pages/session-detail-page.tsx "app/(member)/riwayat/[id]/page.tsx" tests/unit/member/session-detail-shell.test.ts
git commit -m "feat(member): wire session detail route and page"
```

---

## Linear Handoff (implementation session, not this plan)

- Reuse PSR-75 (`[riwayat] Build session detail UI`) for Tasks 1–4; post a `decision` comment on PSR-79 shrinking its scope (Section 5 drills dropped per 2026-10-11 delta) and keep it for close-out.
- Progress comments per completed move (`Done X, next Y.`); `In Review` carries PR URL + 2–4 test steps with the four `scrollWidth` results.
- Advisory: `node scripts/linear-roadmap-audit.mjs issues.json` before review; fix by hand, never blocks `In Review`.
