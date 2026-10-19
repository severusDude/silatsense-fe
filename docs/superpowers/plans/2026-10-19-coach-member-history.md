# Coach Member History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/coach/members/[id]/riwayat` — reused athlete profile + paginated `Daftar Riwayat Sesi` (24 dummy sessions, 10/page via `?page=N`) with bare shared-helper performance badges.

**Architecture:** Three moves: PSR-100 data layer (DTOs + pure dummy + `'use cache'` read + pure pagination helper), PSR-101 UI (section + static session cards + URL pagination), PSR-102 wiring (route-group split `(detail)`/`(history)`, thin RSC route, member-detail link goes live). The route forwards the `searchParams` Promise into a Suspense child; `'use cache'` never sees URL data.

**Tech Stack:** Next 16.3 App Router (RSC, `'use cache'`, `cacheLife`), React 19, Tailwind v4 tokens, shadcn base-nova (`@/components/ui/*`), lucide-react, Vitest (source-text assertions), pnpm.

**Spec:** `docs/superpowers/specs/2026-10-19-coach-member-history-design.md` (approved; commit `5147cf1` + refinements).

## Global Constraints

- Imports `@/` alias only. No `"use client"` in any added/moved file (all server components).
- `features/coach/data/get-*.ts` starts with `import "server-only"`; `*-dummy.ts` and `paginate-history.ts` stay pure (no `server-only`) so Vitest can import them.
- No comments in new code except: the dummy-file provenance header and the exact TODO line `// TODO: connect backend via lib/api-client.ts (GET /coach/members/[id]/history?page=N) — dummy for now`.
- Badge rule (user override): cards use bare `Badge` with `performanceBadgeLabel`/`performanceBadgeVariant` only — never Figma strings (`Sesuai Skor Kualitas`, `Optimal (`, `Sayap Siku Kanan (+8cm)`, `Perlu Poles`, …) and no badge icons; `evaluasi` never appears on this screen.
- No `absolute`, no `<svg>`, no `next/image`; lucide icons only.
- The route never awaits `searchParams`; URL data is read inside the Suspense child, never inside `'use cache'`.
- Dummy literals beyond Card #24 are screenshot-read approximations: audit against the Figma full-frame node `94:40907` while implementing and adjust freely. Tests pin only Card #24, the tone sequence of the first 10, counts, and ordering.
- Commits: `<type>(<scope>): <summary>`, atomic, tree compiles (`pnpm typecheck`) per commit. Branch `feature/psr-99-coach-ship-member-history` (already cut from `development`).
- Full gates (`pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm test`) run once in Task 4 before `In Review`, not per commit.

---

### Task 1: Data layer (PSR-100)

**Files:**
- Modify: `features/coach/types.ts` (insert before `export interface MemberDetail {`)
- Create: `features/coach/data/member-history-dummy.ts`
- Create: `features/coach/data/get-member-history.ts`
- Create: `features/coach/data/paginate-history.ts`
- Test: `tests/unit/coach/member-history-data.test.ts`

**Interfaces:**
- Consumes: `PerformanceBadgeKey` from `@/components/shared/silat-reference`.
- Produces (used by Tasks 2–3):
  - `HistoryPageSession { id; sesiLabel; dateLabel; title; subtitle; repetisiLabel; scorePct; badgeKey: PerformanceBadgeKey }`
  - `MemberHistory { memberId; totalSessions; pageSize; sessions: HistoryPageSession[] }`
  - `dummyMemberHistory: Record<string, MemberHistory>` (`member-history-dummy.ts`)
  - `memberHistoryIds: string[]`, `getMemberHistory(id: string): Promise<MemberHistory | null>` (`get-member-history.ts`)
  - `parseHistoryPage(value: string | string[] | undefined): number`, `paginateHistory(sessions, page, pageSize): HistoryPageSlice`, `interface HistoryPageSlice { sessions; page; totalPages; rangeStart; rangeEnd }` (`paginate-history.ts`)

- [ ] **Step 1: Write the failing test**

