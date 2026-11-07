# Member Dashboard (`/dashboard`) — FE ↔ BE Integration Spec

- **Status:** In Implementation — Phase 1 assessment + Phase 2 spec approved. Implementation on task branch `feature/psr-122-member-ship-member-dashboard-integration` (`PSR-122`).
- **Date:** 2026-11-07
- **Scope:** Member Dashboard module (`/dashboard`, `features/member/pages/dashboard-page.tsx`, `features/member/components/hero-greeting.tsx`, `hero-visual-card.tsx`, `pillar-grid.tsx`, `pillar-status.ts`, `session-feedback.tsx`, `weekly-progress.tsx`, `member-top-nav.tsx`, `features/member/data/get-member-dashboard.ts`, `get-dashboard-summary.ts`, `member-dashboard-dummy.ts`).
- **Out of scope:** Training (`/latihan`), Sessions History (`/riwayat`, `/riwayat/[id]`), Account Profile (`/profil`), Coach modules (`/coach/**`), pose-skeleton canvas rendering, chart libraries.
- **BE source of truth:** `https://silatsense-be.vercel.app/openapi.json` (v0.7.0, fetched 2026-11-07).
- **FE baseline:** Next.js 16.3.8 (`cacheComponents: true`), React 19.2.8, TanStack Query 5.104.1, Zod 4.6.5, `@hey-api/openapi-ts` 0.99.0 generated client in `src/api/`.
- **Canonical conventions:** [`docs/integration/README.md`](./README.md), [`docs/integration/Training.md`](./Training.md), and [`docs/integration/sessions-history.md`](./sessions-history.md).

---

## 0. TL;DR

The Member Dashboard (`/dashboard`) currently runs on **100% static dummy stubs** (`features/member/data/member-dashboard-dummy.ts`) behind a Next.js 16 `'use cache'` + `cacheLife("minutes")` reader (`features/member/data/get-member-dashboard.ts`). All CTAs on `/dashboard` (`Mulai Sesi Latihan`, `Lihat Panduan Biomekanik`, `Lanjut`, `Ulangi Latihan Gerakan Ini`) are dead `<span aria-disabled="true">` placeholders, and `MemberTopNav` hardcodes the avatar initials `"AS"`.

Integrating `/dashboard` against `GET /api/v1/member/dashboard` (`Dashboard`) and `GET /api/v1/auth/session` (`AuthUser`) surfaces five core structural differences between the Figma-derived FE stubs and the live BE contract:

1. **Member identity (`greeting.name` & top-nav initials) is not on `Dashboard`; it lives on `AuthUser` (`getSession()`).**
   - `GET /api/v1/member/dashboard` returns `Dashboard { statistics, lastSession, latestCoachNote, coach, dominantMovementSlug, weeklyActivity, timezone }` — it does not include the member's `fullName`.
   - However, `app/(member)/layout.tsx` already runs `<AuthGate role="member">`, which calls `getSession()` (`GET /api/v1/auth/session` → `AuthUser { id, fullName, identifier, role }`) wrapped in React `cache()`. Reading `getSession()` inside `getMemberDashboard()` (and `MemberTopNav`) provides the real member name and initials with **zero extra network requests**.

2. **`HeroVisualCard` assumes live camera/biomechanical telemetry (`82% Akurasi terkini`, `14° vs <8° siku`, `Jarak 2.5m`, `Kamera Siap`) that does not exist on `Dashboard`.**
   - BE exposes `lastSession?.score` (`0..100` similarity points, not `%`), `lastSession?.scoreReason`, and `statistics` (`completedSessionCount`, `scoredSessionCount`, `totalDurationSeconds`). It does not expose composite accuracy `%`, elbow angle tolerance on the dashboard summary, camera distance in meters, or server-side camera readiness.
   - **Decision (D2):** Adapt `HeroVisualCard` to Honest UI per [`README.md`](./README.md) §6.1: display the latest session's similarity score in `poin` (`"82 poin — Skor Kemiripan Terkini"` or `"Belum dinilai"`) + active session/duration stats, and render the unsupported composite accuracy / sensor distance telemetry slots as visually inactive (`opacity-60 bg-muted/20 border-dashed`) with a `"Segera hadir"` badge.

3. **`PillarGrid` assumes 4 curriculum variation progress strings (`"Tuntas 4/4 Variasi"`), qualitative status tiers (`Stabil` / `Optimal` / `Perlu Koreksi`), and `%` averages.**
   - BE exposes `statistics.similarityGroups: SimilarityGroup[]` (`{ movementSlug, method, analyzerVersion, featureVersion, referenceVersion, averageScore, sampleCount }`) and `dominantMovementSlug`.
   - **Decision (D3):** Reuse the `toSimilarity` rule established in [`Training.md`](./Training.md): show per-pillar `averageScore` in `poin` (`"${formatScore(averageScore)} poin"`) and `"${sampleCount} sesi dinilai"` when a single unambiguous `SimilarityGroup` (`sampleCount > 0`) exists; otherwise render the pillar's average slot as inactive (`"Belum dinilai"` / `"Segera hadir"`). Highlight `dominantMovementSlug` as the active focus card and wire every card's CTA to `/latihan/${pillar.slug}`.

4. **`SessionFeedback` (`lastSession`) is nullable (`HistoryItem | null`), has no repetition count (`reps`), and carries `review` / `scoreReason` rather than 3 hardcoded biomechanical observations.**
   - New members have `lastSession: null`. Even when `lastSession` exists, BE `Capability.repetitionCountingAvailable` is permanently `false`, `score` is in `poin` (not `%`), and `HistoryItem` embeds `review?: PublishedReview | null` (`bodyAssessments`, `note`, `decision`) + `scoreReason`, not `EvaluationOut.measurements`.
   - **Decision (D4):** Handle `lastSession === null` with an honest empty state + CTA to `/latihan`. When `lastSession` exists, derive observations from `lastSession.review?.bodyAssessments` (`approved` → `good`, `needs_revision` → `warning`), `lastSession.review?.note` (`neutral`), and `formatScoreReason(lastSession.scoreReason)` (or optionally hydrate `EvaluationOut` when `lastSession.session.evaluationId` exists — see Open Questions), replace fake `"30 Repetisi"` with real session duration (`formatDurationId(session.media.durationSeconds)`), and wire `Ulangi Latihan Gerakan Ini` to `/latihan/${session.movementSlug}/rekam` plus a `Detail Evaluasi` link to `/riwayat/${session.id}`.

5. **`WeeklyProgress` assumes daily accuracy `%` bars (`88%`, `92%`, `82%`), `"Rest"` days, `"Target: 4 dari 5 Hari Target"`, `"Minggu Ke-3"`, and a non-nullable `coachNote`.**
   - BE `weeklyActivity` is `DailyActivity[]` (`{ date: string, sessionCount: number, durationSeconds: number }`) — it tracks **daily session counts and duration**, not daily accuracy `%` or scheduled rest days. Furthermore, `latestCoachNote` (`PublishedNote | null`) and `coach` (`CoachIdentity | null | undefined`) are nullable.
   - **Decision (D5 & D6):** Normalize `weeklyActivity` onto the 7-day (`Sen`–`Min`) window in `Asia/Jakarta`, plotting bar heights proportional to `sessionCount` (or `durationSeconds`) with labels `"${sessionCount} sesi"` (or `"-"`) instead of fabricated `%`. Map `latestCoachNote` (with fallback to `lastSession?.review?.note`, then `coach` identity with `"Belum ada catatan terbaru dari pelatih."`).

---

## 1. Phase 1 Assessment — Current FE Inventory (`{Member Dashboard}`)

### 1.1 Routes, Layouts, and Page Compositions

| Route | File Path | Server / Client | Current Behavior & Data Flow |
|---|---|---|---|
| `/dashboard` (group layout) | `app/(member)/layout.tsx` | Server (RSC) | Wraps all member routes in `<Suspense fallback={null}><AuthGate role="member">{children}</AuthGate></Suspense>`. Calls `requireRole("member")` → `getSession()` (`GET /api/v1/auth/session`). |
| `/dashboard` (route layout) | `app/(member)/dashboard/layout.tsx` | Server (RSC) | Thin wrapper rendering `<MemberLayout>{children}</MemberLayout>` (`activeTab="dashboard"`, `trail={["Dashboard"]}`). |
| `/dashboard` (page) | `app/(member)/dashboard/page.tsx` | Server (RSC) | Thin route file rendering `<DashboardPage />`. |
| Feature layout | `features/member/pages/member-layout.tsx` | Server (RSC) | Renders `<MemberTopNav trail={trail} />`, centered `<main className="max-w-[448px]">`, and `<MemberBottomNav activeTab={activeTab} />`. |
| Feature page | `features/member/pages/dashboard-page.tsx` | Server (RSC) | Renders 4 independent `<Suspense fallback={<Skeleton ... />}>` sections (`HeroSection`, `PillarSection`, `FeedbackSection`, `WeeklySection`). Each section awaits `getMemberDashboard()`. |

