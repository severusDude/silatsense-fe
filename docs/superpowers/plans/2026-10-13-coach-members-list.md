# Coach Members List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/coach/members` (Figma 94:40178) — 4-stat grid, client search island, 5 member cards — inside the coach shell on dummy data.

**Architecture:** Additive to the dashboard move: new `TeamMember` DTO (+nim), new cached fetcher `TODO (GET /coach/members)`, three new presentational components reusing `coach-stage.ts` + shadcn Card/Badge patterns, one `"use client"` search island, thin RSC route. No changes to existing dashboard files.

**Tech Stack:** Next.js 16.3.8 App Router (Cache Components), React 19, shadcn `base-nova` on `@base-ui/react`, Tailwind 4, Vitest 3, `lucide-react`.

## Global Constraints

- Import with `@/` alias only (`@/features/coach/types`). Never relative imports across folders.
- Every file under `app/` except `api/` handlers is an RSC — never add `"use client"` under `app/`. Route files contain no logic; they call `features/coach/pages/*`.
- `features/coach/data/*` fetchers are server-only: first line `import "server-only"`. Never import them from a client component. Props across the boundary must be serializable.
- Every `'use cache'` pairs with a `cacheLife(...)`. Dynamic units sit behind `<Suspense>` with a `Skeleton` fallback.
- All pills are shadcn `Badge` (variants `secondary` / `outline` / `success` / `warning` only). All graphics are `lucide-react` icons. No `next/image`, no SVG illustrations.
- Flex/grid layouts only — no `absolute` in new/modified UI files.
- Stub contract: dummy lives in pure `data/*-dummy.ts` (no `server-only`); fetcher TODO names the exact endpoint `TODO (GET /coach/members)`.
- Title/heading copy Figma-verbatim where pinned: `Member List`, `Monitoring Pose Kinematika`, `5 Atlet Aktif`, `Cari nama atlet atau NIM…`, `Tidak ada atlet yang cocok.`, `Lihat Detail`.
- Each task ends green for its scope; full gates (`pnpm build` + `pnpm typecheck` + `pnpm lint` + `pnpm test`) run in Task 5.

---

## File Structure

| File | Responsibility |
|---|---|
| `features/coach/types.ts` (modify: append) | Additive `TeamMember` + `TeamMembers` interfaces. `CoachAthlete` untouched. Stats reuse `CoachStat` (no new stat type). |
| `features/coach/data/team-members-dummy.ts` (create, pure) | `dummyTeamMembers` (5 members, NIMs 2307051–2307055) + `dummyTeamMemberStats` (4 stats, no footers). |
| `features/coach/data/get-team-members.ts` (create, server-only) | Cached `getTeamMembers()` + `getTeamMemberStats()` returning the dummies. |
| `features/coach/components/filter-members.ts` (create, pure) | `filterMembers(members, query)` — case-insensitive name-or-NIM match. Keeps client logic unit-testable. |
| `features/coach/components/member-stat-grid.tsx` (create) | 4 stat tiles, `Card size="sm"`, Header Title + Action icon, Content value + Badge/note. No footers. |
| `features/coach/components/member-card-list.tsx` (create) | Outer list Card (Header Title + count Action) + per-athlete nested `Card size="sm"` (Content identity row, Footer ghost `Lihat Detail` CTA). Presentational only — rendered from RSC and from the client island. |
| `features/coach/components/member-header.tsx` (create) | H1 `Member List` + desc + `5 Atlet Aktif` Badge. |
| `features/coach/components/member-search.tsx` (create, `"use client"`) | Search island: `InputGroup` + live filter via `filterMembers` + `MemberCardList`. Only client component in this move. |
| `features/coach/pages/coach-members-page.tsx` (create) | Static shell + 3 `<Suspense>` units (header, stats, search+list). |
| `app/(coach)/coach/members/page.tsx` (create) | Thin RSC route → `CoachMembersPage`. |
| `app/(coach)/coach/members/layout.tsx` (create) | Wraps `CoachLayout` with `activeTab="members"`, trail `["Dashboard", "Member List"]`. |
| `tests/unit/coach/team-members-data.test.ts` (create) | Dummy shape + Figma literals + NIM + stage→Badge mapping. |
| `tests/unit/coach/filter-members.test.ts` (create) | Filter behavior: empty/name/NIM/partial/whitespace/no-match. |
| `tests/unit/coach/team-members-sections.test.ts` (create) | Source-structure pins (Card composition, Badge, ghost CTA, TODO, no-absolute, dropped-suffix guards). |
| `tests/unit/coach/team-members-route.test.ts` (create) | Route wiring pins (page, layout, activeTab, trail). |