Create `tests/unit/coach/member-history-data.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dummyMemberHistory } from "@/features/coach/data/member-history-dummy";
import { paginateHistory, parseHistoryPage } from "@/features/coach/data/paginate-history";

const getSource = readFileSync("features/coach/data/get-member-history.ts", "utf8");

describe("dummyMemberHistory", () => {
  it("ships one member with 24 sessions newest-first at 10 per page", () => {
    // Arrange + Act + Assert
    expect(Object.keys(dummyMemberHistory)).toEqual(["aced-suryana"]);

    const history = dummyMemberHistory["aced-suryana"];

    expect(history.memberId).toBe("aced-suryana");
    expect(history.totalSessions).toBe(24);
    expect(history.pageSize).toBe(10);
    expect(history.sessions).toHaveLength(24);
    expect(history.sessions.map((s) => s.id)).toEqual(
      Array.from({ length: 24 }, (_, i) => `sesi-${24 - i}`)
    );
  });

  it("pins card #24 to the Figma full-frame literals", () => {
    // Arrange + Act + Assert
    expect(dummyMemberHistory["aced-suryana"].sessions[0]).toEqual({
      id: "sesi-24",
      sesiLabel: "Sesi #24",
      dateLabel: "06 Mar 2026, 15:45 WIB",
      title: "Pukulan Lurus Depan",
      subtitle: "Penetapan Sasaran Target",
      repetisiLabel: "Repetisi: 42/50 (84%)",
      scorePct: 82,
      badgeKey: "remediasi",
    });
  });

  it("matches the Figma tone sequence on page one and never uses evaluasi", () => {
    // Arrange + Act + Assert
    const sessions = dummyMemberHistory["aced-suryana"].sessions;

    expect(sessions.slice(0, 10).map((s) => s.badgeKey)).toEqual([
      "remediasi",
      "sesuai",
      "sesuai",
      "tidak-sesuai",
      "remediasi",
      "sesuai",
      "sesuai",
      "tidak-sesuai",
      "sesuai",
      "sesuai",
    ]);
    expect(sessions.every((s) => s.badgeKey !== "evaluasi")).toBe(true);
  });
});

describe("parseHistoryPage", () => {
  it("normalizes arrays, decimals, junk, and out-of-range-low values", () => {
    // Arrange + Act + Assert
    expect(parseHistoryPage("2")).toBe(2);
    expect(parseHistoryPage(["3"])).toBe(3);
    expect(parseHistoryPage("2.9")).toBe(2);
    expect(parseHistoryPage(undefined)).toBe(1);
    expect(parseHistoryPage("abc")).toBe(1);
    expect(parseHistoryPage("0")).toBe(1);
    expect(parseHistoryPage("-2")).toBe(1);
  });
});

describe("paginateHistory", () => {
  const sessions = dummyMemberHistory["aced-suryana"].sessions;

  it("slices 10/10/4 with matching ranges and clamps the page", () => {
    // Arrange + Act + Assert
    const page1 = paginateHistory(sessions, 1, 10);
    expect([page1.sessions.length, page1.rangeStart, page1.rangeEnd, page1.totalPages]).toEqual([10, 1, 10, 3]);

    const page2 = paginateHistory(sessions, 2, 10);
    expect([page2.sessions[0].id, page2.rangeStart, page2.rangeEnd]).toEqual(["sesi-14", 11, 20]);

    const page3 = paginateHistory(sessions, 3, 10);
    expect([page3.sessions.length, page3.rangeStart, page3.rangeEnd]).toEqual([4, 21, 24]);

    expect(paginateHistory(sessions, 0, 10).page).toBe(1);
    expect(paginateHistory(sessions, 99, 10).page).toBe(3);
    expect(paginateHistory(sessions, Number.NaN, 10).page).toBe(1);
  });
});

describe("getMemberHistory source", () => {
  it("stays a cached dummy read with the pinned backend TODO", () => {
    // Arrange + Act + Assert
    expect(getSource).toContain('import "server-only"');
    expect(getSource).toContain('"use cache"');
    expect(getSource).toContain('cacheLife("minutes")');
    expect(getSource).toContain("export const memberHistoryIds = Object.keys(dummyMemberHistory);");
    expect(getSource).toContain(
      "TODO: connect backend via lib/api-client.ts (GET /coach/members/[id]/history?page=N) — dummy for now"
    );
    expect(getSource).not.toContain('"use client"');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/coach/member-history-data.test.ts`
Expected: FAIL — `Cannot find module '@/features/coach/data/member-history-dummy'`.

- [ ] **Step 3: Add the DTOs**

In `features/coach/types.ts`, replace the anchor line `export interface MemberDetail {` with:

```ts
export interface HistoryPageSession {
  id: string;
  sesiLabel: string;
  dateLabel: string;
  title: string;
  subtitle: string;
  repetisiLabel: string;
  scorePct: number;
  badgeKey: PerformanceBadgeKey;
}

export interface MemberHistory {
  memberId: string;
  totalSessions: number;
  pageSize: number;
  sessions: HistoryPageSession[];
}

export interface MemberDetail {
```

- [ ] **Step 4: Create the dummy module**

Create `features/coach/data/member-history-dummy.ts` (re-verify literals against the Figma full-frame render while implementing):

