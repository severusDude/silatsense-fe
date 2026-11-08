# Coach Members (`/coach/members`, `/coach/members/[id]`, `/coach/members/[id]/riwayat`) — FE ↔ BE Integration Spec

- **Status:** Implemented — Phase 19 Coach members integration verified 2026-11-08.
- **Date:** 2026-11-08
- **Linear:** PSR-128 `[coach] Audit members contract` (label `docs`, project `silatsense`, assignee `me`). Parent/subs for implementation are created only after approval.
- **Branch:** `feature/psr-128-coach-audit-members-contract` (cut from `origin/development`).
- **Scope:** Coach Members only:
  - `/coach/members` — member list, stats, search, cards.
  - `/coach/members/[id]` — member profile, 4-pillar performance, latest evaluation, feedback, recent history.
  - `/coach/members/[id]/riwayat` — full member session history.
  - The feedback flow currently stubbed as `POST /coach/feedback`.
- **Out of scope:** Coach dashboard (`/coach`), coach reports (`/coach/laporan`), shared profile (`/profil`), all member routes, backend changes, PDF export, chart libraries, pose-skeleton canvas overlay, coach session video player, coach review-authoring route beyond what the feedback flow requires.
- **BE source of truth:** `https://silatsense-be.vercel.app/openapi.json` (v0.7.0, fetched 2026-11-07). Generated client in `src/api/` is in sync with this contract for the coach endpoints.
- **FE baseline:** Next.js 16.3.8 (`cacheComponents: true`), React 19.2.8, TanStack Query 5.104.1, Zod 4.6.5, `@hey-api/openapi-ts` 0.99.0 generated client in `src/api/`.
- **Canonical conventions:** [`docs/integration/README.md`](./README.md), [`docs/integration/coach-dashboard.md`](./coach-dashboard.md), [`docs/integration/sessions-history.md`](./sessions-history.md).

---

## 0. TL;DR

All three Coach Members screens currently run on **100% static dummy data** behind Next.js 16 `'use cache'` + `cacheLife("minutes")` readers and `generateStaticParams()`:

- `features/coach/data/team-members-dummy.ts` → list stats + 5 members.
- `features/coach/data/member-detail-dummy.ts` → one member detail (`aced-suryana`).
- `features/coach/data/member-history-dummy.ts` → 24 sessions, paginated 10/page in memory.
- `features/coach/components/member-feedback-form.tsx` → a stub mutation whose only TODO is `POST /coach/feedback`.

The live backend supports the three reads and the review flow, but with different shapes:

1. `GET /api/v1/coach/roster` → `RosterPage { items: RosterMember[], nextCursor }` (cursor-paginated, `q` search, no total count).
2. `GET /api/v1/coach/roster/{member_id}` → `RosterDetail { profile, latestSession, statistics }`.
3. `GET /api/v1/coach/roster/{member_id}/sessions` → `HistoryPage { items: HistoryItem[], nextCursor }` (cursor-paginated, filters).
4. `GET /api/v1/coach/sessions/{session_id}` → `CoachSessionDetail { session, evaluation, coach?, review?, reviewHistory?, legacyNotes, followUpTasks?, feedbackDraft }`.
5. `PUT /api/v1/coach/sessions/{session_id}/feedback-draft` → `DraftOut` (optimistic concurrency via `expectedVersion`).
6. `POST /api/v1/coach/sessions/{session_id}/reviews` → `201 PublishedReview` (requires `Idempotency-Key`, `expectedRevision`, `expectedDraftVersion`).
7. `GET /api/v1/coach/overview` → `CoachOverview` for the list stat grid.

**There is no `POST /coach/feedback` endpoint.** Coach feedback is **session-scoped**: a draft is written per session, then published as a review revision. This is the largest FE/BE conflict and blocks the feedback design until product decides the UX (member-level feedback card vs session-level review flow).

Other structural conflicts:

- **No stage classification** (`Siap Tanding` / `Tahap Remediasi` / `Lolos Standar`) and no stage thresholds. `reviewStatus` is available.
- **No aggregate team/member accuracy, graduation ratio, attendance, or trend deltas.** Only per-movement `similarityGroups` (0..100 similarity points), session counts, and duration samples.
- **No page-based history.** BE is cursor-based with no total count; `sesiLabel`, `subtitle`, and `repetisiLabel` have no direct fields.
- **No fixed 5 posture parameters** on coach evaluation. `EvaluationOut.measurements` / `issues` are dynamic (`feature`, `bodyPart`), and `validRepetitions` / `deviatedRepetitions` are always `null` in v0.7.0.
- **`CoachSessionDetail` has no member identity.** A standalone coach session-detail route would need the member context passed in (or a BE field).
- **Feedback is draft + publish**, not a single send. `DraftOut.version` / `review.revision` must round-trip, and publish needs an idempotency key.

**Proposed direction (not approved):** adapt the FE to the contract, reuse the existing member mappers (`toSessionDetailViewModel`, `toEvaluationViewModel`, `toPostureAssessmentViewModel`, `toHistoryReviewBadgeStatus`), map only BE-supported values, and render unsupported Figma metrics with Honest UI (`Segera hadir` / dimmed) per [`README.md`](./README.md) §6.1. The feedback card becomes a session-scoped draft/publish form on the latest session, **unless** product prefers a new BE member-level endpoint.

---

## 1. Phase 1 Assessment — Current FE Inventory

### 1.1 Routes, Layouts, and Page Compositions

| Route / File | Server / Client | Current Behavior & Data Flow |
|---|---|---|
| `app/(coach)/layout.tsx` | Server (RSC) | `<Suspense fallback={null}><AuthGate role="coach">{children}</AuthGate></Suspense>`. `AuthGate` calls `requireRole("coach")` → `getSession()`. |
| `app/(coach)/coach/layout.tsx` | Server (RSC) | Passthrough fragment. |
| `app/(coach)/coach/members/layout.tsx` | Server (RSC) | Passthrough fragment. |
| `app/(coach)/coach/members/(list)/layout.tsx` | Server (RSC) | `CoachLayout activeTab="members" trail={["Dashboard", "Member List"]}`. |
| `app/(coach)/coach/members/(list)/page.tsx` | Server (RSC) | Thin route: `<CoachMembersPage />`. |
| `app/(coach)/coach/members/[id]/(detail)/layout.tsx` | Server (RSC) | `CoachLayout activeTab="members" trail={["Dashboard", "Member List", "Detail"]}`. |
| `app/(coach)/coach/members/[id]/(detail)/page.tsx` | Server (RSC) | Exports `generateStaticParams()` from `memberDetailIds` (dummy ids). Awaits `params`, renders `<MemberDetailPage id={id} />`. |
| `app/(coach)/coach/members/[id]/(history)/riwayat/layout.tsx` | Server (RSC) | `CoachLayout activeTab="members" trail={["Dashboard", "Member List", "Daftar Riwayat Sesi Member"]}`. |
| `app/(coach)/coach/members/[id]/(history)/riwayat/page.tsx` | Server (RSC) | Exports `generateStaticParams()` from `memberHistoryIds`. Awaits `params`, forwards the `searchParams` Promise, renders `<MemberHistoryPage id={id} searchParams={searchParams} />`. |
| `features/coach/pages/coach-members-page.tsx` | Server (RSC) | Static shell + 3 `<Suspense>` units: `HeaderSection` (`getTeamMembers`), `StatSection` (`getTeamMemberStats`), `ListSection` (`getTeamMembers` → `<MemberSearch>`). |
| `features/coach/pages/member-detail-page.tsx` | Server (RSC) | Static shell + 5 `<Suspense>` units: profile, pillars, evaluation, feedback, history. Each calls `getMemberDetail(id)` separately; `null` → `notFound()`. |
| `features/coach/pages/member-history-page.tsx` | Server (RSC) | Static shell + 2 `<Suspense>` units: profile (`getMemberDetail`) and history (`getMemberHistory` + `searchParams` → `parseHistoryPage` + `paginateHistory`). |

### 1.2 Components

| Component / Helper | Server / Client | Props | Current Responsibility & Assumed Data |
|---|---|---|---|
| `features/coach/components/member-header.tsx` (`MemberHeader`) | Server | `{ totalAktif: number }` | H1 `Member List`, description, `<Badge variant="secondary">{totalAktif} Atlet Aktif</Badge>`. |
| `features/coach/components/member-stat-grid.tsx` (`MemberStatGrid`) | Server | `{ stats: CoachStat[] }` | 2×2 stat tiles. Icons: `Users`, `Target`, `CircleCheckBig`, `Video`. Renders `value`, optional `badge`, optional `note`. |
| `features/coach/components/member-search.tsx` (`MemberSearch`) | Client (`"use client"`) | `{ members: TeamMember[]; totalAktif: number }` | `useState` + `useMemo` client-side filter by name/NIM, then `<MemberCardList>`. |
| `features/coach/components/filter-members.ts` (`filterMembers`) | Pure TS | `(members, query)` | Case-insensitive name/NIM `includes` filter. |
| `features/coach/components/member-card-list.tsx` (`MemberCardList`) | Server | `{ members: TeamMember[]; totalAktif: number }` | Outer section `Monitoring Pose Kinematika` + count badge. Per member: initials avatar, name, stage Badge (`stageBadgeVariant`), `lastGerakan`, `scorePct%`, live `<Link href={/coach/members/${id}}>Lihat Detail</Link>`. Empty state `Tidak ada atlet yang cocok.` |
| `features/coach/components/coach-stage.ts` (`stageBadgeVariant`) | Pure TS | `stage: AthleteStage` | `remediasi` → `warning`, otherwise `success`. |
| `features/coach/components/member-detail-profile.tsx` (`MemberDetailProfile`) | Server | `{ detail: MemberDetail }` | Profile Card (initials via `getInitials`, state Badge via `performanceBadgeVariant/Label`, name, `NIM {nim}`), meta Card (`Sabuk`, `Kehadiran`, `Agregat {aggregatePct}%`), aggregate Card (`Skor agregat biomekanika` + Badge). |
| `features/coach/components/pillar-performance-section.tsx` (`PilarPerformanceSection`) | Server | `{ pilares: PilarPerformance[] }` | `Performa 4 Pilar Dasar` card, 2×2 tiles with icon, performance Badge, name, `{scorePct}%`. Dead `Lihat semua` span (`TODO: wire to full pillar breakdown`). |
| `features/coach/components/latest-evaluation.tsx` (`LatestEvaluationSection`) | Server | `{ evaluation: LatestEvaluation }` | Badges `Sesi 24` + `Standar IPSI`, technique, `metaLabel`, big `{bigScorePct}%`, `Target {targetValue}` / `Selisih {deltaValue}`, 4 metric tiles, `ImagePlaceholder`, 4 quick stats, 5 posture rows. |
| `features/coach/components/posture-param-row.tsx` (`PostureParamRow`) | Server | `{ param: PostureParam }` | Posture row with `CircleCheck`/`TriangleAlert`, name, performance Badge, note. |
| `features/coach/components/member-feedback-card.tsx` (`MemberFeedbackCard`) | Server | `{ memberId, memberName }` | Card shell `Feedback Koreksi Pelatih` + description + `<MemberFeedbackForm>`. |
| `features/coach/components/member-feedback-form.tsx` (`MemberFeedbackForm`) | Client (`"use client"`) | `{ memberId, memberName }` | RHF + Zod `feedbackSchema` (message 10..1000). `useMutation` stub returning `{ memberId, status: "sent", echo }`. `Simpan Draft` is a toast stub; `Kirim ke Member` calls the stub. Invalidates `["member-detail", memberId]`. TODOs: `POST /coach/feedback`. |
| `features/coach/components/session-history-log.tsx` (`SessionHistoryLog`) | Server | `{ history: HistorySession[]; memberId: string }` | `Riwayat Sesi Terkini` section, 4 nested cards (`sesiLabel`, `dateLabel`, `title`, `repetisiLabel`, performance Badge). Footer link `Buku Semua Riwayat Atlet` → `/coach/members/{memberId}/riwayat`. |
| `features/coach/components/member-history-section.tsx` (`MemberHistorySection`) | Server | `{ history: MemberHistory; slice: HistoryPageSlice }` | `Daftar Riwayat Sesi` header + count Badge `{shown} / {totalSessions} Sesi`, description, `<ul>` of `<HistorySessionCard>`, `<HistoryPagination>`. |
| `features/coach/components/history-session-card.tsx` (`HistorySessionCard`) | Server | `{ session: HistoryPageSession }` | Card row: `sesiLabel` + `dateLabel`, `scorePct.toFixed(1)%` + `Skor AI`, tone dot + `title`, `subtitle`, footer `repetisiLabel` + performance Badge. |
| `features/coach/components/history-pagination.tsx` (`HistoryPagination`) | Server | `{ memberId, page, totalPages, totalSessions, rangeStart, rangeEnd }` | Range text `Menampilkan {start} - {end} dari {total} total sesi biomekanika`, prev/next + numbered page links (`?page=N`), disabled at edges. |

### 1.3 Types, Zod Schemas, Mocks, Data Fetching, and Tests

