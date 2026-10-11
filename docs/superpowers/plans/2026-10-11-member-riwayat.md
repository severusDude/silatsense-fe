# Member Riwayat List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the `/riwayat` list screen (header + 4 stat cards + 4 independently-collapsible gerakan cards) on dummy data per `docs/superpowers/specs/2026-10-11-member-riwayat-design.md`.

**Architecture:** Mirror the evaluasi move (PSR-63): pure dummy module + cached server fetcher, server-rendered list with exactly one `"use client"` island type per card (children-composition so the expanded body stays server-rendered), thin RSC route + leaf layout owning nav state.

**Tech Stack:** Next.js 16.3.8 App Router (Cache Components), React 19, shadcn base-nova (`Badge`, `buttonVariants`, `Card*`, `Collapsible` on `@base-ui/react`), `lucide-react` 1.x, Vitest 3 source-assertion shell tests (no DOM test env in this repo — interaction coverage = source assertions).

## Global Constraints

- `next.config.ts` has `cacheComponents: true`; every `'use cache'` pairs with `cacheLife('minutes')`.
- `features/member/data/*` and `features/member/pages/*` are server-only (`import "server-only"` first line); never import them from client components.
- `features/member/data/riwayat-dummy.ts` is pure (no `server-only`) so Vitest can import it.
- Import with `@/` alias only, never relative across folders.
- Status pills use `Badge` only: `success` → `Sesuai`, `warning` → `Perlu Koreksi` (title-case, status word only).
- No `absolute` positioning in any new/modified UI file; flex/grid only.
- Copy is Figma Indonesian verbatim minus the spec §2 deletions (no numbering, no `PILAR 0N`, no param-header, no telemetry row).
- Gates per task: `pnpm typecheck` (`tsc --noEmit`) + `pnpm lint` + `pnpm test` green; full `pnpm build` + browser `scrollWidth <= innerWidth` check in Task 5.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `features/member/types.ts` | modify (append) | `RiwayatSlug`, `HistoryStatus`, `RiwayatParam`, `HistoryEntry`, `HistorySummary`, `MemberHistory` (verbatim spec §4) |
| `features/member/data/riwayat-dummy.ts` | create (pure) | `dummyMemberHistory` — 4 Figma rows + summary |
| `features/member/data/get-riwayat.ts` | create (server-only) | `getRiwayat()` cached fetcher, `TODO (GET /member/history)` |
| `features/member/components/riwayat-stat-grid.tsx` | create (server) | 4 stat cards from `HistorySummary` |
| `features/member/components/riwayat-param-chips.tsx` | create (server) | 5-chip grid from `RiwayatParam[]` |
| `features/member/components/riwayat-coach-note.tsx` | create (server) | `Catatan Pelatih:` verdict banner, no telemetry |
| `features/member/components/riwayat-card-actions.tsx` | create (server) | `Latihan Ulang` live Link + dead `Detail Evaluasi` + TODO |
| `features/member/components/riwayat-movement-list.tsx` | create (server) | section heading + maps entries into islands with server-rendered bodies |
| `features/member/components/riwayat-movement-item.tsx` | create (client island) | `Collapsible` root + trigger row, `children` = expanded body, default closed |
| `features/member/pages/riwayat-page.tsx` | create (server) | static shell: inline header + 2 `<Suspense>` units |
| `app/(member)/riwayat/page.tsx` | create (thin RSC) | renders `<RiwayatPage />`, no logic |
| `app/(member)/riwayat/layout.tsx` | create (thin RSC) | `MemberLayout activeTab="riwayat"` + trail |
| `features/member/components/member-bottom-nav.tsx` | modify | `MemberTab += "riwayat"`, Riwayat becomes a real tab (resolves its TODO) |
| `tests/unit/member/riwayat-data.test.ts` | create | pins dummy shape + Figma literals + negative keys |
| `tests/unit/member/riwayat-shell.test.ts` | create (grows T2→T4) | source assertions: badges, deltas, island, route/nav |

---

### Task 1: History DTOs + dummy + fetcher + data test (PSR-77)

**Files:**
- Modify: `features/member/types.ts` (append after line 188)
- Create: `features/member/data/riwayat-dummy.ts`
- Create: `features/member/data/get-riwayat.ts`
- Test: `tests/unit/member/riwayat-data.test.ts`

**Interfaces:**
- Consumes: `PersiapanSlug` from `@/features/member/types` (existing).
- Produces: `RiwayatSlug`, `HistoryStatus`, `RiwayatParam`, `HistoryEntry`, `HistorySummary`, `MemberHistory`, `dummyMemberHistory: MemberHistory`, `getRiwayat(): Promise<MemberHistory>` — exact names/signatures later tasks import.