```ts
import type { MemberHistory } from "@/features/coach/types";

// Placeholder values mirror Figma node 94:40907 (full-frame screenshot; isolated
// sub-node renders are component defaults and not authoritative) until the backend lands.
export const dummyMemberHistory: Record<string, MemberHistory> = {
  "aced-suryana": {
    memberId: "aced-suryana",
    totalSessions: 24,
    pageSize: 10,
    sessions: [
      { id: "sesi-24", sesiLabel: "Sesi #24", dateLabel: "06 Mar 2026, 15:45 WIB", title: "Pukulan Lurus Depan", subtitle: "Penetapan Sasaran Target", repetisiLabel: "Repetisi: 42/50 (84%)", scorePct: 82, badgeKey: "remediasi" },
      { id: "sesi-23", sesiLabel: "Sesi #23", dateLabel: "03 Mar 2026, 15:30 WIB", title: "Tangkisan Lurus & Kuda-Kuda", subtitle: "Kombinasi Doktor Posisi (3)", repetisiLabel: "Repetisi: 36/40 (90%)", scorePct: 86.4, badgeKey: "sesuai" },
      { id: "sesi-22", sesiLabel: "Sesi #22", dateLabel: "28 Feb 2026, 15:10 WIB", title: "Kuda-kuda", subtitle: "Pertahanan Statis (Freestyle)", repetisiLabel: "Repetisi: 40/40 (100%)", scorePct: 92, badgeKey: "sesuai" },
      { id: "sesi-21", sesiLabel: "Sesi #21", dateLabel: "27 Feb 2026, 16:00 WIB", title: "Tendangan", subtitle: "Serangan Pukulan", repetisiLabel: "Repetisi: 36/40 (90%)", scorePct: 76.5, badgeKey: "tidak-sesuai" },
      { id: "sesi-20", sesiLabel: "Sesi #20", dateLabel: "20 Feb 2026, 15:45 WIB", title: "Pukulan Lurus Depan", subtitle: "Penetapan Sasaran Target", repetisiLabel: "Repetisi: 38/40 (95%)", scorePct: 81.2, badgeKey: "remediasi" },
      { id: "sesi-19", sesiLabel: "Sesi #19", dateLabel: "17 Feb 2026, 10:00 WIB", title: "Kuda-kuda", subtitle: "Pertahanan Statis (Front)", repetisiLabel: "Repetisi: 40/40 (100%)", scorePct: 94.5, badgeKey: "sesuai" },
      { id: "sesi-18", sesiLabel: "Sesi #18", dateLabel: "09 Feb 2026, 15:00 WIB", title: "Tangkisan Lurus & Terkait", subtitle: "Kuda-Kuda Terkunci", repetisiLabel: "Repetisi: 35/39 (89%)", scorePct: 88, badgeKey: "sesuai" },
      { id: "sesi-17", sesiLabel: "Sesi #17", dateLabel: "29 Jan 2026, 14:45 WIB", title: "Tendangan & Kelincahan", subtitle: "Kelincahan Gerak dan Otot", repetisiLabel: "Repetisi: 35/40 (87%)", scorePct: 76, badgeKey: "tidak-sesuai" },
      { id: "sesi-16", sesiLabel: "Sesi #16", dateLabel: "27 Jan 2026, 15:30 WIB", title: "Pukulan Tungkai & Passer Siku", subtitle: "Perisai Serangan", repetisiLabel: "Repetisi: 40/40 (95%)", scorePct: 85.5, badgeKey: "sesuai" },
      { id: "sesi-15", sesiLabel: "Sesi #15", dateLabel: "24 Jan 2026, 15:30 WIB", title: "Kuda-kuda", subtitle: "Kekuatan Tumpuan", repetisiLabel: "Repetisi: 50/50 (100%)", scorePct: 95.5, badgeKey: "sesuai" },
      { id: "sesi-14", sesiLabel: "Sesi #14", dateLabel: "17 Jan 2026, 10:15 WIB", title: "Pukulan Lurus Depan", subtitle: "Penetapan Sasaran Target", repetisiLabel: "Repetisi: 41/50 (82%)", scorePct: 83.1, badgeKey: "sesuai" },
      { id: "sesi-13", sesiLabel: "Sesi #13", dateLabel: "10 Jan 2026, 15:20 WIB", title: "Tendangan Sabit", subtitle: "Lintasan Serangan", repetisiLabel: "Repetisi: 30/40 (75%)", scorePct: 72.4, badgeKey: "tidak-sesuai" },
      { id: "sesi-12", sesiLabel: "Sesi #12", dateLabel: "03 Jan 2026, 15:05 WIB", title: "Kuda-kuda", subtitle: "Kestabilan Sumbu", repetisiLabel: "Repetisi: 45/50 (90%)", scorePct: 88.9, badgeKey: "sesuai" },
      { id: "sesi-11", sesiLabel: "Sesi #11", dateLabel: "27 Des 2025, 15:40 WIB", title: "Tangkisan Lurus", subtitle: "Reaksi Serangan", repetisiLabel: "Repetisi: 34/40 (85%)", scorePct: 80.7, badgeKey: "remediasi" },
      { id: "sesi-10", sesiLabel: "Sesi #10", dateLabel: "20 Des 2025, 15:25 WIB", title: "Pukulan Lurus Depan", subtitle: "Penetapan Sasaran Target", repetisiLabel: "Repetisi: 39/50 (78%)", scorePct: 78.3, badgeKey: "tidak-sesuai" },
      { id: "sesi-09", sesiLabel: "Sesi #09", dateLabel: "13 Des 2025, 15:50 WIB", title: "Kuda-kuda", subtitle: "Pertahanan Statis (Freestyle)", repetisiLabel: "Repetisi: 48/50 (96%)", scorePct: 91.6, badgeKey: "sesuai" },
      { id: "sesi-08", sesiLabel: "Sesi #08", dateLabel: "06 Des 2025, 15:35 WIB", title: "Tendangan & Kelincahan", subtitle: "Kelincahan Gerak dan Otot", repetisiLabel: "Repetisi: 37/40 (93%)", scorePct: 87.2, badgeKey: "sesuai" },
      { id: "sesi-07", sesiLabel: "Sesi #07", dateLabel: "29 Nov 2025, 15:15 WIB", title: "Tangkisan Lurus & Kuda-Kuda", subtitle: "Kombinasi Dasar (2)", repetisiLabel: "Repetisi: 33/40 (83%)", scorePct: 79.8, badgeKey: "remediasi" },
      { id: "sesi-06", sesiLabel: "Sesi #06", dateLabel: "22 Nov 2025, 15:45 WIB", title: "Kuda-kuda", subtitle: "Kekuatan Tumpuan", repetisiLabel: "Repetisi: 50/50 (100%)", scorePct: 93.4, badgeKey: "sesuai" },
      { id: "sesi-05", sesiLabel: "Sesi #05", dateLabel: "15 Nov 2025, 15:10 WIB", title: "Pukulan Lurus Depan", subtitle: "Kecepatan Impak", repetisiLabel: "Repetisi: 31/50 (62%)", scorePct: 68.5, badgeKey: "tidak-sesuai" },
      { id: "sesi-04", sesiLabel: "Sesi #04", dateLabel: "08 Nov 2025, 15:30 WIB", title: "Tangkisan & Kuda-Kuda", subtitle: "Kombinasi Doktor Posisi (3)", repetisiLabel: "Repetisi: 38/40 (95%)", scorePct: 86.8, badgeKey: "sesuai" },
      { id: "sesi-03", sesiLabel: "Sesi #03", dateLabel: "01 Nov 2025, 15:20 WIB", title: "Kuda-kuda", subtitle: "Pertahanan Statis (Front)", repetisiLabel: "Repetisi: 44/50 (88%)", scorePct: 84.6, badgeKey: "sesuai" },
      { id: "sesi-02", sesiLabel: "Sesi #02", dateLabel: "25 Okt 2025, 15:40 WIB", title: "Tendangan", subtitle: "Serangan Pukulan", repetisiLabel: "Repetisi: 32/40 (80%)", scorePct: 77.9, badgeKey: "tidak-sesuai" },
      { id: "sesi-01", sesiLabel: "Sesi #01", dateLabel: "18 Okt 2025, 15:05 WIB", title: "Kuda-kuda", subtitle: "Kestabilan Sumbu", repetisiLabel: "Repetisi: 42/50 (84%)", scorePct: 82.5, badgeKey: "remediasi" },
    ],
  },
};
```