- **Local types (`features/coach/types.ts`, members-related):**
  ```ts
  export type AthleteStage = "siap" | "remediasi" | "lolos";

  export interface CoachStat {
    id: "total-atlet" | "akurasi-tim" | "sidang-uji" | "fokus";
    label: string;
    value: string;
    badge?: string;
    note?: string;
    footerLeft?: string;
    footerRight?: string;
  }

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

  export interface PilarPerformance {
    slug: PilarSlug;
    name: string;
    scorePct: number;
    badgeKey: PerformanceBadgeKey;
  }

  export interface PostureParam {
    id: PostureParamId;
    name: string;
    badgeKey: PerformanceBadgeKey;
    note: string;
  }

  export interface LatestEvaluation {
    technique: string;
    metaLabel: string;
    bigScorePct: number;
    targetValue: string;
    deltaValue: string;
    metrics: { label: string; value: string; sub: string }[];
    quickStats: { label: string; value: string; sub: string }[];
    postures: PostureParam[];
  }

  export interface HistorySession {
    id: string;
    sesiLabel: string;
    dateLabel: string;
    title: string;
    repetisiLabel: string;
    scorePct: number;
    badgeKey: PerformanceBadgeKey;
  }

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
    id: string;
    name: string;
    nim: string;
    stateKey: PerformanceBadgeKey;
    beltLabel: string;
    attendanceLabel: string;
    aggregatePct: number;
    aggregateKey: PerformanceBadgeKey;
    pilares: PilarPerformance[];
    evaluation: LatestEvaluation;
    history: HistorySession[];
  }

  export interface FeedbackInput {
    memberId: string;
    message: string;
  }

  export interface FeedbackResult {
    memberId: string;
    status: "draft" | "sent";
    echo: string;
  }
  ```
  `CoachStat`, `AthleteStage`, and `TeamMember` are also referenced by dashboard tests/legacy shapes; dashboard components now use `CoachDashboardStat` / `CoachAthlete`.
- **Local Zod (`features/coach/schemas.ts`):** only `feedbackSchema = z.object({ message: z.string().min(10).max(1000) })` and `FeedbackFormInput`.
- **Mocks / fixtures:**
  - `features/coach/data/team-members-dummy.ts` — `dummyTeamMemberStats` (4 Figma stats) + `dummyTeamMembers` (5 members, ids `aced-suryana` … `dimas-wicaksono`, NIMs `2307051`–`2307055`).
  - `features/coach/data/member-detail-dummy.ts` — `dummyMemberDetail["aced-suryana"]` with 4 pilares, 5 postures, 4 history rows.
  - `features/coach/data/member-history-dummy.ts` — `dummyMemberHistory["aced-suryana"]` with 24 sessions, `pageSize: 10`, `totalSessions: 24`.
- **Data fetching:**
  - `features/coach/data/get-team-members.ts` — `getTeamMembers()` + `getTeamMemberStats()`, both `'use cache'` + `cacheLife("minutes")`; TODOs `GET /coach/members`.
  - `features/coach/data/get-member-detail.ts` — `memberDetailIds = Object.keys(dummyMemberDetail)` + `getMemberDetail(id)`, `'use cache'`; TODO `GET /coach/members/[id]`.
  - `features/coach/data/get-member-history.ts` — `memberHistoryIds = Object.keys(dummyMemberHistory)` + `getMemberHistory(id)`, `'use cache'`; TODO `GET /coach/members/[id]/history?page=N`.
  - `features/coach/data/paginate-history.ts` — pure `parseHistoryPage(value)` (invalid → 1) + `paginateHistory(sessions, page, pageSize)` (clamps to `1..totalPages`, returns `sessions`, `page`, `totalPages`, `rangeStart`, `rangeEnd`).
- **Unit tests:**
  - `tests/unit/coach/team-members-data.test.ts` — dummy shape, Figma literals, NIM, stage→Badge mapping, no footer pairs.
  - `tests/unit/coach/team-members-route.test.ts` — thin route, layout trail, `filterMembers` client search.
  - `tests/unit/coach/team-members-sections.test.ts` — stat/card markup, dead CTA, empty state.
  - `tests/unit/coach/filter-members.test.ts` — name/NIM filter behavior.
  - `tests/unit/coach/member-detail-data.test.ts` — dummy detail, 4 pilares, 5 postures, 4 history rows, no `initials`, prototype-key guard.
  - `tests/unit/coach/member-detail-route.test.ts` — `generateStaticParams`, `memberDetailIds`, layout trail.
  - `tests/unit/coach/member-detail-sections.test.ts` — profile/pillar/evaluation/feedback/history markup; `POST /coach/feedback` stub; read-your-own-write.
  - `tests/unit/coach/member-history-data.test.ts` — 24 sessions, card #24 literals, tone sequence, `parseHistoryPage`, `paginateHistory`, prototype-key guard.
  - `tests/unit/coach/member-history-route.test.ts` — `generateStaticParams`, `memberHistoryIds`, `parseHistoryPage`/`paginateHistory`.
  - `tests/unit/coach/member-history-sections.test.ts` — section/card/pagination markup, badge allowlist, links.

---

## 2. Phase 1 Assessment — Backend Contract Snapshot

### 2.1 Endpoints Relevant to Coach Members

All endpoints require `HTTPBearer` (`Authorization: Bearer <accessToken>`). Error responses use `DomainErrorOut`; the coach endpoints below document `401, 403, 404, 409, 410, 416, 422, 500`.

| # | Method + Path | Params / Query / Headers | Request Body | Success Response | Generated SDK Function |
|---|---|---|---|---|---|
| 1 | `GET /api/v1/coach/overview` | — | — | `200 CoachOverview` | `overviewApiV1CoachOverviewGet` |
| 2 | `GET /api/v1/coach/roster` | `limit?: 1..100` (default `20`), `cursor?: string \| null`, `q?: string` (max `120`, default `""`) | — | `200 RosterPage` | `rosterApiV1CoachRosterGet` |
| 3 | `GET /api/v1/coach/roster/{member_id}` | Path: `member_id: string` | — | `200 RosterDetail` | `memberDetailApiV1CoachRosterMemberIdGet` |
| 4 | `GET /api/v1/coach/roster/{member_id}/sessions` | Path: `member_id: string`; Query: `limit?: 1..100` (default `20`), `cursor?: string \| null` (max `4096`), `movementSlug?: 'kuda-kuda' \| 'pukulan' \| 'tangkisan' \| 'tendangan' \| null`, `processingStatus?: 'queued' \| 'processing' \| 'completed' \| 'failed' \| null`, `reviewStatus?: 'pending' \| 'needs_revision' \| 'approved' \| null`, `from?: ISO datetime \| null`, `to?: ISO datetime \| null` | — | `200 HistoryPage` | `memberSessionsApiV1CoachRosterMemberIdSessionsGet` |
| 5 | `GET /api/v1/coach/sessions/{session_id}` | Path: `session_id: string` | — | `200 CoachSessionDetail` | `sessionDetailApiV1CoachSessionsSessionIdGet` |
| 6 | `PUT /api/v1/coach/sessions/{session_id}/feedback-draft` | Path: `session_id: string` | `DraftInput` | `200 DraftOut` | `draftApiV1CoachSessionsSessionIdFeedbackDraftPut` |
| 7 | `POST /api/v1/coach/sessions/{session_id}/reviews` | Path: `session_id: string`; Header: `Idempotency-Key` (1..128 chars) | `PublishInput` | `201 PublishedReview` | `publishApiV1CoachSessionsSessionIdReviewsPost` |
| 8 | `GET /api/v1/coach/sessions/{session_id}/pose` | Path: `session_id: string` | — | `200 PoseOut` | `poseApiV1CoachSessionsSessionIdPoseGet` — **not used in this module** (pose overlay out of scope). |
| 9 | `GET /api/v1/coach/sessions/{session_id}/video` | Path: `session_id: string`; Header: `Range?: string \| null` | — | `200` / `206` binary | Proxied through a BFF route if a coach video player is added later — **not used in this module**. |

### 2.2 Pagination and Filter Conventions

- **Roster:** cursor pagination (`nextCursor: string | null`), page size `1..100` (default `20`), server-side search `q` (max 120). No total count.
- **Member sessions:** cursor pagination (`nextCursor: string | null`), page size `1..100` (default `20`), filters `movementSlug`, `processingStatus`, `reviewStatus`, `from`, `to`. No total count.
- **No page numbers, no `page` query parameter, no `totalSessions`.** A page-based UI cannot be reproduced without a BE change.

### 2.3 Generated Wire DTOs (from `src/api/types.gen.ts`)

Copied verbatim from the generated client (**generated — never edit**):

```ts
export type RosterPage = {
  items: Array<RosterMember>;
  nextCursor: string | null;
};

export type RosterMember = {
  profile: ProfileOut;
  latestSession: HistoryItem | null;
};

export type RosterDetail = {
  profile: ProfileOut;
  latestSession: HistoryItem | null;
  statistics: ActivitySummary;
};

export type ProfileOut = {
  id: string;
  role: 'member' | 'coach';
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

export type HistoryPage = {
  items: Array<HistoryItem>;
  nextCursor: string | null;
};

export type HistoryItem = {
  session: SessionOut;
  movementName: string;
  score: number | null; // 0..100 similarity points
  scoreReason: string | null;
  review?: PublishedReview | null;
};

export type CoachSessionDetail = {
  session: SessionOut;
  evaluation: EvaluationOut | null;
  coach?: CoachIdentity | null;
  review?: PublishedReview | null;
  reviewHistory?: Array<PublishedReview>;
  legacyNotes: Array<PublishedNote>;
  followUpTasks?: Array<TaskOut>;
  feedbackDraft: DraftOut | null;
};

export type DraftInput = {
  expectedVersion: number; // >= 0
  decision?: 'approved' | 'needs_revision' | null;
  note?: string | null; // max 5000
  bodyAssessments?: Array<BodyAssessment>; // max 33
  tasks?: Array<TaskInput>; // max 20
};

export type DraftOut = {
  version: number;
  author: CoachIdentity;
  updatedAt: string;
  decision: 'approved' | 'needs_revision' | null;
  note: string | null;
  bodyAssessments: Array<BodyAssessment>;
  tasks: Array<TaskInput>;
};

export type PublishInput = {
  expectedRevision: number; // >= 0
  expectedDraftVersion: number; // >= 1
};

export type PublishedReview = {
  id: string;
  revision: number;
  author: CoachIdentity;
  publishedAt: string;
  decision: 'approved' | 'needs_revision';
  note: string | null;
  bodyAssessments: Array<BodyAssessment>;
  taskIds: Array<string>;
  supersedesReviewId: string | null;
};

export type BodyAssessment = {
  bodyPart: string; // 1..80 chars
  status: 'not_assessed' | 'needs_revision' | 'approved';
  note?: string | null; // max 2000
};

export type TaskInput = {
  instruction: string; // 1..2000
};

export type TaskOut = {
  id: string;
  sessionId: string;
  reviewId: string;
  author: CoachIdentity;
  instruction: string;
  status: 'open' | 'completed' | 'dismissed';
  createdAt: string;
  updatedAt: string;
};

export type CoachIdentity = {
  id: string;
  fullName: string;
  title: string | null;
};

export type PublishedNote = {
  id: string;
  author: CoachIdentity;
  text: string;
  publishedAt: string;
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
  averageScore: number | null; // 0..100 similarity points
  sampleCount: number;
};

export type CoachOverview = {
  memberCount: number;
  reviewQueueCount: number;
  statistics: ActivitySummary;
  recentSessions: Array<HistoryItem>;
  topIssues: Array<IssueCount>;
};

export type SessionOut = {
  id: string;
  movementSlug: 'kuda-kuda' | 'pukulan' | 'tangkisan' | 'tendangan';
  createdAt: string;
  uploadedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  processingStatus: 'queued' | 'processing' | 'completed' | 'failed';
  analysisStatus: string | null;
  evaluationId: string | null;
  reviewStatus?: 'pending' | 'approved' | 'needs_revision';
  reviewAvailable?: boolean;
  retryOf: string | null;
  acknowledgedAt: string | null;
  error: SessionFailure | null;
  media: MediaOut;
};

export type EvaluationOut = {
  id: string;
  sessionId: string;
  movementSlug: 'kuda-kuda' | 'pukulan' | 'tangkisan' | 'tendangan';
  evaluatedAt: string;
  analysisStatus: 'experimental' | 'reference_not_ready' | 'insufficient_pose' | 'insufficient_features';
  score: number | null; // 0..100 similarity points
  scoreUnit?: 'similarity_points';
  scoreReason: string | null;
  matchedVariant: string | null;
  method?: 'static-reference-pose';
  analyzerVersion: string;
  featureVersion: string | null;
  referenceVersion: string | null;
  poseStatus: 'detected' | 'not_detected';
  framesProcessed: number;
  validPoseFrames: number;
  featuresCompared: number | null;
  keyFrame: KeyFrame | null;
  measurements: Array<Measurement>;
  issues: Array<AnalysisIssue>;
  validRepetitions: null;
  deviatedRepetitions: null;
  unavailableReasons: Array<string>;
};

export type Measurement = {
  feature: string;
  bodyPart: string;
  value: number | null;
  unit: 'deg' | 'shoulder_width';
  referenceMedian: number | null;
  referenceIqr: number | null;
  deviation: number | null;
  assessment: 'within_reference' | 'deviates' | 'not_assessed';
  reason: string | null;
};

export type AnalysisIssue = {
  feature: string;
  bodyPart: string;
  deviation: number;
  unit: 'deg' | 'shoulder_width';
  severity: 'low' | 'medium' | 'high';
  feedback: string;
};

export type DomainErrorOut = {
  detail: string;
  code: string;
  requestId: string;
  errors?: Array<ValidationIssue> | null;
};
```