### 1.2 Components & Hooks in `{Member Dashboard}`

| Component / Helper File | Server / Client | Props | Current Responsibility, Assumed Data & Dead CTAs |
|---|---|---|---|
| `features/member/components/hero-greeting.tsx` (`HeroGreeting`) | Server | `{ greeting: GreetingData }` | Renders `Halo, {greeting.name}.`, `Sesi latihan mandiri terakhirmu {greeting.lastSessionDaysAgo} hari lalu`, `mematangkan teknik {greeting.focusTechnique}`, and two dead `<span aria-disabled="true">` CTAs: `Mulai Sesi Latihan` (`TODO: wire to /latihan session flow when the route lands`) and `Lihat Panduan Biomekanik` (`TODO: wire to /panduan biomekanik when the route lands`). |
| `features/member/components/hero-visual-card.tsx` (`HeroVisualCard`) | Server | `{ metric: HeroMetricData }` | Renders dark card with `ImagePlaceholder` (`"Visual pose pesilat"`), `<Badge variant="success">{metric.cameraReady ? "Kamera Siap" : "Kamera Mati"}</Badge>`, `{metric.accuracyPct}% Akurasi terkini`, `Toleransi sudut siku: {metric.elbowToleranceDeg}° (Target: <{metric.targetDeg}°)`, and chip `Jarak {metric.cameraDistanceM}m`. |
| `features/member/components/pillar-grid.tsx` (`PillarGrid`) | Server | `{ pillars: PillarStat[] }` | Renders header (`Kategori Gerakan Dasar`, `4 pilar kurikulum baku pesilat pemula UNSIL`, `<Badge variant="secondary">Gasal 2024</Badge>`) and 2×2 grid over `pillars` (`kuda-kuda`, `pukulan`, `tangkisan`, `tendangan`). Each card renders icon, `<Badge variant={pillarBadgeVariant(pillar.status)}>{pillar.statusLabel}</Badge>`, `pillar.name`, `pillar.detail`, `Rata-rata` `{pillar.avgPct.toFixed(1)}%`, and when `pillar.active` a dead `<span aria-disabled="true">Lanjut</span>` (`TODO: wire to /latihan pukulan flow when the route lands`). |
| `features/member/components/pillar-status.ts` (`pillarBadgeVariant`) | Pure TS | `status: PillarStatus` | Maps `"perlu-koreksi"` → `"warning"`, `"stabil" \| "optimal"` → `"success"`. |
| `features/member/components/session-feedback.tsx` (`SessionFeedback`) | Server | `{ session: LastSessionData }` | Renders `Evaluasi sesi mandiri`, `{session.technique}`, `{session.time} • {session.reps} Repetisi`, `<Badge variant="warning">{session.scorePct}% — {session.scoreLabel}</Badge>`, maps `session.observations` (`good` → `CircleCheck`, `warning` → `TriangleAlert`, `neutral` → `Lightbulb`), and renders dead `<span aria-disabled="true">Ulangi Latihan Gerakan Ini</span>` (`TODO: wire repeat to the /latihan flow for this technique when the route lands`). |
| `features/member/components/weekly-progress.tsx` (`WeeklyProgress`) | Server | `{ weekly: WeeklyData; note: CoachNoteData }` | Renders `{weekly.title}`, `{weekly.targetLabel}`, `<Badge variant="secondary">{weekly.weekLabel}</Badge>`, 7 day columns (`day.value === null ? (day.state === "rest" ? "Rest" : "-") : "${day.value}%"`, bar `style={{ height: "${day.value}%" }}`), and coach quote `<figure>` (`{note.initials}`, `{note.name}`, `"{note.quote}"`). |
| `features/member/components/member-top-nav.tsx` (`MemberTopNav`) | Server | `{ trail?: string[] }` | Sticky top header with `SILATSENSE` brand, live `<Link href="/latihan">` play button, hardcoded `"AS"` avatar initials, breadcrumb `trail.join(" / ")`, and `<Badge variant="success">Cloud Sinkron</Badge>`. |
| `features/member/components/member-bottom-nav.tsx` (`MemberBottomNav`) | Server | `{ activeTab?: MemberTab }` | Sticky bottom nav linking `/dashboard`, `/latihan` (with badge `4`), `/riwayat`, `/profil`. |

**Hooks:** None. Member Dashboard uses zero custom hooks (`features/member/hooks/use-camera.ts` and `use-media-recorder.ts` belong exclusively to `/latihan`).

### 1.3 Local Types, Zod Schemas, Mocks/Fixtures, Tests, and Data Fetching

- **Local Types (`features/member/types.ts` lines 8–77):**
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
    slug: PilarSlug;
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
- **Local Zod Schemas:** None in `features/member/schemas/` for `/dashboard` (dashboard is read-only; generated `zDashboard` and `zDashboardApiV1MemberDashboardGetResponse` live in `src/api/zod.gen.ts`).
- **Mocks / Fixtures:**
  - `features/member/data/member-dashboard-dummy.ts`: exports `dummyMemberDashboard` (hardcoded Figma node `94:38108` values for `"Aced"`).
- **Data Fetching & Assumed Endpoints:**
  - `features/member/data/get-member-dashboard.ts`:
    - Uses `'use cache'` + `cacheLife("minutes")` (violates [`README.md`](./README.md) §9 for authenticated data).
    - Carries `// TODO: connect backend via lib/api-client.ts (GET /member/dashboard) — dummy for now` and returns `dummyMemberDashboard`.
  - `features/member/data/get-dashboard-summary.ts`:
    - Created during the History (`/riwayat`) integration; calls `dashboardApiV1MemberDashboardGet` with `Authorization: Bearer ${token}` and `cache: "no-store"`, parses with `zDashboardApiV1MemberDashboardGetResponse`, and maps via `toHistorySummaryViewModel`.
- **Unit Tests:**
  - `tests/unit/member/dashboard-data.test.ts` (pins `dummyMemberDashboard` shape)
  - `tests/unit/member/hero-visual.test.ts` (asserts `HeroGreeting` & `HeroVisualCard` source strings, including dead `aria-disabled` + `TODO`)
  - `tests/unit/member/pillars-feedback.test.ts` (asserts `pillarBadgeVariant`, `PillarGrid`, `SessionFeedback`)
  - `tests/unit/member/weekly.test.ts` (asserts `WeeklyProgress` source strings)
  - `tests/unit/member/member-shell.test.ts` (asserts thin RSC routes, nav links, `<Suspense>` + `Skeleton` in `dashboard-page.tsx`)

---

## 2. Phase 1 Assessment — Backend Contract Snapshot

### 2.1 Endpoints Relevant to `{Member Dashboard}`

All endpoints require `HTTPBearer` (`Authorization: Bearer <accessToken>`). No query parameters, path parameters, pagination, or request bodies are used on `/api/v1/member/dashboard`.

| # | Method + Path | Params / Query | Request Body | Success Response | Error Statuses & Shape | Generated SDK Function |
|---|---|---|---|---|---|---|
| 1 | `GET /api/v1/member/dashboard` | — | — | `200 Dashboard` | `401, 403, 404, 422, 500` (`DomainErrorOut`) | `dashboardApiV1MemberDashboardGet` |
| 2 | `GET /api/v1/auth/session` | — | — | `200 AuthUser` | `401, 422, 500` (`DomainErrorOut`) | `authSessionApiV1AuthSessionGet` (already called & memoized by `getSession()` in `features/auth/data/session.ts`) |
| 3 | *(Optional enrichment — see Open Questions)* `GET /api/v1/member/sessions/{session_id}/evaluation` | Path: `session_id: string` | — | `200 EvaluationOut` | `401, 403, 404, 409, 410, 413, 415, 416, 422, 429, 500, 503` (`DomainErrorOut`) | `evaluationApiV1MemberSessionsSessionIdEvaluationGet` |

### 2.2 Generated Wire DTOs (from `src/api/types.gen.ts`)

Copied verbatim from `src/api/types.gen.ts` (**generated — never edit**):