- [ ] **Step 5: Create the cached read**

Create `features/coach/data/get-member-history.ts`:

```ts
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

- [ ] **Step 6: Create the pagination helper**

Create `features/coach/data/paginate-history.ts`:

```ts
import type { HistoryPageSession } from "@/features/coach/types";

export interface HistoryPageSlice {
  sessions: HistoryPageSession[];
  page: number;
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
}

export function parseHistoryPage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

export function paginateHistory(sessions: HistoryPageSession[], page: number, pageSize: number): HistoryPageSlice {
  const totalPages = Math.max(1, Math.ceil(sessions.length / pageSize));
  const requested = Number.isFinite(page) ? Math.trunc(page) : 1;
  const safePage = Math.min(Math.max(requested, 1), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const slice = sessions.slice(startIndex, startIndex + pageSize);
  return {
    sessions: slice,
    page: safePage,
    totalPages,
    rangeStart: slice.length === 0 ? 0 : startIndex + 1,
    rangeEnd: startIndex + slice.length,
  };
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `pnpm test tests/unit/coach/member-history-data.test.ts`
Expected: PASS (4 describe blocks green).

- [ ] **Step 8: Verify the tree compiles**

Run: `pnpm typecheck`
Expected: clean.

- [ ] **Step 9: Commit**

```bash
git add features/coach/types.ts features/coach/data/member-history-dummy.ts features/coach/data/get-member-history.ts features/coach/data/paginate-history.ts tests/unit/coach/member-history-data.test.ts
git commit -m "feat(coach): add member history data layer (PSR-100)"
```

---

### Task 2: History list UI (PSR-101)

**Files:**
- Create: `features/coach/components/member-history-section.tsx`
- Create: `features/coach/components/history-session-card.tsx`
- Create: `features/coach/components/history-pagination.tsx`
- Test: `tests/unit/coach/member-history-sections.test.ts`

**Interfaces:**
- Consumes: `HistoryPageSession`, `MemberHistory` (Task 1); `HistoryPageSlice` (Task 1); `META_BADGE_VARIANT`, `performanceBadgeLabel`, `performanceBadgeVariant` from `@/components/shared/silat-reference`; `Badge`, `Card`/`CardHeader`/`CardFooter`, `Button`/`buttonVariants`.
- Produces (used by Task 3):
  - `MemberHistorySection({ history: MemberHistory; slice: HistoryPageSlice })`
  - `HistorySessionCard({ session: HistoryPageSession })`
  - `HistoryPagination({ memberId; page; totalPages; totalSessions; rangeStart; rangeEnd }: { memberId: string; page: number; totalPages: number; totalSessions: number; rangeStart: number; rangeEnd: number })`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/coach/member-history-sections.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const section = readFileSync("features/coach/components/member-history-section.tsx", "utf8");
const card = readFileSync("features/coach/components/history-session-card.tsx", "utf8");
const pagination = readFileSync("features/coach/components/history-pagination.tsx", "utf8");
const all = [section, card, pagination].join("\n");

describe("member history sections", () => {
  it("builds the log as a section with the Figma header, count badge, and description", () => {
    // Arrange + Act + Assert
    expect(section).toContain("<section");
    expect(section).toContain("Daftar Riwayat Sesi");
    expect(section).toContain("META_BADGE_VARIANT.count");
    expect(section).toContain("Catatan telemetri repetisi dan akurasi sensorik MediaPipe.");
    expect(section).toContain("<ul");
    expect(section).toContain("<li");
    expect(section).toContain("HistorySessionCard");
    expect(section).toContain("HistoryPagination");
  });

  it("renders static session cards with tone dot, Skor AI caption, and one helper badge", () => {
    // Arrange + Act + Assert
    expect(card).toContain('<Card size="sm">');
    expect(card).toContain("session.sesiLabel");
    expect(card).toContain("session.dateLabel");
    expect(card).toContain("toFixed(1)");
    expect(card).toContain("Skor AI");
    expect(card).toContain("size-1.5");
    expect(card).toContain("performanceBadgeLabel");
    expect(card).toContain("performanceBadgeVariant");
    expect(card).toContain("<CardFooter");
    expect(card).not.toContain("href=");
  });

  it("paginates functionally via ?page= links with aria-current and disabled edges", () => {
    // Arrange + Act + Assert
    expect(pagination).toContain("Menampilkan");
    expect(pagination).toContain("total sesi biomekanika");
    expect(pagination).toContain("Sebelumnya");
    expect(pagination).toContain("Selanjutnya");
    expect(pagination).toContain("aria-current");
    expect(pagination).toContain("`/coach/members/${memberId}/riwayat?page=${page - 1}`");
    expect(pagination).toContain("`/coach/members/${memberId}/riwayat?page=${page + 1}`");
    expect(pagination).toContain("disabled");
    expect(pagination).toContain("aria-label=");
  });

  it("keeps the user badge rule: bare labels, no Figma strings, lucide only", () => {
    // Arrange + Act + Assert
    expect(all).toContain("performanceBadgeLabel");
    expect(all).toContain("ChevronLeft");
    expect(all).toContain("ChevronRight");
    expect(all).toContain("lucide-react");
    expect(all).not.toContain("Sesuai Skor Kualitas");
    expect(all).not.toContain("Standar IPSI");
    expect(all).not.toContain("Optimal (");
    expect(all).not.toContain("Sayap Siku");
    expect(all).not.toContain("Perlu Poles");
    expect(all).not.toContain("(-6.5");
    expect(all).not.toContain("(+8cm)");
    expect(all).not.toContain("evaluasi");
    expect(all).not.toContain('"use client"');
    expect(all).not.toContain("<svg");
    expect(all).not.toContain("absolute");
    expect(all).not.toContain("next/image");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/coach/member-history-sections.test.ts`
Expected: FAIL — `ENOENT` reading `features/coach/components/member-history-section.tsx`.

- [ ] **Step 3: Create the session card**

Create `features/coach/components/history-session-card.tsx`:

```tsx
import { Badge } from "@/components/ui/badge";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { performanceBadgeLabel, performanceBadgeVariant } from "@/components/shared/silat-reference";
import type { HistoryPageSession } from "@/features/coach/types";

type ToneVariant = ReturnType<typeof performanceBadgeVariant>;

const TONE_TEXT: Record<ToneVariant, string> = {
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  secondary: "text-muted-foreground",
};

const TONE_DOT: Record<ToneVariant, string> = {
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  secondary: "bg-muted-foreground",
};

export function HistorySessionCard({ session }: { session: HistoryPageSession }) {
  const tone = performanceBadgeVariant(session.badgeKey);
  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-baseline gap-1">
            <span className="text-xs font-bold">{session.sesiLabel}</span>
            <span className="text-[10px] text-muted-foreground">• {session.dateLabel}</span>
          </div>
          <div className="flex shrink-0 flex-col items-end">
            <span className={`text-sm font-bold tabular-nums ${TONE_TEXT[tone]}`}>{session.scorePct.toFixed(1)}%</span>
            <span className="text-[9px] text-muted-foreground">Skor AI</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span aria-hidden className={`size-1.5 rounded-full ${TONE_DOT[tone]}`} />
          <p className="text-sm font-bold">{session.title}</p>
        </div>
        <p className="text-[10px] text-muted-foreground">{session.subtitle}</p>
      </CardHeader>
      <CardFooter className="justify-between gap-2">
        <p className="text-[10px] text-muted-foreground">{session.repetisiLabel}</p>
        <Badge variant={performanceBadgeVariant(session.badgeKey)}>{performanceBadgeLabel(session.badgeKey)}</Badge>
      </CardFooter>
    </Card>
  );
}
```

- [ ] **Step 4: Create the pagination**

Create `features/coach/components/history-pagination.tsx`:

```tsx
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

export function HistoryPagination({
  memberId,
  page,
  totalPages,
  totalSessions,
  rangeStart,
  rangeEnd,
}: {
  memberId: string;
  page: number;
  totalPages: number;
  totalSessions: number;
  rangeStart: number;
  rangeEnd: number;
}) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  return (
    <nav aria-label="Navigasi halaman riwayat sesi" className="flex flex-col gap-2.5">
      <p className="text-xs text-muted-foreground">
        Menampilkan <span className="font-bold text-foreground">{rangeStart} - {rangeEnd}</span> dari{" "}
        <span className="font-bold text-foreground">{totalSessions}</span> total sesi biomekanika
      </p>
      <div className="flex items-center justify-between gap-2">
        {page <= 1 ? (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft data-icon="inline-start" />
            Sebelumnya
          </Button>
        ) : (
          <Link
            href={`/coach/members/${memberId}/riwayat?page=${page - 1}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ChevronLeft data-icon="inline-start" />
            Sebelumnya
          </Link>
        )}
        <div className="flex items-center gap-1.5">
          {pages.map((entry) =>
            entry === page ? (
              <span key={entry} aria-current="page" className={buttonVariants({ variant: "default", size: "icon" })}>
                {entry}
              </span>
            ) : (
              <Link
                key={entry}
                href={`/coach/members/${memberId}/riwayat?page=${entry}`}
                className={buttonVariants({ variant: "outline", size: "icon" })}
              >
                {entry}
              </Link>
            )
          )}
        </div>
        {page >= totalPages ? (
          <Button variant="outline" size="sm" disabled>
            Selanjutnya
            <ChevronRight data-icon="inline-end" />
          </Button>
        ) : (
          <Link
            href={`/coach/members/${memberId}/riwayat?page=${page + 1}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Selanjutnya
            <ChevronRight data-icon="inline-end" />
          </Link>
        )}
      </div>
    </nav>
  );
}
```

- [ ] **Step 5: Create the section**

Create `features/coach/components/member-history-section.tsx`:

```tsx
import { Badge } from "@/components/ui/badge";
import { META_BADGE_VARIANT } from "@/components/shared/silat-reference";
import { HistoryPagination } from "@/features/coach/components/history-pagination";
import { HistorySessionCard } from "@/features/coach/components/history-session-card";
import type { HistoryPageSlice } from "@/features/coach/data/paginate-history";
import type { MemberHistory } from "@/features/coach/types";

export function MemberHistorySection({ history, slice }: { history: MemberHistory; slice: HistoryPageSlice }) {
  return (
    <section aria-labelledby="member-history-heading" className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <h2 id="member-history-heading" className="text-lg font-bold">
          Daftar Riwayat Sesi
        </h2>
        <Badge variant={META_BADGE_VARIANT.count}>
          {slice.sessions.length} / {history.totalSessions} Sesi
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">Catatan telemetri repetisi dan akurasi sensorik MediaPipe.</p>
      <ul className="flex flex-col gap-2.5">
        {slice.sessions.map((session) => (
          <li key={session.id}>
            <HistorySessionCard session={session} />
          </li>
        ))}
      </ul>
      <HistoryPagination
        memberId={history.memberId}
        page={slice.page}
        totalPages={slice.totalPages}
        totalSessions={history.totalSessions}
        rangeStart={slice.rangeStart}
        rangeEnd={slice.rangeEnd}
      />
    </section>
  );
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm test tests/unit/coach/member-history-sections.test.ts`
Expected: PASS.

- [ ] **Step 7: Verify the tree compiles**

Run: `pnpm typecheck`
Expected: clean.

- [ ] **Step 8: Commit**

```bash
git add features/coach/components/member-history-section.tsx features/coach/components/history-session-card.tsx features/coach/components/history-pagination.tsx tests/unit/coach/member-history-sections.test.ts
git commit -m "feat(coach): build member history list UI (PSR-101)"
```

---

### Task 3: Wire route + links (PSR-102)

**Files:**
- Move: `app/(coach)/coach/members/[id]/layout.tsx` → `app/(coach)/coach/members/[id]/(detail)/layout.tsx`
- Move: `app/(coach)/coach/members/[id]/page.tsx` → `app/(coach)/coach/members/[id]/(detail)/page.tsx`
- Create: `app/(coach)/coach/members/[id]/(history)/riwayat/layout.tsx`
- Create: `app/(coach)/coach/members/[id]/(history)/riwayat/page.tsx`
- Create: `features/coach/pages/member-history-page.tsx`
- Modify: `features/coach/components/session-history-log.tsx` (`memberId` prop; live link; drop TODO)
- Modify: `features/coach/pages/member-detail-page.tsx:60` (`memberId={detail.id}`)
- Modify: `tests/unit/coach/member-detail-route.test.ts:4-5` (paths into the `(detail)` group)
- Test: `tests/unit/coach/member-history-route.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 1–2 (`getMemberHistory`, `memberHistoryIds`, `parseHistoryPage`, `paginateHistory`, `MemberDetailProfile`, `MemberHistorySection`, `getMemberDetail`).
- Produces: `MemberHistoryPage({ id: string; searchParams: Promise<Record<string, string | string[] | undefined>> })`; routes `/coach/members/[id]` (detail group) + `/coach/members/[id]/riwayat`; live `SessionHistoryLog` link.

- [ ] **Step 1: Create the route group and move the detail files**

PowerShell (brackets/parens are literal only with `-LiteralPath`):

```powershell
New-Item -ItemType Directory -Force -LiteralPath "app/(coach)/coach/members/[id]/(detail)" | Out-Null
git mv "app/(coach)/coach/members/[id]/layout.tsx" "app/(coach)/coach/members/[id]/(detail)/layout.tsx"
git mv "app/(coach)/coach/members/[id]/page.tsx" "app/(coach)/coach/members/[id]/(detail)/page.tsx"
```

- [ ] **Step 2: Update the existing route test paths and run it**

In `tests/unit/coach/member-detail-route.test.ts` replace:

```ts
const page = readFileSync("app/(coach)/coach/members/[id]/page.tsx", "utf8");
const layout = readFileSync("app/(coach)/coach/members/[id]/layout.tsx", "utf8");
```

with:

```ts
const page = readFileSync("app/(coach)/coach/members/[id]/(detail)/page.tsx", "utf8");
const layout = readFileSync("app/(coach)/coach/members/[id]/(detail)/layout.tsx", "utf8");
```

Run: `pnpm test tests/unit/coach/member-detail-route.test.ts`
Expected: PASS.

- [ ] **Step 3: Write the failing history route test**

Create `tests/unit/coach/member-history-route.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const page = readFileSync("app/(coach)/coach/members/[id]/(history)/riwayat/page.tsx", "utf8");
const layout = readFileSync("app/(coach)/coach/members/[id]/(history)/riwayat/layout.tsx", "utf8");
const detailPage = readFileSync("app/(coach)/coach/members/[id]/(detail)/page.tsx", "utf8");
const detailLayout = readFileSync("app/(coach)/coach/members/[id]/(detail)/layout.tsx", "utf8");
const historyPage = readFileSync("features/coach/pages/member-history-page.tsx", "utf8");
const sessionLog = readFileSync("features/coach/components/session-history-log.tsx", "utf8");

describe("member history route", () => {
  it("wires the thin RSC riwayat route with static params and forwarded searchParams", () => {
    // Arrange + Act + Assert
    expect(page).toContain("MemberHistoryPage");
    expect(page).toContain("generateStaticParams");
    expect(page).toContain("memberHistoryIds");
    expect(page).toContain("searchParams");
    expect(page).not.toContain('"use client"');
    expect(page).not.toContain("getMemberHistory");
  });

  it("renders the history route inside the coach shell members tab with riwayat trail", () => {
    // Arrange + Act + Assert
    expect(layout).toContain("CoachLayout");
    expect(layout).toContain('activeTab="members"');
    expect(layout).toContain("Daftar Riwayat Sesi Member");
  });

  it("keeps the detail group shell after the move", () => {
    // Arrange + Act + Assert
    expect(detailPage).toContain("MemberDetailPage");
    expect(detailPage).toContain("generateStaticParams");
    expect(detailLayout).toContain("CoachLayout");
    expect(detailLayout).toContain('activeTab="members"');
    expect(detailLayout).toContain("Detail");
  });

  it("streams profile + history sections behind Suspense with 404 on unknown id", () => {
    // Arrange + Act + Assert
    expect(historyPage).toContain("MemberDetailProfile");
    expect(historyPage).toContain("MemberHistorySection");
    expect(historyPage).toContain("<Suspense");
    expect(historyPage).toContain("notFound");
    expect(historyPage).toContain("parseHistoryPage");
    expect(historyPage).toContain("paginateHistory");
    expect(historyPage).toContain("getMemberHistory");
    expect(historyPage).not.toContain('"use client"');
  });

  it("links Buku Semua Riwayat Atlet to the live history route", () => {
    // Arrange + Act + Assert
    expect(sessionLog).toContain("memberId");
    expect(sessionLog).toContain("`/coach/members/${memberId}/riwayat`");
    expect(sessionLog).not.toContain("TODO");
  });
});
```

Run: `pnpm test tests/unit/coach/member-history-route.test.ts`
Expected: FAIL — `ENOENT` for the `(history)/riwayat` files.

- [ ] **Step 4: Create the history layout and thin route**

Create `app/(coach)/coach/members/[id]/(history)/riwayat/layout.tsx`:

```tsx
import type { ReactNode } from "react";
import { CoachLayout } from "@/features/coach/pages/coach-layout";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <CoachLayout activeTab="members" trail={["Dashboard", "Member List", "Daftar Riwayat Sesi Member"]}>
      {children}
    </CoachLayout>
  );
}
```

Create `app/(coach)/coach/members/[id]/(history)/riwayat/page.tsx`:

```tsx
import { memberHistoryIds } from "@/features/coach/data/get-member-history";
import { MemberHistoryPage } from "@/features/coach/pages/member-history-page";

export function generateStaticParams() {
  return memberHistoryIds.map((id) => ({ id }));
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  return <MemberHistoryPage id={id} searchParams={searchParams} />;
}
```

- [ ] **Step 5: Create the page composition**

Create `features/coach/pages/member-history-page.tsx`:

```tsx
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getMemberDetail } from "@/features/coach/data/get-member-detail";
import { getMemberHistory } from "@/features/coach/data/get-member-history";
import { paginateHistory, parseHistoryPage } from "@/features/coach/data/paginate-history";
import { MemberDetailProfile } from "@/features/coach/components/member-detail-profile";
import { MemberHistorySection } from "@/features/coach/components/member-history-section";

export function MemberHistoryPage({
  id,
  searchParams,
}: {
  id: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="flex flex-col gap-5">
      <Suspense fallback={<Skeleton className="h-44 w-full rounded-3xl" />}>
        <ProfileSection id={id} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
        <HistorySection id={id} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ProfileSection({ id }: { id: string }) {
  const detail = await getMemberDetail(id);
  if (detail === null) notFound();
  return <MemberDetailProfile detail={detail} />;
}

async function HistorySection({
  id,
  searchParams,
}: {
  id: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [history, query] = await Promise.all([getMemberHistory(id), searchParams]);
  if (history === null) notFound();
  const page = parseHistoryPage(query.page);
  const slice = paginateHistory(history.sessions, page, history.pageSize);
  return <MemberHistorySection history={history} slice={slice} />;
}
```

- [ ] **Step 6: Wire the member-detail link**

In `features/coach/components/session-history-log.tsx` replace the signature line and the closing block:

```tsx
export function SessionHistoryLog({ history, memberId }: { history: HistorySession[]; memberId: string }) {
```

and replace the final comment + link with:

```tsx
      <Link
        href={`/coach/members/${memberId}/riwayat`}
        className={buttonVariants({ variant: "ghost", size: "sm", className: "w-full" })}
      >
        Buku Semua Riwayat Atlet <ChevronRight data-icon="inline-end" />
      </Link>
```

In `features/coach/pages/member-detail-page.tsx:60` change:

```tsx
  return <SessionHistoryLog history={detail.history} memberId={detail.id} />;
```

- [ ] **Step 7: Run route tests to verify they pass, then the full suite**

Run: `pnpm test tests/unit/coach/member-history-route.test.ts tests/unit/coach/member-detail-route.test.ts`
Expected: PASS.
Run: `pnpm test`
Expected: full suite PASS (no regression from the moved route files).
Run: `pnpm typecheck`
Expected: clean.

- [ ] **Step 8: Commit**

```bash
git add "app/(coach)/coach/members/[id]" features/coach/pages/member-history-page.tsx features/coach/components/session-history-log.tsx features/coach/pages/member-detail-page.tsx tests/unit/coach/member-history-route.test.ts tests/unit/coach/member-detail-route.test.ts
git commit -m "feat(coach): wire member history route + links (PSR-102)"
```

---

### Task 4: Verification + closeout

**Files:**
- Modify: `docs/superpowers/roadmap-template.md` (mirror sync)
- Linear Doc `[Roadmap] SilatSense FE — Member closeout + Coach` (same edits)

- [ ] **Step 1: Full gates**

Run: `pnpm build` → `pnpm typecheck` → `pnpm lint` → `pnpm test`
Expected: all green. Zero errors before `In Review`.

- [ ] **Step 2: Browser check (AGENTS.md dev-server protocol, port 3101)**

Start detached via WMI exactly as in AGENTS.md §Dev server (destroy leftovers first; `curl.exe` 000 confirm; remember ProcessId). Readiness with One `Get-Content -Tail 5` / single `Invoke-WebRequest -TimeoutSec 5`. Then Playwright: tab-new, resize 390×844, visit:

1. `/coach/members/aced-suryana/riwayat` — assert 10 cards, count badge `10 / 24 Sesi`, prev disabled, page 1 active (`aria-current="page"`), `document.documentElement.scrollWidth <= window.innerWidth`.
2. `?page=2` — range `11 - 20`, 10 cards, both arrows enabled.
3. `?page=3` — range `21 - 24`, 4 cards, count badge `4 / 24 Sesi`, next disabled.
4. `?page=99` — clamps to page 3 (same as above).
5. `/coach/members/aced-suryana` — click `Buku Semua Riwayat Atlet` lands on the riwayat screen.

Stop via `taskkill /PID <pid> /T /F`, confirm port free, delete `.playwright-mcp/` + temp logs, `git status --short` clean. Paste the four `scrollWidth`/`innerWidth` numbers into the review comment.

- [ ] **Step 3: Sync the roadmap mirror + Linear Doc**

In `docs/superpowers/roadmap-template.md`:

- §1: add/replace row `| Now | 12 | [Phase 12] Coach member history — demoable /coach/members/[id]/riwayat (reused profile + paginated log) |`.
- §2: append row `| 12 | Member history renders reused profile + Daftar Riwayat Sesi (count badge, 10 cards/page, tone dot + bare badge, range text, ?page= clamp); no overflow 390px | 94:40907 | docs/superpowers/specs/2026-10-19-coach-member-history-design.md | 1 parent + 3 subs |`.
- §3: append entry `| 8 | Coach member history | 94:40907 Daftar Riwayat sesi - Coach | /coach/members/[id]/riwayat | Reused athlete profile; header + 10/24 count badge + description; 24 static session cards (sesi #, date, Skor AI, tone dot, title, subtitle, repetisi + badge footer); range text + prev/pages/next pagination | MemberHistory { memberId, totalSessions: 24, pageSize: 10, sessions[24] HistoryPageSession { id, sesiLabel, dateLabel, title, subtitle, repetisiLabel, scorePct, badgeKey } } — TODO (GET /coach/members/[id]/history?page=N) |`.
- §6: append risk `- Figma card badges carry descriptive text ("Sesuai Skor Kualitas (80.0%)", "Sayap Siku Kanan (+8cm)") — user override: cards ship bare Sesuai/Remediasi/Tidak Sesuai badges only; isolated-node screenshots render component defaults, only the full frame (94:40907) is authoritative.`

Mirror the same three edits into the Linear Doc (id `53bbb274-d468-4400-ae5e-a621dc61033a`) via `linear-personal_save_document` `patch`. Commit:

```bash
git add docs/superpowers/roadmap-template.md
git commit -m "docs(coach): sync roadmap mirror with Phase 12"
```

- [ ] **Step 4: Linear closeout**

- PSR-100, PSR-101, PSR-102 → `Done` + `progress` comment each (`Done X, next Y.`).
- PSR-99 → `In Review` + `review` comment: PR URL + test steps (`open /coach/members/aced-suryana/riwayat, check 10 cards + page 1 active; ?page=3 → 4 cards + next disabled; ?page=99 → clamps; tap Buku Semua Riwayat Atlet from member detail`).
- Do not close the `[Phase 12]` milestone until all issues are `Done`.

- [ ] **Step 5: Push + PR (user-confirmed)**

```bash
git push -u origin feature/psr-99-coach-ship-member-history
gh pr create --base development --title "feat(coach): ship member history (PSR-99)" --body "Spec: docs/superpowers/specs/2026-10-19-coach-member-history-design.md. Test steps and scrollWidth evidence filled from Step 2 results."
```

Squash on merge (`development`), one task = one squashed commit.

---

## Self-review notes (recorded when plan was written)

- Spec coverage: §2 deltas → Tasks 1–3; §3 architecture → Task 3; §4 DTOs → Task 1; §5 UI → Task 2; §6 data flow → Tasks 1+3; §7 verification → Tasks 1–4.
- `memberHistoryIds` is asserted via source text, not import — Vitest cannot import `server-only` modules (confirmed: no existing test does).
- Types: `HistoryPageSession.subtitle` is present in Task 1 and consumed in Task 2 card; `HistoryPageSlice` naming consistent across Tasks 1–3.