- [ ] **Step 1: Write the failing data test**

Create `tests/unit/member/riwayat-data.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { dummyMemberHistory } from "@/features/member/data/riwayat-dummy";

describe("dummyMemberHistory", () => {
  it("carries the summary verbatim with four entries in order", () => {
    // Arrange + Act
    const { summary, entries } = dummyMemberHistory;

    // Assert
    expect(summary.totalSessionsLabel).toBe("24 Sesi");
    expect(summary.sessionsDeltaLabel).toBe("↗ +4 minggu ini");
    expect(summary.avgAccuracyPct).toBe(84.6);
    expect(summary.accuracyNote).toBe("Mendekati IPSI ≥85%");
    expect(summary.dominantFocus).toBe("Kuda Kuda");
    expect(summary.dominantSessionsLabel).toBe("12 Sesi terekam");
    expect(summary.sensorHoursLabel).toBe("08j 45m");
    expect(summary.sensorNote).toBe("Telemetri aktif");
    expect(entries.map((entry) => entry.slug)).toEqual([
      "kuda-kuda",
      "pukulan",
      "tangkisan",
      "tendangan",
    ]);
  });

  it("carries the pukulan entry verbatim with title-case status", () => {
    // Arrange + Act
    const entry = dummyMemberHistory.entries[1];

    // Assert
    expect(entry.techniqueName).toBe("Pukulan Lurus Depan");
    expect(entry.dateLabel).toBe("28 SEP 2026");
    expect(entry.timeLabel).toBe("16:45 WIB");
    expect(entry.status).toBe("perlu-koreksi");
    expect(entry.statusLabel).toBe("Perlu Koreksi");
    expect(entry.scorePct).toBe(80);
    expect(entry.scoreCaption).toBe("Standar ≥85%");
    expect(entry.params.map((param) => param.name)).toEqual([
      "Bahu",
      "Siku Kanan",
      "Pinggul",
      "Lutut",
      "Pergelangan",
    ]);
    expect(entry.params.map((param) => param.deviated)).toEqual([
      false,
      true,
      false,
      false,
      true,
    ]);
    expect(entry.coachNote).toContain("Rapatkan siku kanan");
  });

  it("pins scores and title-case statuses on all entries", () => {
    // Arrange + Act
    const entries = dummyMemberHistory.entries;

    // Assert
    expect(entries.map((entry) => entry.scorePct)).toEqual([91, 80, 86, 76]);
    expect(entries.map((entry) => entry.statusLabel)).toEqual([
      "Sesuai",
      "Perlu Koreksi",
      "Sesuai",
      "Perlu Koreksi",
    ]);
    expect(entries.map((entry) => entry.params)).toHaveLength(4);
    for (const entry of entries) {
      expect(entry.params).toHaveLength(5);
    }
  });

  it("carries no pilar, numbering, telemetry, or speed keys", () => {
    // Arrange + Act
    const raw = JSON.stringify(dummyMemberHistory);

    // Assert
    expect(raw).not.toContain("PILAR");
    expect(raw).not.toContain("pilar");
    expect(raw).not.toContain("speed");
    expect(raw).not.toContain("4.18");
    expect(raw).not.toContain("telemetry");
    expect(raw).not.toContain("15 Reps");
    expect(raw).not.toContain("Perlu Perbaikan");
    expect(raw).not.toContain("Sesuai Standar");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/member/riwayat-data.test.ts`
Expected: FAIL with "Failed to resolve import ... riwayat-dummy" (module does not exist yet).

- [ ] **Step 3: Append History types to `features/member/types.ts`**

Append after line 188 (`}` closing `EvaluationSession`):

```ts
export type RiwayatSlug = PersiapanSlug;

export type HistoryStatus = "sesuai" | "perlu-koreksi";

export interface RiwayatParam {
  id: "bahu" | "siku-kanan" | "pinggul" | "lutut" | "pergelangan";
  name: string;
  reading: string;
  deviated: boolean;
  actionLabel?: string;
}

export interface HistoryEntry {
  slug: RiwayatSlug;
  techniqueName: string;
  dateLabel: string;
  timeLabel: string;
  summary: string;
  status: HistoryStatus;
  statusLabel: string; // "Sesuai" | "Perlu Koreksi" — title-case, status word only
  scorePct: number;
  scoreCaption: string; // "Kinematika IPSI" | "Standar ≥85%"
  params: RiwayatParam[]; // length 5
  coachNote: string; // verdict only, no telemetry
}

export interface HistorySummary {
  totalSessionsLabel: string;
  sessionsDeltaLabel: string;
  avgAccuracyPct: number;
  accuracyNote: string;
  dominantFocus: string;
  dominantSessionsLabel: string;
  sensorHoursLabel: string;
  sensorNote: string;
}

export interface MemberHistory {
  summary: HistorySummary;
  entries: HistoryEntry[]; // length 4: kuda-kuda, pukulan, tangkisan, tendangan
}
```