```ts
export type Dashboard = {
  statistics: ActivitySummary;
  lastSession: HistoryItem | null;
  latestCoachNote: PublishedNote | null;
  coach?: CoachIdentity | null;
  dominantMovementSlug: "kuda-kuda" | "pukulan" | "tangkisan" | "tendangan" | null;
  weeklyActivity: Array<DailyActivity>;
  timezone?: "Asia/Jakarta";
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
  averageScore: number | null;
  sampleCount: number;
};

export type DailyActivity = {
  date: string; // ISO date string (YYYY-MM-DD in Asia/Jakarta)
  sessionCount: number;
  durationSeconds: number;
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
  createdAt: string; // ISO 8601 datetime
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

export type PublishedReview = {
  id: string;
  revision: number;
  author: CoachIdentity;
  publishedAt: string; // ISO 8601 datetime
  decision: "approved" | "needs_revision";
  note: string | null;
  bodyAssessments: Array<BodyAssessment>;
  taskIds: Array<string>;
  supersedesReviewId: string | null;
};

export type BodyAssessment = {
  bodyPart: string; // 1..80 chars
  status: "not_assessed" | "needs_revision" | "approved";
  note?: string | null; // max 2000 chars
};

export type PublishedNote = {
  id: string;
  author: CoachIdentity;
  text: string;
  publishedAt: string; // ISO 8601 datetime
};

export type CoachIdentity = {
  id: string;
  fullName: string;
  title: string | null;
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
export const zDashboard = z.object({
  statistics: zActivitySummary,
  lastSession: zHistoryItem.nullable(),
  latestCoachNote: zPublishedNote.nullable(),
  coach: zCoachIdentity.nullish(),
  dominantMovementSlug: z
    .enum(["kuda-kuda", "pukulan", "tangkisan", "tendangan"])
    .nullable(),
  weeklyActivity: z.array(zDailyActivity),
  timezone: z.literal("Asia/Jakarta").optional().default("Asia/Jakarta"),
});

export const zDashboardApiV1MemberDashboardGetResponse = zDashboard;
```

---

## 3. Phase 1 & 2 — Gap Analysis Table

Status legend:
- **Match** — directly supported by the BE contract with the same semantics.
- **Mismatch** — field name, structure, unit, nullability, or enum differs; resolved in a pure ViewModel mapper (`features/member/data/dashboard-mapper.ts`).
- **Missing in BE** — UI expects data not exposed by the BE; rendered visually inactive (`opacity-60 bg-muted/20 border-dashed`) with a `"Segera hadir"` badge per [`README.md`](./README.md) §6.1, or adapted per product decision.
- **Unused in BE** — exposed by BE on `Dashboard` but not directly displayed on `/dashboard`.
- **Derived** — computed in the FE mapper from real BE fields.

### 3.1 Top Nav & Hero Greeting (`MemberTopNav` & `HeroGreeting`)

| FE Need | BE Endpoint & Field | Status | Notes (Field Names, Types, Nullability, Enums, Date Formats) |
|---|---|---|---|
| `MemberTopNav` avatar initials (`"AS"`) | `GET /api/v1/auth/session` → `AuthUser.fullName` | **Mismatch (hardcoded in FE)** | `Dashboard` does not carry the member's name. Read `getSession()` (memoized via React `cache()` from `AuthGate`) and compute `getInitials(user.fullName)` (fallback to `lucide-react` `User` icon when `user` is `null` or empty). |
| `greeting.name` (`"Aced"`) | `GET /api/v1/auth/session` → `AuthUser.fullName` | **Mismatch (endpoint)** | Extract first name `fullName.trim().split(/\s+/)[0]` (or full name) from `AuthUser.fullName` (fallback `"Pesilat"`). |
| `greeting.lastSessionDaysAgo` (`2`) | `Dashboard.lastSession?.session.startedAt ?? Dashboard.lastSession?.session.createdAt` | **Derived & Nullable** | `lastSession` is `HistoryItem \| null`. When `lastSession !== null`, compute whole calendar days elapsed in `Dashboard.timezone` (`"Asia/Jakarta"`) between session timestamp and `now` (`0` = `"hari ini"`, `1` = `"kemarin"`, `N` = `"${N} hari lalu"`). When `lastSession === null`, render `"Belum ada sesi latihan mandiri yang terekam."` |
| `greeting.focusTechnique` (`"Pukulan Lurus"`) | `Dashboard.dominantMovementSlug` (`'kuda-kuda' \| 'pukulan' \| 'tangkisan' \| 'tendangan' \| null`) | **Mismatch (nullable enum)** | Map `dominantMovementSlug ?? lastSession?.session.movementSlug` via `PILAR_NAMES[slug]`. When both are `null`, fallback to `"Kuda-kuda"` (`slug: "kuda-kuda"`). |
| Primary CTA: `Mulai Sesi Latihan` (dead `<span>`) | `/latihan` (or `/latihan/${focusSlug}`) | **Mismatch (dead CTA)** | Replace `<span aria-disabled="true">` with live `<Link href="/latihan">Mulai Sesi Latihan</Link>`. |
| Secondary CTA: `Lihat Panduan Biomekanik` (dead `<span>`) | `/latihan/${focusSlug}` (`GET /api/v1/member/training-prep/{slug}`) | **Mismatch (route path)** | No standalone `/panduan` route exists; biomechanical guides (`checklist` + `guides`) live on `/latihan/[slug]`. Wire to `<Link href={`/latihan/${focusSlug}`}>Lihat Panduan Biomekanik</Link>`. |

### 3.2 Hero Visual Card (`HeroVisualCard`)

| FE Need | BE Endpoint & Field | Status | Notes (Field Names, Types, Nullability, Enums, Date Formats) |
|---|---|---|---|
| `metric.cameraReady` (`"Kamera Siap"` badge) | — (client hardware state only on `/latihan/[slug]/rekam`) | **Missing in BE** | Camera hardware readiness is not tracked on the BE (`README.md` §6.3). Replace with session/analysis status badge from `lastSession` (e.g. `"Sesi Terakhir Dinilai"` / `"Menunggu Sesi Pertama"`) or mark hardware status as client-only on `/rekam`. |
| `metric.accuracyPct` (`82% Akurasi terkini`) | `Dashboard.lastSession?.score` (`number \| null`), `Dashboard.lastSession?.movementName` | **Mismatch (unit & nullable)** | BE `score` is `0..100` similarity points (`poin`), **not** composite accuracy `%` (`Training.md` D5, `README.md` §6.1). When `lastSession?.score !== null`, render `"${Math.round(score)} poin"` with caption `"Skor Kemiripan Terkini (${movementName})"`; when `null`, render `"Belum dinilai"` with `formatScoreReason(lastSession?.scoreReason)`. Render composite accuracy `%` slot as inactive `"Segera hadir"`. |
| `metric.elbowToleranceDeg` (`14°`) & `metric.targetDeg` (`<8°`) | — (not in `Dashboard`; per-session angles live in `EvaluationOut.measurements` on `/evaluasi/[sessionId]`) | **Missing in BE (on `Dashboard`)** | `Dashboard` does not include `EvaluationOut.measurements`. Render the angle-tolerance telemetry line as visually inactive (`opacity-60 border-dashed`, `<Badge variant="outline">Segera hadir</Badge>`) or show active session/duration summary (`"${completedSessionCount} sesi selesai • ${scoredSessionCount} dinilai"`). |
| `metric.cameraDistanceM` (`"Jarak 2.5m"`) | — | **Missing in BE** | BE never measures camera distance in meters (`Measurement.unit` is only `'deg' \| 'shoulder_width'`). Render chip as inactive `"Jarak: Segera hadir"` (or replace with active total duration chip `formatDurationHours(statistics.totalDurationSeconds)`). |

### 3.3 Pillar Grid (`PillarGrid` — 4 Pillars)

| FE Need | BE Endpoint & Field | Status | Notes (Field Names, Types, Nullability, Enums, Date Formats) |
|---|---|---|---|
| 4 pillar items (`kuda-kuda`, `pukulan`, `tangkisan`, `tendangan`) | `TRAINING_MODULE_SLUGS` + `Dashboard.statistics.similarityGroups` (`SimilarityGroup[]`) | **Mismatch (aggregation)** | `similarityGroups` contains `0..N` entries grouped by `(movementSlug, method, analyzerVersion, featureVersion, referenceVersion)`. Map over the 4 canonical `PilarSlug`s (`kuda-kuda`, `pukulan`, `tangkisan`, `tendangan`). |
| `pillar.name` | `PILAR_NAMES[slug]` | **Match** | `"Kuda-kuda"`, `"Pukulan Lurus"` (or `"Pukulan"`), `"Tangkisan"`, `"Tendangan"`. |
| `pillar.active` (`true` on `pukulan`) | `Dashboard.dominantMovementSlug` | **Match (nullable)** | Mark `pillar.active = (pillar.slug === (dashboard.dominantMovementSlug ?? dashboard.lastSession?.session.movementSlug))`. If both are `null`, no card (or `kuda-kuda` default) is forced active. |
| `pillar.avgPct` (`94.8%`) | `SimilarityGroup.averageScore` (`number \| null`) | **Mismatch (unit & nullable)** | Per `Training.md` (`toSimilarity` in `training-mapper.ts`), when exactly 1 `SimilarityGroup` for `slug` has `averageScore !== null && sampleCount > 0`, display `"${formatScore(averageScore)} poin"` (unit `poin`, **never** `%`, label `"Rata-rata Skor"`). When no single unambiguous group exists (`0` samples or multiple incompatible analyzer versions), render `"—"` with inactive `"Segera hadir"` / `"Belum dinilai"` styling. |
| `pillar.detail` (`"Tuntas 4/4 Variasi"`, `"Harus Evaluasi"`) | `SimilarityGroup.sampleCount` (`number`) | **Mismatch (curriculum variations missing in BE)** | BE does not track `4/4 Variasi` sub-variation completion. Display `"${sampleCount} sesi dinilai"` when `sampleCount > 0`, or `"Belum ada sesi"` when `0`. |
| `pillar.status` (`"stabil" \| "optimal" \| "perlu-koreksi"`) & `pillar.statusLabel` | `SimilarityGroup.sampleCount`, `lastSession?.session.reviewStatus` | **Mismatch (no IPSI threshold in BE)** | BE does not define `Stabil` / `Optimal` / `Perlu Koreksi` score cutoffs. Map honestly: if `lastSession?.session.movementSlug === slug && lastSession.session.reviewStatus === "needs_revision"`, use `"perlu-koreksi"` (`"Perlu Revisi"`); else if `sampleCount > 0`, use `"terdata"` (`"${sampleCount} Sesi"`, `secondary`/`success` badge); else `"belum-ada"` (`"Belum Dinilai"`, `outline` badge). |
| Pillar card CTA (`Lanjut` dead `<span>` / chevron) | `/latihan/${pillar.slug}` | **Mismatch (dead CTA)** | Wrap card action (or card link) with `<Link href={`/latihan/${pillar.slug}`}>` so every pillar navigates to its preparation page. |
| Section badge `<Badge variant="secondary">Gasal 2024</Badge>` | — | **Missing in BE (static copy)** | Keep as static curriculum label or replace with `"4 Pilar IPSI"`. |