*(For `MediaOut`, `SessionFailure`, `KeyFrame`, and `PoseOut`, see [`docs/integration/Training.md`](./Training.md) §1.2 and the generated types.)*

### 2.4 Generated Zod Schemas (`src/api/zod.gen.ts`)

```ts
export const zRosterApiV1CoachRosterGetQuery = z.object({
  limit: z.int().gte(1).lte(100).optional().default(20),
  cursor: z.string().nullish(),
  q: z.string().max(120).optional().default(''),
});

export const zRosterApiV1CoachRosterGetResponse = zRosterPage;
export const zMemberDetailApiV1CoachRosterMemberIdGetResponse = zRosterDetail;

export const zMemberSessionsApiV1CoachRosterMemberIdSessionsGetQuery = z.object({
  limit: z.int().gte(1).lte(100).optional().default(20),
  cursor: z.string().nullish(),
  movementSlug: z.enum(['kuda-kuda', 'pukulan', 'tangkisan', 'tendangan']).nullish(),
  processingStatus: z.enum(['queued', 'processing', 'completed', 'failed']).nullish(),
  reviewStatus: z.enum(['pending', 'needs_revision', 'approved']).nullish(),
  from: z.iso.datetime().nullish(),
  to: z.iso.datetime().nullish(),
});

export const zMemberSessionsApiV1CoachRosterMemberIdSessionsGetResponse = zHistoryPage;
export const zSessionDetailApiV1CoachSessionsSessionIdGetResponse = zCoachSessionDetail;
export const zDraftApiV1CoachSessionsSessionIdFeedbackDraftPutBody = zDraftInput;
export const zDraftApiV1CoachSessionsSessionIdFeedbackDraftPutResponse = zDraftOut;
export const zPublishApiV1CoachSessionsSessionIdReviewsPostBody = zPublishInput;
export const zPublishApiV1CoachSessionsSessionIdReviewsPostHeaders = z.object({
  'Idempotency-Key': z.string().min(1).max(128),
});
export const zPublishApiV1CoachSessionsSessionIdReviewsPostResponse = zPublishedReview;
```

### 2.5 Generated TanStack Query Options

- `overviewApiV1CoachOverviewGetOptions()` / `overviewApiV1CoachOverviewGetQueryKey()`
- `rosterApiV1CoachRosterGetOptions()` / `rosterApiV1CoachRosterGetQueryKey()` / `rosterApiV1CoachRosterGetInfiniteOptions()` / `rosterApiV1CoachRosterGetInfiniteQueryKey()`
- `memberDetailApiV1CoachRosterMemberIdGetOptions()` / `memberDetailApiV1CoachRosterMemberIdGetQueryKey()`
- `memberSessionsApiV1CoachRosterMemberIdSessionsGetOptions()` / `memberSessionsApiV1CoachRosterMemberIdSessionsGetQueryKey()` / `memberSessionsApiV1CoachRosterMemberIdSessionsGetInfiniteOptions()` / `memberSessionsApiV1CoachRosterMemberIdSessionsGetInfiniteQueryKey()`
- `sessionDetailApiV1CoachSessionsSessionIdGetOptions()` / `sessionDetailApiV1CoachSessionsSessionIdGetQueryKey()`
- `draftApiV1CoachSessionsSessionIdFeedbackDraftPutMutation()`
- `publishApiV1CoachSessionsSessionIdReviewsPostMutation()`

> The generated infinite options **do not** include `initialPageParam` or `getNextPageParam`. If a client `useInfiniteQuery` is used, add `initialPageParam: null` and `getNextPageParam: (last) => last.nextCursor`. The server-rendered cursor-link approach in D9 does not need them.
>
> Query keys include `headers` if passed. Call key factories **without** the auth header for stable invalidation; add the header only on the SDK call.

---

## 3. Gap Analysis

Status legend:
- **Match** — directly supported with the same semantics.
- **Mismatch** — field name, structure, unit, nullability, or enum differs; resolved in a pure ViewModel mapper.
- **Missing in BE** — UI expects data not exposed; rendered inactive (`opacity-60 bg-muted/20 border-dashed`) with `Segera hadir`, or adapted per product decision.
- **Derived** — computed from real BE fields with an explicit rule.
- **Unused in BE** — exposed but not needed on this screen.

### 3.1 List — Header and Stat Grid

| FE Need | BE Endpoint & Field | Status | Notes |
|---|---|---|---|
| Header badge `{totalAktif} Atlet Aktif` | `GET /api/v1/coach/overview` → `memberCount` | **Mismatch (copy)** | BE has no active/inactive state. Use `{memberCount} Atlet Binaan`. When the roster page is truncated, show `{items.length} dari {memberCount} Atlet`. |
| `Total Binaan` value (`5 Atlet`) | `CoachOverview.memberCount` | **Match** | `${memberCount} Atlet`. |
| `Total Binaan` badge (`3 Siap • 2 Remediasi`) | — | **Missing in BE** | No stage classification. Dim `Rincian tahap: Segera hadir`. |
| `Rata Akurasi` value (`84.6%`) | `statistics.similarityGroups[].averageScore` | **Missing in BE (aggregate)** | Per-movement similarity points, not a composite accuracy. Do **not** synthesize an average. Dim `Segera hadir`. |
| `Rata Akurasi` badge (`Target IPSI ≥ 85% (-0.4%)`) | — | **Missing in BE** | No target/threshold or delta. Dim `Target ≥ 85%` / `Segera hadir`. |
| `Rata Akurasi` note | `statistics.scoredSessionCount` | **Derived** | `${scoredSessionCount} sesi dinilai` (active). |
| `Kelulusan` value (`60%`) | — | **Missing in BE** | No graduation ratio. Dim `Segera hadir`. |
| `Kelulusan` note (`Memenuhi Standar`) | — | **Missing in BE** | No pass threshold. Dim `Ambang kelulusan: Segera hadir`. |
| `Sesi Rekaman` value (`24 Sesi`) | `statistics.completedSessionCount` | **Match / Derived** | `${completedSessionCount} Sesi`. |
| `Sesi Rekaman` badge (`+3.8%`) | — | **Missing in BE** | No trend/delta. Dim `Segera hadir`. |
| `Sesi Rekaman` note (`Pekan Ini Tercatat`) | `CoachOverview.reviewQueueCount` | **Derived** | `${reviewQueueCount} menunggu ulasan` (real and useful). Alternative: dim the original note. |

### 3.2 List — Search, Cards, and Pagination

| FE Need | BE Endpoint & Field | Status | Notes |
|---|---|---|---|
| Member rows (`5`) | `GET /api/v1/coach/roster` → `RosterPage.items` | **Mismatch (source & cardinality)** | BE returns `0..limit` members with cursor pagination, not a fixed 5. Use `limit` (proposed 20) + `nextCursor`. |
| Search by name/NIM (client-side) | `GET /api/v1/coach/roster` → `q` (max 120) | **Unused in FE → Adapt FE** | Move search to the BE (`?q=`) so it covers the whole roster, not just the loaded page. Keep the client input as a debounced URL writer. |
| `initials` (`AS`) | `profile.fullName` | **Derived** | `getInitials(fullName)` from `@/components/shared/silat-reference`. |
| `name` | `profile.fullName` | **Match** | — |
| `nim` (`2307051`) | `profile.npm` | **Mismatch (name & nullable)** | `npm: string \| null`. Display `npm ?? "—"`. Search is handled by BE `q`. |
| `stage` / `stageLabel` (`Tahap Remediasi`, `Siap Tanding`, `Lolos Standar`) | `latestSession.session.reviewStatus` + `processingStatus` | **Missing in BE (classification)** | No stage thresholds. Replace with the real session-review badge: `Belum Ada Sesi` (outline), `Diproses` (secondary), `Menunggu Ulasan` (secondary), `Disetujui` (success), `Perlu Revisi` (warning), `Gagal` (destructive). |
| `scorePct` (`80%`) | `latestSession.score` | **Mismatch (unit & nullable)** | `0..100` similarity points, nullable. Render `${formatScore(score)} poin` or `Belum dinilai`. Never append `%`. |
| `lastGerakan` (`Kuda-kuda`) | `latestSession.movementName` + `latestSession.session.movementSlug` | **Derived** | `movementName \|\| PILAR_NAMES[movementSlug]`; when `latestSession === null`, `Belum ada sesi`. |
| Per-row `Lihat Detail` | Existing FE route `/coach/members/[id]` | **Match (wire link)** | `<Link href={/coach/members/${profile.id}}>`. |
| Count badge on the list section (`5 Atlet Aktif`) | `CoachOverview.memberCount` + `items.length` | **Derived** | `${memberCount} Atlet`; `${items.length} dari ${memberCount} Atlet` when truncated. |
| Empty search result | `RosterPage.items = []` | **Empty state** | Keep `Tidak ada atlet yang cocok.`; distinguish "no query" (`Belum ada atlet binaan`) from "no match". |
| Page numbers / total count | — | **Missing in BE** | No total count. Use cursor `Muat Lebih Banyak` (D9). |

### 3.3 Detail — Profile

| FE Need | BE Endpoint & Field | Status | Notes |
|---|---|---|---|
| `id` | `RosterDetail.profile.id` | **Match** | Opaque string. `404` → `notFound()`. |
| `name` | `profile.fullName` | **Match** | — |
| `nim` | `profile.npm` | **Mismatch (name & nullable)** | `npm ?? "—"`. |
| `stateKey` / state Badge (`Evaluasi`) | `latestSession.session.reviewStatus` + `processingStatus` | **Missing in BE (classification)** | Replace with the same 6-state session-review badge as the list. If `latestSession === null`, `Belum Ada Sesi`. |
| `beltLabel` (`Sabuk Kuning`) | `profile.belt` | **Mismatch (nullable)** | `belt ?? "—"`. Optionally show `beltTarget` as a caption (`Target: ${beltTarget}`). |
| `attendanceLabel` (`48 Sesi`) | — | **Missing in BE** | No attendance endpoint. Dim `Kehadiran: Segera hadir`. |
| `aggregatePct` (`82.4`) | — | **Missing in BE (aggregate)** | No member aggregate score. Dim `Agregat: Segera hadir`. |
| `aggregateKey` Badge (`Remediasi`) | — | **Missing in BE** | No aggregate classification. Dim the badge; show `${statistics.scoredSessionCount} sesi dinilai` as the real caption. |
| Profile email/division/title/coach/createdAt | `ProfileOut` | **Unused in BE** | Not in the Figma profile. Candidate for a future profile section. |
| `profile.statistics` | `ActivitySummary \| null` | **Unused in BE (duplicate)** | `RosterDetail.statistics` is the authoritative member summary; use it instead. |

### 3.4 Detail — 4-Pillar Performance

| FE Need | BE Endpoint & Field | Status | Notes |
|---|---|---|---|
| 4 pillars (`kuda-kuda`, `pukulan`, `tangkisan`, `tendangan`) | `RosterDetail.statistics.similarityGroups` + canonical `PILAR_NAMES` | **Derived** | Render 4 canonical pillars in the current order (`kuda-kuda`, `pukulan`, `tangkisan`, `tendangan`). |
| `scorePct` (`82%`) | `SimilarityGroup.averageScore` | **Mismatch (unit & nullable)** | Apply the single-unambiguous-group rule: exactly one group for the slug with `averageScore !== null` and `sampleCount > 0`. Render `${formatScore(score)} poin`; otherwise `Belum dinilai`. |
| `badgeKey` (`Sesuai` / `Remediasi`) | — | **Missing in BE (thresholds)** | No pass/fail thresholds. Use `Terdata` (success) when a single unambiguous score exists, `Belum Dinilai` (outline) otherwise. Never infer `Sesuai`/`Remediasi`. |
| Sample detail | `SimilarityGroup.sampleCount` | **Derived** | `${sampleCount} sesi dinilai`; multiple incompatible groups → `Multi-versi` and no score. |
| Dead `Lihat semua` | — | **Missing in BE (endpoint)** | No full pillar breakdown endpoint. Keep the span `aria-disabled` with `Segera hadir` microcopy. |

### 3.5 Detail — Latest Evaluation