- [ ] **Step 4: Create the pure dummy module**

Create `features/member/data/riwayat-dummy.ts` (no `server-only` — Vitest-safe):

```ts
import type { MemberHistory } from "@/features/member/types";

export const dummyMemberHistory: MemberHistory = {
  summary: {
    totalSessionsLabel: "24 Sesi",
    sessionsDeltaLabel: "↗ +4 minggu ini",
    avgAccuracyPct: 84.6,
    accuracyNote: "Mendekati IPSI ≥85%",
    dominantFocus: "Kuda Kuda",
    dominantSessionsLabel: "12 Sesi terekam",
    sensorHoursLabel: "08j 45m",
    sensorNote: "Telemetri aktif",
  },
  entries: [
    {
      slug: "kuda-kuda",
      techniqueName: "Kuda Kuda (Pasang Rendah)",
      dateLabel: "26 SEP 2026",
      timeLabel: "09:15 WIB",
      summary:
        "Sudut lutut simetris 120°, distribusi bobot panggul 50:50 seimbang sempurna, postur tulang belakang tegak stabil.",
      status: "sesuai",
      statusLabel: "Sesuai",
      scorePct: 91,
      scoreCaption: "Kinematika IPSI",
      params: [
        { id: "bahu", name: "Bahu", reading: "Sesuai (Sejajar)", deviated: false },
        { id: "siku-kanan", name: "Siku Kanan", reading: "Sesuai (Terkunci)", deviated: false },
        { id: "pinggul", name: "Pinggul", reading: "Sesuai (Simetris 50:50)", deviated: false },
        { id: "lutut", name: "Lutut", reading: "Sesuai (Fleksi 120°)", deviated: false },
        { id: "pergelangan", name: "Pergelangan", reading: "Sesuai (Netral)", deviated: false },
      ],
      coachNote: "Pertahankan distribusi bobot 50:50 dan sudut lutut simetris.",
    },
    {
      slug: "pukulan",
      techniqueName: "Pukulan Lurus Depan",
      dateLabel: "28 SEP 2026",
      timeLabel: "16:45 WIB",
      summary:
        "Siku kanan (142°) & pergelangan tangan perlu koreksi deviasi sagital; bahu, pinggul, dan lutut telah sesuai standar.",
      status: "perlu-koreksi",
      statusLabel: "Perlu Koreksi",
      scorePct: 80,
      scoreCaption: "Standar ≥85%",
      params: [
        { id: "bahu", name: "Bahu", reading: "Sesuai (Sejajar)", deviated: false },
        { id: "siku-kanan", name: "Siku Kanan", reading: "Deviasi +8cm (142°)", deviated: true },
        { id: "pinggul", name: "Pinggul", reading: "Sesuai (Terkunci)", deviated: false },
        { id: "lutut", name: "Lutut", reading: "Sesuai (Fleksi 135°)", deviated: false },
        {
          id: "pergelangan",
          name: "Pergelangan",
          reading: "Pronasi Lambat",
          deviated: true,
          actionLabel: "Koreksi Rotasi",
        },
      ],
      coachNote:
        "Rapatkan siku kanan ke lintasan rusuk sebelum dilepaskan ke target untuk mengunci kinetik lurus.",
    },
    {
      slug: "tangkisan",
      techniqueName: "Tangkisan Atas (Tangkis Kepala / Gedig)",
      dateLabel: "24 SEP 2026",
      timeLabel: "15:30 WIB",
      summary:
        "Elevasi lengan 45° di atas kening sasaran, sudut lengan penangkis optimal menepis serangan vertikal.",
      status: "sesuai",
      statusLabel: "Sesuai",
      scorePct: 86,
      scoreCaption: "Kinematika IPSI",
      params: [
        { id: "bahu", name: "Bahu", reading: "Sesuai (Sejajar)", deviated: false },
        { id: "siku-kanan", name: "Siku Kanan", reading: "Sesuai (Terkunci)", deviated: false },
        { id: "pinggul", name: "Pinggul", reading: "Sesuai (Simetris)", deviated: false },
        { id: "lutut", name: "Lutut", reading: "Sesuai (Fleksi 135°)", deviated: false },
        { id: "pergelangan", name: "Pergelangan", reading: "Sesuai (Netral)", deviated: false },
      ],
      coachNote: "Pertahankan elevasi lengan 45° di atas kening sasaran.",
    },
    {
      slug: "tendangan",
      techniqueName: "Tendangan",
      dateLabel: "21 SEP 2026",
      timeLabel: "17:00 WIB",
      summary:
        "Ketinggian tumit optimal menembus ulu hati sasaran, namun tumpuan kaki belakang sedikit bergeser dari poros.",
      status: "perlu-koreksi",
      statusLabel: "Perlu Koreksi",
      scorePct: 76,
      scoreCaption: "Standar ≥85%",
      params: [
        { id: "bahu", name: "Bahu", reading: "Sesuai (Sejajar)", deviated: false },
        { id: "siku-kanan", name: "Siku Kanan", reading: "Sesuai (Terkunci)", deviated: false },
        { id: "pinggul", name: "Pinggul", reading: "Pergeseran poros +5cm", deviated: true },
        { id: "lutut", name: "Lutut", reading: "Sesuai (Fleksi 135°)", deviated: false },
        { id: "pergelangan", name: "Pergelangan", reading: "Sesuai (Netral)", deviated: false },
      ],
      coachNote: "Kunci tumpuan kaki belakang agar poros tidak bergeser.",
    },
  ],
};
```