### 3.4 Session Feedback Card (`SessionFeedback` — `Dashboard.lastSession`)

| FE Need | BE Endpoint & Field | Status | Notes (Field Names, Types, Nullability, Enums, Date Formats) |
|---|---|---|---|
| `lastSession` object (non-nullable in FE `MemberDashboard`) | `Dashboard.lastSession` (`HistoryItem \| null`) | **Mismatch (nullable)** | `null` when the member has never recorded a session. Render an honest empty state card (`"Belum ada sesi latihan mandiri"`, subtitle `"Rekam sesi pertamamu untuk mendapatkan evaluasi postur dan ulasan pelatih"`, CTA `<Link href="/latihan">Mulai Latihan Pertama</Link>`). |
| `session.technique` (`"Pukulan Lurus (Serangan Tangan)"`) | `HistoryItem.movementName`, `HistoryItem.session.movementSlug` | **Match** | `lastSession.movementName || PILAR_NAMES[lastSession.session.movementSlug]`. |
| `session.time` (`"Kemarin, 16:40 WIB"`) | `HistoryItem.session.startedAt ?? HistoryItem.session.createdAt` | **Mismatch (format)** | ISO 8601 UTC string → formatted in `Asia/Jakarta` (`formatDateTimeId`). |
| `session.reps` (`30` → `"30 Repetisi"`) | `HistoryItem.session.media.durationSeconds` (`number \| null`) | **Missing in BE (`reps`)** | BE `repetitionCountingAvailable` is `false` and `validRepetitions` is always `null`. Replace `"${reps} Repetisi"` with real duration (`formatDurationId(session.media.durationSeconds)` when available) + `"Repetisi: Segera hadir"` badge/caption. |
| `session.scorePct` (`82%`) & `session.scoreLabel` (`"Perlu Ditingkatkan"`) | `HistoryItem.score` (`number \| null`), `HistoryItem.session.reviewStatus`, `HistoryItem.session.processingStatus` | **Mismatch (unit, nullable & enum)** | Display `"${Math.round(score)} poin — ${statusLabel}"` when `score !== null`, or `"Belum dinilai — ${statusLabel}"` when `score === null`, where `statusLabel` comes from `toHistoryReviewBadgeStatus(session.reviewStatus, session.processingStatus)` (`"Disetujui"`, `"Perlu Revisi"`, `"Menunggu Ulasan"`, `"Diproses"`, `"Gagal"`). |
| `session.observations` (3 items: `good`, `warning`, `neutral`) | `HistoryItem.review?.bodyAssessments` (`BodyAssessment[]`), `HistoryItem.review?.note`, `HistoryItem.scoreReason`, `HistoryItem.session.error` | **Mismatch (source & cardinality)** | Map available data honestly without fabricating angles:<br>1. Each `review.bodyAssessments` item maps to an observation (`approved` → `good`, `needs_revision` → `warning`, `not_assessed` → `neutral`) with `title = humanizeIdentifier(bodyPart)` and `body = note ?? defaultStatusText`.<br>2. `review.note` maps to a `neutral` observation (`title: "Catatan Pelatih"`, `body: review.note`).<br>3. If `review == null`, map `scoreReason` / `session.error` / `processingStatus` into an informative status observation (`"Evaluasi otomatis selesai. Buka Detail Evaluasi untuk melihat rincian parameter sudut & postur AI."`). |
| CTA: `Ulangi Latihan Gerakan Ini` (dead `<span>`) + Detail link | `/latihan/${session.movementSlug}/rekam` & `/riwayat/${session.id}` | **Mismatch (dead CTA)** | Wire `Ulangi Latihan Gerakan Ini` to `<Link href={`/latihan/${session.movementSlug}/rekam`}>` and add `<Link href={`/riwayat/${session.id}`}>Lihat Detail Evaluasi</Link>`. |

### 3.5 Weekly Consistency & Coach Note (`WeeklyProgress`)

| FE Need | BE Endpoint & Field | Status | Notes (Field Names, Types, Nullability, Enums, Date Formats) |
|---|---|---|---|
| `weekly.days` (7 items `Sen`–`Min` with `value: number \| null` in `%` and `state: "filled" \| "rest" \| "empty" \| "active"`) | `Dashboard.weeklyActivity` (`DailyActivity[]`: `{ date: string, sessionCount: number, durationSeconds: number }`), `Dashboard.timezone` (`"Asia/Jakarta"`) | **Mismatch (metric unit & day states)** | BE `DailyActivity` has `sessionCount` (int) and `durationSeconds` (number) per `date` (`YYYY-MM-DD`), **not** daily accuracy `%` and no `"rest"` state.<br>• Build a 7-day (`Sen`..`Min`) window anchored in `Asia/Jakarta` (or sorted from `weeklyActivity`).<br>• For each day: `sessionCount > 0` → `state = isToday ? "active" : "filled"`, `barHeightPct = Math.max(20, Math.round((sessionCount / maxSessionCount) * 100))`, top readout = `"${sessionCount}x"` (or `"${sessionCount} sesi"`); `sessionCount === 0` → `state = "empty"`, `barHeightPct = 0`, top readout = `"-"`. |
| `weekly.targetLabel` (`"Target: 4 dari 5 Hari Target"`) | `Dashboard.weeklyActivity` | **Mismatch (target not in BE)** | BE has no custom weekly day target (`5 Hari Target`). Display active summary `"${activeDays} dari 7 hari aktif • ${totalWeeklySessions} sesi"` and mark custom target configuration as `"Target mingguan: Segera hadir"` (or inactive badge). |
| `weekly.weekLabel` (`"Minggu Ke-3"`) | `Dashboard.weeklyActivity[].date` | **Mismatch (curriculum week not in BE)** | Derive date range label from the 7-day window in `id-ID` (`"7 Hari Terakhir"` or `"${startShort} – ${endShort}"`). |
| `coachNote.initials`, `coachNote.name`, `coachNote.quote` | `Dashboard.latestCoachNote` (`PublishedNote \| null`), `Dashboard.lastSession?.review`, `Dashboard.coach` (`CoachIdentity \| null \| undefined`) | **Mismatch (nullable)** | Fallback chain:<br>1. `latestCoachNote`: `{ initials: getInitials(author.fullName), name: author.fullName, quote: text, publishedAtLabel: formatDateTimeId(publishedAt), available: true }`.<br>2. Else `lastSession?.review` (when `review.note` non-empty): `{ initials: getInitials(review.author.fullName), name: review.author.fullName, quote: review.note, publishedAtLabel: formatDateTimeId(review.publishedAt), available: true }`.<br>3. Else if `dashboard.coach` exists: `{ initials: getInitials(coach.fullName), name: coach.fullName, quote: "Belum ada catatan terbaru dari pelatih.", available: false }`.<br>4. Else: `{ initials: "—", name: "Pelatih Belum Ditugaskan", quote: "Belum ada catatan dari pelatih.", available: false }`. |

### 3.6 Unused BE Fields on `GET /api/v1/member/dashboard`

| BE Field | Type | Status | Notes |
|---|---|---|---|
| `statistics.excludedScoreCount` | `number` (int) | **Unused in BE** | Number of sessions excluded from similarity scoring; available for diagnostic tooltips if needed. |
| `statistics.durationSampleCount` | `number` (int) | **Unused in BE (on `/dashboard`)** | Used by `/riwayat` (`RiwayatStatGrid` via `toHistorySummaryViewModel`), not displayed as a standalone counter on `/dashboard`. |
| `lastSession.review?.taskIds` & `supersedesReviewId` | `string[]`, `string \| null` | **Unused in BE (on `/dashboard`)** | Displayed in full on `/riwayat/[id]`. |