---

### Task 1: Members DTOs, dummy, fetcher + data test (PSR-92)

**Files:**
- Modify: `features/coach/types.ts` (append at end)
- Create: `features/coach/data/team-members-dummy.ts`
- Create: `features/coach/data/get-team-members.ts`
- Test: `tests/unit/coach/team-members-data.test.ts`

**Interfaces:**
- Consumes: `AthleteStage` (existing, `features/coach/types.ts`), `CoachStat` (existing), `stageBadgeVariant` (existing, `features/coach/components/coach-stage.ts`)
- Produces: `TeamMember`, `TeamMembers`, `dummyTeamMembers`, `dummyTeamMemberStats`, `getTeamMembers(): Promise<TeamMembers>`, `getTeamMemberStats(): Promise<CoachStat[]>`

- [ ] **Step 1: Write the failing data test**

```ts
import { describe, expect, it } from "vitest";
import { dummyTeamMembers, dummyTeamMemberStats } from "@/features/coach/data/team-members-dummy";
import { stageBadgeVariant } from "@/features/coach/components/coach-stage";

describe("dummyTeamMembers", () => {
  it("exposes five members with Figma scores, trimmed gerakan, and NIM", () => {
    // Arrange + Act
    const rows = dummyTeamMembers.members.map((m) => [m.name, m.scorePct, m.lastGerakan, m.nim]);

    // Assert
    expect(dummyTeamMembers.totalAktif).toBe(5);
    expect(rows).toEqual([
      ["Aced Suryana", 80, "Kuda-kuda", "2307051"],
      ["Siti Nurhaliza", 76, "Tendangan", "2307052"],
      ["Rian Mahendra", 94, "Kuda-kuda", "2307053"],
      ["Fajar Pratama", 91, "Pukulan", "2307054"],
      ["Dimas Wicaksono", 88, "Tangkisan", "2307055"],
    ]);
  });

  it("pins the four member-list stats with Figma literals", () => {
    // Arrange + Act
    const rows = dummyTeamMemberStats.map((s) => [s.label, s.value, s.badge ?? null, s.note ?? null]);

    // Assert
    expect(rows).toEqual([
      ["Total Binaan", "5 Atlet", "3 Siap • 2 Remediasi", null],
      ["Rata Akurasi", "84.6%", "Target IPSI ≥ 85% (-0.4%)", null],
      ["Kelulusan", "60%", null, "Memenuhi Standar"],
      ["Sesi Rekaman", "24 Sesi", "+3.8%", "Pekan Ini Tercatat"],
    ]);
  });

  it("carries no footer pairs on member-list stats", () => {
    // Arrange + Act
    const footered = dummyTeamMemberStats.filter((s) => s.footerLeft ?? s.footerRight);

    // Assert
    expect(footered).toEqual([]);
  });

  it("maps every member stage to the dashboard Badge variant", () => {
    // Arrange + Act
    const variants = dummyTeamMembers.members.map((m) => stageBadgeVariant(m.stage));

    // Assert
    expect(variants).toEqual(["warning", "warning", "success", "success", "success"]);
  });

  it("keeps trimmed subtitles free of Figma detail suffixes", () => {
    // Arrange + Act
    const raw = JSON.stringify(dummyTeamMembers.members);

    // Assert
    expect(raw).not.toContain("Tumpuan");
    expect(raw).not.toContain("Recoil");
    expect(raw).not.toContain("Simetris");
    expect(raw).not.toContain("142");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/unit/coach/team-members-data.test.ts`
Expected: FAIL with "Failed to resolve import" for `@/features/coach/data/team-members-dummy` (file does not exist yet).

- [ ] **Step 3: Append the additive types to `features/coach/types.ts`**

Append exactly this block at the end of the file (after the `CoachOverview` interface). Do not modify any existing interface:

```ts
export interface TeamMember {
  id: string;
  initials: string;
  name: string;
  nim: string;
  stage: AthleteStage;
  stageLabel: string;
  scorePct: number;
  lastGerakan: string;
}

export interface TeamMembers {
  members: TeamMember[];
  totalAktif: number;
}
```

Stats reuse `CoachStat` unchanged (member-list stats carry no `footerLeft`/`footerRight` — leave them `undefined`).

- [ ] **Step 4: Create `features/coach/data/team-members-dummy.ts`**

```ts
import type { CoachStat, TeamMembers } from "@/features/coach/types";

// Placeholder values mirror Figma node 94:40178 (except trimmed subtitles + invented NIMs)
// until the backend lands.
export const dummyTeamMemberStats: CoachStat[] = [
  { id: "total-atlet", label: "Total Binaan", value: "5 Atlet", badge: "3 Siap • 2 Remediasi" },
  { id: "akurasi-tim", label: "Rata Akurasi", value: "84.6%", badge: "Target IPSI ≥ 85% (-0.4%)" },
  { id: "sidang-uji", label: "Kelulusan", value: "60%", note: "Memenuhi Standar" },
  { id: "fokus", label: "Sesi Rekaman", value: "24 Sesi", badge: "+3.8%", note: "Pekan Ini Tercatat" },
];

export const dummyTeamMembers: TeamMembers = {
  members: [
    { id: "aced-suryana", initials: "AS", name: "Aced Suryana", nim: "2307051", stage: "remediasi", stageLabel: "Tahap Remediasi", scorePct: 80, lastGerakan: "Kuda-kuda" },
    { id: "siti-nurhaliza", initials: "SN", name: "Siti Nurhaliza", nim: "2307052", stage: "remediasi", stageLabel: "Tahap Remediasi", scorePct: 76, lastGerakan: "Tendangan" },
    { id: "rian-mahendra", initials: "RM", name: "Rian Mahendra", nim: "2307053", stage: "siap", stageLabel: "Siap Tanding", scorePct: 94, lastGerakan: "Kuda-kuda" },
    { id: "fajar-pratama", initials: "FP", name: "Fajar Pratama", nim: "2307054", stage: "siap", stageLabel: "Siap Tanding", scorePct: 91, lastGerakan: "Pukulan" },
    { id: "dimas-wicaksono", initials: "DW", name: "Dimas Wicaksono", nim: "2307055", stage: "lolos", stageLabel: "Lolos Standar", scorePct: 88, lastGerakan: "Tangkisan" },
  ],
  totalAktif: 5,
};
```

Spelling note: `remediasi` (with e) follows the codebase `AthleteStage`; the `•` separator follows Figma.

- [ ] **Step 5: Create `features/coach/data/get-team-members.ts`**

```ts
import "server-only";

import { cacheLife } from "next/cache";

import { dummyTeamMembers, dummyTeamMemberStats } from "@/features/coach/data/team-members-dummy";
import type { CoachStat, TeamMembers } from "@/features/coach/types";

export async function getTeamMembers(): Promise<TeamMembers> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /coach/members) — dummy for now
  return dummyTeamMembers;
}

export async function getTeamMemberStats(): Promise<CoachStat[]> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /coach/members) — dummy for now
  return dummyTeamMemberStats;
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm test tests/unit/coach/team-members-data.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 7: Run typecheck for the touched scope**

Run: `pnpm typecheck`
Expected: clean, zero errors.

- [ ] **Step 8: Commit**

```bash
git add features/coach/types.ts features/coach/data/team-members-dummy.ts features/coach/data/get-team-members.ts tests/unit/coach/team-members-data.test.ts
git commit -m "feat(coach): add team members DTOs dummy fetcher"
```

- [ ] **Step 9: Linear tracking (PSR-92)**

Move PSR-92 to `In Progress` at start, then `save_comment` on PSR-92: `Done DTOs+dummy+fetcher+test, next list UI.`

---

### Task 2: Name/NIM filter helper + test (PSR-93)

**Files:**
- Create: `features/coach/components/filter-members.ts`
- Test: `tests/unit/coach/filter-members.test.ts`

**Interfaces:**
- Consumes: `TeamMember` (Task 1), `dummyTeamMembers.members` (Task 1, test fixture)
- Produces: `filterMembers(members: TeamMember[], query: string): TeamMember[]` (pure; empty/blank query returns the input array unchanged)

- [ ] **Step 1: Write the failing filter test**

```ts
import { describe, expect, it } from "vitest";
import { filterMembers } from "@/features/coach/components/filter-members";
import { dummyTeamMembers } from "@/features/coach/data/team-members-dummy";