| FE Need | BE Endpoint & Field | Status | Notes |
|---|---|---|---|
| Evaluation source | `GET /api/v1/coach/sessions/{session_id}` → `CoachSessionDetail.evaluation` | **Mismatch (second request)** | `RosterDetail` only carries `latestSession` (a `HistoryItem`, no evaluation). Call `/coach/sessions/{latestSession.session.id}` when `latestSession !== null`. If `latestSession === null`, render an empty evaluation state. |
| `technique` (`Pukulan Lurus Depan`) | `PILAR_NAMES[session.movementSlug]` + `evaluation.matchedVariant` | **Derived** | Append `(${matchedVariant})` when present. |
| `metaLabel` (`28 Sep 2026, 16:45 WIB • Sesi Mandiri Sasana • 15 Repetisi`) | `evaluation.evaluatedAt` / `session.startedAt` + `analysisStatus` | **Mismatch** | Format `Asia/Jakarta`; replace the venue/repetition text with the analysis status. No venue or repetition count in BE. |
| `bigScorePct` (`80%`) | `evaluation.score` (`0..100`, nullable) | **Mismatch (unit & nullable)** | `${formatScore(score)} poin` or `Belum dinilai`; never `%`. |
| `targetValue` (`85%`) | — | **Missing in BE** | No target/threshold. Dim `Target: Segera hadir`. |
| `deltaValue` (`-5%`) | — | **Missing in BE** | No delta. Dim `Selisih: Segera hadir`. |
| 4 metric tiles (`Target IPSI`, `Repetisi Sah`, `Kecepatan Puncak`, `Kestabilan Kuda-kuda`) | `evaluation.framesProcessed`, `validPoseFrames`, `featuresCompared`, `poseStatus` | **Missing in BE (fixed metrics) → Adapt FE** | The four fixed metrics do not exist. Replace the tiles with real analysis counters: `Frame Diproses`, `Frame Pose Valid`, `Fitur Dibandingkan`, `Status Pose`. Alternative: render the first 4 `measurements` dynamically. |
| 4 quick stats (`Lintasan`, `Sudut Siku`, `Rotasi Pinggul`, `Fleksi Lutut`) | `evaluation.measurements[]` (`feature`, `bodyPart`, `value`, `unit`, `referenceMedian`, `referenceIqr`, `assessment`) | **Mismatch (dynamic vocabulary)** | Render up to 4 measurements with `humanizeIdentifier(feature/bodyPart)`, `formatMeasurementValue`, and `formatReferenceTarget`. Do not hardcode the 4 Figma labels; if no measurements, show `Belum ada pengukuran`. |
| `ImagePlaceholder` (`Visual tracking …`) | `evaluation.keyFrame` (time only) / `GET /pose` | **Missing in BE (image)** | Keep the placeholder. A pose skeleton overlay is a separate move (out of scope). |
| 5 fixed posture rows (`bahu`, `siku-kanan`, `pinggul`, `lutut`, `pergelangan`) | `evaluation.measurements` + `evaluation.issues` + `review.bodyAssessments` | **Mismatch (dynamic cardinality)** | Reuse `toSessionDetailViewModel` → `coachBodyAssessments` + `aiPostures`. Do not force the 5 `PostureParamId`s; render 0..N dynamic body parts. |
| `Sesi 24` badge | — | **Missing in BE** | No session sequence number. Replace with the formatted session date, or drop the badge. |
| `Standar IPSI` badge | — | **Missing in BE** | No IPSI classification. Dim `Standar IPSI: Segera hadir` or drop with product approval. |

### 3.6 Detail — Feedback

| FE Need | BE Endpoint & Field | Status | Notes |
|---|---|---|---|
| `POST /coach/feedback` (`{ memberId, message }`) | — | **Missing in BE (endpoint)** | No member-level feedback endpoint exists. |
| Member-level feedback message | `PUT /api/v1/coach/sessions/{session_id}/feedback-draft` → `DraftInput.note` | **Mismatch (scope)** | Feedback is session-scoped. The draft needs `session_id` and `expectedVersion`; `note` max 5000. |
| `Simpan Draft` | `PUT /feedback-draft` | **Mismatch (real endpoint)** | Send `{ expectedVersion: feedbackDraft?.version ?? 0, decision, note }`. `200 DraftOut`. |
| `Kirim ke Member` | `POST /reviews` | **Mismatch (two-step publish)** | Publish the saved draft with `{ expectedRevision: review?.revision ?? 0, expectedDraftVersion: draft.version }` + `Idempotency-Key`. `201 PublishedReview`. |
| `FeedbackResult { memberId, status, echo }` | `DraftOut` / `PublishedReview` | **Mismatch (result shape)** | Return the real `DraftOut` / `PublishedReview`; do not echo the message. |
| Decision (`approved` / `needs_revision`) | `DraftInput.decision` / `PublishedReview.decision` | **Unused in FE → Adapt FE** | The current form has no decision control. Publish likely requires a decision; add a two-option control. |
| Body assessments | `DraftInput.bodyAssessments` (`BodyAssessment[]`, max 33) | **Unused in FE** | Optional; not in the Figma feedback card. Defer unless product wants per-body-part feedback. |
| Follow-up tasks | `DraftInput.tasks` (`TaskInput[]`, max 20) | **Unused in FE** | Optional; not in the Figma feedback card. Defer. |
| `feedbackDraft` version | `CoachSessionDetail.feedbackDraft.version` | **Unused in FE** | Must round-trip for optimistic concurrency. `feedbackDraft === null` → `expectedVersion: 0`. |
| Review revision | `CoachSessionDetail.review.revision` | **Unused in FE** | `review === null` → `expectedRevision: 0`. |
| `reviewHistory`, `legacyNotes`, `followUpTasks` | `CoachSessionDetail` | **Unused in BE** | Optional display on the member detail; not required for the feedback MVP. |

### 3.7 Detail — Recent History Preview

| FE Need | BE Endpoint & Field | Status | Notes |
|---|---|---|---|
| 4 history rows (`MemberDetail.history`) | `GET /api/v1/coach/roster/{member_id}/sessions?limit=4` → `HistoryPage.items` | **Mismatch (source & cardinality)** | `RosterDetail` has no history array. Fetch 4 items separately (React `cache()` so the full history page can reuse the same call when the cursor matches). |
| `sesiLabel` (`Sesi 24`) | — | **Missing in BE** | No sequence number. Replace with the formatted date badge or drop. |
| `dateLabel` | `session.startedAt ?? session.createdAt` | **Mismatch (format)** | `formatDateTimeId` (`Asia/Jakarta`). |
| `title` | `movementName` | **Match / Derived** | Fallback `PILAR_NAMES[movementSlug]`. |
| `repetisiLabel` (`Repetisi: 42/50 (84%)`) | `evaluation.validRepetitions` / `deviatedRepetitions` | **Missing in BE** | Both fields are always `null` in v0.7.0. Drop the label; show the review note or `scoreReason` as the subtitle instead. |
| `scorePct` (`80`) | `item.score` | **Mismatch (unit & nullable)** | `${formatScore(score)} poin` or `Belum dinilai`. |
| `badgeKey` | `item.session.reviewStatus` + `processingStatus` | **Mismatch (enum)** | Use `toHistoryReviewBadgeStatus` → `Disetujui` / `Perlu Revisi` / `Menunggu Ulasan` / `Diproses` / `Gagal`. |
| `Buku Semua Riwayat Atlet` | Existing route `/coach/members/[id]/riwayat` | **Match (wire link)** | Already live. |

### 3.8 History Page

| FE Need | BE Endpoint & Field | Status | Notes |
|---|---|---|---|
| 24 sessions, 10/page | `GET /api/v1/coach/roster/{member_id}/sessions` → `HistoryPage.items` + `nextCursor` | **Mismatch (pagination model)** | Cursor pagination, default 20/page, no total. Replace `?page=N` with `?cursor=`. |
| `totalSessions` / `totalPages` / `rangeStart` / `rangeEnd` | — | **Missing in BE** | No total count. Replace the range text with `Sesi terbaru` / `Halaman ini`; show `${items.length} Sesi` for the current page. |
| `sesiLabel` (`Sesi #24`) | — | **Missing in BE** | No sequence number. Drop the badge or replace with date. |
| `dateLabel` (`06 Mar 2026, 15:45 WIB`) | `session.startedAt ?? session.createdAt` | **Mismatch (format)** | `formatDateTimeId`. |
| `title` (`Pukulan Lurus Depan`) | `movementName` | **Match / Derived** | Fallback `PILAR_NAMES[movementSlug]`. |
| `subtitle` (`Penetapan Sasaran Target`) | `review?.note` / `scoreReason` / `session.error?.detail` | **Mismatch (no field)** | Use the same fallback chain as `toHistoryEntryViewModel`; omit when empty. |
| `repetisiLabel` | `validRepetitions` / `deviatedRepetitions` | **Missing in BE** | Always `null`. Drop the label. |
| `scorePct` (`82.0%`) | `item.score` | **Mismatch (unit & nullable)** | `poin`, not `%`; `Belum dinilai` when `null`. |
| `badgeKey` | `session.reviewStatus` + `processingStatus` | **Mismatch (enum)** | `toHistoryReviewBadgeStatus` 5-state mapping. |
| Page-number controls | `cursor` / `nextCursor` | **Mismatch (control model)** | Use `Muat Lebih Banyak` + `Kembali ke Awal` (server cursor links), or a client infinite list. |
| Filters (`movementSlug`, `reviewStatus`, `processingStatus`, `from`, `to`) | BE supports them | **Unused in FE** | The current screen has no filters. Defer unless product asks; if added, use URL search params + the same cursor reset. |

### 3.9 Non-Existent FE TODO Endpoints to Remove

| Assumed FE TODO | Actual BE Contract |
|---|---|
| `TODO: connect backend via lib/api-client.ts (GET /coach/members)` | `GET /api/v1/coach/roster` (`rosterApiV1CoachRosterGet`) → `RosterPage { items, nextCursor }`. |
| `TODO: connect backend via lib/api-client.ts (GET /coach/members/[id])` | `GET /api/v1/coach/roster/{member_id}` (`memberDetailApiV1CoachRosterMemberIdGet`) → `RosterDetail { profile, latestSession, statistics }`. |
| `TODO: connect backend via lib/api-client.ts (GET /coach/members/[id]/history?page=N)` | `GET /api/v1/coach/roster/{member_id}/sessions` (`memberSessionsApiV1CoachRosterMemberIdSessionsGet`) → `HistoryPage { items, nextCursor }` with `limit`/`cursor`/filters. |
| `TODO: connect backend via lib/api-client.ts (POST /coach/feedback)` | No `/coach/feedback` endpoint. Use `PUT /api/v1/coach/sessions/{session_id}/feedback-draft` (`draftApiV1CoachSessionsSessionIdFeedbackDraftPut`) then `POST /api/v1/coach/sessions/{session_id}/reviews` (`publishApiV1CoachSessionsSessionIdReviewsPost`). |
| `TODO: wire to full pillar breakdown when the backend lands` | No full pillar endpoint. Keep the CTA inactive (`Segera hadir`). |

---

## 4. Cross-Cutting Concerns

| Concern | Current FE State | BE Contract & Repo Convention | Integration Strategy |
|---|---|---|---|
| **Auth / Token Handling** | All three readers are unauthenticated dummies. `app/(coach)/layout.tsx` wraps routes in `AuthGate role="coach"`. | All coach endpoints require `HTTPBearer`. Tokens live in HttpOnly cookies (`ss_at`, `ss_rt`); `proxy.ts` forwards `x-silatsense-access`. | Read the token server-side via `getAccessToken()`; pass `headers: { Authorization: \`Bearer ${token}\` }`. Never expose tokens to client components. |
| **Base URL / Env Config** | `src/hey-api.ts` uses `NEXT_PUBLIC_API_URL ?? config?.baseUrl ?? "https://silatsense-be.vercel.app"`. | `openapi-ts.config.ts` points `runtimeConfigPath` at `./src/hey-api`. | No change. Use `src/hey-api.ts` and `lib/api-client.ts` as-is. |
| **Error Mapping** | None; dummies always succeed. | `DomainErrorOut { detail, code, requestId, errors }`. Per [`README.md`](./README.md) §5: distinguish `401` (signed out → `null`) from `5xx`/network/schema mismatch (`throw`). | Reads: `401` → `null`; `404` on detail/history → `null` → `notFound()`; `403`, `409`, `410`, `416`, `422`, `500`, network, or Zod failure → throw a descriptive `Error` (status + normalized message). Actions: normalize via `normalizeApiError` / a coach-specific `toCoachActionError`. |
| **Loading & Empty States** | `<Suspense>` skeletons; components assume non-empty arrays. | A coach with no members → `memberCount: 0`, `items: []`, `nextCursor: null`. A member with no sessions → `latestSession: null`, `statistics.* = 0`, `similarityGroups: []`, `items: []`. | Keep Suspense boundaries. Add first-class empty states: `Belum ada atlet binaan`, `Belum ada sesi`, `Belum ada riwayat sesi`, `Belum ada pengukuran`, `Belum ada sesi untuk diulas`. |
| **Cache Keys, Next 16 Cache Components & Invalidation** | `'use cache'` + `cacheLife("minutes")` on all three readers; `generateStaticParams()` on both dynamic routes. | **Forbidden by [`README.md`](./README.md) §9** on cookie/token-dependent reads. `session_id` / `member_id` are per-user DB ids and cannot be statically enumerated. | Remove `'use cache'`, `cacheLife`, and `generateStaticParams`. Wrap each reader in React `cache()`; pass `cache: "no-store"`. After draft/publish, `revalidatePath("/coach/members")`, `revalidatePath(\`/coach/members/${memberId}\`)`, `revalidatePath(\`/coach/members/${memberId}/riwayat\`)`, and invalidate the generated query keys. |
| **SSR vs Client Fetching** | List search and feedback form are the only client islands. | `ss_at` is HttpOnly; browser JS cannot call the BE directly. | Keep reads in RSC. The search input writes `?q=` via `useRouter` (debounced). The feedback form calls server actions; it never calls the SDK directly. |
| **CORS** | No browser XHR. | Server-to-server RSC → FastAPI. | Non-issue. |
| **Pagination** | In-memory `?page=N`, 10/page, 24 total. | Roster and member sessions are cursor-based; no total count. | Roster: `limit=20` + `Muat Lebih Banyak`. History: `limit=10` or `20` + `?cursor=` links. Remove `parseHistoryPage` / `paginateHistory`. |
| **Team scoping** | Dummy assumes a single team. | BE endpoints are coach-scoped by the authenticated coach; no `teamId`. | Do not add a team selector. The token defines scope. |
| **Date / timezone** | Dummy strings (`06 Mar 2026, 15:45 WIB`). | ISO 8601 timestamps; no timezone field on the coach endpoints. | Format server-side in `Asia/Jakarta` (`id-ID`) and pass plain strings. |
| **Mutation concurrency** | Stub mutation has no versioning. | `DraftInput.expectedVersion`, `PublishInput.expectedRevision`, `PublishInput.expectedDraftVersion`, `Idempotency-Key`. | Round-trip the versions from `CoachSessionDetail`; handle `409` with a conflict toast and refresh. Generate a new UUID per publish attempt. |