- [ ] **Step 5: Create the cached server fetcher**

Create `features/member/data/get-riwayat.ts` (first line `import "server-only"`):

```ts
import "server-only";

import { cacheLife } from "next/cache";

import { dummyMemberHistory } from "@/features/member/data/riwayat-dummy";
import type { MemberHistory } from "@/features/member/types";

export async function getRiwayat(): Promise<MemberHistory> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /member/history) — dummy for now
  return dummyMemberHistory;
}
```

- [ ] **Step 6: Run test + typecheck, expect green**

Run: `pnpm vitest run tests/unit/member/riwayat-data.test.ts`
Expected: 4 passed.
Run: `pnpm typecheck`
Expected: no output (clean).

- [ ] **Step 7: Commit**

```bash
git add features/member/types.ts features/member/data/riwayat-dummy.ts features/member/data/get-riwayat.ts tests/unit/member/riwayat-data.test.ts
git commit -m "feat(member): add history DTOs dummy fetcher and tests (PSR-77)"
```

---

### Task 2: Server components — stats, chips, note, actions, list + shell test (PSR-76)

**Files:**
- Create: `features/member/components/riwayat-stat-grid.tsx`
- Create: `features/member/components/riwayat-param-chips.tsx`
- Create: `features/member/components/riwayat-coach-note.tsx`
- Create: `features/member/components/riwayat-card-actions.tsx`
- Create: `features/member/components/riwayat-movement-list.tsx`
- Test: `tests/unit/member/riwayat-shell.test.ts` (create with server-component describes)

**Interfaces:**
- Consumes: `HistorySummary`, `HistoryEntry`, `RiwayatParam`, `RiwayatSlug` types; `dummyMemberHistory` shape (Task 1).
- Produces: `RiwayatStatGrid({ summary })`, `RiwayatParamChips({ params })`, `RiwayatCoachNote({ note })`, `RiwayatCardActions({ slug })`, `RiwayatMovementList({ entries })` — server components Task 3 composes.

- [ ] **Step 1: Create `riwayat-stat-grid.tsx`**

```tsx
import { Card, CardContent } from "@/components/ui/card";
import type { HistorySummary } from "@/features/member/types";

const stats = (summary: HistorySummary) => [
  { label: "Total Sesi", value: summary.totalSessionsLabel, note: summary.sessionsDeltaLabel },
  {
    label: "Rata-rata Akurasi",
    value: `${summary.avgAccuracyPct}%`,
    note: summary.accuracyNote,
  },
  {
    label: "Fokus Dominan",
    value: summary.dominantFocus,
    note: summary.dominantSessionsLabel,
  },
  {
    label: "Jam Sensor",
    value: summary.sensorHoursLabel,
    note: summary.sensorNote,
  },
];

export function RiwayatStatGrid({ summary }: { summary: HistorySummary }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {stats(summary).map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex flex-col gap-1 p-3">
            <p className="text-[11px] font-medium text-muted-foreground">{stat.label}</p>
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
            <p className="text-[10px] font-semibold text-success-foreground">{stat.note}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create `riwayat-param-chips.tsx`**

```tsx
import { BadgeAlert, BadgeCheck } from "lucide-react";
import type { RiwayatParam } from "@/features/member/types";