---

## 4. Phase 1 Assessment — Cross-Cutting Concerns

| Concern | Current FE State (`/dashboard`) | BE Contract & Repo Convention | Integration Strategy for `/dashboard` |
|---|---|---|---|
| **Auth / Token Handling** | `getMemberDashboard()` is an unauthenticated dummy function. `app/(member)/layout.tsx` wraps routes in `<AuthGate role="member">`. | `GET /api/v1/member/dashboard` and `GET /api/v1/auth/session` require `HTTPBearer`. Tokens live in HttpOnly cookies (`ss_at`, `ss_rt`); `proxy.ts` refreshes near expiry and forwards `x-silatsense-access`. | Read token server-side via `getAccessToken()` from `@/features/auth/data/session` and pass `headers: { Authorization: \`Bearer \${token}\` }`. Read member identity via `getSession()` (already memoized per request). Never expose tokens to client components. |
| **Base URL / Env Config** | `src/hey-api.ts` configures `baseUrl: process.env.NEXT_PUBLIC_API_URL ?? config?.baseUrl ?? "https://silatsense-be.vercel.app"`. | `openapi-ts.config.ts` points `runtimeConfigPath` to `./src/hey-api`. | Use `src/hey-api.ts` and `lib/api-client.ts` unchanged. |
| **Error Mapping** | None in `get-member-dashboard.ts`; `get-dashboard-summary.ts` currently swallows `5xx` errors by returning `null`. | `DomainErrorOut { detail, code, requestId, errors }`. Per [`README.md`](./README.md) §5: distinguish `401` (`null` → signed out) from `5xx`/network/schema mismatch (`throw Error` so BE outages do not silently appear as empty/signed-out states). | In shared `getDashboardDto()`: return `null` on missing token or `response?.status === 401`; throw descriptive `Error` (with status & normalized message) on `403`, `404`, `422`, `500`, network failure, or Zod validation error. |
| **Loading & Empty States** | `DashboardPage` wraps 4 sections in `<Suspense fallback={<Skeleton ... />}>`. Assumes `lastSession`, `pillars`, `weekly`, and `coachNote` are always populated. | A newly registered member has `completedSessionCount: 0`, `lastSession: null`, `latestCoachNote: null`, `dominantMovementSlug: null`, `similarityGroups: []`, and `weeklyActivity` with `0` sessions. | Preserve the 4 `<Suspense>` boundaries and skeletons; add first-class empty states for `lastSession === null` (in `SessionFeedback`), `0` scored pillars (in `PillarGrid`), `0` weekly sessions (in `WeeklyProgress`), and `latestCoachNote === null`. |
| **Cache Keys, Next 16 Cache Components & Invalidation** | `get-member-dashboard.ts` uses `'use cache'` + `cacheLife("minutes")`. | **Forbidden by [`README.md`](./README.md) §9:** `'use cache'` on cookie/token-dependent reads fails build under `cacheComponents: true` or leaks user data across requests. | Remove `'use cache'` and `cacheLife("minutes")` from `get-member-dashboard.ts`. Wrap `getDashboardDto()` and `getMemberDashboard()` in React `cache()` from `'react'` and pass `cache: "no-store"` to `dashboardApiV1MemberDashboardGet`. Because all 4 `<Suspense>` sections in `DashboardPage` call `getMemberDashboard()` within the same RSC render pass, React `cache()` deduplicates them into **one** HTTP call per request. Cross-module mutations (`acknowledgeSessionAction`, `retrySessionAction`, `deleteSessionAction`, `updateFollowUpTaskAction`, `updateProfileAction`) invalidate `dashboardApiV1MemberDashboardGetQueryKey()` / `revalidatePath("/dashboard")`. |
| **SSR vs Client Fetching** | All `/dashboard` components (`DashboardPage`, `HeroGreeting`, `HeroVisualCard`, `PillarGrid`, `SessionFeedback`, `WeeklyProgress`, `MemberTopNav`, `MemberBottomNav`) are Server Components (RSC). | `ss_at` is an `HttpOnly` cookie, so browser JS cannot call `dashboardApiV1MemberDashboardGetOptions()` directly against the BE without a token. | Keep `/dashboard` 100% Server Components streamed via `<Suspense>`. No `"use client"` boundary is needed on `/dashboard` because all interactions are standard Next.js `<Link>` navigations (`/latihan`, `/latihan/[slug]`, `/latihan/[slug]/rekam`, `/riwayat/[id]`). |
| **CORS** | All `/dashboard` reads run server-to-server from Next.js RSC to the FastAPI backend. | Browser never makes cross-origin XHR/fetch requests on `/dashboard`. | CORS is a non-issue for `/dashboard`. |

---

## 5. Phase 2 — Decisions (Adapt FE vs Request BE Change)

### D1 — Unify `getMemberDashboard` and `getDashboardSummary` on a single React `cache()` wire reader (`getDashboardDto`) + `getSession()`
- **Decision:** Adapt FE (`features/member/data/get-member-dashboard.ts` & `features/member/data/get-dashboard-summary.ts`).
- **Why:**
  - `get-member-dashboard.ts` currently uses `'use cache'` + `cacheLife("minutes")` and returns `dummyMemberDashboard`.
  - `get-dashboard-summary.ts` (used by `/riwayat`) already calls `dashboardApiV1MemberDashboardGet`.
  - `DashboardPage` has 4 `<Suspense>` sections (`HeroSection`, `PillarSection`, `FeedbackSection`, `WeeklySection`) that each call `getMemberDashboard()`.
  - `AuthGate` in `app/(member)/layout.tsx` already calls `getSession()` (wrapped in React `cache()`).
- **How:**
  - Export `getDashboardDto = cache(async (): Promise<Dashboard | null> => ...)` in `get-member-dashboard.ts` using `getAccessToken()`, `dashboardApiV1MemberDashboardGet({ headers, cache: "no-store", throwOnError: false })`, and `zDashboardApiV1MemberDashboardGetResponse.parse(data)`.
  - Export `getMemberDashboard = cache(async (): Promise<MemberDashboardViewModel | null> => ...)` which awaits `Promise.all([getDashboardDto(), getSession()])` and maps them via `toMemberDashboardViewModel(dashboard, user)`.
  - Update `getDashboardSummary()` in `get-dashboard-summary.ts` to delegate to `getDashboardDto()` + `toHistorySummaryViewModel(dashboard)` so error handling (`401` → `null`, `5xx` → `throw`) is 100% consistent across `/dashboard` and `/riwayat`.
  - Update `MemberTopNav` (or `MemberLayout`) to read `getSession()` (or accept `userInitials`) so the top-right avatar displays the authenticated member's real initials instead of hardcoded `"AS"`.
- **BE change:** None.

### D2 — Adapt `HeroVisualCard` to Honest UI (Active Latest Similarity Score + Inactive Sensor Telemetry)
- **Decision:** Adapt FE (`HeroVisualCard` + `dashboard-mapper.ts`).
- **Why:** `GET /api/v1/member/dashboard` does not provide composite accuracy `%`, elbow tolerance degrees (`14° vs <8°`), camera distance (`2.5m`), or browser camera readiness (`Kamera Siap`). Per [`README.md`](./README.md) §6.1, we must never fabricate metrics or silently delete the visual card's telemetry area.
- **How:**
  - Top status badge: reflects real session status (`"Sesi Terakhir Dinilai"` when `lastSession?.score !== null`, `"Menunggu Evaluasi"` when `lastSession` is pending/unscored, or `"Belum Ada Sesi"` when `lastSession === null`).
  - Primary metric readout (Active):
    - When `lastSession?.score !== null`: `"${Math.round(lastSession.score)} poin"` with eyebrow `"Skor Kemiripan Terkini • ${lastSession.movementName}"`.
    - When `lastSession === null` or `score === null`: `"Belum dinilai"` with subtitle `formatScoreReason(lastSession?.scoreReason) ?? "Rekam sesi latihan untuk melihat skor kemiripan"` and active session counter `"${statistics.completedSessionCount} Sesi Selesai"`.
  - Unsupported telemetry row (`Akurasi Gabungan & Toleransi Sudut` / `Jarak Sensor`): rendered visually inactive (`opacity-60 bg-muted/20 border-dashed border-border/80`) with `<Badge variant="outline">Segera hadir</Badge>`.
- **BE change:** None.