---

## 5. Phase 2 — Proposed Decisions (D1–D12, **not approved**)

> These are recommendations, not decisions. Each conflict is presented with the alternative so product can choose. Do not implement until the blocking questions in §11 are answered.

### D1 — Replace all three dummy readers with request-time cached RSC reads; remove `'use cache'` and `generateStaticParams()`

- **Decision (proposed):** Adapt FE (`get-team-members.ts`, `get-member-detail.ts`, `get-member-history.ts`, both dynamic route files).
- **Why:** `'use cache'` is forbidden on cookie/token-dependent reads; `member_id` / `session_id` are dynamic DB ids. The current dummy readers cannot be partially kept because the shapes no longer match the contract.
- **How:**
  - `getCoachRosterDto({ limit, cursor, q })` → `rosterApiV1CoachRosterGet({ query, headers, cache: "no-store", throwOnError: false })` + `zRosterApiV1CoachRosterGetResponse.parse(data)`.
  - `getCoachMemberDetailDto(memberId)` → `memberDetailApiV1CoachRosterMemberIdGet({ path: { member_id }, ... })` + `zMemberDetailApiV1CoachRosterMemberIdGetResponse.parse(data)`.
  - `getCoachMemberSessionsDto(memberId, query)` → `memberSessionsApiV1CoachRosterMemberIdSessionsGet({ path, query, ... })` + `zMemberSessionsApiV1CoachRosterMemberIdSessionsGetResponse.parse(data)`.
  - `getCoachSessionDetailDto(sessionId)` → `sessionDetailApiV1CoachSessionsSessionIdGet({ path: { session_id }, ... })` + `zSessionDetailApiV1CoachSessionsSessionIdGetResponse.parse(data)`.
  - Wrap every reader in React `cache()`; return `null` on missing token / `401` / `404`; throw on other failures.
  - Remove `memberDetailIds` / `memberHistoryIds` and both `generateStaticParams()` exports.
- **BE change:** None.

### D2 — Adapt the list to cursor-paginated `/coach/roster` with server-side `q` search

- **Decision (proposed):** Adapt FE (`coach-members-page.tsx`, `member-search.tsx`, `member-card-list.tsx`, new mapper).
- **Why:** `RosterPage` is cursor-paginated and the BE exposes `q`; client-side filtering only searches the loaded page and would silently miss members.
- **How:**
  - `app/(coach)/coach/members/(list)/page.tsx` accepts `searchParams` and passes the Promise to `<CoachMembersPage searchParams={searchParams} />`.
  - Parse `q`, `cursor`, `limit` with a Zod schema derived from `zRosterApiV1CoachRosterGetQuery`; clamp invalid values.
  - `MemberSearch` becomes a client island that writes `?q=` (300 ms debounce) with `router.replace`; the RSC list reads the validated `q`.
  - `Muat Lebih Banyak` is a `<Link href={?q=…&cursor=…}>` when `nextCursor !== null`; `Kembali ke Awal` resets the cursor.
  - `limit: 20` (BE default). The design's "5" was dummy data, not a page size.
- **Alternative:** Keep client-side filtering for the loaded page and label it `Filter halaman ini`; not recommended because it breaks roster-wide search.
- **BE change:** None.

### D3 — Map list stats from `CoachOverview`; keep unsupported metrics visibly inactive

- **Decision (proposed):** Adapt FE (`MemberStatGrid`, new stat mapper).
- **Why:** `memberCount`, `completedSessionCount`, `scoredSessionCount`, and `reviewQueueCount` are real. Team accuracy, graduation ratio, stage breakdown, and trend deltas are not.
- **How:**
  - `Total Binaan`: `${memberCount} Atlet`; badge dim `Rincian tahap: Segera hadir`.
  - `Rata Akurasi`: value dim `Segera hadir`; badge dim `Target ≥ 85%`; note `${scoredSessionCount} sesi dinilai`.
  - `Kelulusan`: value dim `Segera hadir`; note dim `Ambang kelulusan: Segera hadir`.
  - `Sesi Rekaman`: `${completedSessionCount} Sesi`; badge dim `Segera hadir`; note `${reviewQueueCount} menunggu ulasan`.
  - Reuse `CoachDashboardStat` (it already carries `valueAvailable` / `badgeAvailable` / `noteAvailable`) instead of the legacy `CoachStat`; retire `CoachStat` if no other consumer remains.
- **Alternative:** Request BE aggregate endpoints (`teamAccuracy`, `graduationRatio`, `stageBreakdown`, `weeklyDelta`). Larger scope; not required for the members MVP.
- **BE change:** None for the proposed direction.

### D4 — Replace stage badges with session-review status; derive initials; map `npm` and `poin`

- **Decision (proposed):** Adapt FE (`member-card-list.tsx`, `types.ts`, new mapper).
- **Why:** The BE has no stage/readiness classification, no `initials`, and `score` is nullable similarity points, not a percentage.
- **How:**
  - `initials = getInitials(profile.fullName)`.
  - `name = profile.fullName`; `nim = profile.npm ?? "—"`.
  - `latestSession === null` → `Belum Ada Sesi` (outline), `Belum ada sesi`, `Belum dinilai`.
  - Otherwise `toHistoryReviewBadgeStatus(reviewStatus, processingStatus)` → `Disetujui` / `Perlu Revisi` / `Menunggu Ulasan` / `Diproses` / `Gagal`.
  - `scoreLabel = score !== null ? `${formatScore(score)} poin` : "Belum dinilai"`.
  - `lastGerakan = movementName || PILAR_NAMES[movementSlug] || "Belum ada sesi"`.
  - `detailHref = /coach/members/${profile.id}`.
- **BE change:** None. A future BE `stage` field could restore the original badges, but it is not required.

### D5 — Map the detail profile to `ProfileOut`; keep attendance and aggregate inactive

- **Decision (proposed):** Adapt FE (`member-detail-profile.tsx`, `types.ts`, new mapper).
- **Why:** `ProfileOut` provides identity, belt, and belt target, but no attendance, aggregate score, or aggregate classification.
- **How:**
  - State badge: same 6-state session-review badge as D4 (from `latestSession`).
  - `NIM {npm ?? "—"}`; `Sabuk {belt ?? "—"}`; optional `Target: {beltTarget}` caption.
  - `Kehadiran` value dim `Segera hadir`; `Agregat` value dim `Segera hadir`.
  - Aggregate card: value dim `Segera hadir`; caption `${statistics.scoredSessionCount} sesi dinilai`; badge dim.
  - Keep the initials avatar via `getInitials(fullName)`.
- **Alternative:** Rename `Kehadiran` to `Sesi Selesai` and show `statistics.completedSessionCount` (real, but not attendance). Product call.
- **BE change:** None for the proposed direction. A future attendance endpoint or aggregate-score endpoint would restore the original metrics.

### D6 — Map 4 pillars from `RosterDetail.statistics.similarityGroups` with the single-unambiguous-group rule

- **Decision (proposed):** Adapt FE (`pillar-performance-section.tsx`, new mapper).
- **Why:** `averageScore` is similarity points per `(movement, method, analyzerVersion, featureVersion, referenceVersion)`, not a pass/fail percentage; BE defines no qualitative thresholds.
- **How:**
  - For each canonical slug, filter groups with `movementSlug === slug && averageScore !== null && sampleCount > 0`.
  - Exactly one match → `score`, `scoreLabel = "${formatScore(score)} poin"`, `status = "terdata"`, `statusLabel = "Terdata"`, bar width = `score`.
  - Zero or multiple matches → `score = null`, `scoreLabel = "Belum dinilai"`, `status = "belum-dinilai"`, bar width `0`; summed `sampleCount`; `Multi-versi` when multiple groups.
  - Reuse the existing `toCoachPillars` shape (`CoachPillar`) from `coach-dashboard-mapper.ts` rather than inventing a second pillar VM.
  - Dead `Lihat semua` stays `aria-disabled` with `Segera hadir`.
- **BE change:** None.

### D7 — Read the latest evaluation from `/coach/sessions/{session_id}` and reuse the member session mapper

- **Decision (proposed):** Adapt FE (`latest-evaluation.tsx`, `posture-param-row.tsx`, `member-detail-page.tsx`, new coach session reader).
- **Why:** `RosterDetail` has no evaluation; `CoachSessionDetail.evaluation` is the only source. The member module already has a tested mapper for the same wire shape.
- **How:**
  - If `latestSession === null` → empty evaluation state; do not call `/coach/sessions/...`.
  - Otherwise `getCoachSessionDetailDto(latestSession.session.id)` inside React `cache()`.
  - Map with `toSessionDetailViewModel(detail)` (the API `CoachSessionDetail` is structurally assignable to the member `SessionDetail`; the extra `feedbackDraft` field is ignored). This gives `evaluation`, `coachBodyAssessments`, `aiPostures`, `reviewDecision`, `reviewNote`, `followUpTasks`, etc.
  - Render the score in `poin` (no `%`); dim target/delta; replace the four fixed metric tiles with real analysis counters (`framesProcessed`, `validPoseFrames`, `featuresCompared`, `poseStatus`); render up to 4 dynamic `measurements` in the quick-stat grid; render dynamic posture rows (0..N) instead of the fixed 5.
  - Keep `ImagePlaceholder`; pose overlay is out of scope.
- **Alternative:** Request BE fixed metric fields (`targetPct`, `deltaPct`, `validRepetitions`, `deviatedRepetitions`, fixed 5 posture params). Larger scope; `validRepetitions` / `deviatedRepetitions` are explicitly `null` in v0.7.0.
- **BE change:** None for the proposed direction.

### D8 — Source the detail's recent history from `/roster/{member_id}/sessions?limit=4`

- **Decision (proposed):** Adapt FE (`session-history-log.tsx`, `member-detail-page.tsx`, new mapper).
- **Why:** `RosterDetail` has no history array. The member sessions endpoint is the only source.
- **How:**
  - `getCoachMemberSessionsDto(memberId, { limit: 4 })` inside React `cache()`; share the same reader with the full history page when the query matches.
  - Card: date badge (`formatDateTimeId`), movement name, score `poin`, review badge.
  - Drop `sesiLabel` and `repetisiLabel` (no BE fields); subtitle = `review?.note ?? scoreReason ?? "Sesi selesai dianalisis"`.
  - Keep `Buku Semua Riwayat Atlet` → `/coach/members/{memberId}/riwayat`.
- **BE change:** None.

### D9 — Adapt the history page to cursor pagination; drop page numbers and total count

- **Decision (proposed):** Adapt FE (`member-history-page.tsx`, `member-history-section.tsx`, `history-session-card.tsx`, `history-pagination.tsx`, delete `paginate-history.ts`).
- **Why:** The BE is cursor-based with no total count; the current page model cannot be reproduced honestly.
- **How:**
  - Route accepts `searchParams` (`cursor`, `limit`, optional filters) and forwards the Promise.
  - Parse `cursor` (max 4096) + `limit` (1..100, proposed 10 or 20) with a Zod schema derived from `zMemberSessionsApiV1CoachRosterMemberIdSessionsGetQuery`.
  - Render `${items.length} Sesi` for the current page (no total).
  - Replace numbered pages with `Muat Lebih Banyak` (`?cursor={nextCursor}`) and `Kembali ke Awal`; disable/hide when `nextCursor === null`.
  - Card: date/time, movement name, score `poin`, review badge; subtitle from `review.note` / `scoreReason`; drop `sesiLabel` / `repetisiLabel`.
  - Empty state: `Belum ada riwayat sesi`.
  - Remove `parseHistoryPage` / `paginateHistory` and their tests.
