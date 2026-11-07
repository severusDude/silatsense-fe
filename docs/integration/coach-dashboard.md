# Coach Dashboard (`/coach`) — FE ↔ BE Integration Spec

- **Status:** Approved — Phase 1 assessment + Phase 2 spec approved 2026-11-07. Implementation not started.
- **Date:** 2026-11-07
- **Scope:** Coach Dashboard only (`/coach`, `features/coach/pages/coach-dashboard-page.tsx`, `features/coach/components/coach-header.tsx`, `coach-top-nav.tsx`, `coach-stat-grid.tsx`, `coach-athlete-list.tsx`, `coach-pillar-monitor.tsx`, `coach-posture-grid.tsx`, `features/coach/data/get-coach-overview.ts`, `coach-overview-dummy.ts`).
- **Out of scope:** Coach members list (`/coach/members`), coach member detail (`/coach/members/[id]`), coach member history (`/coach/members/[id]/riwayat`), coach reports (`/coach/laporan`), shared profile (`/profil`), all member routes, backend changes, PDF export implementation, chart libraries.
- **BE source of truth:** `https://silatsense-be.vercel.app/openapi.json` (v0.7.0, fetched 2026-11-07). Generated client in `src/api/` is in sync with this contract for the coach endpoints.
- **FE baseline:** Next.js 16.3.8 (`cacheComponents: true`), React 19.2.8, TanStack Query 5.104.1, Zod 4.6.5, `@hey-api/openapi-ts` 0.99.0 generated client in `src/api/`.
- **Canonical conventions:** [`docs/integration/README.md`](./README.md), [`docs/integration/member-dashboard.md`](./member-dashboard.md), [`docs/integration/Training.md`](./Training.md).

---

## 0. TL;DR

`/coach` currently runs on **100% static dummy data** (`features/coach/data/coach-overview-dummy.ts`) behind a Next.js 16 `'use cache'` + `cacheLife("minutes")` reader (`features/coach/data/get-coach-overview.ts`). The PDF report CTA is dead, the coach avatar hardcodes `KF`, and the header hardcodes `5 atlet`.

The live backend supports the dashboard's two core reads:

1. `GET /api/v1/coach/overview` → `CoachOverview { memberCount, reviewQueueCount, statistics, recentSessions, topIssues }`
2. `GET /api/v1/coach/roster?limit=5` → `RosterPage { items: RosterMember[], nextCursor }`

The contract does **not** provide several Figma-derived dashboard concepts:

1. **No aggregated team accuracy `%` or 85% threshold.** `statistics.similarityGroups` exposes per-movement/version similarity points (`0..100`), not a composite “Akurasi Tim”.
2. **No athlete identity in `CoachOverview`.** `recentSessions` has no member name/id, so the athlete list must come from `/coach/roster`.
3. **No athlete stage classification** (`Siap Tanding` / `Tahap Remediasi` / `Lolos Standar`) and no stage thresholds. Review status is available on `latestSession.session`.
4. **No qualitative pillar statuses** (`Stabil` / `Optimal` / `Deviasi` / `Remediasi`) and no per-pillar pass/fail threshold.
5. **No fixed 5-point posture scores or percentages.** `topIssues` only exposes `{ feature, sessionCount }` — no `bodyPart`, `severity`, angle, or per-point `%`.
6. **No report endpoint** (`GET /coach/report` does not exist).

**Approved direction (2026-11-07):** keep a single request-time cached RSC view model that reads overview + roster (`limit=5`) in parallel, maps only BE-supported values, and renders unsupported slots with Honest UI (`Segera hadir` / dimmed) per [`README.md`](./README.md) §6.1. No backend change request is required for the dashboard itself.

**Approved product decisions:** `Akurasi Tim` stays inactive; posture uses dynamic `topIssues`; labels become `Ulasan Tertunda` and `Isu Teratas`; athlete badges use session-review status; the roster shows 5 rows; the report CTA stays disabled; the 85% target is dimmed.

---

## 1. Phase 1 Assessment — Current FE Inventory (`/coach`)

### 1.1 Routes, Layouts, and Page Compositions

| Route / File | Server / Client | Current Behavior & Data Flow |
|---|---|---|
| `app/(coach)/layout.tsx` | Server (RSC) | Wraps all coach routes in `<Suspense fallback={null}><AuthGate role="coach">{children}</AuthGate></Suspense>`. `AuthGate` calls `requireRole("coach")` → `getSession()` (`GET /api/v1/auth/session`). |
| `app/(coach)/coach/layout.tsx` | Server (RSC) | Passthrough fragment (`<>{children}</>`). |
| `app/(coach)/coach/page.tsx` | Server (RSC) | Thin route: `<CoachLayout><CoachDashboardPage /></CoachLayout>`. |
| `features/coach/pages/coach-layout.tsx` | Server (RSC) | Renders `<CoachTopNav trail={trail} />`, centered `<main className="max-w-[448px]">`, and `<CoachBottomNav activeTab={activeTab} />`. |
| `features/coach/pages/coach-dashboard-page.tsx` | Server (RSC) | Static header + 4 independent `<Suspense>` sections (`StatSection`, `AthleteSection`, `PillarSection`, `PostureSection`). **Each section calls `getCoachOverview()` separately.** |

### 1.2 Components in `/coach`

| Component / Helper | Server / Client | Props | Current Responsibility, Assumed Data & Dead CTAs |
|---|---|---|---|
| `features/coach/components/coach-header.tsx` (`CoachHeader`) | Server | — | H1 `Dashboard Pelatih`, description with hardcoded `5 atlet binaan`, and a dead `<Button aria-disabled="true" title="Unduh rapor (TODO)">Unduh Rapor Tim (PDF)</Button>` (`TODO (GET /coach/report)`). |
| `features/coach/components/coach-top-nav.tsx` (`CoachTopNav`) | Server | `{ trail?: string[] }` | Sticky top nav with brand, **hardcoded `KF` coach avatar** with `aria-label="Avatar pelatih Kang Fauzan"`, breadcrumb, and `<Badge variant="success">Cloud Sinkron</Badge>`. |
| `features/coach/components/coach-stat-grid.tsx` (`CoachStatGrid`) | Server | `{ stats: CoachStat[] }` | 2×2 stat tiles. Renders `stat.value` (all strings), optional `badge`, optional `note`, and optional `footerLeft`/`footerRight` pair. Icons: `Users`, `Target`, `Clock`, `Wrench`. |
| `features/coach/components/coach-athlete-list.tsx` (`CoachAthleteList`) | Server | `{ athletes: CoachAthlete[] }` | `Ringkasan Latihan Member` card with a hardcoded `5 Atlet` Badge and one mini-card per athlete: initials avatar, name, stage Badge, `lastGerakan` subtitle, `scorePct` with `%`, and a **dead per-row `Lihat Detail` Button** (`TODO: /coach/members/[id]`). |
| `features/coach/components/coach-stage.ts` (`stageBadgeVariant`) | Pure TS | `stage: AthleteStage` | Maps `remediasi` → `warning`, otherwise `success`. Also used by the coach members list; **leave unchanged for that module**. |
| `features/coach/components/coach-pillar-monitor.tsx` (`CoachPillarMonitor`) | Server | `{ pillars: CoachPillar[] }` | `Monitoring 4 Pilar Gerakan` card with a static `Target ≥ 85%` outline Badge. Each row renders `{avgPct.toFixed(1)}%`, a status Badge (`Stabil` success, `Optimal` secondary, `Deviasi Siku`/`Remediasi` warning), and a progress bar width of `avgPct%`. |
| `features/coach/components/coach-posture-grid.tsx` (`CoachPostureGrid`) | Server | `{ posture: PosturePoint[] }` | `5 Titik Validasi Postur Tim` card. First 4 items render as 2×2 tiles with `scorePct%` + status Badge; the 5th renders as a warning banner (`name — scorePct% statusLabel`). |
| `features/coach/components/coach-bottom-nav.tsx` (`CoachBottomNav`) | Server | `{ activeTab?: CoachTab }` | Four tabs: `Dasbor` (`/coach`), `Member List` (`/coach/members`), `Laporan` (`/coach/laporan`, currently dead route), `Profil` (`/profil`). Not part of this move except for regression checks. |