### D3 — Adapt `PillarGrid` to `SimilarityGroup` (`poin` + Sample Count) & Wire `/latihan/[slug]` Links
- **Decision:** Adapt FE (`PillarGrid`, `pillar-status.ts`, `dashboard-mapper.ts`).
- **Why:** BE `statistics.similarityGroups` provides per-movement `averageScore` (`0–100` similarity points) and `sampleCount` grouped by analyzer/reference version, not `%` accuracy, not `"Tuntas 4/4 Variasi"`, and not `Stabil`/`Optimal`/`Perlu Koreksi` thresholds.
- **How:**
  - Use the same unambiguous single-group rule as `toSimilarity` in `features/member/data/training-mapper.ts`:
    - Filter `statistics.similarityGroups` for `group.movementSlug === slug && group.averageScore !== null && group.sampleCount > 0`.
    - If `matching.length === 1`: `scoreAvailable = true`, `scoreLabel = "${formatScore(matching[0].averageScore)} poin"`, `detail = "${matching[0].sampleCount} sesi dinilai"`.
    - Otherwise (`0` scored sessions or multiple incompatible versions): `scoreAvailable = false`, `scoreLabel = "Segera hadir"` (or `"Belum dinilai"` when `totalSamples === 0`), `detail = totalSamples > 0 ? "${totalSamples} sesi dinilai" : "Belum ada sesi"`.
  - Status badge per pillar:
    - `"perlu-koreksi"` (`"Perlu Revisi"`, `warning` badge) if `lastSession?.session.movementSlug === slug && lastSession.session.reviewStatus === "needs_revision"`.
    - `"terdata"` (`"Terdata"`, `success` badge) if `scoreAvailable` is `true`.
    - `"belum-dinilai"` (`"Belum Dinilai"`, `secondary` badge) otherwise.
  - Active focus card: `active = (slug === (dashboard.dominantMovementSlug ?? dashboard.lastSession?.session.movementSlug))`.
  - Wire every pillar card's footer CTA (`Lanjut` / chevron) as a live `<Link href={`/latihan/${pillar.slug}`}>`.
- **BE change:** None.

### D4 — Adapt `SessionFeedback` for Nullable `lastSession`, Similarity `poin`, Real Duration, and Live CTAs
- **Decision:** Adapt FE (`SessionFeedback` + `dashboard-mapper.ts`).
- **Why:** `Dashboard.lastSession` is `HistoryItem | null`. When present, it has `score` in `poin` (nullable), `media.durationSeconds` (no `reps`), and `review?: PublishedReview | null` + `scoreReason` (no `EvaluationOut.measurements`).
- **How:**
  - **When `lastSession === null`:** Render an honest empty-state card (`"Evaluasi Sesi Mandiri"`, `"Belum ada sesi latihan mandiri"`, `"Mulai sesi rekaman pertamamu untuk melihat evaluasi postur dan catatan pelatih di sini."`, `<Link href="/latihan">Mulai Latihan Sekarang</Link>`).
  - **When `lastSession !== null`:**
    - Header: `technique = lastSession.movementName || PILAR_NAMES[slug]`.
    - Subtitle: `${formatDateTimeId(session.startedAt ?? session.createdAt)} • ${durationLabel}` (plus an inline muted badge `"Repetisi: Segera hadir"`).
    - Badge: `${score !== null ? `${Math.round(score)} poin — ` : ""}${statusLabel}` with variant mapped from `toHistoryReviewBadgeStatus(session.reviewStatus, session.processingStatus)`.
    - Observations list:
      - If `lastSession.review` exists: map `review.bodyAssessments` (`approved` → `good`, `needs_revision` → `warning`, `not_assessed` → `neutral`) and `review.note` (`neutral`, `"Catatan Pelatih"`).
      - If no observations came from `review` (e.g. `review == null`): render a status observation row (`tone: session.processingStatus === "failed" ? "warning" : "neutral"`, `title: "Status Evaluasi Sesi"`, `body: formatScoreReason(lastSession.scoreReason) ?? formatScoreReason(session.error?.detail) ?? "Sesi telah terekam. Buka Detail Evaluasi untuk melihat rincian analisis postur AI."`).
    - CTAs:
      - Primary outline CTA: `<Link href={`/latihan/${session.movementSlug}/rekam`}>Ulangi Latihan Gerakan Ini</Link>`.
      - Secondary link: `<Link href={`/riwayat/${session.id}`}>Lihat Detail Evaluasi</Link>`.
- **BE change:** None.

### D5 — Adapt `WeeklyProgress` Bars from Accuracy `%` to Daily Session Count (`DailyActivity`)
- **Decision:** Adapt FE (`WeeklyProgress` + `dashboard-mapper.ts`).
- **Why:** BE `weeklyActivity` is `Array<DailyActivity>` (`{ date: string, sessionCount: number, durationSeconds: number }`). It does not provide daily accuracy percentages or scheduled rest days.
- **How:**
  - Construct a 7-day sequence (`Sen`, `Sel`, `Rab`, `Kam`, `Jum`, `Sab`, `Min`) from `weeklyActivity` in `Asia/Jakarta` (if `weeklyActivity` has 7 items, sort chronologically by `date`; if fewer or empty, generate the 7-day window ending today in `Asia/Jakarta` and merge matching `date` entries).
  - Compute `maxSessions = Math.max(1, ...days.map((d) => d.sessionCount))`.
  - For each day:
    - `sessionCount: number`, `durationSeconds: number`.
    - `state`: `"active"` if it is the latest day with `sessionCount > 0` (or today when `sessionCount > 0`), `"filled"` if `sessionCount > 0`, `"empty"` if `sessionCount === 0`.
    - `barHeightPct`: `sessionCount > 0 ? Math.max(20, Math.round((sessionCount / maxSessions) * 100)) : 0`.
    - `valueLabel`: `sessionCount > 0 ? `${sessionCount}x` : "-"`.
  - Header metadata:
    - `title`: `"Konsistensi Latihan"`
    - `targetLabel`: `"${activeDaysCount} dari 7 hari aktif • ${totalWeeklySessions} sesi"` (and render custom weekly target as an inactive `"Target mingguan: Segera hadir"` badge/caption).
    - `weekLabel`: formatted 7-day range (e.g. `"7 Hari Terakhir"`).
- **BE change:** None.

### D6 — Handle Nullable `latestCoachNote` and `coach` in `WeeklyProgress`
- **Decision:** Adapt FE (`WeeklyProgress` + `dashboard-mapper.ts`).
- **Why:** Both `Dashboard.latestCoachNote` (`PublishedNote | null`) and `Dashboard.coach` (`CoachIdentity | null | undefined`) are nullable.
- **How:**
  - Priority 1: `dashboard.latestCoachNote` (`author.fullName`, `text`, `publishedAt`).
  - Priority 2: `dashboard.lastSession?.review` when `review.note` is non-empty (`review.author.fullName`, `review.note`, `review.publishedAt`).
  - Priority 3 (no note yet, but `dashboard.coach` is assigned): `name = coach.fullName`, `initials = getInitials(coach.fullName)`, `quote = "Belum ada catatan terbaru dari pelatih."`, `available = false`.
  - Priority 4 (neither note nor coach): `name = "Pelatih Belum Ditugaskan"`, `initials = "—"`, `quote = "Belum ada catatan dari pelatih."`, `available = false`.
- **BE change:** None.

---

## 6. Target Architecture & ViewModel Specification

### 6.1 Data Flow Diagram

```
Browser (GET /dashboard)
  │
  └─ app/(member)/layout.tsx
       └─ <Suspense fallback={null}>
            └─ <AuthGate role="member">
                 ├─ requireRole("member") -> getSession() [React cache()]
                 │    └─ authSessionApiV1AuthSessionGet({ cache: "no-store" }) -> 200 AuthUser
                 └─ app/(member)/dashboard/layout.tsx -> <MemberLayout>
                      ├─ <MemberTopNav> (reads memoized getSession() -> real initials)
                      ├─ app/(member)/dashboard/page.tsx -> <DashboardPage>
                      │    ├─ <Suspense fallback={<Skeleton />}> -> HeroSection
                      │    ├─ <Suspense fallback={<Skeleton />}> -> PillarSection
                      │    ├─ <Suspense fallback={<Skeleton />}> -> FeedbackSection
                      │    └─ <Suspense fallback={<Skeleton />}> -> WeeklySection
                      │         │
                      │         └─ All 4 sections call getMemberDashboard() [React cache()]
                      │              ├─ getDashboardDto() [React cache()]
                      │              │    └─ dashboardApiV1MemberDashboardGet({
                      │              │         headers: { Authorization: Bearer <ss_at> },
                      │              │         cache: "no-store",
                      │              │         throwOnError: false,
                      │              │       }) -> 200 Dashboard (validated via zDashboard)
                      │              ├─ getSession() [memoized hit — 0 extra network calls]
                      │              └─ toMemberDashboardViewModel(dashboard, user)
                      └─ <MemberBottomNav activeTab="dashboard" />
```

### 6.2 ViewModel Interfaces (`features/member/types.ts`)