- **Alternative:** Client `useInfiniteQuery` that appends pages via a server action returning `HistoryPage` (keeps token server-side). Better UX but more moving parts; not the MVP.
- **BE change:** None.

### D10 — Rebind feedback from member-level `POST /coach/feedback` to session-scoped draft + publish

- **Decision (proposed):** Adapt FE (`member-feedback-card.tsx`, `member-feedback-form.tsx`, `schemas.ts`, `types.ts`, new actions). **This decision is blocking.**
- **Why:** No member-level feedback endpoint exists. The BE only supports a per-session draft (`PUT /feedback-draft`) and a published review (`POST /reviews`).
- **How (proposed MVP):**
  - Scope the card to `latestSession` and show the session context (`Pukulan Lurus · 28 Sep 2026`).
  - If `latestSession === null` → disabled card `Belum ada sesi untuk diulas`.
  - Form fields: `decision` (`approved` / `needs_revision`) + `note` (10..5000). No `bodyAssessments` / `tasks` in the MVP.
  - `Simpan Draft` → `saveFeedbackDraftAction({ sessionId, expectedVersion, decision, note })` → `PUT /feedback-draft`.
  - `Kirim ke Member` → if the form is dirty, save the draft first; then `publishReviewAction({ sessionId, expectedRevision, expectedDraftVersion, idempotencyKey })` → `POST /reviews`.
  - `expectedVersion = feedbackDraft?.version ?? 0`; `expectedRevision = review?.revision ?? 0`; `expectedDraftVersion = savedDraft.version`; `idempotencyKey = crypto.randomUUID()`.
  - On success: toast, `revalidatePath` for the member detail/list/history, invalidate `memberDetailApiV1CoachRosterMemberIdGetQueryKey` and `sessionDetailApiV1CoachSessionsSessionIdGetQueryKey`.
  - On `409`: conflict toast (`Ulasan telah berubah. Muat ulang lalu coba lagi.`) + `router.refresh()`.
- **Alternatives:**
  1. **Member-level feedback endpoint** (`POST /coach/members/{id}/feedback`) — requires a BE change. Cleaner UX; no session/version semantics.
  2. **New coach session-detail/review route** (`/coach/members/[id]/sesi/[sessionId]`) — allows reviewing older sessions and matches the BE model, but the roadmap explicitly lists "coach session-detail route" as not-planned until a distinct Figma node exists. `CoachSessionDetail` also has no member identity, so the route must carry `memberId` in the URL.
- **BE change:** None if the proposed latest-session MVP is accepted. A member-level endpoint would be a BE change.

### D11 — Add two server actions with Zod validation and explicit revalidation

- **Decision (proposed):** Adapt FE (`features/coach/actions/save-feedback-draft.ts`, `publish-review.ts`, `features/coach/schemas.ts`).
- **Why:** Mutations must stay server-side (`ss_at` is HttpOnly) and validate at the action boundary per [`README.md`](./README.md) §4.
- **How:**
  - `saveFeedbackDraftAction(input: unknown): Promise<ActionResult<DraftOut>>` — parse `{ sessionId, expectedVersion, decision?, note? }`; call `draftApiV1CoachSessionsSessionIdFeedbackDraftPut`; `throwOnError: false`; normalize errors.
  - `publishReviewAction(input: unknown): Promise<ActionResult<PublishedReview>>` — parse `{ sessionId, expectedRevision, expectedDraftVersion, idempotencyKey }`; call `publishApiV1CoachSessionsSessionIdReviewsPost` with the `Idempotency-Key` header.
  - **Idempotency-Key validator workaround:** the generated request validator receives a `Headers` instance but its schema reads `Idempotency-Key` as a plain-object property. Pre-validate the key with Zod and pass `requestValidator: undefined` (same workaround as `features/member/actions/retry-session.ts`); keep the response validator active.
  - `revalidatePath` + query invalidation in `onSuccess`.
- **BE change:** None.

### D12 — Preserve streaming, add honest empty states, and keep the module read-only except feedback

- **Decision (proposed):** Adapt FE (all three page compositions).
- **Why:** A new coach/member may have zero members, zero sessions, or zero scored groups. The only mutation is the feedback draft/publish.
- **How:**
  - Keep the existing `<Suspense>` boundaries and skeletons; handle `null` (unauthenticated) by rendering `null` (the layout `AuthGate` owns redirect).
  - `404` on detail/history → `notFound()`.
  - Empty states: `Belum ada atlet binaan`, `Belum ada sesi`, `Belum ada riwayat sesi`, `Belum ada pengukuran`, `Belum ada sesi untuk diulas`.
  - No `app/api/` handlers; no browser SDK calls.
- **BE change:** None.

---

## 6. Target Architecture & ViewModel Specification

### 6.1 Data Flow Diagram

```
Browser (GET /coach/members?q=&cursor=)
  │
  └─ app/(coach)/layout.tsx
       └─ <Suspense><AuthGate role="coach">…
            └─ app/(coach)/coach/members/(list)/page.tsx
                 └─ <CoachMembersPage searchParams>
                      ├─ <Suspense> HeaderSection  ─┐
                      ├─ <Suspense> StatSection     │ all call
                      └─ <Suspense> ListSection    ─┘ getCoachMembersPage()
                           ├─ getCoachOverviewDto() [React cache()]
                           │    └─ overviewApiV1CoachOverviewGet({ cache: "no-store" })
                           └─ getCoachRosterDto({ limit, cursor, q }) [React cache()]
                                └─ rosterApiV1CoachRosterGet({ query, cache: "no-store" })
                                     → toCoachMembersViewModel(overview, roster)

Browser (GET /coach/members/[id])
  └─ MemberDetailPage
       ├─ getCoachMemberDetailDto(id) [React cache()]
       │    └─ memberDetailApiV1CoachRosterMemberIdGet({ path, cache: "no-store" })
       ├─ getCoachSessionDetailDto(latestSession.session.id) [React cache()]
       │    └─ sessionDetailApiV1CoachSessionsSessionIdGet({ path, cache: "no-store" })
       ├─ getCoachMemberSessionsDto(id, { limit: 4 }) [React cache()]
       │    └─ memberSessionsApiV1CoachRosterMemberIdSessionsGet({ path, query, cache: "no-store" })
       └─ <MemberFeedbackForm> → saveFeedbackDraftAction / publishReviewAction

Browser (GET /coach/members/[id]/riwayat?cursor=)
  └─ MemberHistoryPage
       ├─ getCoachMemberDetailDto(id) [React cache() — shared]
       └─ getCoachMemberSessionsDto(id, { limit, cursor }) [React cache()]
```

### 6.2 Proposed ViewModel Interfaces (`features/coach/types.ts`)

```ts
import type { PilarSlug } from "@/components/shared/silat-reference";
import type { EvaluationViewModel, SessionViewModel } from "@/features/member/types";

export type CoachBadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning";

/** List + detail state badge, derived from session review status. */
export type CoachMemberStatus =
  | "belum-ada"
  | "diproses"
  | "menunggu"
  | "disetujui"
  | "perlu-revisi"
  | "gagal";

export interface CoachMemberStat {
  id: "total-atlet" | "akurasi-tim" | "sidang-uji" | "fokus";
  label: string;
  value: string;
  valueAvailable: boolean;
  badge?: string;
  badgeAvailable?: boolean;
  note?: string;
  noteAvailable?: boolean;
}

export interface CoachMemberListItem {
  id: string;
  initials: string;
  name: string;
  nim: string; // "—" when profile.npm is null
  status: CoachMemberStatus;
  statusLabel: string;
  statusVariant: CoachBadgeVariant;
  score: number | null;
  scoreLabel: string; // "80 poin" | "Belum dinilai"
  lastGerakan: string;
  detailHref: string;
}

export interface CoachMembersPageViewModel {
  stats: CoachMemberStat[];
  members: CoachMemberListItem[];
  memberCount: number;
  countLabel: string; // "5 Atlet" | "20 dari 24 Atlet"
  nextCursor: string | null;
  q: string;
}

export interface CoachMemberProfileViewModel {
  id: string;
  name: string;
  nim: string;
  status: CoachMemberStatus;
  statusLabel: string;
  statusVariant: CoachBadgeVariant;
  beltLabel: string;
  beltTargetLabel: string | null;
  attendance: { available: false; label: "Segera hadir" };
  aggregate: { available: false; label: "Segera hadir" };
  scoredSessionCount: number;
}

export interface CoachMemberPillarViewModel {
  slug: PilarSlug;
  name: string;
  score: number | null;
  scoreLabel: string; // "82 poin" | "Belum dinilai"
  sampleCount: number;
  sampleLabel: string; // "4 sesi dinilai" | "Multi-versi" | "Belum ada sesi"
  status: "terdata" | "belum-dinilai";
  statusLabel: "Terdata" | "Belum Dinilai";
  statusVariant: CoachBadgeVariant;
  barPercent: number;
}

export interface CoachMemberEvaluationViewModel {
  available: boolean;
  techniqueName: string;
  metaLabel: string;
  score: {
    available: boolean;
    value: number | null;
    label: string; // "80 poin" | "Belum dinilai"
    unitLabel: "poin";
    analysisStatusLabel: string | null;
    target: { available: false; label: "Segera hadir" };
    delta: { available: false; label: "Segera hadir" };
  };
  analysisMetrics: Array<{ label: string; value: string; sub: string }>;
  measurements: Array<{ id: string; label: string; value: string; sub: string }>;
  postures: Array<{
    id: string;
    name: string;
    status: "sesuai" | "perlu-koreksi" | "tidak-dinilai";
    statusLabel: string;
    reading: string;
    note: string | null;
  }>;
  session: SessionViewModel | null;
}

export interface CoachMemberHistoryItem {
  id: string;
  dateLabel: string;
  timeLabel: string;
  title: string;
  subtitle: string | null;
  score: number | null;
  scoreLabel: string; // "82 poin" | "Belum dinilai"
  status: CoachMemberStatus;
  statusLabel: string;
  statusVariant: CoachBadgeVariant;
}

export interface CoachMemberHistoryPageViewModel {
  memberId: string;
  items: CoachMemberHistoryItem[];
  nextCursor: string | null;
  limit: number;
}

export interface CoachMemberDetailViewModel {
  profile: CoachMemberProfileViewModel;
  pillars: CoachMemberPillarViewModel[];
  evaluation: CoachMemberEvaluationViewModel;
  history: CoachMemberHistoryItem[]; // 4 most recent
  feedback: {
    sessionId: string | null;
    sessionLabel: string | null;
    draftVersion: number;
    reviewRevision: number;
    decision: "approved" | "needs_revision" | null;
    note: string;
  };
}
```

**Compatibility note:** `CoachStat`, `AthleteStage`, `TeamMember`, `PilarPerformance`, `PostureParam`, `LatestEvaluation`, `HistorySession`, `HistoryPageSession`, `MemberHistory`, `MemberDetail`, `FeedbackInput`, and `FeedbackResult` are members-only and can be replaced. `CoachDashboardStat`, `CoachAthlete`, `CoachPillar`, and `PostureIssue` are dashboard-owned; do not change them in this move. If `CoachMemberPillarViewModel` duplicates `CoachPillar`, prefer reusing `CoachPillar` and deleting the duplicate.

### 6.3 Mapper Functions

New file: `features/coach/data/coach-members-mapper.ts` (pure, no `server-only`).

```ts
export function toCoachMembersPageViewModel(
  overview: CoachOverview,
  roster: RosterPage | null,
  q: string,
): CoachMembersPageViewModel;

export function toCoachMemberStats(overview: CoachOverview): CoachMemberStat[];

export function toCoachMemberListItems(roster: RosterPage | null): CoachMemberListItem[];

export function toCoachMemberDetailViewModel(
  detail: RosterDetail,
  sessionDetail: CoachSessionDetail | null,
  history: HistoryPage | null,
): CoachMemberDetailViewModel;

export function toCoachMemberPillars(statistics: ActivitySummary): CoachMemberPillarViewModel[];

export function toCoachMemberHistoryItem(item: HistoryItem): CoachMemberHistoryItem;

export function toCoachMemberHistoryPage(
  page: HistoryPage,
  memberId: string,
  limit: number,
): CoachMemberHistoryPageViewModel;

export function toCoachMemberStatus(
  reviewStatus: SessionOut["reviewStatus"],
  processingStatus: SessionOut["processingStatus"],
): { status: CoachMemberStatus; label: string; variant: CoachBadgeVariant };
```

Mapper rules:

- Reuse `formatScore`, `formatDateTimeId`, `humanizeIdentifier` from `@/features/member/data/format`.
- Reuse `getInitials`, `PILAR_NAMES` from `@/components/shared/silat-reference`.
- Reuse `toHistoryReviewBadgeStatus` from `@/features/member/data/history-mapper` for the 5-state mapping, then translate to `CoachMemberStatus` / `CoachBadgeVariant`.
- Reuse `toSessionDetailViewModel` for the evaluation/postures (D7).
- Reuse `toCoachPillars` from `@/features/coach/data/coach-dashboard-mapper` if the VM shape matches (D6); otherwise keep the same single-unambiguous-group rule.
- Never pass raw DTOs to client components; all dates/numbers become plain strings.