const members = dummyTeamMembers.members;

describe("filterMembers", () => {
  it("returns all members on an empty query", () => {
    // Arrange + Act
    const result = filterMembers(members, "");

    // Assert
    expect(result).toHaveLength(5);
  });

  it("matches names case-insensitively", () => {
    // Arrange + Act
    const result = filterMembers(members, "aced");

    // Assert
    expect(result.map((m) => m.id)).toEqual(["aced-suryana"]);
  });

  it("matches a partial name across members", () => {
    // Arrange + Act
    const result = filterMembers(members, "a");

    // Assert
    expect(result.length).toBeGreaterThan(1);
    expect(result.map((m) => m.id)).toContain("rian-mahendra");
  });

  it("matches an exact NIM", () => {
    // Arrange + Act
    const result = filterMembers(members, "2307053");

    // Assert
    expect(result.map((m) => m.id)).toEqual(["rian-mahendra"]);
  });

  it("matches a shared NIM prefix", () => {
    // Arrange + Act
    const result = filterMembers(members, "230705");

    // Assert
    expect(result).toHaveLength(5);
  });

  it("trims surrounding whitespace before matching", () => {
    // Arrange + Act
    const result = filterMembers(members, "  siti  ");

    // Assert
    expect(result.map((m) => m.id)).toEqual(["siti-nurhaliza"]);
  });

  it("returns an empty list when nothing matches", () => {
    // Arrange + Act
    const result = filterMembers(members, "zzz-999");

    // Assert
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/unit/coach/filter-members.test.ts`
Expected: FAIL with "Failed to resolve import" for `@/features/coach/components/filter-members`.

- [ ] **Step 3: Create `features/coach/components/filter-members.ts`**

```ts
import type { TeamMember } from "@/features/coach/types";

export function filterMembers(members: TeamMember[], query: string): TeamMember[] {
  const q = query.trim().toLowerCase();
  if (!q) return members;
  return members.filter((m) => m.name.toLowerCase().includes(q) || m.nim.toLowerCase().includes(q));
}
```

No `"use client"`, no `server-only` — pure module, safe to import from the client island and from Vitest.

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/unit/coach/filter-members.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add features/coach/components/filter-members.ts tests/unit/coach/filter-members.test.ts
git commit -m "feat(coach): add member name/nim filter"
```

---

### Task 3: Members stat grid + card list UI (PSR-91)

**Files:**
- Create: `features/coach/components/member-stat-grid.tsx`
- Create: `features/coach/components/member-card-list.tsx`
- Test: `tests/unit/coach/team-members-sections.test.ts`

**Interfaces:**
- Consumes: `CoachStat`, `TeamMember` (Task 1); `stageBadgeVariant` (existing); `filterMembers` NOT consumed here (Task 4); `Badge`, `Button`, `Card`, `CardAction`, `CardContent`, `CardFooter`, `CardHeader`, `CardTitle` from `@/components/ui/*`; icons `Users`, `Target`, `CircleCheckBig`, `Video`, `ChevronRight` from `lucide-react`
- Produces: `MemberStatGrid({ stats: CoachStat[] })`, `MemberCardList({ members: TeamMember[]; totalAktif: number })` — both presentational, no directives, renderable from RSC and client components

- [ ] **Step 1: Write the failing sections test**

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const statGrid = readFileSync("features/coach/components/member-stat-grid.tsx", "utf8");
const cardList = readFileSync("features/coach/components/member-card-list.tsx", "utf8");

describe("member sections", () => {
  it("renders the member stat grid with four icons and no footers", () => {
    // Arrange + Act + Assert
    expect(statGrid).toContain("Statistik binaan");
    expect(statGrid).toContain("Users");
    expect(statGrid).toContain("Target");
    expect(statGrid).toContain("CircleCheckBig");
    expect(statGrid).toContain("Video");
    expect(statGrid).toContain('size="sm"');
    expect(statGrid).not.toContain("CardFooter");
    expect(statGrid).not.toContain("footerLeft");
    expect(statGrid).not.toContain("absolute");
  });

  it("renders the member card list with full Card composition and ghost CTAs", () => {
    // Arrange + Act + Assert
    expect(cardList).toContain("Monitoring Pose Kinematika");
    expect(cardList).toContain("Atlet Aktif");
    expect(cardList).toContain("<CardHeader");
    expect(cardList).toContain("<CardTitle");
    expect(cardList).toContain("<CardFooter");
    expect(cardList).toContain("<Button");
    expect(cardList).toContain('variant="ghost"');
    expect(cardList).toContain("Lihat Detail");
    expect(cardList).toContain("/coach/members/[id]");
    expect(cardList).toContain("Tidak ada atlet yang cocok");
    expect(cardList).toContain("stageBadgeVariant");
    expect(cardList).toContain('role="img"');
  });

  it("keeps pills on Badge and graphics on lucide only", () => {
    // Arrange + Act + Assert
    expect(cardList).toContain("Badge");
    expect(cardList).toContain("lucide-react");
    expect(cardList).not.toContain("MediaPipe");
    expect(cardList).not.toContain("Elevasi Siku");
    expect(cardList).not.toContain("absolute");
    expect(statGrid).not.toContain("MediaPipe");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/unit/coach/team-members-sections.test.ts`
Expected: FAIL with ENOENT (component files do not exist yet).

- [ ] **Step 3: Create `features/coach/components/member-stat-grid.tsx`**

```tsx
import { CircleCheckBig, Target, Users, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CoachStat } from "@/features/coach/types";

const statIcons = {
  "total-atlet": Users,
  "akurasi-tim": Target,
  "sidang-uji": CircleCheckBig,
  fokus: Video,
} as const;

export function MemberStatGrid({ stats }: { stats: CoachStat[] }) {
  return (
    <section aria-label="Statistik binaan" className="grid grid-cols-2 gap-2.5">
      {stats.map((stat) => {
        const Icon = statIcons[stat.id] ?? Users;
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
            <CardContent className="flex flex-col items-start gap-1.5">
              <p className="text-lg font-bold tabular-nums">{stat.value}</p>
              {stat.badge ? (
                <Badge variant={stat.id === "akurasi-tim" ? "outline" : "secondary"}>{stat.badge}</Badge>
              ) : null}
              {stat.note ? <p className="text-[11px] text-muted-foreground">{stat.note}</p> : null}
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
```

Badge mapping: `Rata Akurasi` target pill → `outline`; `Total Binaan` count pill and `Sesi Rekaman` `+3.8%` → `secondary` (spec §2).

- [ ] **Step 4: Create `features/coach/components/member-card-list.tsx`**

```tsx
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { stageBadgeVariant } from "@/features/coach/components/coach-stage";
import type { TeamMember } from "@/features/coach/types";

export function MemberCardList({ members, totalAktif }: { members: TeamMember[]; totalAktif: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monitoring Pose Kinematika</CardTitle>
        <CardAction>
          <Badge variant="secondary">{totalAktif} Atlet Aktif</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">Tidak ada atlet yang cocok.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {members.map((member) => (
              <li key={member.id}>
                <Card size="sm" className="gap-0">
                  <CardContent>
                    <div className="flex items-center gap-2.5">
                      <span
                        role="img"
                        aria-label={`Avatar ${member.name}`}
                        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground"
                      >
                        {member.initials}
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="truncate text-xs font-bold">{member.name}</h3>
                          <Badge variant={stageBadgeVariant(member.stage)}>{member.stageLabel}</Badge>
                        </div>
                        <p className="truncate text-[11px] text-muted-foreground">{member.lastGerakan}</p>
                      </div>
                      <span className="shrink-0 text-sm font-bold tabular-nums">{member.scorePct}%</span>
                    </div>
                  </CardContent>
                  {/* TODO: wire to /coach/members/[id] when the Phase 11 detail move lands */}
                  <CardFooter className="p-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-disabled="true"
                      title={`Lihat detail ${member.name} (TODO)`}
                      className="h-auto w-full justify-center gap-1 rounded-none border-0 px-2.5 py-2 text-xs font-bold text-primary hover:text-primary"
                    >
                      Lihat Detail <ChevronRight className="size-3.5" aria-hidden="true" />
                    </Button>
                  </CardFooter>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
```

Notes: `CardFooter` keeps its default `border-t` (separator above the CTA); `p-0` lets the ghost Button span full width (tailwind-merge keeps the override — same mechanism as the dashboard `gap-0` precedent). Identity row mirrors `coach-athlete-list.tsx` so dashboard/member rows stay consistent.

- [ ] **Step 5: Run the sections test to verify it passes**

Run: `pnpm test tests/unit/coach/team-members-sections.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 6: Run typecheck + lint for the new components**

Run: `pnpm typecheck && pnpm lint`
Expected: clean, zero errors.

- [ ] **Step 7: Commit**

```bash
git add features/coach/components/member-stat-grid.tsx features/coach/components/member-card-list.tsx tests/unit/coach/team-members-sections.test.ts
git commit -m "feat(coach): build members stat grid and card list"
```

- [ ] **Step 8: Linear tracking (PSR-91)**

Move PSR-91 to `In Progress` at start, then `save_comment` on PSR-91: `Done stats+cards UI, next route+search wiring.`

---

### Task 4: Search island, members page, routes (PSR-93)

**Files:**
- Create: `features/coach/components/member-search.tsx` (`"use client"`)
- Create: `features/coach/components/member-header.tsx`
- Create: `features/coach/pages/coach-members-page.tsx`
- Create: `app/(coach)/coach/members/page.tsx`
- Create: `app/(coach)/coach/members/layout.tsx`
- Test: `tests/unit/coach/team-members-route.test.ts`

**Interfaces:**
- Consumes: `filterMembers` (Task 2); `MemberStatGrid`, `MemberCardList`, `TeamMember` (Tasks 1+3); `getTeamMembers`, `getTeamMemberStats` (Task 1); `CoachLayout` (existing, `features/coach/pages/coach-layout.tsx`); `InputGroup`, `InputGroupAddon`, `InputGroupInput` (existing, `@/components/ui/input-group.tsx`); `Skeleton` (existing); `Search` icon (lucide)
- Produces: `MemberSearch({ members: TeamMember[]; totalAktif: number })` (client), `MemberHeader({ totalAktif: number })`, `CoachMembersPage()` (async RSC shell), thin `Page` + `Layout` routes

- [ ] **Step 1: Write the failing route test**

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const page = readFileSync("app/(coach)/coach/members/page.tsx", "utf8");
const layout = readFileSync("app/(coach)/coach/members/layout.tsx", "utf8");
const membersPage = readFileSync("features/coach/pages/coach-members-page.tsx", "utf8");
const search = readFileSync("features/coach/components/member-search.tsx", "utf8");

describe("members route", () => {
  it("wires the thin RSC route to the members page composition", () => {
    // Arrange + Act + Assert
    expect(page).toContain("CoachMembersPage");
    expect(page).not.toContain('"use client"');
    expect(page).not.toContain("getTeamMembers");
  });

  it("renders the members route inside the coach shell members tab", () => {
    // Arrange + Act + Assert
    expect(layout).toContain("CoachLayout");
    expect(layout).toContain('activeTab="members"');
    expect(layout).toContain("Member List");
  });

  it("streams header, stats, and search list behind Suspense units", () => {
    // Arrange + Act + Assert
    expect(membersPage).toContain("MemberHeader");
    expect(membersPage).toContain("MemberStatGrid");
    expect(membersPage).toContain("MemberSearch");
    expect(membersPage).toContain("<Suspense");
    expect(membersPage).toContain("getTeamMembers");
    expect(membersPage).toContain("getTeamMemberStats");
    expect(membersPage).not.toContain('"use client"');
  });

  it("keeps the search island client-side with name-or-NIM filtering", () => {
    // Arrange + Act + Assert
    expect(search).toContain('"use client"');
    expect(search).toContain("filterMembers");
    expect(search).toContain("Cari nama atlet atau NIM");
    expect(search).toContain("MemberCardList");
    expect(search).not.toContain("getTeamMembers");
    expect(search).not.toContain("absolute");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/unit/coach/team-members-route.test.ts`
Expected: FAIL with ENOENT (route files do not exist yet).

- [ ] **Step 3: Create `features/coach/components/member-header.tsx`**

```tsx
import { Badge } from "@/components/ui/badge";

export function MemberHeader({ totalAktif }: { totalAktif: number }) {
  return (
    <section aria-labelledby="members-heading" className="flex items-start justify-between gap-3">
      <div className="flex flex-col gap-1">
        <h1 id="members-heading" className="text-xl font-bold tracking-tight">
          Member List
        </h1>
        <p className="text-xs text-muted-foreground">Pantau perkembangan tiap atlet binaan UKM UNSIL.</p>
      </div>
      <Badge variant="secondary" className="shrink-0">
        {totalAktif} Atlet Aktif
      </Badge>
    </section>
  );
}
```

- [ ] **Step 4: Create `features/coach/components/member-search.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { filterMembers } from "@/features/coach/components/filter-members";
import { MemberCardList } from "@/features/coach/components/member-card-list";
import type { TeamMember } from "@/features/coach/types";

export function MemberSearch({ members, totalAktif }: { members: TeamMember[]; totalAktif: number }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => filterMembers(members, query), [members, query]);

  return (
    <div className="flex flex-col gap-2.5">
      <InputGroup className="h-10">
        <InputGroupAddon>
          <Search className="size-4" aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama atlet atau NIM…"
          aria-label="Cari nama atlet atau NIM"
        />
      </InputGroup>
      <MemberCardList members={filtered} totalAktif={totalAktif} />
    </div>
  );
}
```

Notes: `InputGroup` (flex, no absolute) satisfies the no-absolute rule. Only serializable props (`members`, `totalAktif`) cross into this client component; fetchers are never imported here.

- [ ] **Step 5: Create `features/coach/pages/coach-members-page.tsx`**

```tsx
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getTeamMembers, getTeamMemberStats } from "@/features/coach/data/get-team-members";
import { MemberHeader } from "@/features/coach/components/member-header";
import { MemberStatGrid } from "@/features/coach/components/member-stat-grid";
import { MemberSearch } from "@/features/coach/components/member-search";

export function CoachMembersPage() {
  return (
    <div className="flex flex-col gap-5">
      <Suspense fallback={<Skeleton className="h-14 w-full rounded-3xl" />}>
        <HeaderSection />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-44 w-full rounded-3xl" />}>
        <StatSection />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-80 w-full rounded-3xl" />}>
        <ListSection />
      </Suspense>
    </div>
  );
}

async function HeaderSection() {
  const data = await getTeamMembers();
  return <MemberHeader totalAktif={data.totalAktif} />;
}

async function StatSection() {
  const stats = await getTeamMemberStats();
  return <MemberStatGrid stats={stats} />;
}

async function ListSection() {
  const data = await getTeamMembers();
  return <MemberSearch members={data.members} totalAktif={data.totalAktif} />;
}
```

- [ ] **Step 6: Create `app/(coach)/coach/members/page.tsx`**

```tsx
import { CoachMembersPage } from "@/features/coach/pages/coach-members-page";

export default function Page() {
  return <CoachMembersPage />;
}
```

- [ ] **Step 7: Create `app/(coach)/coach/members/layout.tsx`**

```tsx
import type { ReactNode } from "react";
import { CoachLayout } from "@/features/coach/pages/coach-layout";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <CoachLayout activeTab="members" trail={["Dashboard", "Member List"]}>
      {children}
    </CoachLayout>
  );
}
```

Mirrors `app/(coach)/coach/layout.tsx` (default dasbor tab) with the members tab + trail.

- [ ] **Step 8: Run the route test to verify it passes**

Run: `pnpm test tests/unit/coach/team-members-route.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 9: Run typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: clean, zero errors.

- [ ] **Step 10: Commit**

```bash
git add features/coach/components/member-search.tsx features/coach/components/member-header.tsx features/coach/pages/coach-members-page.tsx "app/(coach)/coach/members/page.tsx" "app/(coach)/coach/members/layout.tsx" tests/unit/coach/team-members-route.test.ts
git commit -m "feat(coach): wire members route with search"
```

- [ ] **Step 11: Linear tracking (PSR-93)**

Move PSR-93 to `In Progress` at start, then `save_comment` on PSR-93: `Done route+search wiring, next gates+browser verify.`

---

### Task 5: Full gates + browser check + review (PSR-93 verify)

**Files:** none (verification only; no code changes expected — if gates fail, fix forward in the owning task's files with a `fix(coach): …` commit).

- [ ] **Step 1: Run the full unit suite**

Run: `pnpm test`
Expected: all suites PASS, including the 4 pre-existing coach suites (no regressions).

- [ ] **Step 2: Run typecheck, lint, and production build**

Run: `pnpm typecheck && pnpm lint && pnpm build`
Expected: zero errors; build completes. Read the full output — do not skim.

- [ ] **Step 3: Start the dev server detached (returns instantly, never foreground)**

First free the port and confirm it is dead, then start via WMI on a fresh port (e.g. 3103; never reuse a port from an earlier run):

```powershell
Get-NetTCPConnection -LocalPort 3103 -ErrorAction SilentlyContinue
curl.exe -s -o NUL -w "%{http_code}" http://localhost:3103 --max-time 3
Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = 'cmd.exe /c pnpm dev --port 3103 > C:\Users\Lutfi\AppData\Local\Temp\opencode\next-dev-3103.log 2>&1'; CurrentDirectory = 'C:\Users\Lutfi\Documents\Github\silatsense-fe' }
```

Expected: `000` from curl (port free), WMI `ReturnValue 0` with a `ProcessId`. Remember the ProcessId.

- [ ] **Step 4: Check readiness with fast bounded calls only**

Run: `Get-Content -Tail 5 C:\Users\Lutfi\AppData\Local\Temp\opencode\next-dev-3103.log` and look for `Ready in`. If not ready, do other work or issue ONE `Start-Sleep -Seconds 15` then re-check (cap ~3 re-checks; if still not ready, read the log tail, kill the tree, and report instead of hanging).

- [ ] **Step 5: Drive `/coach/members` with Playwright and run the overflow check**

Open via tab-new first (bare navigate fails with no open tab), navigate to `http://localhost:3103/coach/members`, then evaluate:

```js
document.documentElement.scrollWidth <= window.innerWidth
```

Expected: `true` at 390px viewport. Also spot-check: (a) 4 stat tiles + 5 member cards render with Figma copy, (b) typing `siti` in the search filters to 1 card, typing `230705` shows 5, typing `zzz` shows `Tidak ada atlet yang cocok.`, (c) each card carries a ghost `Lihat Detail` dead CTA. Screenshot only if needed.

- [ ] **Step 6: Stop the server and delete artifacts every time**

```powershell
taskkill /PID <processId> /T /F
Get-NetTCPConnection -LocalPort 3103 -ErrorAction SilentlyContinue
Remove-Item C:\Users\Lutfi\AppData\Local\Temp\opencode\next-dev-3103.log -ErrorAction SilentlyContinue
```

Expected: port query returns empty (port free). Then verify no artifacts remain: `git status --short` shows no `.playwright-mcp/` or log files.

- [ ] **Step 7: Push, open the PR, and move to In Review**

```bash
git push -u origin feature/psr-90-coach-ship-members-list
gh pr create --base development --title "feat(coach): ship members list (PSR-90)" --body "Parent PSR-90 + subs PSR-92/91/93. Spec docs/superpowers/specs/2026-10-13-coach-members-design.md."
```

Then move PSR-90 (and subs PSR-92/91/93) to `In Review` with one `review` comment on PSR-90 carrying the PR URL + 2–4 test steps, e.g.:

`In Review: <PR URL>. Test: (1) open /coach/members at 390px, scrollWidth<=innerWidth true; (2) search "siti" -> 1 card, "230705" -> 5, "zzz" -> empty state; (3) 5 ghost Lihat Detail CTAs carry Phase-11 TODO; (4) pnpm build+typecheck+lint+test green.`

No commit in this task (one task = one squashed commit on `development` at merge; the squash message follows `<type>(<scope>): <summary>`).