### 1.3 Local Types, Mocks, Data Fetching, and Tests

- **Local types (`features/coach/types.ts`, dashboard-related only):**
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
    slug: PilarSlug;
    name: string;
    avgPct: number;
    status: PillarStatus;
    statusLabel: string;
  }

  export interface CoachStat {
    id: "total-atlet" | "akurasi-tim" | "sidang-uji" | "fokus";
    label: string;
    value: string;
    badge?: string;
    note?: string;
    footerLeft?: string;
    footerRight?: string;
  }

  export interface PosturePoint {
    id: PostureParamId; // "bahu" | "siku-kanan" | "pinggul" | "lutut" | "pergelangan"
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
  `CoachStat`, `AthleteStage`, and `TeamMember` are also used by the coach members list; dashboard changes must not break that module.

- **Mocks / fixtures:** `features/coach/data/coach-overview-dummy.ts` exports `dummyCoachOverview` with Figma-verbatim values (5 athletes, 84.6%, 2-session queue, 4 pillars, 5 posture points).
- **Data fetching:** `features/coach/data/get-coach-overview.ts`:
  - Uses `'use cache'` + `cacheLife("minutes")` — **forbidden for authenticated reads** by [`README.md`](./README.md) §9.
  - Carries `// TODO: connect backend via lib/api-client.ts (GET /coach/overview) — dummy for now` and returns `dummyCoachOverview`.
- **Unit tests:**
  - `tests/unit/coach/coach-overview-data.test.ts` — pins the dummy shape and Figma literals.
  - `tests/unit/coach/coach-sections.test.ts` — source-inspects `CoachStatGrid` and `CoachAthleteList` (dead CTA, `5 Atlet`, `/coach/members/[id]` TODO).
  - `tests/unit/coach/coach-shell.test.ts` — asserts hardcoded `KF`, `Cloud Sinkron`, `Dashboard Pelatih`, dead PDF CTA, and `GET /coach/report`.

---

## 2. Phase 1 Assessment — Backend Contract Snapshot

### 2.1 Endpoints Relevant to `/coach`

All endpoints require `HTTPBearer` (`Authorization: Bearer <accessToken>`).

| # | Method + Path | Params / Query | Request Body | Success Response | Error Statuses & Shape | Generated SDK Function |
|---|---|---|---|---|---|---|
| 1 | `GET /api/v1/coach/overview` | — | — | `200 CoachOverview` | `401, 403, 404, 409, 410, 416, 422, 500` (`DomainErrorOut`) | `overviewApiV1CoachOverviewGet` |
| 2 | `GET /api/v1/coach/roster` | `limit?: 1..100` (default `20`), `cursor?: string \| null`, `q?: string` (max `120`) | — | `200 RosterPage` | `401, 403, 404, 409, 410, 416, 422, 500` (`DomainErrorOut`) | `rosterApiV1CoachRosterGet` |
| 3 | `GET /api/v1/auth/session` | — | — | `200 AuthUser` | `401, 422, 500` (`DomainErrorOut`) | `authSessionApiV1AuthSessionGet` (already called and memoized by `getSession()` in `features/auth/data/session.ts`) |

**No `GET /coach/report` endpoint exists.** The PDF CTA cannot be wired in this move.

### 2.2 Generated Wire DTOs (from `src/api/types.gen.ts`)

Copied verbatim from the generated client (**generated — never edit**):

```ts
export type CoachOverview = {
  memberCount: number;
  reviewQueueCount: number;
  statistics: ActivitySummary;
  recentSessions: Array<HistoryItem>;
  topIssues: Array<IssueCount>;
};

export type ActivitySummary = {
  completedSessionCount: number;
  totalDurationSeconds: number;
  durationSampleCount: number;
  scoredSessionCount: number;
  excludedScoreCount: number;
  similarityGroups: Array<SimilarityGroup>;
};

export type SimilarityGroup = {
  movementSlug: string;
  method: string;
  analyzerVersion: string;
  featureVersion: string;
  referenceVersion: string;
  averageScore: number | null; // 0..100 similarity points, not composite accuracy %
  sampleCount: number;
};

export type IssueCount = {
  feature: string;
  sessionCount: number;
};

export type HistoryItem = {
  session: SessionOut;
  movementName: string;
  score: number | null; // 0..100 similarity points
  scoreReason: string | null;
  review?: PublishedReview | null;
};

export type SessionOut = {
  id: string;
  movementSlug: "kuda-kuda" | "pukulan" | "tangkisan" | "tendangan";
  createdAt: string;
  uploadedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  processingStatus: "queued" | "processing" | "completed" | "failed";
  analysisStatus: string | null;
  evaluationId: string | null;
  reviewStatus?: "pending" | "approved" | "needs_revision";
  reviewAvailable?: boolean;
  retryOf: string | null;
  acknowledgedAt: string | null;
  error: SessionFailure | null;
  media: MediaOut;
};

export type RosterMember = {
  profile: ProfileOut;
  latestSession: HistoryItem | null;
};

export type RosterPage = {
  items: Array<RosterMember>;
  nextCursor: string | null;
};

export type ProfileOut = {
  id: string;
  role: "member" | "coach";
  fullName: string;
  npm: string | null;
  email: string | null;
  emailVerifiedAt: string | null;
  division: string | null;
  title: string | null;
  belt: string | null;
  beltTarget: string | null;
  passwordChangedAt: string | null;
  coach: CoachIdentity | null;
  createdAt: string;
  statistics: ActivitySummary | null;
};

export type AuthUser = {
  id: string;
  fullName: string;
  identifier: string;
  role: "member" | "coach";
};

export type DomainErrorOut = {
  detail: string;
  code: string;
  requestId: string;
  errors?: Array<ValidationIssue> | null;
};
```

### 2.3 Generated Zod Schemas (`src/api/zod.gen.ts`)

```ts
export const zCoachOverview = z.object({
  memberCount: z.int(),
  reviewQueueCount: z.int(),
  statistics: zActivitySummary,
  recentSessions: z.array(zHistoryItem),
  topIssues: z.array(zIssueCount),
});

export const zRosterMember = z.object({
  profile: zProfileOut,
  latestSession: zHistoryItem.nullable(),
});

export const zRosterPage = z.object({
  items: z.array(zRosterMember),
  nextCursor: z.string().nullable(),
});

export const zRosterApiV1CoachRosterGetQuery = z.object({
  limit: z.int().gte(1).lte(100).optional().default(20),
  cursor: z.string().nullish(),
  q: z.string().max(120).optional().default(""),
});

export const zOverviewApiV1CoachOverviewGetResponse = zCoachOverview;
export const zRosterApiV1CoachRosterGetResponse = zRosterPage;
```

### 2.4 Generated TanStack Query Options

- `overviewApiV1CoachOverviewGetOptions()` / `overviewApiV1CoachOverviewGetQueryKey()`
- `rosterApiV1CoachRosterGetOptions({ query: { limit } })` / `rosterApiV1CoachRosterGetQueryKey({ query: { limit } })`
- `rosterApiV1CoachRosterGetInfiniteOptions()` / `...InfiniteQueryKey()` exist but are **not used** on the dashboard (one page of 5 rows).

> Query keys include `headers` if they are passed to the key factory. For stable invalidation, call key factories **without** the auth header: `overviewApiV1CoachOverviewGetQueryKey()` and `rosterApiV1CoachRosterGetQueryKey({ query: { limit: 5 } })`. The auth header is added only on the server-side SDK call.

---

## 3. Phase 1 & 2 — Gap Analysis

Status legend:
- **Match** — directly supported with the same semantics.
- **Mismatch** — field name, structure, unit, nullability, or enum differs; resolved in the mapper.
- **Missing in BE** — UI expects data not exposed; rendered inactive (`opacity-60 bg-muted/20 border-dashed`) with `Segera hadir`.
- **Derived** — computed from real BE fields with an explicit rule.
- **Unused in BE** — exposed but not needed on `/coach`.

### 3.1 Header & Shell (`CoachHeader`, `CoachTopNav`)

| FE Need | BE Endpoint & Field | Status | Notes |
|---|---|---|---|
| Header description `5 atlet binaan` | `GET /api/v1/coach/overview` → `memberCount` | **Mismatch (static copy)** | Header renders outside the data Suspense boundary. Remove the hardcoded `5` and use neutral copy (`atlet binaan UKM UNSIL`); the live count is shown in the `Total Atlet` stat. |
| Coach avatar `KF` / `Avatar pelatih Kang Fauzan` | `GET /api/v1/auth/session` → `AuthUser.fullName` | **Mismatch (hardcoded)** | Follow `MemberTopNav`: async initials child inside `<Suspense>`, `getInitials(user.fullName)`, `User` icon fallback when `fullName` is empty. `AuthGate role="coach"` already calls the same memoized `getSession()`. |
| `Cloud Sinkron` badge | — | **Missing in BE (decorative)** | Keep as static shell copy; it is a connection indicator, not a reported backend metric. |
| `Unduh Rapor Tim (PDF)` | — | **Missing in BE (endpoint)** | No `/coach/report`. Keep the Button `aria-disabled="true"` and add visible `Segera hadir` microcopy so it is intentionally inactive. |

### 3.2 Stat Grid (`CoachStatGrid`)

| FE Stat / Slot | BE Endpoint & Field | Status | Notes |
|---|---|---|---|
| `Total Atlet` value (`5 Atlet`) | `CoachOverview.memberCount` | **Match** | `${memberCount} Atlet`. |
| `Total Atlet` badge (`3 Siap 2 Remediasi`) | — | **Missing in BE** | No athlete stage/readiness classification. Render dimmed `Rincian tahap: Segera hadir`. |
| `Total Atlet` footer (`Ketuntasan 60%`) | — | **Missing in BE** | No completion/graduation ratio. Keep `Ketuntasan` label; dim `Segera hadir` on the right. |
| `Akurasi Tim` value (`84.6%`) | `statistics.similarityGroups[].averageScore` | **Missing in BE (aggregate)** | BE exposes per-movement/version similarity points, not a composite team accuracy. Do **not** synthesize an overall average. Render dimmed `Segera hadir`. |
| `Akurasi Tim` badge (`Target ≥ 85% (-0.4%)`) | — | **Missing in BE** | No target/threshold config or delta. Render dimmed `Target ≥ 85%` (or `Segera hadir` if product prefers). |
| `Akurasi Tim` footer left (`24 Sesi`) | `statistics.scoredSessionCount` | **Derived** | `Sesi Dinilai` + count. This is the active, real metric in this card. |
| `Akurasi Tim` footer right (`+3.8%`) | — | **Missing in BE** | No trend/delta. Render dimmed `Segera hadir`. |
| `Sidang Uji` value (`2 Sesi`) | `CoachOverview.reviewQueueCount` | **Match** | `${reviewQueueCount} Antrean` (or `${reviewQueueCount} Sesi`). |
| `Sidang Uji` note (`Aced S., Siti N.`) | — | **Missing in BE** | `reviewQueueCount` has no names. Deriving names from roster `latestSession.reviewStatus === "pending"` is unreliable (the queue may contain older sessions and only one latest session per member is returned). Render dimmed `Nama antrean: Segera hadir`. |
| `Sidang Uji` footer (`Uji Dojo 2 Okt 2026`) | — | **Missing in BE** | No exam schedule/date. Replace with real `Total Sesi` / `statistics.completedSessionCount`, or dim the original footer. |
| `Fokus Utama` value (`Elevasi Siku`) | `CoachOverview.topIssues[0].feature` | **Derived** | Humanize `feature` (`humanizeIdentifier`); no hardcoded anatomy dictionary. If `topIssues` is empty, `Belum ada isu`. |
| `Fokus Utama` note | `topIssues[0].sessionCount` | **Derived** | `${sessionCount} sesi terindikasi`. |

> **Approved rename (Q3):** the integrated dashboard renders `Sidang Uji` as **`Ulasan Tertunda`** and `Fokus Utama` as **`Isu Teratas`**. This supersedes the Figma-verbatim labels recorded in `docs/superpowers/specs/2026-10-12-coach-dashboard-design.md` §2. Internal stat ids (`sidang-uji`, `fokus`) stay unchanged for icon mapping.

### 3.3 Athlete List (`CoachAthleteList`)

| FE Need | BE Endpoint & Field | Status | Notes |
|---|---|---|---|
| 5 athlete rows | `GET /api/v1/coach/roster?limit=5` → `RosterPage.items` | **Mismatch (source)** | `CoachOverview.recentSessions` has no member identity. Use roster as the only source of athlete rows. BE ordering is authoritative; FE does not re-sort. |
| Header count badge (`5 Atlet`) | `CoachOverview.memberCount` + `roster.items.length` | **Derived** | `${memberCount} Atlet`; if `items.length < memberCount`, show `${items.length} dari ${memberCount} Atlet` so truncation is explicit. |
| `initials` (`AS`) | `RosterMember.profile.fullName` | **Derived** | `getInitials(fullName)` from `@/components/shared/silat-reference`. |
| `name` | `RosterMember.profile.fullName` | **Match** | — |
| `stage` / `stageLabel` (`Tahap Remediasi`, `Siap Tanding`, `Lolos Standar`) | `latestSession.session.reviewStatus` + `processingStatus` | **Missing in BE (classification)** | No stage thresholds. Replace the stage badge with a real session-review badge: `Belum Ada Sesi` (outline), `Diproses` (secondary), `Menunggu Ulasan` (secondary), `Disetujui` (success), `Perlu Revisi` (warning), `Gagal` (destructive). |
| `scorePct` (`80%`) | `RosterMember.latestSession.score` | **Mismatch (unit & nullable)** | `score` is `0..100` similarity points. Render `${formatScore(score)} poin` or `Belum dinilai`. Never append `%`. |
| `lastGerakan` (`Kuda-kuda`) | `latestSession.movementName` + `latestSession.session.movementSlug` | **Derived** | `movementName || PILAR_NAMES[movementSlug]`; when `latestSession === null`, `Belum ada sesi`. |
| Per-row `Lihat Detail` dead Button | Existing FE route `/coach/members/[id]` | **Mismatch (dead CTA)** | Wire to `<Link href={`/coach/members/${profile.id}`}>`. The detail page remains dummy; linking is in scope, changing that page is not. |
| Empty roster / no members | `RosterPage.items = []` or `roster === null` | **Empty state** | Render `Belum ada atlet binaan` with a neutral caption. Do not invent stage rows. |

### 3.4 Pillar Monitor (`CoachPillarMonitor`)

| FE Need | BE Endpoint & Field | Status | Notes |
|---|---|---|---|
| 4 pillars (`kuda-kuda`, `pukulan`, `tangkisan`, `tendangan`) | `statistics.similarityGroups` + canonical `PILAR_NAMES` | **Derived** | Render 4 canonical pillars in the current Figma order (`kuda-kuda`, `tangkisan`, `pukulan`, `tendangan`). |
| `avgPct` (`94.8%`) | `SimilarityGroup.averageScore` | **Mismatch (unit & nullable)** | Apply the `toSimilarity` rule from `Training.md`: only show a number when exactly **one** group matches `movementSlug`, `averageScore !== null`, and `sampleCount > 0`. Render `${formatScore(averageScore)} poin`; otherwise `Belum dinilai`. |
| `status` / `statusLabel` (`Stabil`, `Optimal`, `Deviasi Siku`, `Remediasi`) | — | **Missing in BE (thresholds)** | No qualitative status thresholds. Use `Terdata` (success) when a single unambiguous score exists, `Belum Dinilai` (outline) otherwise. Never infer `Stabil`/`Optimal`/`Deviasi`/`Remediasi`. |
| Sample detail (`4/4 Variasi`) | `SimilarityGroup.sampleCount` | **Derived** | `${sampleCount} sesi dinilai`; when multiple incompatible groups exist, sum samples but keep the score unavailable and label `Multi-versi`. |
| Progress bar width | `averageScore` | **Derived** | Width = `score` (0..100). Aria label uses `poin`, not `persen`. |
| Header badge `Target ≥ 85%` | — | **Missing in BE** | No threshold config. Render dimmed `Ambang target: Segera hadir`. |
| Empty (`similarityGroups` empty) | `statistics.similarityGroups = []` | **Empty state** | All four pillars `Belum dinilai`, bars at 0, no fabricated numbers. |

### 3.5 Posture Grid (`CoachPostureGrid`)

| FE Need | BE Endpoint & Field | Status | Notes |
|---|---|---|---|
| 5 fixed anatomy points (`Bahu & Leher`, `Siku Kanan`, `Torsi Pinggul`, `Fleksi Lutut`, `Pronasi Pergelangan`) | — | **Missing in BE** | `IssueCount` has only `feature` + `sessionCount`; no `bodyPart`, `scorePct`, angle, or status. Do not force the old 5 `PostureParamId`s — the analyzer's feature vocabulary is not guaranteed to match. |
| Per-point `scorePct` (`92%`, `64%`, `88%`, `91%`, `58%`) | — | **Missing in BE** | No per-feature score/percentage. Do not render a fake `%`. |
| Per-point status (`Sesuai`, `Deviasi`, `Terdeteksi (+10.5°)`) | — | **Missing in BE** | No severity/deviation aggregation on the coach overview. |
| Warning banner (`5. Pronasi Pergelangan — 58% Terdeteksi (+10.5°)`) | `topIssues[0]` | **Mismatch (shape)** | Render `${humanizeIdentifier(feature)} — ${sessionCount} sesi terindikasi`. No angle/percentage. |
| 2×2 tiles + banner structure | `topIssues` | **Adapted** | Banner = `topIssues[0]`; tiles = the next up to 4 issues (`slice(1, 5)`). If more than 5 issues exist, show muted `+N isu lainnya`. If `topIssues` is empty, show `Belum ada isu postur terdeteksi`. Change the section title from `5 Titik Validasi Postur Tim` to `Isu Postur Teratas Tim` (approved Q2). |

### 3.6 Unused BE Fields on the Dashboard

| BE Field | Type | Status | Notes |
|---|---|---|---|
| `recentSessions` | `HistoryItem[]` | **Unused in BE** | No member identity, and the dashboard design has no recent-session list. Candidate for a future “Aktivitas Terbaru” section. |
| `statistics.totalDurationSeconds` / `durationSampleCount` | `number` / `number` | **Unused in BE** | No duration metric on the dashboard stat grid. |
| `statistics.excludedScoreCount` | `number` | **Unused in BE** | Could support a data-quality tooltip later. |
| `roster.profile.npm`, `email`, `division`, `title`, `belt`, `beltTarget`, `coach`, `createdAt`, `statistics` | mixed | **Unused in BE** | Needed by members list/detail, not the dashboard. |
| `roster.nextCursor` | `string \| null` | **Unused in BE** | Dashboard shows one page of 5; the members list owns cursor pagination. |

---

## 4. Cross-Cutting Concerns

| Concern | Current FE State (`/coach`) | BE Contract & Repo Convention | Integration Strategy for `/coach` |
|---|---|---|---|
| **Auth / Token Handling** | `getCoachOverview()` is an unauthenticated dummy. `app/(coach)/layout.tsx` wraps routes in `AuthGate role="coach"`. | `overview` and `roster` require `HTTPBearer`. Tokens live in HttpOnly cookies (`ss_at`, `ss_rt`); `proxy.ts` forwards `x-silatsense-access`. | Read token server-side via `getAccessToken()`; pass `headers: { Authorization: \`Bearer ${token}\` }`. Never expose tokens to client components. |
| **Base URL / Env Config** | `src/hey-api.ts` uses `NEXT_PUBLIC_API_URL ?? config?.baseUrl ?? "https://silatsense-be.vercel.app"`. | `openapi-ts.config.ts` points `runtimeConfigPath` at `./src/hey-api`. | No change. Use `src/hey-api.ts` and `lib/api-client.ts` as-is. |
| **Error Mapping** | No error handling; dummy always succeeds. | `DomainErrorOut { detail, code, requestId, errors }`. Per [`README.md`](./README.md) §5: distinguish `401` (signed out → `null`) from `5xx`/network/schema mismatch (`throw`). | In both DTO readers: return `null` on missing token or `401`; throw a descriptive `Error` (status + normalized message) on `403`, `404`, `409`, `410`, `416`, `422`, `500`, network failure, or Zod validation error. |
| **Loading & Empty States** | Four `<Suspense>` skeletons; components assume non-empty arrays. | A coach with no athletes has `memberCount: 0`, `reviewQueueCount: 0`, `statistics.* = 0`, `similarityGroups: []`, `topIssues: []`, and `roster.items: []`. | Preserve 4 Suspense boundaries. Add first-class empty states for zero athletes, zero scored pillars, zero top issues, and zero review queue. |
| **Cache Keys, Next 16 Cache Components & Invalidation** | `'use cache'` + `cacheLife("minutes")`. | **Forbidden by [`README.md`](./README.md) §9** on cookie/token-dependent reads. | Remove `'use cache'`/`cacheLife`. Wrap each DTO reader and the composite reader in React `cache()`; pass `cache: "no-store"`. All 4 sections share one overview and one roster request per RSC render. |
| **SSR vs Client Fetching** | All dashboard components are Server Components. | `ss_at` is HttpOnly; browser JS cannot call the BE directly. | Keep `/coach` 100% RSC streamed via `<Suspense>`. All CTAs are Next.js `<Link>` navigations; no `"use client"` boundary is needed. |
| **CORS** | No browser XHR on `/coach`. | Server-to-server RSC → FastAPI. | Non-issue. |
| **Pagination** | None; dummy has exactly 5 athletes. | Roster supports `limit` (1–100, default 20), `cursor`, `q`. | Dashboard requests `limit=5`; `nextCursor` is ignored here. Members list owns search/cursor pagination. |
| **Team scoping** | Dummy assumes a single team. | BE endpoints are coach-scoped by the authenticated coach; no `teamId` parameter. | Do not add a team selector. The coach's token defines scope. |
| **Date / timezone** | Dummy strings (`2 Okt 2026`). | ISO 8601 timestamps; no timezone field on `CoachOverview`. | Only format dates if a real field is displayed (e.g. latest session date later). Use `Asia/Jakarta` per repo convention; do not display the dummy exam date. |

---

## 5. Phase 2 — Decisions (Approved 2026-11-07)

### D1 — Replace the dummy reader with one request-time cached dashboard reader (`overview` + `roster`)

- **Decision:** Adapt FE (`features/coach/data/get-coach-overview.ts`, `features/coach/types.ts`, `features/coach/pages/coach-dashboard-page.tsx`).
- **Why:** The dashboard needs both aggregate stats (`overview`) and athlete identity rows (`roster`); `recentSessions` cannot provide names. `'use cache'` is forbidden on authenticated reads.
- **How:**
  - Export `getCoachOverviewDto = cache(async (): Promise<CoachOverviewDto | null> => ...)` using `getAccessToken()`, `overviewApiV1CoachOverviewGet({ headers, cache: "no-store", throwOnError: false })`, and `zOverviewApiV1CoachOverviewGetResponse.parse(data)`.
  - Export `getCoachRosterDto = cache(async (): Promise<RosterPage | null> => ...)` using `rosterApiV1CoachRosterGet({ query: { limit: 5 }, headers, cache: "no-store", throwOnError: false })`, `zRosterApiV1CoachRosterGetResponse.parse(data)`, and the same `401 → null` / other errors → throw policy.
  - Export `getCoachDashboard = cache(async (): Promise<CoachDashboardViewModel | null> => ...)` that awaits `Promise.all([getCoachOverviewDto(), getCoachRosterDto()])`; if `overview` is `null`, return `null`; if `roster` is `null`, still map stats/pillars/posture and render the athlete empty state.
  - Update `CoachDashboardPage` to call `getCoachDashboard()` in all four sections; React `cache()` deduplicates the two network reads.
- **BE change:** None.

### D2 — Map only BE-supported stats; keep unsupported Figma slots visibly inactive

- **Decision:** Adapt FE (`CoachStatGrid` + new `CoachDashboardStat` type).
- **Why:** `memberCount`, `reviewQueueCount`, `scoredSessionCount`, `completedSessionCount`, and `topIssues` are real. Team accuracy, stage breakdown, completion ratio, review-queue names, trend deltas, and exam dates are not.
- **How:**
  - `Total Atlet`: `${memberCount} Atlet`; stage badge and `Ketuntasan` footer right are dimmed `Segera hadir`.
  - `Akurasi Tim`: value dimmed `Segera hadir`; badge dimmed `Target ≥ 85%`; footer left `Sesi Dinilai`, footer right `${scoredSessionCount}` (active).
  - `Ulasan Tertunda` (renamed from `Sidang Uji`): `${reviewQueueCount} Antrean`; note dimmed `Nama antrean: Segera hadir`; footer left `Total Sesi`, footer right `${completedSessionCount}` (active).
  - `Isu Teratas` (renamed from `Fokus Utama`): `topIssues[0]` humanized, note `${sessionCount} sesi terindikasi`; `Belum ada isu` when empty.
- **BE change:** None.

### D3 — Source athlete rows from `/coach/roster` and replace stage badges with session-review status

- **Decision:** Adapt FE (`CoachAthleteList` + mapper).
- **Why:** `CoachOverview` has no athlete identity. The BE has no stage/readiness classification; inventing `Siap Tanding`/`Tahap Remediasi`/`Lolos Standar` would fabricate data.
- **How:**
  - Request `limit=5`; map `profile.id`, `profile.fullName`, `getInitials(fullName)`.
  - `latestSession === null` → badge `Belum Ada Sesi` (outline), subtitle `Belum ada sesi`, score `Belum dinilai`.
  - Otherwise use `toHistoryReviewBadgeStatus(latestSession.session.reviewStatus, latestSession.session.processingStatus)` for the badge and `latestSession.score` for the score (`poin`).
  - Subtitle: `latestSession.movementName || PILAR_NAMES[movementSlug]`.
  - Wire `Lihat Detail` to `<Link href={`/coach/members/${profile.id}`}>`.
  - Count badge: `${memberCount} Atlet`, or `${items.length} dari ${memberCount} Atlet` when truncated.
- **BE change:** None for the dashboard. A future BE sort/`stage` field could improve ordering/classification, but it is not required.

### D4 — Map pillars from `similarityGroups` with the single-unambiguous-group rule

- **Decision:** Adapt FE (`CoachPillarMonitor` + mapper).
- **Why:** `averageScore` is similarity points per `(movement, method, analyzerVersion, featureVersion, referenceVersion)`, not accuracy `%`, and BE defines no qualitative thresholds.
- **How:**
  - For each canonical slug, filter groups with `movementSlug === slug && averageScore !== null && sampleCount > 0`.
  - Exactly one match → `score = averageScore`, `scoreLabel = "${formatScore(score)} poin"`, `status = "terdata"`, `statusLabel = "Terdata"`, bar width = `score`.
  - Zero or multiple matches → `score = null`, `scoreLabel = "Belum dinilai"`, `status = "belum-dinilai"`, bar width = `0`; still show summed `sampleCount` (`"${n} sesi dinilai"`, or `"Multi-versi"` when multiple groups).
  - Header target badge → dimmed `Ambang target: Segera hadir`.
- **BE change:** None.

### D5 — Adapt the posture section to `topIssues` (feature + session count)

- **Decision:** Adapt FE (`CoachPostureGrid` + mapper) — approved Q2.
- **Why:** The BE exposes no fixed 5 anatomy points, no per-point score, no severity, and no angle. The only real posture signal is `topIssues`.
- **How:**
  - Render `topIssues[0]` as the warning banner: `${name} — ${sessionCount} sesi terindikasi`.
  - Render the next up to 4 issues (`slice(1, 5)`) as 2×2 tiles: `humanizeIdentifier(feature)`, `${sessionCount} sesi`, Badge `Terindikasi` (warning).
  - If more than 5 issues exist, append muted `+N isu lainnya`.
  - If `topIssues` is empty, show `Belum ada isu postur terdeteksi`.
  - Change the section title to `Isu Postur Teratas Tim`.
- **BE change:** None. A future BE aggregate with `bodyPart`, `severity`, and per-point scores could restore the original 5-point layout.

### D6 — Fix shell identity and header copy; keep the report CTA inactive

- **Decision:** Adapt FE (`CoachTopNav`, `CoachHeader`).
- **Why:** The coach identity is already available from `getSession()`; the header's `5 atlet` is static and wrong after real data; no report endpoint exists.
- **How:**
  - `CoachTopNav` mirrors `MemberTopNav`: an async initials child inside `<Suspense fallback={<User />}>` reads `getSession().catch(() => null)` and renders `getInitials(user.fullName)`, falling back to the `User` icon when `fullName` is empty.
  - `CoachHeader` description drops the hardcoded count: `Ringkasan performa latihan mandiri dan monitoring kinematika atlet binaan UKM UNSIL.`
  - Keep the PDF Button `aria-disabled="true"` and add visible `Segera hadir` microcopy; keep the `TODO (GET /coach/report)` comment.
- **BE change:** A future `GET /coach/report` endpoint would enable the CTA; not required now.

### D7 — Preserve streaming, add empty states, and keep the dashboard read-only

- **Decision:** Adapt FE (`CoachDashboardPage` + components).
- **Why:** A new coach/team may have zero athletes, zero sessions, zero scored pillars, and zero issues. The dashboard has no mutations.
- **How:**
  - Keep the four `<Suspense>` boundaries and skeletons.
  - Handle `data === null` gracefully in each section (render `null` or a neutral fallback; `AuthGate` owns redirect).
  - Add empty states: `Belum ada atlet binaan`, `Belum ada sesi dinilai`, `Belum ada isu postur terdeteksi`.
  - No `actions/`, no `app/api/`, no client hooks.
- **BE change:** None.

---

## 6. Target Architecture & ViewModel Specification

### 6.1 Data Flow Diagram

```
Browser (GET /coach)
  │
  └─ app/(coach)/layout.tsx
       └─ <Suspense fallback={null}>
            └─ <AuthGate role="coach">
                 ├─ requireRole("coach") -> getSession() [React cache()]
                 │    └─ authSessionApiV1AuthSessionGet({ cache: "no-store" }) -> 200 AuthUser
                 └─ app/(coach)/coach/page.tsx
                      ├─ <CoachLayout>
                      │    ├─ <CoachTopNav> -> <Suspense> -> getSession() (memoized hit)
                      │    └─ <CoachDashboardPage>
                      │         ├─ <Suspense> StatSection    ─┐
                      │         ├─ <Suspense> AthleteSection  │ all call
                      │         ├─ <Suspense> PillarSection   │ getCoachDashboard()
                      │         └─ <Suspense> PostureSection  ─┘ [React cache()]
                      │              │
                      │              └─ getCoachDashboard()
                      │                   ├─ getCoachOverviewDto() [React cache()]
                      │                   │    └─ overviewApiV1CoachOverviewGet({
                      │                   │         headers: { Authorization: Bearer <ss_at> },
                      │                   │         cache: "no-store",
                      │                   │         throwOnError: false,
                      │                   │       }) -> 200 CoachOverview
                      │                   ├─ getCoachRosterDto() [React cache()]
                      │                   │    └─ rosterApiV1CoachRosterGet({
                      │                   │         query: { limit: 5 },
                      │                   │         headers: { Authorization: Bearer <ss_at> },
                      │                   │         cache: "no-store",
                      │                   │         throwOnError: false,
                      │                   │       }) -> 200 RosterPage
                      │                   └─ toCoachDashboardViewModel(overview, roster)
                      └─ <CoachBottomNav activeTab="dasbor" />
```

### 6.2 ViewModel Interfaces (`features/coach/types.ts`)

```ts
import type { PilarSlug } from "@/components/shared/silat-reference";

export type CoachAthleteStatus =
  | "belum-ada"
  | "diproses"
  | "menunggu"
  | "disetujui"
  | "perlu-revisi"
  | "gagal";

export type CoachBadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning";

export interface CoachDashboardStat {
  id: "total-atlet" | "akurasi-tim" | "sidang-uji" | "fokus"; // internal ids; labels are Ulasan Tertunda / Isu Teratas
  label: string;
  value: string;
  valueAvailable: boolean;
  badge?: string;
  badgeAvailable?: boolean;
  note?: string;
  noteAvailable?: boolean;
  footerLeft?: string;
  footerRight?: string;
  footerRightAvailable?: boolean;
}

export interface CoachAthlete {
  id: string;
  initials: string;
  name: string;
  status: CoachAthleteStatus;
  statusLabel: string;
  statusVariant: CoachBadgeVariant;
  score: number | null;
  scoreLabel: string; // "80 poin" | "Belum dinilai"
  lastGerakan: string;
  detailHref: string;
}

export interface CoachPillar {
  slug: PilarSlug;
  name: string;
  score: number | null;
  scoreLabel: string; // "94,8 poin" | "Belum dinilai"
  sampleCount: number;
  sampleLabel: string; // "12 sesi dinilai" | "Belum ada sesi" | "Multi-versi"
  status: "terdata" | "belum-dinilai";
  statusLabel: string; // "Terdata" | "Belum Dinilai"
  statusVariant: CoachBadgeVariant;
  barPercent: number; // 0..100
}

export interface PostureIssue {
  id: string; // topIssues[].feature
  name: string; // humanizeIdentifier(feature)
  sessionCount: number;
  sessionLabel: string; // "12 sesi"
  statusLabel: "Terindikasi";
  statusVariant: "warning";
}

export interface CoachDashboardViewModel {
  stats: CoachDashboardStat[];
  athletes: CoachAthlete[];
  athleteCountLabel: string; // "5 Atlet" | "5 dari 24 Atlet"
  pillars: CoachPillar[];
  posture: PostureIssue[];
  memberCount: number;
  reviewQueueCount: number;
  completedSessionCount: number;
  scoredSessionCount: number;
}
```

**Compatibility note:** keep `CoachStat`, `AthleteStage`, and `TeamMember` unchanged for the coach members list; introduce `CoachDashboardStat` only for the dashboard grid. Remove the old dashboard-only `CoachOverview`, `CoachAthlete`, `CoachPillar`, and `PosturePoint` shapes or replace them in place; no other module imports them.

### 6.3 Mapper Functions (`features/coach/data/coach-dashboard-mapper.ts`)

Wire types imported from `@/api`: `CoachOverview as CoachOverviewDto`, `ActivitySummary`, `IssueCount`, and `RosterPage`.

```ts
export function toCoachDashboardViewModel(
  overview: CoachOverviewDto,
  roster: RosterPage | null,
): CoachDashboardViewModel;

export function toCoachStats(
  overview: CoachOverviewDto,
): CoachDashboardStat[];

export function toCoachAthletes(
  roster: RosterPage | null,
  memberCount: number,
): { athletes: CoachAthlete[]; athleteCountLabel: string };

export function toCoachPillars(
  statistics: ActivitySummary,
): CoachPillar[];

export function toPostureIssues(
  topIssues: IssueCount[],
): PostureIssue[];
```

Mapper rules:

- Use `formatScore()` and `humanizeIdentifier()` from `@/features/member/data/format` (pure module, no `server-only` import). Use `getInitials()` from `@/components/shared/silat-reference`.
- Validate all component-facing values; never pass raw DTOs to client components (none are client here, but keep the boundary clean).
- `statusVariant` values must match the `Badge` variant set used by `components/ui/badge.tsx`.

---

## 7. Phase 2 — List of FE Files to Change

### 7.1 New Files

| File Path | Purpose |
|---|---|
| `features/coach/data/coach-dashboard-mapper.ts` | Pure mapper from `CoachOverview` + `RosterPage | null` to `CoachDashboardViewModel`; includes stat, athlete, pillar, and posture sub-mappers. |
| `tests/unit/coach/coach-dashboard-mapper.test.ts` | Fixture-driven tests for every mapping rule, nullability fallback, single-group rule, review-status badges, posture top-issues, and inactive flags. |
| `tests/unit/coach/coach-dashboard-data.test.ts` | Data-reader tests for `401 → null`, `200 → ViewModel`, `500 → throw`, Bearer header, `cache: "no-store"`, roster `limit: 5`, and Zod validation. Replaces `coach-overview-data.test.ts`. |

### 7.2 Modified Files

| File Path | Changes |
|---|---|
| `features/coach/types.ts` | Add `CoachDashboardStat`, `CoachAthleteStatus`, `CoachBadgeVariant`, `CoachDashboardViewModel`; revise dashboard-only `CoachAthlete`, `CoachPillar`, `PostureIssue`; keep `CoachStat`, `AthleteStage`, `TeamMember` for members list. |
| `features/coach/data/get-coach-overview.ts` | Remove `'use cache'`, `cacheLife`, and the dummy import. Add `getCoachOverviewDto`, `getCoachRosterDto`, and `getCoachDashboard` with React `cache()`, `getAccessToken()`, generated SDK calls, `cache: "no-store"`, and generated Zod response parsing. |
| `features/coach/pages/coach-dashboard-page.tsx` | Call `getCoachDashboard()` in all four sections; handle `null`; pass `athleteCountLabel` to the list. |
| `features/coach/components/coach-stat-grid.tsx` | Accept `CoachDashboardStat[]`; render the approved labels `Ulasan Tertunda` / `Isu Teratas`; render `Segera hadir`/muted styling for unavailable value, badge, note, and footer slots. |
| `features/coach/components/coach-athlete-list.tsx` | Render `scoreLabel` (`poin`), `statusLabel` with `statusVariant`, dynamic count badge, live `<Link href={athlete.detailHref}>Lihat Detail</Link>`, and empty state. |
| `features/coach/components/coach-pillar-monitor.tsx` | Render `scoreLabel` (`poin`), `sampleLabel`, `statusLabel`/`statusVariant`, `barPercent`; dim the target badge. |
| `features/coach/components/coach-posture-grid.tsx` | Render dynamic `PostureIssue[]` as 2×2 + banner, session counts instead of percentages, `+N isu lainnya`, and empty state. |
| `features/coach/components/coach-header.tsx` | Remove hardcoded `5 atlet`; keep PDF Button disabled with `Segera hadir` microcopy. |
| `features/coach/components/coach-top-nav.tsx` | Replace hardcoded `KF` with `getSession()` initials inside `<Suspense>`, `User` icon fallback. |
| `tests/unit/coach/coach-sections.test.ts` | Update source assertions for `poin`, live `/coach/members/` link, dynamic posture tiles, and no fabricated `%`. |
| `tests/unit/coach/coach-shell.test.ts` | Remove the `KF` assertion; assert `getSession`/`getInitials` and `Segera hadir`; keep `Cloud Sinkron`, `Dashboard Pelatih`, and the dead report TODO. |

### 7.3 Deleted / Retired Files

| File Path | Reason |
|---|---|
| `features/coach/data/coach-overview-dummy.ts` | Retired once the mapper tests use typed `CoachOverview`/`RosterPage` fixtures validated by generated Zod schemas. |
| `tests/unit/coach/coach-overview-data.test.ts` | Replaced by `coach-dashboard-data.test.ts` and `coach-dashboard-mapper.test.ts`. |

**No changes** to `app/api/`, `features/coach/actions/`, `features/coach/pages/coach-members-page.tsx`, `member-detail-page.tsx`, `member-history-page.tsx`, `components/ui/`, or generated `src/api/**`.

---

## 8. Generated SDK / Query Mapping

| FE Consumer | Generated SDK Function | Generated Query Options / Key | Generated Zod Schema | Usage |
|---|---|---|---|---|
| `getCoachOverviewDto` | `overviewApiV1CoachOverviewGet` | `overviewApiV1CoachOverviewGetOptions()`<br>`overviewApiV1CoachOverviewGetQueryKey()` | `zCoachOverview`<br>`zOverviewApiV1CoachOverviewGetResponse` | Server RSC read inside React `cache()` with Bearer token and `cache: "no-store"`. |
| `getCoachRosterDto` | `rosterApiV1CoachRosterGet` | `rosterApiV1CoachRosterGetOptions({ query: { limit: 5 } })`<br>`rosterApiV1CoachRosterGetQueryKey({ query: { limit: 5 } })` | `zRosterPage`<br>`zRosterApiV1CoachRosterGetResponse`<br>`zRosterApiV1CoachRosterGetQuery` | Server RSC read inside React `cache()`; fixed `limit: 5`, no cursor. |
| `CoachTopNav` initials | `authSessionApiV1AuthSessionGet` | `authSessionApiV1AuthSessionGetOptions()`<br>`authSessionApiV1AuthSessionGetQueryKey()` | `zAuthUser`<br>`zAuthSessionApiV1AuthSessionGetResponse` | Already executed by `AuthGate` in `app/(coach)/layout.tsx`; `getSession()` is React-memoized. |
| Future client mutation invalidation | — | `overviewApiV1CoachOverviewGetQueryKey()`<br>`rosterApiV1CoachRosterGetQueryKey({ query: { limit: 5 } })` | — | No dashboard mutations this move. When coach review/feedback actions land, invalidate these keys and call `revalidatePath("/coach")`. |

> **Why the dashboard does not use `overviewApiV1CoachOverviewGetOptions()` in a browser `useQuery`:** `ss_at` is HttpOnly and unavailable to browser JS. The page is fully server-rendered; the generated options/keys are documented for future hydration or client filters, not used directly here.

---

## 9. Zod Validation Strategy

Per [`README.md`](./README.md) §3 & §7:

1. **Wire response validation:** the generated SDK has `validator: true`, so `overviewApiV1CoachOverviewGet` and `rosterApiV1CoachRosterGet` already validate responses. In the data readers, additionally call:
   - `zOverviewApiV1CoachOverviewGetResponse.parse(data)`
   - `zRosterApiV1CoachRosterGetResponse.parse(data)`
   
   This keeps unit tests that mock the SDK on the same validation path as production.
2. **Query validation:** the SDK validates `zRosterApiV1CoachRosterGetQuery` (`limit` 1–100, default 20; `q` max 120). The dashboard hardcodes `limit: 5`; tests assert the exact query object.
3. **No form or action schemas:** `/coach` is read-only. No `features/coach/schemas.ts` change is needed for this move.
4. **Fixture pinning:** mapper tests must parse fixtures through `zCoachOverview` and `zRosterPage` before mapping. A future OpenAPI change then fails tests immediately instead of drifting.

---

## 10. Risks & Mitigations

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R1 | **`'use cache'` remains on an authenticated read.** | Build failure under `cacheComponents: true` or cross-coach data leak. | Remove `'use cache'`/`cacheLife`; use React `cache()` + `cache: "no-store"` only. |
| R2 | **Four duplicate overview requests per render.** | Four sections each call `getCoachDashboard()`; without memoization that is 4× the network cost. | React `cache()` on `getCoachOverviewDto`, `getCoachRosterDto`, and `getCoachDashboard` deduplicates within one RSC request. |
| R3 | **Roster outage breaks stats.** | A 5xx from `/coach/roster` throws and the whole dashboard fails. | Follow `README.md` §5: throw rather than silently render an empty athlete list. Optionally isolate the athlete section behind an error boundary in a later move; no dashboard error boundary exists today. |
| R4 | **Synthesizing team accuracy from `similarityGroups`.** | Mixing analyzer/reference versions or calling similarity points “accuracy” misleads coaches. | Approved Q1: keep `Akurasi Tim` inactive; show real `scoredSessionCount` in the footer and never derive a team average. |
| R5 | **Multiple `SimilarityGroup` versions per pillar.** | Arbitrary average or wrong version shown. | Reuse `toSimilarity`: exactly one matching group with `averageScore !== null` and `sampleCount > 0`; otherwise `Belum dinilai` with summed samples. |
| R6 | **Fabricated athlete stages or posture percentages.** | Coaches make decisions on non-existent classifications. | Replace stage badges with real review status; replace posture scores with `topIssues` session counts. |
| R7 | **Roster truncation is invisible.** | Dashboard shows 5 rows while the team has more members. | Count badge shows `${items.length} dari ${memberCount} Atlet`; `Member List` remains the full paginated view. |
| R8 | **Hardcoded `KF` and `5 atlet` survive the integration.** | Identity/copy mismatch persists. | Update `coach-shell.test.ts` to assert `getSession`/`getInitials` and neutral header copy. |
| R9 | **Existing tests pin dummy values and dead strings.** | `pnpm test` fails after component updates. | Replace `coach-overview-data.test.ts`; update `coach-sections.test.ts` and `coach-shell.test.ts` in lockstep. |
| R10 | **`topIssues.feature` vocabulary is unknown.** | Humanized raw identifiers may read poorly (e.g. `elbow_angle`). | Display `humanizeIdentifier(feature)`; do not invent a body-part dictionary. If labels are poor, request a BE label field later. |
| R11 | **Query-key mismatch after future mutations.** | Invalidation misses cached data. | Key factories are called without auth headers; document both keys in the action that mutates review state. |
| R12 | **Empty team / zero sessions crashes components.** | New coaches see a broken dashboard. | Test `memberCount: 0`, `topIssues: []`, `roster.items: []`, and `similarityGroups: []` in mapper tests; render empty states. |

---

## 11. Approved Product Decisions (2026-11-07)

| # | Question | Decision | Implementation Impact |
|---|---|---|---|
| Q1 | `Akurasi Tim` | **Keep inactive.** Do not synthesize a team average from `similarityGroups`. | Value and target badge are dimmed `Segera hadir`; `scoredSessionCount` is shown as the active footer metric. |
| Q2 | Posture section | **Dynamic `topIssues`.** | `topIssues[0]` becomes the warning banner; the next up to 4 issues become tiles; section title becomes `Isu Postur Teratas Tim`. |
| Q3 | Stat labels | **Rename.** `Sidang Uji` → `Ulasan Tertunda`; `Fokus Utama` → `Isu Teratas`. | Supersedes the Figma-verbatim labels in the design spec §2. Internal stat ids remain `sidang-uji` / `fokus` for icon mapping. |
| Q4 | Athlete stage badges | **Replace with session-review status.** | Badges: `Belum Ada Sesi`, `Diproses`, `Menunggu Ulasan`, `Disetujui`, `Perlu Revisi`, `Gagal`. |
| Q5 | Roster page size | **Show 5 rows.** | Request `/coach/roster?limit=5`; count badge shows truncation when `items.length < memberCount`. |
| Q6 | Report CTA | **Keep disabled.** | No `/coach/report` call; Button stays `aria-disabled` with `Segera hadir` microcopy. |
| Q7 | 85% target | **Dim.** | `Target ≥ 85%` and pillar target badges render dimmed `Segera hadir` until the BE exposes a threshold. |

No open product questions remain for this dashboard move.

---

## 12. Approval Checklist

- [x] Scope confirmed: `/coach` dashboard only; members list/detail/history remain dummy and untouched.
- [x] Q1–Q7 resolved (approved 2026-11-07; see §11).
- [x] Decision approved: overview + roster (`limit=5`) as the only dashboard reads.
- [x] Decision approved: Honest UI for team accuracy, stage breakdown, completion ratio, review names, pillar thresholds, posture scores, and report export.
- [ ] Implementation approved to start.
- [ ] Gates after implementation: `pnpm build`, `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`, and browser `scrollWidth <= innerWidth` at 390px.