---

## 7. Phase 2 — List of FE Files to Change

### 7.1 New Files

| File Path | Purpose |
|---|---|
| `features/coach/data/coach-members-mapper.ts` | Pure mappers for list stats/cards, detail profile/pillars/evaluation/history, history page items, and status badges. |
| `features/coach/actions/save-feedback-draft.ts` | `"use server"` + `"server-only"` action calling `draftApiV1CoachSessionsSessionIdFeedbackDraftPut` with Zod validation and revalidation. |
| `features/coach/actions/publish-review.ts` | `"use server"` + `"server-only"` action calling `publishApiV1CoachSessionsSessionIdReviewsPost` with `Idempotency-Key` and the validator workaround. |
| `features/coach/actions/coach-action-errors.ts` | Coach-specific status → Indonesian message mapping (reuse `normalizeApiError`); `invalidInputFailure` helper if not shared. |
| `tests/unit/coach/coach-members-mapper.test.ts` | Fixture-driven tests for every mapping rule: null `latestSession`, null `npm`, null score, 6-state badges, single-group pillars, multi-version groups, empty history, dynamic measurements/postures, unsupported flags. |
| `tests/unit/coach/coach-members-data.test.ts` | Data-reader tests: `401 → null`, `404 → null`, `200 → VM`, `500 → throw`, Bearer header, `cache: "no-store"`, query params, Zod validation. Replaces the three dummy data tests. |
| `tests/unit/coach/coach-feedback-actions.test.ts` | Action tests: Zod failure, missing token (`UNAUTHORIZED`), `200 DraftOut` / `201 PublishedReview`, `409` conflict, `422`/`500` normalization, `Idempotency-Key` present, `requestValidator: undefined`. |
| `tests/unit/coach/coach-members-schemas.test.ts` | URL query schemas (`q`, `cursor`, `limit`) and action payload schemas (decision enum, note bounds, version bounds, idempotency key). |

### 7.2 Modified Files

| File Path | Changes |
|---|---|
| `features/coach/types.ts` | Replace members-only dummy types with the ViewModels in §6.2; keep dashboard types untouched. |
| `features/coach/schemas.ts` | Replace `feedbackSchema` with `coachMemberListQuerySchema`, `coachMemberHistoryQuerySchema`, `saveFeedbackDraftInputSchema`, `publishReviewInputSchema`; derive from generated Zod where possible. |
| `features/coach/data/get-team-members.ts` | Remove `'use cache'`, `cacheLife`, and dummies. Add `getCoachOverviewDto`, `getCoachRosterDto`, and `getCoachMembersPage({ q, cursor, limit })` with React `cache()`, `getAccessToken()`, generated SDK calls, `cache: "no-store"`, and generated Zod parsing. |
| `features/coach/data/get-member-detail.ts` | Remove `'use cache'`, `cacheLife`, `memberDetailIds`, and dummies. Add `getCoachMemberDetailDto(memberId)` + `getCoachMemberDetail(memberId)` (detail + latest session detail + 4 history items) with React `cache()` and `404 → null`. |
| `features/coach/data/get-member-history.ts` | Remove `'use cache'`, `cacheLife`, `memberHistoryIds`, and dummies. Add `getCoachMemberSessions(memberId, { limit, cursor })` with React `cache()`. |
| `features/coach/data/paginate-history.ts` | Delete (page-based pagination no longer applies). |
| `app/(coach)/coach/members/(list)/page.tsx` | Accept `searchParams` and pass the Promise to `<CoachMembersPage>`. |
| `app/(coach)/coach/members/[id]/(detail)/page.tsx` | Remove `generateStaticParams()` and `memberDetailIds`. |
| `app/(coach)/coach/members/[id]/(history)/riwayat/page.tsx` | Remove `generateStaticParams()` and `memberHistoryIds`; keep forwarding `searchParams`. |
| `features/coach/pages/coach-members-page.tsx` | Accept `searchParams`; parse `q`/`cursor`/`limit` in the list section; call `getCoachMembersPage`; handle `null`/empty. |
| `features/coach/pages/member-detail-page.tsx` | Call `getCoachMemberDetail(id)` once per section (React `cache()` dedupes); handle `latestSession === null`; render the new evaluation/history VMs; pass feedback props. |
| `features/coach/pages/member-history-page.tsx` | Accept cursor/filters; call `getCoachMemberDetail` + `getCoachMemberSessions`; remove `parseHistoryPage`/`paginateHistory`. |
| `features/coach/components/member-header.tsx` | Replace `totalAktif` with `countLabel`; copy `Atlet Binaan`. |
| `features/coach/components/member-stat-grid.tsx` | Accept `CoachMemberStat[]`; render unavailable slots dimmed with `Segera hadir`. |
| `features/coach/components/member-search.tsx` | Write `?q=` via `useRouter` (debounced); remove `filterMembers`; keep the input accessible. |
| `features/coach/components/filter-members.ts` | Delete if search moves server-side. |
| `features/coach/components/member-card-list.tsx` | Render `statusLabel`/`statusVariant`, `scoreLabel` (`poin`), `nim`, `lastGerakan`; add cursor `Muat Lebih Banyak`/`Kembali ke Awal`; empty states. |
| `features/coach/components/member-detail-profile.tsx` | Render the new profile VM; dim `Kehadiran`/`Agregat`; real belt/NIM/status. |
| `features/coach/components/pillar-performance-section.tsx` | Accept `CoachMemberPillarViewModel[]`; render `poin`, sample label, `Terdata`/`Belum Dinilai`; dim `Lihat semua`. |
| `features/coach/components/latest-evaluation.tsx` | Accept `CoachMemberEvaluationViewModel`; render real analysis counters/measurements; dim target/delta; dynamic postures; empty state. |
| `features/coach/components/posture-param-row.tsx` | Accept the dynamic posture VM (0..N), not the fixed `PostureParamId`. |
| `features/coach/components/member-feedback-card.tsx` | Pass session context and draft/review versions; render the disabled state when `latestSession === null`. |
| `features/coach/components/member-feedback-form.tsx` | Add decision control; call `saveFeedbackDraftAction` / `publishReviewAction`; handle `409`; remove the stub mutation and `POST /coach/feedback` TODO. |
| `features/coach/components/session-history-log.tsx` | Accept `CoachMemberHistoryItem[]`; drop `sesiLabel`/`repetisiLabel`; render `poin` + review badge. |
| `features/coach/components/member-history-section.tsx` | Render `${items.length} Sesi` (no total), cursor controls, empty state. |
| `features/coach/components/history-session-card.tsx` | Render `poin`, dynamic status badge, date/time, subtitle; remove `%` and `sesiLabel`/`repetisiLabel`. |
| `features/coach/components/history-pagination.tsx` | Replace numbered pages with `Muat Lebih Banyak` / `Kembali ke Awal` cursor links. |
| `tests/unit/coach/team-members-data.test.ts` | Replace with `coach-members-data.test.ts` / mapper tests. |
| `tests/unit/coach/team-members-route.test.ts` | Update for `searchParams`, no `filterMembers`, cursor links. |
| `tests/unit/coach/team-members-sections.test.ts` | Update for `poin`, review badges, dimmed stats, cursor controls. |
| `tests/unit/coach/filter-members.test.ts` | Delete if search moves server-side. |
| `tests/unit/coach/member-detail-data.test.ts` | Replace with mapper/data tests. |
| `tests/unit/coach/member-detail-route.test.ts` | Remove `generateStaticParams` / `memberDetailIds` assertions. |
| `tests/unit/coach/member-detail-sections.test.ts` | Update for the new profile/evaluation/postures/feedback; remove `POST /coach/feedback`; add draft/publish assertions. |
| `tests/unit/coach/member-history-data.test.ts` | Replace with cursor/mapper tests; delete `parseHistoryPage`/`paginateHistory` tests. |
| `tests/unit/coach/member-history-route.test.ts` | Remove `generateStaticParams` / `memberHistoryIds`; assert `searchParams` forwarding. |
| `tests/unit/coach/member-history-sections.test.ts` | Update for cursor pagination, `poin`, no total count, no page numbers. |

### 7.3 Deleted / Retired Files

| File Path | Reason |
|---|---|
| `features/coach/data/team-members-dummy.ts` | Replaced by generated DTO fixtures + mapper tests. |
| `features/coach/data/member-detail-dummy.ts` | Replaced by generated DTO fixtures + mapper tests. |
| `features/coach/data/member-history-dummy.ts` | Replaced by generated DTO fixtures + mapper tests. |
| `features/coach/data/paginate-history.ts` | Cursor pagination replaces in-memory page slicing. |
| `features/coach/components/filter-members.ts` | BE `q` replaces client-side filtering (if D2 accepted). |
| `tests/unit/coach/filter-members.test.ts` | No `filterMembers` to test (if D2 accepted). |
| `tests/unit/coach/team-members-data.test.ts` | Dummy-literal test retired. |
| `tests/unit/coach/member-detail-data.test.ts` | Dummy-literal test retired. |
| `tests/unit/coach/member-history-data.test.ts` | Dummy-literal + page-slicing test retired. |

**No changes** to `app/api/`, `components/ui/`, generated `src/api/**`, dashboard components, `features/member/**` (reuse only), or `features/auth/**`.

---

## 8. Generated SDK / Query / Mutation Mapping

| FE Consumer | Generated SDK Function | Generated Query Options / Key | Generated Zod Schema | Usage |
|---|---|---|---|---|
| `getCoachOverviewDto` | `overviewApiV1CoachOverviewGet` | `overviewApiV1CoachOverviewGetOptions()`<br>`overviewApiV1CoachOverviewGetQueryKey()` | `zCoachOverview`<br>`zOverviewApiV1CoachOverviewGetResponse` | Server RSC read inside React `cache()` with Bearer token and `cache: "no-store"`. |
| `getCoachRosterDto` | `rosterApiV1CoachRosterGet` | `rosterApiV1CoachRosterGetOptions({ query })`<br>`rosterApiV1CoachRosterGetQueryKey({ query })`<br>`rosterApiV1CoachRosterGetInfiniteOptions()` (optional) | `zRosterApiV1CoachRosterGetQuery`<br>`zRosterPage`<br>`zRosterApiV1CoachRosterGetResponse` | Server RSC read; `limit: 20`, `q`, `cursor`. |
| `getCoachMemberDetailDto` | `memberDetailApiV1CoachRosterMemberIdGet` | `memberDetailApiV1CoachRosterMemberIdGetOptions({ path })`<br>`memberDetailApiV1CoachRosterMemberIdGetQueryKey({ path })` | `zRosterDetail`<br>`zMemberDetailApiV1CoachRosterMemberIdGetResponse` | Server RSC read; `404 → null`. |
| `getCoachMemberSessionsDto` | `memberSessionsApiV1CoachRosterMemberIdSessionsGet` | `memberSessionsApiV1CoachRosterMemberIdSessionsGetOptions({ path, query })`<br>`memberSessionsApiV1CoachRosterMemberIdSessionsGetQueryKey({ path, query })`<br>`memberSessionsApiV1CoachRosterMemberIdSessionsGetInfiniteOptions()` (optional) | `zMemberSessionsApiV1CoachRosterMemberIdSessionsGetQuery`<br>`zHistoryPage`<br>`zMemberSessionsApiV1CoachRosterMemberIdSessionsGetResponse` | Server RSC read; `limit` 4 (preview) or 10/20 (history), `cursor`, optional filters. |
| `getCoachSessionDetailDto` | `sessionDetailApiV1CoachSessionsSessionIdGet` | `sessionDetailApiV1CoachSessionsSessionIdGetOptions({ path })`<br>`sessionDetailApiV1CoachSessionsSessionIdGetQueryKey({ path })` | `zCoachSessionDetail`<br>`zSessionDetailApiV1CoachSessionsSessionIdGetResponse` | Server RSC read for the latest evaluation + draft/review. |
| `saveFeedbackDraftAction` | `draftApiV1CoachSessionsSessionIdFeedbackDraftPut` | `draftApiV1CoachSessionsSessionIdFeedbackDraftPutMutation()` (documented; not called from the browser) | `zDraftInput`<br>`zDraftApiV1CoachSessionsSessionIdFeedbackDraftPutBody`<br>`zDraftOut`<br>`zDraftApiV1CoachSessionsSessionIdFeedbackDraftPutResponse` | Server action; `PUT` with Bearer + body; `throwOnError: false`. |
| `publishReviewAction` | `publishApiV1CoachSessionsSessionIdReviewsPost` | `publishApiV1CoachSessionsSessionIdReviewsPostMutation()` (documented; not called from the browser) | `zPublishInput`<br>`zPublishApiV1CoachSessionsSessionIdReviewsPostBody`<br>`zPublishApiV1CoachSessionsSessionIdReviewsPostHeaders`<br>`zPublishedReview` | Server action; `POST` with Bearer + `Idempotency-Key`; `requestValidator: undefined` workaround. |
| Mutation invalidation | — | `rosterApiV1CoachRosterGetQueryKey()`<br>`memberDetailApiV1CoachRosterMemberIdGetQueryKey({ path: { member_id } })`<br>`memberSessionsApiV1CoachRosterMemberIdSessionsGetQueryKey({ path, query })`<br>`sessionDetailApiV1CoachSessionsSessionIdGetQueryKey({ path: { session_id } })` | — | Invalidate without auth headers; also `revalidatePath` the member routes. |