```ts
export type PillarStatus =
  | "stabil"
  | "optimal"
  | "perlu-koreksi"
  | "terdata"
  | "belum-dinilai";

export type DayState = "filled" | "rest" | "empty" | "active";
export type ObservationTone = "good" | "warning" | "neutral";

export interface GreetingData {
  name: string;
  lastSessionDaysAgo: number | null;
  lastSessionRecencyLabel: string; // e.g. "hari ini" | "kemarin" | "2 hari lalu" | "Belum ada sesi latihan mandiri yang terekam."
  focusSlug: TrainingModuleSlug;
  focusTechnique: string;
  hasRecordedSession: boolean;
}

export interface HeroMetricData {
  statusLabel: string; // "Sesi Terakhir Dinilai" | "Menunggu Evaluasi" | "Belum Ada Sesi"
  statusVariant: "success" | "secondary" | "outline";
  scoreAvailable: boolean;
  scoreValue: number | null;
  scoreLabel: string; // e.g. "82 poin" | "Belum dinilai"
  scoreSubtitle: string; // e.g. "Skor Kemiripan Terkini • Pukulan Lurus"
  completedSessionsLabel: string; // e.g. "24 Sesi Selesai"
  totalDurationLabel: string; // e.g. "08j 45m"
  compositeAccuracy: { available: false; label: "Segera hadir" };
  sensorTelemetry: { available: false; label: "Segera hadir" };
}

export interface PillarStat {
  slug: TrainingModuleSlug;
  name: string;
  status: PillarStatus;
  statusLabel: string;
  detail: string;
  scoreAvailable: boolean;
  avgScore: number | null;
  avgLabel: string; // e.g. "82,0 poin" | "Segera hadir" | "—"
  sampleCount: number;
  active?: boolean;
  href: string; // `/latihan/${slug}`
}

export interface SessionObservation {
  tone: ObservationTone;
  title: string;
  body: string;
}

export interface LastSessionData {
  id: string;
  slug: TrainingModuleSlug;
  technique: string;
  time: string;
  durationLabel: string; // e.g. "45 detik" | "—"
  reps: { available: false; label: "Segera hadir" };
  scoreAvailable: boolean;
  scoreValue: number | null;
  badgeLabel: string; // e.g. "82 poin — Perlu Revisi" | "Menunggu Ulasan"
  badgeVariant: "success" | "warning" | "secondary" | "outline" | "destructive";
  observations: SessionObservation[];
  retryHref: string; // `/latihan/${slug}/rekam`
  detailHref: string; // `/riwayat/${id}`
}

export interface WeekDay {
  date: string; // YYYY-MM-DD
  label: string; // "Sen" .. "Min"
  sessionCount: number;
  durationSeconds: number;
  value: number | null; // normalized bar height 0..100 when sessionCount > 0, else null
  valueLabel: string; // e.g. "2x" | "-"
  state: DayState;
}

export interface WeeklyData {
  title: string;
  targetLabel: string; // e.g. "3 dari 7 hari aktif • 5 sesi"
  targetConfig: { available: false; label: "Segera hadir" };
  weekLabel: string; // e.g. "7 Hari Terakhir"
  days: WeekDay[];
}

export interface CoachNoteData {
  available: boolean;
  initials: string;
  name: string;
  roleLabel?: string;
  publishedAtLabel?: string;
  quote: string;
}

export interface MemberDashboardViewModel {
  greeting: GreetingData;
  heroMetric: HeroMetricData;
  pillars: PillarStat[];
  lastSession: LastSessionData | null;
  weekly: WeeklyData;
  coachNote: CoachNoteData;
}

export type MemberDashboard = MemberDashboardViewModel;
```

---

## 7. Phase 2 — List of FE Files to Change

### 7.1 New Files

| File Path | Purpose |
|---|---|
| `features/member/data/dashboard-mapper.ts` | Pure, deterministic mapper `toMemberDashboardViewModel(dashboard: Dashboard, user?: AuthUser | null, now?: Date): MemberDashboardViewModel` + helper mappers (`toGreetingViewModel`, `toHeroMetricViewModel`, `toPillarStatsViewModel`, `toLastSessionViewModel`, `toWeeklyDataViewModel`, `toCoachNoteViewModel`). |
| `tests/unit/member/dashboard-mapper.test.ts` | Vitest unit tests covering active `Dashboard` + `AuthUser` mapping, nullability fallbacks (`lastSession: null`, `latestCoachNote: null`, `coach: null`, `dominantMovementSlug: null`), multi-group vs single-group `SimilarityGroup` handling, 7-day `weeklyActivity` normalization in `Asia/Jakarta`, and inactive `"Segera hadir"` flags. |

### 7.2 Modified Files

| File Path | Changes |
|---|---|
| `features/member/types.ts` | Update `PillarStatus`, `GreetingData`, `HeroMetricData`, `PillarStat`, `LastSessionData`, `WeekDay`, `WeeklyData`, `CoachNoteData`, and `MemberDashboard` (`MemberDashboardViewModel`) to reflect `lastSession: LastSessionData \| null`, similarity `poin`, and inactive `"Segera hadir"` fields. |
| `features/member/data/get-member-dashboard.ts` | Remove `'use cache'`, `cacheLife("minutes")`, and `dummyMemberDashboard` import. Implement `getDashboardDto` and `getMemberDashboard` with React `cache()`, `getAccessToken()`, `getSession()`, `dashboardApiV1MemberDashboardGet({ cache: "no-store", throwOnError: false })`, `zDashboardApiV1MemberDashboardGetResponse.parse()`, and `toMemberDashboardViewModel()`. |
| `features/member/data/get-dashboard-summary.ts` | Reuse `getDashboardDto()` from `get-member-dashboard.ts` so `/riwayat` and `/dashboard` share a single per-request memoized fetcher and consistent `401` vs `5xx` error handling. |
| `features/member/pages/dashboard-page.tsx` | Handle `data === null` (when unauthenticated/`401` before layout redirect completes) gracefully across `HeroSection`, `PillarSection`, `FeedbackSection`, and `WeeklySection`. |
| `features/member/components/member-top-nav.tsx` | Replace hardcoded `"AS"` avatar initials with dynamic initials from `getSession()` (falling back to the `lucide-react` `User` icon when unauthenticated or in static render tests). |
| `features/member/components/hero-greeting.tsx` | Render `greeting.lastSessionRecencyLabel` (handling `lastSession === null`), replace dead `<span aria-disabled="true">` buttons with live `<Link href="/latihan">` and `<Link href={`/latihan/${greeting.focusSlug}`}>`. |
| `features/member/components/hero-visual-card.tsx` | Render active similarity score (`poin`) or `"Belum dinilai"`, active session/duration summary, and visually inactive (`opacity-60 bg-muted/20 border-dashed`) `"Segera hadir"` badges for composite accuracy and sensor distance/angle tolerance. |
| `features/member/components/pillar-status.ts` | Support `"terdata"` (`"success"`) and `"belum-dinilai"` (`"secondary"`) alongside `"stabil"`, `"optimal"`, and `"perlu-koreksi"`. |
| `features/member/components/pillar-grid.tsx` | Display `"Rata-rata Skor"` in `poin` (`pillar.avgLabel`) when `pillar.scoreAvailable` is true, or dimmed `"Segera hadir"` / `"—"` when unavailable; wire each pillar's CTA to `<Link href={pillar.href}>`. |
| `features/member/components/session-feedback.tsx` | Accept `session: LastSessionData \| null`. Render an empty state with CTA to `/latihan` when `null`. When present, render similarity score in `poin`, duration + `"Repetisi: Segera hadir"`, mapped observations, live `<Link href={session.retryHref}>Ulangi Latihan Gerakan Ini</Link>`, and `<Link href={session.detailHref}>Lihat Detail Evaluasi</Link>`. |
| `features/member/components/weekly-progress.tsx` | Render daily session count labels (`day.valueLabel`, e.g. `"2x"` / `"-"`) and proportional bar heights (`day.value`), active-days summary + `"Target mingguan: Segera hadir"`, and nullable coach note state. |
| `features/member/actions/acknowledge-session.ts` | Add `revalidatePath("/dashboard")` alongside existing revalidations so acknowledging a session refreshes `/dashboard`. |
| `features/member/actions/delete-session.ts` | Add `revalidatePath("/dashboard")` so deleting a session refreshes `/dashboard`. |
| `features/member/actions/retry-session.ts` | Add `revalidatePath("/dashboard")` so creating a retry session refreshes `/dashboard`. |
| `tests/unit/member/dashboard-data.test.ts` | Update characterization tests to verify `getMemberDashboard` (`401` → `null`, `200` → `MemberDashboardViewModel`, `500` → `throw`) using mocked SDK calls. |
| `tests/unit/member/hero-visual.test.ts` | Update assertions for live `<Link>` CTAs in `HeroGreeting` and Honest UI (`poin` + `"Segera hadir"`) in `HeroVisualCard`. |
| `tests/unit/member/pillars-feedback.test.ts` | Update assertions for `pillarBadgeVariant`, `PillarGrid` (`poin` + live `/latihan` links), and `SessionFeedback` (empty state + live links). |
| `tests/unit/member/weekly.test.ts` | Update assertions for `WeeklyProgress` session-count bars and coach note fallback. |