export function RiwayatParamChips({ params }: { params: RiwayatParam[] }) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {params.map((param) => {
        const Icon = param.deviated ? BadgeAlert : BadgeCheck;
        return (
          <div
            key={param.id}
            className={`flex items-start gap-1.5 rounded-xl border p-2 ${
              param.id === "pergelangan" ? "col-span-2" : ""
            } ${
              param.deviated
                ? "border-warning-border bg-warning"
                : "border-success-border bg-success"
            }`}
          >
            <Icon
              aria-hidden="true"
              className={`size-4 shrink-0 ${
                param.deviated ? "text-warning-foreground" : "text-success-foreground"
              }`}
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="truncate text-[11px] font-bold text-foreground">{param.name}</p>
              <p
                className={`truncate text-[10px] font-medium ${
                  param.deviated ? "text-warning-foreground" : "text-success-foreground"
                }`}
              >
                {param.reading}
              </p>
            </div>
            {param.actionLabel ? (
              <span className="shrink-0 rounded border border-warning-border bg-card px-1.5 py-0.5 text-[9px] font-semibold text-warning-foreground">
                {param.actionLabel}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Create `riwayat-coach-note.tsx`**

```tsx
import { MapPin } from "lucide-react";

export function RiwayatCoachNote({ note }: { note: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border bg-card p-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-destructive/10">
        <MapPin aria-hidden="true" className="size-3 text-destructive" />
      </span>
      <p className="text-[11px] leading-relaxed text-foreground">
        <span className="font-bold text-destructive">Catatan Pelatih: </span>
        <span className="font-medium">{note}</span>
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Create `riwayat-card-actions.tsx`**

```tsx
import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { RiwayatSlug } from "@/features/member/types";

export function RiwayatCardActions({ slug }: { slug: RiwayatSlug }) {
  return (
    <div className="flex gap-2">
      <Link
        href={`/latihan/${slug}/rekam`}
        className={buttonVariants({ variant: "outline", size: "sm", className: "flex-1" })}
      >
        <RotateCcw data-icon="inline-start" /> Latihan Ulang
      </Link>
      {/* TODO: wire Detail Evaluasi to lib/api-client.ts (GET /member/history/:id) when the detail move lands — dead stub for now */}
      <span
        aria-disabled="true"
        className={buttonVariants({ size: "sm", className: "flex-1" })}
      >
        Detail Evaluasi <ArrowRight data-icon="inline-end" />
      </span>
    </div>
  );
}
```

- [ ] **Step 5: Create `riwayat-movement-list.tsx`**

```tsx
import type { HistoryEntry } from "@/features/member/types";
import { RiwayatCardActions } from "@/features/member/components/riwayat-card-actions";
import { RiwayatCoachNote } from "@/features/member/components/riwayat-coach-note";
import { RiwayatMovementItem } from "@/features/member/components/riwayat-movement-item";
import { RiwayatParamChips } from "@/features/member/components/riwayat-param-chips";

export function RiwayatMovementList({ entries }: { entries: HistoryEntry[] }) {
  return (
    <section aria-label="Daftar gerakan utama" className="flex flex-col gap-2">
      <div className="flex flex-col gap-0.5 pt-2">
        <h2 className="text-base font-bold tracking-tight text-foreground">
          Daftar 4 Gerakan Utama
        </h2>
        <p className="text-[11px] text-muted-foreground">
          Klik baris gerakan untuk melihat ringkasan evaluasi biomekanika instan
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {entries.map((entry) => (
          <RiwayatMovementItem key={entry.slug} entry={entry}>
            <RiwayatParamChips params={entry.params} />
            <RiwayatCoachNote note={entry.coachNote} />
            <RiwayatCardActions slug={entry.slug} />
          </RiwayatMovementItem>
        ))}
      </div>
    </section>
  );
}
```

Note: `RiwayatMovementItem` does not exist yet (Task 3) — typecheck stays red until Task 3 lands; do not gate-commit Task 2 on `pnpm typecheck` alone. Run tests only after Task 3, or expect the type error and proceed (Task 2 + Task 3 share one review gate).

- [ ] **Step 6: Create `tests/unit/member/riwayat-shell.test.ts` (server half)**

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

const serverFiles = [
  "features/member/components/riwayat-stat-grid.tsx",
  "features/member/components/riwayat-param-chips.tsx",
  "features/member/components/riwayat-coach-note.tsx",
  "features/member/components/riwayat-card-actions.tsx",
  "features/member/components/riwayat-movement-list.tsx",
];

describe("riwayat server components", () => {
  it("uses shadcn Badge with unified Sesuai/Perlu Koreksi wording", () => {
    // Arrange + Act
    const src = serverFiles.map(read).join("\n") + read("features/member/components/riwayat-movement-item.tsx");

    // Assert
    expect(src).toContain("@/components/ui/badge");
    expect(src).toContain("statusLabel");
    expect(read("features/member/data/riwayat-dummy.ts")).toContain("Perlu Koreksi");
    expect(src).not.toContain("Perlu Perbaikan");
    expect(src).not.toContain("Sesuai Standar");
  });

  it("carries no pilar suffixes, numbering, telemetry, or speed values", () => {
    // Arrange + Act
    const src = serverFiles.map(read).join("\n");

    // Assert
    expect(src).not.toContain("PILAR");
    expect(src).not.toContain("pilar");
    expect(src).not.toContain("15 Reps");
    expect(src).not.toContain("4.18");
    expect(src).not.toContain("MediaPipe");
  });

  it("keeps all riwayat server UI flex-only", () => {
    // Arrange + Act + Assert
    for (const file of serverFiles) {
      expect(read(file)).not.toContain("absolute");
    }
  });

  it("links Latihan Ulang to rekam and keeps Detail Evaluasi dead with a TODO", () => {
    // Arrange + Act
    const src = read("features/member/components/riwayat-card-actions.tsx");

    // Assert
    expect(src).toContain("Latihan Ulang");
    expect(src).toContain("/latihan/${slug}/rekam");
    expect(src).toContain("Detail Evaluasi");
    expect(src).toContain("GET /member/history/:id");
    expect(src).toContain("TODO");
  });
});
```

Note: this file references `riwayat-movement-item.tsx` (Task 3) — the file is created in this task but the island test block is appended in Task 3.

- [ ] **Step 7: Run the shell test, expect FAIL (island missing)**

Run: `pnpm vitest run tests/unit/member/riwayat-shell.test.ts`
Expected: FAIL — `riwayat-movement-item.tsx` does not exist (ENOENT). Do not commit; proceed to Task 3 in the same gate.

---

### Task 3: Client gerakan-card island + interaction assertions (PSR-76)

**Files:**
- Create: `features/member/components/riwayat-movement-item.tsx`
- Modify: `tests/unit/member/riwayat-shell.test.ts` (append island describe)

**Interfaces:**
- Consumes: `HistoryEntry` type; `RiwayatMovementList` renders `<RiwayatMovementItem entry children>` (Task 2); server-rendered `children` (chips + note + actions) slot into `CollapsibleContent`.
- Produces: `RiwayatMovementItem({ entry, children })` — the only `"use client"` module in the move.

- [ ] **Step 1: Create `riwayat-movement-item.tsx`**

```tsx
"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import {
  ChevronDown,
  Footprints,
  Hand,
  PersonStanding,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { HistoryEntry, RiwayatSlug } from "@/features/member/types";

// TODO: replace with per-gerakan Lucide icon — placeholder set
const iconBySlug: Record<RiwayatSlug, typeof Hand> = {
  "kuda-kuda": PersonStanding,
  pukulan: Hand,
  tangkisan: Shield,
  tendangan: Footprints,
};

export function RiwayatMovementItem({
  entry,
  children,
}: {
  entry: HistoryEntry;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const needsFix = entry.status === "perlu-koreksi";
  const Icon = iconBySlug[entry.slug];

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-2xl border bg-card"
    >
      <CollapsibleTrigger className="flex w-full items-start gap-3 p-3.5 text-left">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
          <Icon aria-hidden="true" className="size-5 text-foreground" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-px">
          <span className="truncate text-sm font-bold text-foreground">
            {entry.techniqueName}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {entry.dateLabel} • {entry.timeLabel}
          </span>
          <span className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
            {entry.summary}
          </span>
          <span className="mt-2 flex items-center justify-between border-t pt-2">
            <Badge variant={needsFix ? "warning" : "success"}>
              {entry.statusLabel}
            </Badge>
            <span className="flex items-center gap-2">
              <span className="flex flex-col items-end">
                <span className="text-sm font-bold text-foreground">
                  {entry.scorePct}%
                </span>
                <span className="text-[9px] text-muted-foreground">
                  {entry.scoreCaption}
                </span>
              </span>
              <span className="flex size-6 items-center justify-center rounded-full border">
                <ChevronDown
                  aria-hidden="true"
                  className={`size-3.5 text-muted-foreground transition-transform motion-reduce:transition-none ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </span>
            </span>
          </span>
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-3 bg-muted/70 px-3.5 pb-3.5">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
```

- [ ] **Step 2: Append the island describe to the shell test**

Append at the end of `tests/unit/member/riwayat-shell.test.ts`:

```ts
describe("riwayat movement island", () => {
  it("renders collapsed by default with independent toggles and icon TODOs", () => {
    // Arrange + Act (no DOM env in repo — interaction covered via source contract)
    const src = read("features/member/components/riwayat-movement-item.tsx");

    // Assert
    expect(src).toContain('"use client"');
    expect(src).toContain("useState(false)");
    expect(src).toContain("onOpenChange");
    expect(src).toContain("CollapsibleTrigger");
    expect(src).toContain("CollapsibleContent");
    expect(src).toContain("rotate-180");
    expect(src).toContain("motion-reduce");
    expect(src).toContain("TODO: replace with per-gerakan Lucide icon");
    expect(src).toContain("PersonStanding");
    expect(src).toContain("Footprints");
    expect(src).not.toContain("absolute");
    expect(src).not.toContain("PILAR");
  });

  it("orders title above date with no numbering", () => {
    // Arrange + Act
    const src = read("features/member/components/riwayat-movement-item.tsx");

    // Assert
    const titleAt = src.indexOf("techniqueName");
    const dateAt = src.indexOf("dateLabel");
    expect(titleAt).toBeGreaterThan(-1);
    expect(dateAt).toBeGreaterThan(titleAt);
  });
});
```

- [ ] **Step 3: Run tests + typecheck, expect green**

Run: `pnpm vitest run tests/unit/member/riwayat-shell.test.ts tests/unit/member/riwayat-data.test.ts`
Expected: all pass (8 tests).
Run: `pnpm typecheck && pnpm lint`
Expected: clean (Task 2's missing import now resolves).

- [ ] **Step 4: Commit (Tasks 2+3 share one compiling gate)**

```bash
git add features/member/components/riwayat-stat-grid.tsx features/member/components/riwayat-param-chips.tsx features/member/components/riwayat-coach-note.tsx features/member/components/riwayat-card-actions.tsx features/member/components/riwayat-movement-list.tsx features/member/components/riwayat-movement-item.tsx tests/unit/member/riwayat-shell.test.ts
git commit -m "feat(member): build riwayat list UI with collapsible cards (PSR-76)"
```

---

### Task 4: Routes + nav wiring (PSR-78)

**Files:**
- Create: `features/member/pages/riwayat-page.tsx`
- Create: `app/(member)/riwayat/page.tsx`
- Create: `app/(member)/riwayat/layout.tsx`
- Modify: `features/member/components/member-bottom-nav.tsx`
- Modify: `tests/unit/member/riwayat-shell.test.ts` (append route/nav describe)

**Interfaces:**
- Consumes: `getRiwayat()`, `RiwayatStatGrid`, `RiwayatMovementList`, `MemberLayout`, `MemberTab`.
- Produces: `/riwayat` route + `activeTab="riwayat"` nav state. No `generateStaticParams` (list has no params).

- [ ] **Step 1: Create `features/member/pages/riwayat-page.tsx`**

```tsx
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getRiwayat } from "@/features/member/data/get-riwayat";
import { RiwayatMovementList } from "@/features/member/components/riwayat-movement-list";
import { RiwayatStatGrid } from "@/features/member/components/riwayat-stat-grid";

export function RiwayatPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5 pt-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Riwayat Latihan
        </h1>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Dokumentasi perkembangan kinematika dan ketepatan jurus pesilat secara
          berkala, dianalisis berbasis MediaPipe 33-point biomechanics.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-44 w-full rounded-2xl" />}>
        <StatsSection />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <MovementsSection />
      </Suspense>
    </div>
  );
}

async function StatsSection() {
  const history = await getRiwayat();
  return <RiwayatStatGrid summary={history.summary} />;
}

async function MovementsSection() {
  const history = await getRiwayat();
  return <RiwayatMovementList entries={history.entries} />;
}
```

- [ ] **Step 2: Create the thin route + leaf layout**

Create `app/(member)/riwayat/page.tsx`:

```tsx
import { RiwayatPage } from "@/features/member/pages/riwayat-page";

export default function Page() {
  return <RiwayatPage />;
}
```

Create `app/(member)/riwayat/layout.tsx`:

```tsx
import type { ReactNode } from "react";
import { MemberLayout } from "@/features/member/pages/member-layout";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <MemberLayout activeTab="riwayat" trail={["Dashboard", "Riwayat Latihan"]}>
      {children}
    </MemberLayout>
  );
}
```

- [ ] **Step 3: Wire the Riwayat tab in `member-bottom-nav.tsx`**

Edit `features/member/components/member-bottom-nav.tsx`:
- Change `export type MemberTab = "dashboard" | "latihan";` to `export type MemberTab = "dashboard" | "latihan" | "riwayat";`
- Add `const riwayatActive = activeTab === "riwayat";` after the latihan line.
- Replace the dead Riwayat block (`{/* TODO: link to /riwayat when the route lands */}` + `<li>`) with:

```tsx
        <li className={`${itemClass} ${riwayatActive ? "text-primary" : "text-muted-foreground"}`}>
          {riwayatActive ? (
            <span aria-current="page" className={linkInner}>
              <ScrollText className="size-4" aria-hidden="true" />
              Riwayat
            </span>
          ) : (
            <Link href="/riwayat" className={linkInner}>
              <ScrollText className="size-4" aria-hidden="true" />
              Riwayat
            </Link>
          )}
        </li>
```

(Keep the Profil TODO block untouched.)

- [ ] **Step 4: Append the route/nav describe to the shell test**

Append at the end of `tests/unit/member/riwayat-shell.test.ts`:

```ts
describe("riwayat route and nav", () => {
  it("keeps the route thin with shell-owned nav state", () => {
    // Arrange + Act
    const route = read("app/(member)/riwayat/page.tsx");
    const layout = read("app/(member)/riwayat/layout.tsx");
    const page = read("features/member/pages/riwayat-page.tsx");

    // Assert
    expect(route).not.toContain('"use client"');
    expect(route).toContain("<RiwayatPage />");
    expect(route).not.toContain("generateStaticParams");
    expect(layout).toContain('activeTab="riwayat"');
    expect(layout).toContain("Riwayat Latihan");
    expect(page).not.toContain('"use client"');
    expect(page).toContain("Riwayat Latihan");
    expect(page).toContain("MediaPipe 33-point");
    expect(page).toContain("Suspense");
  });

  it("makes Riwayat a real bottom-nav tab", () => {
    // Arrange + Act
    const src = read("features/member/components/member-bottom-nav.tsx");

    // Assert
    expect(src).toContain('"riwayat"');
    expect(src).toContain('href="/riwayat"');
    expect(src).not.toContain("TODO: link to /riwayat");
  });
});
```

- [ ] **Step 5: Run tests + typecheck + lint, expect green**

Run: `pnpm vitest run tests/unit/member/riwayat-shell.test.ts`
Expected: all pass (11 tests).
Run: `pnpm typecheck && pnpm lint`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add features/member/pages/riwayat-page.tsx "app/(member)/riwayat/page.tsx" "app/(member)/riwayat/layout.tsx" features/member/components/member-bottom-nav.tsx tests/unit/member/riwayat-shell.test.ts
git commit -m "feat(member): wire riwayat route and nav (PSR-78)"
```

---

### Task 5: Full gates + browser overflow check (no commit)

- [ ] **Step 1: Run the full verification suite**

Run: `pnpm build`
Expected: compiles successfully, `/riwayat` in the route list.
Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: zero errors, all suites pass.

- [ ] **Step 2: Browser check at 390px (AGENTS.md dev-server protocol)**

Start detached per AGENTS.md (WMI `Win32_Process.Create`, fresh port, `pnet dev --port <PORT>` log to Temp), wait bounded for `Ready in`, open via Playwright tab-new on `/riwayat`, and evaluate:

```js
() => document.documentElement.scrollWidth <= window.innerWidth
```

Expected: `true` at 390px mobile + desktop widths. Tap the pukulan card trigger and re-evaluate (expanded body must not overflow). Tap a second card to confirm independent toggles (both stay open).
Stop the server (`taskkill /PID <pid> /T /F`), confirm the port is free, delete Temp logs + `.playwright-mcp/`, verify `git status --short` is clean of artifacts.

- [ ] **Step 3: Report**

Paste the gate outputs + `scrollWidth` results into the `In Review` comment on PSR-76/PSR-78 with the PR URL + 2–4 test steps (per linear-tracking `review` comment type). No commit in this task.

---

## Self-Review

1. **Spec coverage:** §1 list goal → Tasks 2–4; §2 deltas → Task 2 (Badge/wording/no-telemetry/no-header via components + negative shell assertions), Task 3 (flip order, numbering/pilar absence, icon TODOs); §3 architecture → Tasks 2–4 (islands, Suspense, thin route, leaf layout); §4 DTOs → Task 1 (verbatim types + dummy + pins); §5 UI pattern → Tasks 2–3 (Collapsible, chevron, CTAs, copy); §6 data → Task 1 (fetcher + TODO) + Task 4 (retake Link); §7 verification → Task 1/3/4 tests + Task 5 gates/browser; §8 out-of-scope → untouched (PSR-75/PSR-79 remain Backlog).
2. **Placeholder scan:** no TBD/TODO-describes-what gaps — every TODO is an exact pinned string (`GET /member/history`, `GET /member/history/:id`, per-gerakan icon). No "similar to Task N" — code repeated per task. No unreferenced names — `Interfaces` blocks chain exact identifiers.
3. **Type consistency:** `HistoryEntry.statusLabel` title-case in types/dummy/tests; `RiwayatSlug` reused for `RiwayatCardActions({ slug })` and `iconBySlug: Record<RiwayatSlug, …>`; `scoreCaption` (not `caption`) everywhere; `getRiwayat()` (not `getHistory`) in page + Task 1 export.