> **Why the browser does not call the generated query hooks directly:** `ss_at` is HttpOnly. The pages are RSC; the generated options/keys are documented for future hydration, client filters, or invalidation, not for browser network calls.

---

## 9. Zod Validation Strategy

Per [`README.md`](./README.md) §7, Zod operates across three layers:

### 9.1 Layer 1 — Wire Validators (Generated)

Used automatically by the SDK (`validator: true`) and explicitly in the readers:

- `zOverviewApiV1CoachOverviewGetResponse`
- `zRosterApiV1CoachRosterGetQuery` + `zRosterApiV1CoachRosterGetResponse`
- `zMemberDetailApiV1CoachRosterMemberIdGetResponse`
- `zMemberSessionsApiV1CoachRosterMemberIdSessionsGetQuery` + `zMemberSessionsApiV1CoachRosterMemberIdSessionsGetResponse`
- `zSessionDetailApiV1CoachSessionsSessionIdGetResponse`
- `zDraftApiV1CoachSessionsSessionIdFeedbackDraftPutBody` + `...Response`
- `zPublishApiV1CoachSessionsSessionIdReviewsPostBody` + `...Headers` + `...Response`

### 9.2 Layer 2 — URL Query Validators (`features/coach/schemas.ts`)

`searchParams` are untrusted. Sanitize each field with `.catch()` defaults derived from the generated schemas; never fail the page render on a malformed query.

```ts
import { z } from "zod";
import {
  zRosterApiV1CoachRosterGetQuery,
  zMemberSessionsApiV1CoachRosterMemberIdSessionsGetQuery,
} from "@/api/zod.gen";

export const coachMemberListQuerySchema = z.object({
  q: z.string().trim().max(120).catch("").default(""),
  cursor: z.string().trim().min(1).max(4096).nullable().catch(null).default(null),
  limit: z.coerce.number().int().min(1).max(100).catch(20).default(20),
});

export const coachMemberHistoryQuerySchema = z.object({
  cursor: z.string().trim().min(1).max(4096).nullable().catch(null).default(null),
  limit: z.coerce.number().int().min(1).max(100).catch(10).default(10),
  movementSlug: zMemberSessionsApiV1CoachRosterMemberIdSessionsGetQuery.shape.movementSlug
    .unwrap().unwrap().nullable().catch(null).default(null),
  reviewStatus: zMemberSessionsApiV1CoachRosterMemberIdSessionsGetQuery.shape.reviewStatus
    .unwrap().unwrap().nullable().catch(null).default(null),
  processingStatus: zMemberSessionsApiV1CoachRosterMemberIdSessionsGetQuery.shape.processingStatus
    .unwrap().unwrap().nullable().catch(null).default(null),
});
```

> The generated `.nullish()` fields need `.unwrap().unwrap()` to reach the enum; confirm the exact wrapper depth against `zod.gen.ts` at implementation time (the member history schema uses the same pattern in `sessions-history.md` §9.2).

### 9.3 Layer 3 — Server Action Payload Validators (`features/coach/schemas.ts`)

```ts
import { z } from "zod";
import { zDraftInput, zPublishInput } from "@/api/zod.gen";

export const coachSessionIdSchema = z.string().trim().min(1).max(128);

export const saveFeedbackDraftInputSchema = z.object({
  sessionId: coachSessionIdSchema,
  expectedVersion: zDraftInput.shape.expectedVersion, // int >= 0
  decision: zDraftInput.shape.decision,               // 'approved' | 'needs_revision' | null | undefined
  note: z.string().trim().min(10, "Catatan minimal 10 karakter").max(5000).nullable(),
});

export const publishReviewInputSchema = z.object({
  sessionId: coachSessionIdSchema,
  expectedRevision: zPublishInput.shape.expectedRevision,       // int >= 0
  expectedDraftVersion: zPublishInput.shape.expectedDraftVersion, // int >= 1
  idempotencyKey: z.string().trim().min(1).max(128),
});
```

- Form-level messages stay Indonesian and field-specific.
- The action boundary uses `safeParse(input: unknown)`; client validation is never trusted.
- Fixture pinning: mapper tests parse fixtures through `zRosterPage`, `zRosterDetail`, `zHistoryPage`, and `zCoachSessionDetail` before mapping, so an OpenAPI change fails tests immediately.

---

## 10. Risks & Mitigations

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R1 | **`'use cache'` remains on an authenticated read.** | Build failure under `cacheComponents: true` or cross-coach data leak. | Remove `'use cache'`/`cacheLife`; use React `cache()` + `cache: "no-store"` only. |
| R2 | **`generateStaticParams()` enumerates dummy ids.** | Dynamic member/session routes are pre-rendered for non-existent ids; real ids 404 at build/route time. | Remove both `generateStaticParams()` exports and the `memberDetailIds`/`memberHistoryIds` exports. |
| R3 | **Feedback model mismatch.** | The member-level card cannot be wired to `POST /coach/feedback`; building the wrong UX wastes a move. | Blocking decision D10 / Q1–Q3. Do not implement the feedback form until product chooses session-scoped draft/publish or a BE member-level endpoint. |
| R4 | **Draft/publish race conditions.** | Two tabs or a stale page publish over a newer review; `409`/`422` failures. | Round-trip `expectedVersion` / `expectedRevision` / `expectedDraftVersion`; generate a new `Idempotency-Key` per publish; on `409`, show a conflict toast and `router.refresh()`. |
| R5 | **`CoachSessionDetail` has no member identity.** | A standalone coach session-detail route cannot show which member the session belongs to. | Keep the feedback flow on the member detail route (member context in the URL); if a session route is added, pass `memberId` in the path or request a BE field. |
| R6 | **Detail page makes 2–3 sequential reads.** | Slow page or a partial failure. | React `cache()` dedupes; run independent reads in parallel (`Promise.all`) where possible; keep separate Suspense boundaries so one failure does not blank the whole page. |
| R7 | **No total count in roster/history.** | Page numbers, ranges, and "10 / 24" badges cannot be reproduced. | Replace with cursor `Muat Lebih Banyak` and current-page counts; do not fabricate a total. |
| R8 | **Fabricated stages, accuracy, attendance, or aggregates.** | Coaches make decisions on non-existent classifications. | Replace stage badges with review status; dim unsupported metrics with `Segera hadir`; never synthesize a team/member average. |
| R9 | **Fixed 5 posture params vs dynamic `bodyPart`.** | Wrong joints or empty rows if forced. | Render dynamic `aiPostures` + `coachBodyAssessments`; do not force `PostureParamId`. |
| R10 | **`validRepetitions` / `deviatedRepetitions` are always `null`.** | Repetition labels and "Repetisi Sah" metrics would be fake. | Drop the repetition labels; use real analysis counters/measurements. |
| R11 | **`npm` is nullable.** | NIM search/display breaks for coaches without NPM. | Display `—`; search via BE `q` (which handles the BE's own matching); do not crash. |
| R12 | **`reviewStatus` defaults to `pending` even for queued/failed sessions.** | A failed session could show `Menunggu Ulasan`. | Use `toHistoryReviewBadgeStatus` (processing status wins for failed/queued/processing). |
| R13 | **`Idempotency-Key` generated validator bug.** | Publish always fails request validation. | Pre-validate with Zod and pass `requestValidator: undefined`; keep the response validator active (same as `retry-session.ts`). |
| R14 | **Existing tests pin dummy literals and page pagination.** | `pnpm test` fails after the integration. | Replace the three `*-data.test.ts` files with mapper/data tests; update route/section tests in lockstep. |
| R15 | **Query-key mismatch after mutations.** | Stale member detail/history after publish. | Invalidate the generated keys without headers and `revalidatePath` the member routes. |
| R16 | **Search debounce floods the server.** | Excess RSC requests while typing. | 300 ms debounce + `router.replace` (no history spam) + `q` max 120. |
| R17 | **Empty member/session states crash components.** | New coaches/members see a broken page. | Test `items: []`, `latestSession: null`, `similarityGroups: []`, `measurements: []`, `feedbackDraft: null`, `review: null`; render empty states. |
| R18 | **Date/time hydration or timezone drift.** | Inconsistent labels. | Format all ISO timestamps server-side in `Asia/Jakarta` (`id-ID`) and pass plain strings. |

---

## 11. Open Questions

### Blocking (must be answered before implementation)

| # | Question | Why it blocks | Options |
|---|---|---|---|
| Q1 | **Feedback model:** keep a member-level feedback card, or move to session-scoped draft/publish? | No `POST /coach/feedback` exists; the entire feedback UI depends on this. | **A (proposed):** session-scoped draft/publish on the latest session. **B:** request a BE member-level endpoint. **C:** new coach session-detail/review route. |
| Q2 | **If session-scoped, which session?** Latest session only, or a session picker / session-detail route? | `CoachSessionDetail` is per-session; the member detail only knows `latestSession`. | **A (proposed):** latest session only in the MVP. **B:** session picker from history → new route. |
| Q3 | **Feedback fields in the MVP:** decision + note only, or include `bodyAssessments` and `tasks`? | The BE supports all four; the Figma card only has a textarea. | **A (proposed):** decision + note. **B:** full draft (body assessments + tasks). |
| Q4 | **List stats:** accept Honest UI for `Rata Akurasi`, `Kelulusan`, stage breakdown, and trend deltas? | These Figma metrics have no BE fields. | **A (proposed):** dim with `Segera hadir`, show real counts. **B:** request BE aggregate endpoints. |
| Q5 | **Search:** server-side `q` or client-side page filter? | Client-side filtering silently misses members beyond the loaded cursor page. | **A (proposed):** server-side `q`. **B:** client-side filter with an explicit "this page only" label. |
| Q6 | **History pagination UX:** cursor "next page" links or append/infinite list? | No total count; page numbers cannot be honest. | **A (proposed):** server cursor links (`Muat Lebih Banyak` + `Kembali ke Awal`). **B:** client `useInfiniteQuery` via a server action. |
| Q7 | **Detail evaluation:** accept replacing the four fixed metric tiles with real analysis counters / dynamic measurements? | The Figma metrics (`Target IPSI`, `Repetisi Sah`, `Kecepatan Puncak`, `Kestabilan`) do not exist in BE. | **A (proposed):** real counters + dynamic measurements. **B:** dim each Figma tile with `Segera hadir` (preserves layout, less useful). **C:** request BE fixed metric fields. |

### Non-Blocking (can be decided during implementation)

| # | Question | Proposed default |
|---|---|---|
| Q8 | Roster page size | `20` (BE default). |
| Q9 | History page size | `10` (closer to the Figma 10/page) or `20` (BE default). |
| Q10 | History filters (`movementSlug`, `reviewStatus`, `processingStatus`, `from`, `to`) in the MVP? | Defer; the current screen has no filters. Add later with URL params + cursor reset. |
| Q11 | `npm === null` display | `NIM —`; do not hide the row. |
| Q12 | `beltTarget` display | Optional caption `Target: ${beltTarget}`; omit when `null`. |
| Q13 | `feedbackDraft.version` initial value / `expectedVersion: 0` semantics | Assume `null` draft → `0`; confirm against the BE during implementation. |
| Q14 | Publish with `decision: null` | Assume invalid; require a decision in the form. Confirm against the BE. |
| Q15 | Show `reviewHistory`, `legacyNotes`, `followUpTasks` on the member detail? | Defer; not in the Figma card. |
| Q16 | Coach pose overlay / video player | Out of scope; `GET /pose` and `/video` exist but are not used. |
| Q17 | Search debounce interval | 300 ms. |
| Q18 | Should `Rata Akurasi`'s note show `scoredSessionCount`, and `Sesi Rekaman`'s note show `reviewQueueCount`? | Yes (both are real); product can swap. |

---

## 12. Approval Checklist

- [x] Scope confirmed: Coach Members list/detail/history + feedback only; dashboard/member routes untouched.
- [x] Q1–Q7 resolved (blocking; see §11).
- [x] D1–D12 reviewed; decisions approved or amended.
- [x] FE file change list (§7) and ViewModel contract (§6.2) approved.
- [x] Feedback model chosen (session-scoped latest session vs new BE endpoint vs new session route).
- [x] Unsupported metrics accepted as Honest UI (`Segera hadir`), or BE changes requested.
- [x] Implementation issue(s) created (parent + subs, max 1 level) with the approved spec linked.
- [x] Gates after implementation: `pnpm build`, `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`, and browser `scrollWidth <= innerWidth` at 390px for the list, detail, and history routes.

**No implementation starts until this checklist is approved.**