### 7.3 Files to Delete / Retire

| File Path | Reason |
|---|---|
| `features/member/data/member-dashboard-dummy.ts` | Retired once `get-member-dashboard.ts` and unit tests use `toMemberDashboardViewModel` against typed `Dashboard` fixtures. |

---

## 8. Phase 2 — Mapping of Generated SDK / Query / Mutation Options to FE Usage

| FE Consumer / Location | Generated SDK Function (`src/api/sdk.gen.ts`) | Generated TanStack Query / Key (`src/api/@tanstack/react-query.gen.ts`) | Generated Wire Zod Schema (`src/api/zod.gen.ts`) | Usage Pattern |
|---|---|---|---|---|
| `features/member/data/get-member-dashboard.ts` (`getDashboardDto`) | `dashboardApiV1MemberDashboardGet` | `dashboardApiV1MemberDashboardGetOptions()`<br>`dashboardApiV1MemberDashboardGetQueryKey()` | `zDashboard`<br>`zDashboardApiV1MemberDashboardGetResponse` | Server-side RSC read inside React `cache()` with `Authorization: Bearer ${token}` and `cache: "no-store"`. Shared by both `/dashboard` (`getMemberDashboard`) and `/riwayat` (`getDashboardSummary`). |
| `features/auth/data/session.ts` (`getSession`, called by `getMemberDashboard` & `MemberTopNav`) | `authSessionApiV1AuthSessionGet` | `authSessionApiV1AuthSessionGetOptions()`<br>`authSessionApiV1AuthSessionGetQueryKey()` | `zAuthUser`<br>`zAuthSessionApiV1AuthSessionGetResponse` | Server-side RSC read inside React `cache()`; already executed by `<AuthGate role="member">` in `app/(member)/layout.tsx`. |
| Cross-module cache invalidation (after session upload, delete, acknowledge, retry, or profile update) | — | `dashboardApiV1MemberDashboardGetQueryKey()` | — | Server Actions call `revalidatePath("/dashboard")`; client mutation `onSuccess` handlers may also call `queryClient.invalidateQueries({ queryKey: dashboardApiV1MemberDashboardGetQueryKey() })`. |

> **Why `dashboardApiV1MemberDashboardGetOptions()` is not called directly in a browser `useQuery`:**
> Per [`README.md`](./README.md) §8 & §10, the access token (`ss_at`) is stored in an `HttpOnly` cookie and is intentionally inaccessible to client-side JavaScript. Therefore, `/dashboard` fetches data on the server in RSC `<Suspense>` boundaries via `dashboardApiV1MemberDashboardGet` with `Authorization: Bearer ${token}` and streams the resolved HTML. If a client component ever needs hydrated query data, the server page prefetches with `queryClient.prefetchQuery({ queryKey: dashboardApiV1MemberDashboardGetQueryKey(), queryFn: getMemberDashboard })` and wraps the client tree in `<HydrationBoundary state={dehydrate(queryClient)}>`.

---

## 9. Phase 2 — Zod Validation Strategy

Per [`docs/integration/README.md`](./README.md) §3 & §7:

1. **Wire Response Validation (Generated SDK + Explicit Parse):**
   - `openapi-ts.config.ts` sets `{ name: "@hey-api/sdk", validator: true }`, which configures `dashboardApiV1MemberDashboardGet` in `src/api/sdk.gen.ts` with:
     ```ts
     responseValidator: async (data) => await zDashboardApiV1MemberDashboardGetResponse.parseAsync(data)
     ```
   - In `getDashboardDto()`, we additionally call `zDashboardApiV1MemberDashboardGetResponse.parse(data)` so unit tests that mock `dashboardApiV1MemberDashboardGet` still run full Zod wire validation (`zDashboard`, `zActivitySummary`, `zSimilarityGroup`, `zHistoryItem`, `zPublishedNote`, `zCoachIdentity`, `zDailyActivity`).
   - Note that `zDashboard` defines `.default('Asia/Jakarta')` on `timezone` and `zSessionOut` defines `.default('pending')` on `reviewStatus` and `.default(false)` on `reviewAvailable`. Parsing through `zDashboardApiV1MemberDashboardGetResponse` guarantees those defaults are materialized before `toMemberDashboardViewModel()` runs.
2. **No Form or Action Payload Schemas Required in `{Member Dashboard}`:**
   - `/dashboard` is a read-only overview screen with no forms, no query string filters, and no dashboard-specific mutations.
3. **Contract Drift Pinning in Unit Tests:**
   - `tests/unit/member/dashboard-mapper.test.ts` validates all test fixtures with `zDashboard.parse(...)` before passing them to `toMemberDashboardViewModel()`, ensuring any future OpenAPI change to `Dashboard` fails unit tests immediately.

---

## 10. Phase 2 — Risks & Mitigations

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R1 | **Next.js 16 Cache Components build failure or cross-user data leak if `'use cache'` remains in `get-member-dashboard.ts`.** | Reading `cookies()` / `headers()` inside `'use cache'` either fails `pnpm build` under `cacheComponents: true` or caches one member's dashboard for another member. | Remove `'use cache'` and `cacheLife` completely; use React `cache()` for single-request deduplication and pass `cache: "no-store"` to `dashboardApiV1MemberDashboardGet`. |
| R2 | **4× duplicate requests to `GET /api/v1/member/dashboard` on a single `/dashboard` render.** | `DashboardPage` mounts 4 parallel `<Suspense>` boundaries (`HeroSection`, `PillarSection`, `FeedbackSection`, `WeeklySection`) that each call `getMemberDashboard()`. | Wrapping `getDashboardDto` and `getMemberDashboard` in React `cache()` guarantees all 4 sections share the same in-flight promise within a single RSC request. |
| R3 | **New member (`0` sessions) crashes UI components assuming non-null `lastSession`, `latestCoachNote`, or `dominantMovementSlug`.** | `Dashboard.lastSession`, `latestCoachNote`, `coach`, and `dominantMovementSlug` are all `null` for a newly registered account. | Make `MemberDashboardViewModel.lastSession` explicitly nullable (`LastSessionData \| null`), provide an empty-state card in `SessionFeedback`, and test the zero-session member payload in `dashboard-mapper.test.ts`. |
| R4 | **Arbitrary averaging across incompatible `SimilarityGroup` versions.** | `statistics.similarityGroups` can contain multiple entries for the same `movementSlug` if `analyzerVersion` or `referenceVersion` changed. | Follow `Training.md` (`toSimilarity`): only display a numeric `averageScore` when a single unambiguous group with `averageScore !== null && sampleCount > 0` exists for that `movementSlug`; otherwise display `"Segera hadir"` / `"Belum dinilai"`, while still summing `sampleCount` for the session count detail. |
| R5 | **Timezone drift on `weeklyActivity` and `lastSessionDaysAgo` between server UTC and `Asia/Jakarta`.** | Vercel serverless functions run in UTC, while `DailyActivity.date` is formatted in `Asia/Jakarta` (`YYYY-MM-DD`). | Format all date comparisons and 7-day window generation explicitly using `Intl.DateTimeFormat("en-CA", { timeZone: dashboard.timezone ?? "Asia/Jakarta" })` (`YYYY-MM-DD`). |
| R6 | **Existing unit tests (`hero-visual.test.ts`, `pillars-feedback.test.ts`, `dashboard-data.test.ts`) assert on `dummyMemberDashboard` and dead `TODO` / `aria-disabled` strings.** | Updating components without updating their source-inspection tests will break `pnpm test`. | Update the 4 test files in lockstep with the component updates and add `tests/unit/member/dashboard-mapper.test.ts`. |

---

## 11. Phase 2 — Approved Open Questions (2026-11-07)

1. **`SessionFeedback` observations source when no coach review exists yet (`lastSession.review === null`):**
   - **Approved: Option A (Single Endpoint).** Keep `/dashboard` strictly on `GET /api/v1/member/dashboard`. Derive observations from `lastSession.review?.bodyAssessments` + `lastSession.review?.note` when reviewed, and show an AI status summary row (`formatScoreReason(lastSession.scoreReason)`) + a `"Lihat Detail Evaluasi"` link (`/riwayat/${session.id}`) when unreviewed. Zero waterfall requests.

2. **`HeroGreeting` secondary CTA (`Lihat Panduan Biomekanik`):**
   - **Approved: Yes.** `Lihat Panduan Biomekanik` links to `/latihan/${greeting.focusSlug}` (the recommended pillar's preparation & biomechanics guide page) and `Mulai Sesi Latihan` links to `/latihan`.

3. **`MemberTopNav` avatar initials (`"AS"`):**
   - **Approved: Yes, with `lucide-react` `User` icon fallback.** `MemberTopNav` reads memoized `getSession()` and displays `getInitials(user.fullName)` when available, falling back to `<User className="size-4" aria-hidden="true" />` when `user` is `null` or has no name.
