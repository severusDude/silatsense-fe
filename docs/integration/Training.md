# Training (`/latihan`) — FE ↔ BE Integration Spec

- **Status:** Draft — Phase 1 assessment + Phase 2 spec. Awaiting approval; no implementation yet.
- **Date:** 2026-11-04
- **Scope:** the whole `/latihan` module: catalog (`/latihan`), preparation (`/latihan/[slug]`), recording (`/latihan/[slug]/rekam`), session review (`/latihan/[slug]/sesi/...`), and evaluation (`/latihan/[slug]/evaluasi/...`).
- **Out of scope:** `/riwayat` session detail, coach review flows, notifications, frame-accurate video scrubbing, pose-skeleton rendering, offline recording.
- **BE source of truth:** `https://silatsense-be.vercel.app/openapi.json` (fetched 2026-11-04).
- **FE baseline:** Next.js 16.3.8, React 19, TanStack Query 5.104.1, Zod 4.6.5, `@hey-api/openapi-ts` 0.99.0, generated client in `src/api/`.
- **Canonical conventions:** [`docs/integration/README.md`](./README.md). This document only records module-specific decisions and gaps.

---

## 0. TL;DR

The five training screens are currently **fully mocked**. Every `features/member/data/get-*.ts` reader is `'use cache'` + `cacheLife("minutes")` returning a hardcoded object, the recorder is a mount timer, the upload is an interval that fails once at 72%, and both `<video>` elements have no `src`.

The backend already exposes the complete read + mutation surface:

1. `GET /api/v1/member/training-modules` → `TrainingCatalog`
2. `GET /api/v1/member/training-prep/{slug}` → `TrainingPrep`
3. `GET /api/v1/member/record-config/{slug}` → `UploadConfig`
4. `POST /api/v1/member/sessions` (multipart, required `Idempotency-Key`) → `202 AcceptedSession`
5. `GET /api/v1/member/sessions/{session_id}` → `SessionOut`
6. `DELETE /api/v1/member/sessions/{session_id}` → `204`
7. `GET /api/v1/member/sessions/{session_id}/evaluation` → `EvaluationOut`
8. `GET /api/v1/member/sessions/{session_id}/pose` → `PoseOut`
9. `GET /api/v1/member/sessions/{session_id}/video` (Range, `200`/`206`) → binary
10. `POST /api/v1/member/sessions/{session_id}/acknowledge` → `AcknowledgedOut`
11. `POST /api/v1/member/sessions/{session_id}/follow-ups` (retry) → `201 RetryOut`

There are four integration realities that change the shape of the module:

- **Session identity is opaque.** The BE has no slug-keyed session endpoint. `/sesi` and `/evaluasi` must become `/latihan/[slug]/sesi/[sessionId]` and `/latihan/[slug]/evaluasi/[sessionId]`.
- **There is no real capture/upload today.** The BE expects a multipart video and an `Idempotency-Key`; the FE has neither. Upload must move to `/rekam` (where the blob still exists), then navigate to the session-ID route.
- **The evaluation score is not an accuracy percentage.** `EvaluationOut.score` is `number | null` on a 0–100 scale with `scoreUnit: "similarity_points"`. It is not “Akurasi Kinematika %”, and the BE exposes no 85% pass target. Repetition counts are permanently `null`.
- **Upload transport is the one open infrastructure gap.** The token is HttpOnly on the FE origin, so the browser cannot call the BE directly with `Authorization`. A same-origin BFF proxy works, but a Vercel-style host caps request bodies at ~4.5 MB — below a normal 60 s video. The `proxy.ts` spike rejected the rewrite option (it buffers, 10 MB default), so the interim is a guarded BFF route plus a BE request for pre-signed uploads (D4, §11).

Everything else is adaptable with the ViewModel + mapper pattern: real fields are rendered active, unsupported metrics become visually inactive with a “Segera hadir” badge, and nothing is fabricated.

---

## 1. Contract Snapshot

### 1.1 Endpoints

All training endpoints require `HTTPBearer`. No pagination is used anywhere in this module.

| # | Method + Path | Request | Success | Error statuses | Generated SDK function |
|---|---|---|---|---|---|
| 1 | `GET /api/v1/member/training-modules` | — | `200 TrainingCatalog` | `401, 403, 404, 422, 500` | `modulesApiV1MemberTrainingModulesGet` |
| 2 | `GET /api/v1/member/training-prep/{slug}` | path `slug: string` | `200 TrainingPrep` | `401, 403, 404, 422, 500` | `prepApiV1MemberTrainingPrepSlugGet` |
| 3 | `GET /api/v1/member/record-config/{slug}` | path `slug: string` | `200 UploadConfig` | `401, 403, 404, 422, 500` | `recordConfigApiV1MemberRecordConfigSlugGet` |
| 4 | `POST /api/v1/member/sessions` | `multipart/form-data` body, header `Idempotency-Key` (1–128 chars) | `202 AcceptedSession` | `401, 403, 404, 409, 410, 413, 415, 416, 422, 429, 500, 503` | `uploadSessionApiV1MemberSessionsPost` |
| 5 | `GET /api/v1/member/sessions/{session_id}` | path `session_id: string` | `200 SessionOut` | `401, 403, 404, 409, 410, 413, 415, 416, 422, 429, 500, 503` | `sessionStatusApiV1MemberSessionsSessionIdGet` |
| 6 | `DELETE /api/v1/member/sessions/{session_id}` | path `session_id: string` | `204` (no body) | same broad domain set | `removeSessionApiV1MemberSessionsSessionIdDelete` |
| 7 | `GET /api/v1/member/sessions/{session_id}/evaluation` | path `session_id: string` | `200 EvaluationOut` | same broad domain set | `evaluationApiV1MemberSessionsSessionIdEvaluationGet` |
| 8 | `GET /api/v1/member/sessions/{session_id}/pose` | path `session_id: string` | `200 PoseOut` | same broad domain set | `poseApiV1MemberSessionsSessionIdPoseGet` |
| 9 | `GET /api/v1/member/sessions/{session_id}/video` | path `session_id: string`; optional `Range: string \| null` | `200` or `206`, `video/mp4 \| video/quicktime \| video/webm` | `401, 403, 404, 409, 410, 413, 415, 416, 422, 429, 500, 503` | `videoApiV1MemberSessionsSessionIdVideoGet` |
| 10 | `POST /api/v1/member/sessions/{session_id}/acknowledge` | path `session_id: string` | `200 AcknowledgedOut` | `401, 403, 404, 409, 410, 413, 415, 416, 422, 429, 500, 503` | `acknowledgeSessionApiV1MemberSessionsSessionIdAcknowledgePost` |
| 11 | `POST /api/v1/member/sessions/{session_id}/follow-ups` | path `session_id: string`; body `RetryInput`; header `Idempotency-Key` | `201 RetryOut` | `401, 403, 404, 409, 410, 416, 422, 429, 500, 503` | `retryApiV1MemberSessionsSessionIdFollowUpsPost` |

Error bodies are `DomainErrorOut { detail: string; code: string; requestId: string; errors?: ValidationIssue[] | null }`. The rate-limit `429` body is documented as `DomainErrorOut` for these endpoints. The FE still normalizes `422` as a FastAPI validation array in `lib/api-client.ts`, because other endpoints share that shape.

### 1.2 Generated wire DTOs

Copied from `src/api/types.gen.ts`; **generated, never edit**. Optional markers and nullability are significant.

```ts
export type TrainingCatalog = {
  modules: Array<TrainingModule>;
  statistics: ActivitySummary;
};

export type TrainingModule = {
  slug: "kuda-kuda" | "pukulan" | "tangkisan" | "tendangan";
  name: string;
  order: number;
  description: string | null;
  level: string | null;
  estimatedDurationSeconds: number | null;
  capability: Capability;
};

export type Capability = {
  scoringAvailable: boolean;
  reason: "reference_not_ready" | null;
  method?: "static-reference-pose"; // generated default: "static-reference-pose"
  referenceVersions: Array<string>;
  repetitionCountingAvailable?: false; // generated default: false
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
  movementSlug: string; // free string, not the 4-value enum
  method: string;
  analyzerVersion: string;
  featureVersion: string;
  referenceVersion: string;
  averageScore: number | null;
  sampleCount: number;
};
```

```ts
export type TrainingPrep = {
  module: TrainingModule;
  checklist: Array<GuideItem>;
  guides: Array<GuideItem>;
};

export type GuideItem = {
  id: string;
  text: string;
  source: string;
};
```

```ts
export type UploadConfig = {
  movementSlug: "kuda-kuda" | "pukulan" | "tangkisan" | "tendangan";
  acceptedMimeTypes: Array<string>;
  maxBytes: number;
  maxDurationSeconds: number;
  retentionSeconds?: 86400; // generated default: 86400
  recommendedDurationSeconds: number | null;
};
```

```ts
export type BodyUploadSessionApiV1MemberSessionsPost = {
  movementSlug: string;
  video: Blob | File;
  retryOf?: string | null;
};

export type AcceptedSession = {
  sessionId: string;
  processingStatus?: "queued"; // generated default: "queued"
  statusUrl: string;
  evaluationUrl: string;
  uploadedAt: string; // ISO 8601 datetime
};
```

```ts
export type SessionOut = {
  id: string;
  movementSlug: "kuda-kuda" | "pukulan" | "tangkisan" | "tendangan";
  createdAt: string;                    // ISO 8601 datetime
  uploadedAt: string | null;            // ISO 8601 datetime
  startedAt: string | null;             // ISO 8601 datetime
  completedAt: string | null;           // ISO 8601 datetime
  processingStatus: "queued" | "processing" | "completed" | "failed";
  analysisStatus: string | null;        // untyped here; EvaluationOut has the enum
  evaluationId: string | null;
  reviewStatus?: "pending" | "approved" | "needs_revision"; // default "pending"
  reviewAvailable?: boolean;            // default false
  retryOf: string | null;
  acknowledgedAt: string | null;        // ISO 8601 datetime
  error: SessionFailure | null;
  media: MediaOut;
};

export type SessionFailure = {
  code: string;
  detail: string;
};

export type MediaOut = {
  status: "available" | "expired" | "deleted" | "unavailable";
  expiresAt: string | null;             // ISO 8601 datetime
  mimeType: string | null;
  byteSize: number | null;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  playbackPath: string | null;          // semantics not documented
};
```

```ts
export type EvaluationOut = {
  id: string;
  sessionId: string;
  movementSlug: "kuda-kuda" | "pukulan" | "tangkisan" | "tendangan";
  evaluatedAt: string; // ISO 8601 datetime
  analysisStatus:
    | "experimental"
    | "reference_not_ready"
    | "insufficient_pose"
    | "insufficient_features";
  score: number | null;                 // 0..100 by schema; unit is similarity points
  scoreUnit?: "similarity_points";      // default "similarity_points"
  scoreReason: string | null;
  matchedVariant: string | null;
  method?: "static-reference-pose";     // default "static-reference-pose"
  analyzerVersion: string;
  featureVersion: string | null;
  referenceVersion: string | null;
  poseStatus: "detected" | "not_detected";
  framesProcessed: number;
  validPoseFrames: number;
  featuresCompared: number | null;
  keyFrame: KeyFrame | null;
  measurements: Array<Measurement>;
  issues: Array<AnalysisIssue>;
  validRepetitions?: null;              // always null today
  deviatedRepetitions?: null;           // always null today
  unavailableReasons: Array<string>;
};

export type Measurement = {
  feature: string;                      // free string
  bodyPart: string;                     // free string
  value: number | null;
  unit: "deg" | "shoulder_width";
  referenceMedian: number | null;
  referenceIqr: number | null;
  deviation: number | null;
  assessment: "within_reference" | "deviates" | "not_assessed";
  reason: string | null;
};

export type AnalysisIssue = {
  feature: string;
  bodyPart: string;
  deviation: number;
  unit: "deg" | "shoulder_width";
  severity: "low" | "medium" | "high";
  feedback: string;
};

export type KeyFrame = {
  index: number;
  timeSeconds: number;
};
```

```ts
export type PoseOut = {
  sessionId: string;
  pose: PoseData | null;
  reason: string | null;
};

export type PoseData = {
  kind?: "keyframe";                    // default "keyframe"
  frameIndex: number;
  timeSeconds: number;
  coordinateSystem?: "image-normalized"; // default "image-normalized"
  origin?: "top-left";                   // default "top-left"
  imageWidth: number;
  imageHeight: number;
  landmarks: Array<Landmark>;
};

export type Landmark = {
  index: number;
  x: number;
  y: number;
  z: number;
  visibility: number;
};
```

```ts
export type RetryInput = { intent: "retry" };

export type RetryOut = {
  id: string;
  sourceSessionId: string;
  createdAt: string; // ISO 8601 datetime
};

export type AcknowledgedOut = {
  acknowledgedAt: string; // ISO 8601 datetime
};
```

### 1.3 Generated-artifact caveats

Two generated validators are wrong for binary payloads and **must not be used** for their endpoints:

- `zUploadSessionApiV1MemberSessionsPostBody.video` is `z.string()`, although the TS type is `Blob | File`. The SDK request validator rejects a real `File` before the request is sent. Bypass the SDK wrapper for this one endpoint and call the low-level `client.post` with a `FormData` body; validate the response with `zAcceptedSession`.
- `zVideoApiV1MemberSessionsSessionIdVideoGetResponse` is `z.string()`, although the response is `video/mp4 | video/quicktime | video/webm`. Do not call the SDK function; call `client.get` with `parseAs: "stream"` and forward the stream.

Do not patch `src/api/**`. These are generator limitations to work around at the seam.

---

## 2. Current FE Inventory

### 2.1 Routes and compositions

| Route | Route file | Feature composition | Current state |
|---|---|---|---|
| `/latihan` | `app/(member)/latihan/(list)/page.tsx` | `features/member/pages/latihan-page.tsx` → `LatihanHero`, `ModuleCardList` | Dummy catalog via `getTrainingModules()` |
| `/latihan/[slug]` | `app/(member)/latihan/[slug]/(persiapan)/page.tsx` | `features/member/pages/persiapan-page.tsx` → `CameraExperience`, `CoachInstructionCard`, `CalibrationCard`, `PersiapanCta` | Dummy prep + dummy cameras |
| `/latihan/[slug]/rekam` | `app/(member)/latihan/[slug]/rekam/page.tsx` | `features/member/pages/rekam-page.tsx` → `RekamViewport`, `RekamSelesaiCta` | Live camera preview, but no `MediaRecorder`; timer counts from mount; “Selesai” is a link |
| `/latihan/[slug]/sesi` | `app/(member)/latihan/[slug]/sesi/page.tsx` | `features/member/pages/sesi-page.tsx` → `SesiPlayback`, `SesiInfoCard`, `SesiActions` | Dummy session; empty video; simulated upload |
| `/latihan/[slug]/evaluasi` | `app/(member)/latihan/[slug]/evaluasi/page.tsx` | `features/member/pages/evaluasi-page.tsx` → `EvaluasiHeader`, `EvaluasiScoreCard`, `EvaluasiPlayback`, `EvaluasiPostureList`, `EvaluasiActions` | Dummy evaluation; empty video; dead “Selesai dan Simpan” |

All five route files use `generateStaticParams()` for the four slugs. The leaf layouts own `MemberLayout` and the breadcrumb trail; `app/(member)/layout.tsx` owns `AuthGate role="member"`.

### 2.2 Data reads

| File | Signature | Current implementation |
|---|---|---|
| `features/member/data/get-training-modules.ts` | `getTrainingModules(): Promise<MemberTraining>` | `'use cache'` + `cacheLife("minutes")` → `dummyMemberTraining` |
| `features/member/data/get-persiapan.ts` | `getPersiapan(slug): Promise<PersiapanDetail \| null>` · `getCameras(): Promise<CameraDevice[]>` | `'use cache'` → `dummyPersiapanBySlug` · `dummyCameras` |
| `features/member/data/get-rekam.ts` | `getRekam(slug): Promise<RekamSession \| null>` | `'use cache'` → `dummyRekamBySlug` |
| `features/member/data/get-sesi.ts` | `getSesi(slug): Promise<TrainingSession \| null>` | `'use cache'` → `dummySesiBySlug` |
| `features/member/data/get-evaluasi.ts` | `getEvaluasi(slug): Promise<EvaluationSession \| null>` | `'use cache'` → `dummyEvaluasiBySlug` |

Every reader has a `TODO: connect backend via lib/api-client.ts (...) — dummy for now` comment naming an endpoint that does not exist in the OpenAPI contract (`/member/cameras`, `/member/sessions/:slug`, `/member/evaluations/:slug`).

### 2.3 Simulated behavior that must be removed

| Location | Simulation |
|---|---|
| `features/member/components/rekam-viewport.tsx` | `elapsedSec` increments on a `setInterval` from mount; no `MediaRecorder`, no blob, no stop. |
| `features/member/components/rekam-selesai-cta.tsx` | `<Link>` to `/latihan/[slug]/sesi`; no recording handoff. |
| `features/member/components/sesi-actions.tsx` | Fake upload: increments 8%/120 ms, fails once at 72%, succeeds on “Coba lagi”; no network, no file. |
| `features/member/components/sesi-playback.tsx` | `<video>` with no `src`. |
| `features/member/components/evaluasi-playback.tsx` | `<video>` with no `src`; `EvaluasiScrubber` is static. |
| `features/member/components/evaluasi-actions.tsx` | “Selesai dan Simpan” is an `aria-disabled` `<span>`; “Latihan Ulang” links to `/rekam`. |
| `features/member/components/evaluasi-pose-thumb.tsx` | Placeholder; no pose asset. |
| `features/member/data/persiapan-dummy.ts` | Fake sensor checks: “540 Lux”, “2.48 meter”, “33 titik persendian”, “100% SIAP”. |

### 2.4 Tests that pin the current behavior

`tests/unit/member/{training,persiapan,rekam,sesi,evaluasi}-data.test.ts` assert dummy literals, slug resolution, and the fake camera list. `tests/unit/member/{latihan,persiapan,rekam,sesi,evaluasi}-shell.test.ts` assert the simulated upload machine, dead CTAs, empty video shells, and `generateStaticParams`. These will be rewritten around the mappers and real state; they are expected churn, not a regression.

---

## 3. Gap Analysis

Status legend:

- **Match** — direct field, same meaning.
- **Mismatch** — field name, unit, nullability, or enum differs; resolved in a ViewModel mapper.
- **Missing in BE** — the screen needs it but the contract does not expose it; render inactive/“Segera hadir” or remove by product decision.
- **Unused in BE** — exposed but not needed by the current UI.
- **Derived** — computed by the FE from real BE fields (formatting, labels, counts).
- **FE-only** — static copy or browser hardware state; never sent to the BE.

### 3.1 Catalog — `/latihan`

| FE need | BE field | Type / nullability / enum | Status | Decision |
|---|---|---|---|---|
| `hero.badges` | — | — | **FE-only** | Keep “MODUL LATIHAN” and “Standar PB IPSI Resmi” as product copy; derive “4 Pilar Teknik” from `modules.length`. |
| `hero.title`, `hero.subtitle` | — | — | **FE-only** | Keep Figma copy; no BE field. |
| `hero.sessionsLabel` | `statistics.completedSessionCount` | `number` (int) | **Match** | `"${count} Sesi Tersimpan"`. |
| `hero.accuracyLabel` | `statistics.similarityGroups[].averageScore` | `number \| null`, per movement/method/version | **Missing in BE (aggregate)** | Do not synthesize an overall average. Render an inactive “Akurasi: Segera hadir” slot, or show `scoredSessionCount` as the second active stat. Recommended: second stat = `"${scoredSessionCount} Sesi Dinilai"`, plus an inactive accuracy badge. |
| `module.slug` | `modules[].slug` | enum of 4 | **Match** | Direct. |
| `module.order` | `modules[].order` | `number` (int) | **Match** | Direct. |
| `module.orderLabel` | `modules[].order` + static tagline | `number` | **Derived** | `Latihan 01 · Fondasi Inti`; the tagline is FE taxonomy keyed by the 4-value enum. |
| `module.name` | `modules[].name` | `string` | **Match** | Direct. |
| `module.levelLabel` | `modules[].level` | `string \| null` | **Mismatch (nullable)** | `level ?? "Semua Tingkat"`; do not map arbitrary BE strings to Figma copy. |
| `module.description` | `modules[].description` | `string \| null` | **Mismatch (nullable)** | `description ?? ""`; hide the paragraph when empty. |
| `module.estimateLabel` | `modules[].estimatedDurationSeconds` | `number \| null` (seconds) | **Mismatch (unit)** | `"10 Menit"` via `Math.round(seconds / 60)`; omit the badge when null. |
| `module.capability` (new) | `modules[].capability` | `Capability` | **Match** | If `scoringAvailable === false`, show “Penilaian segera hadir” + reason `reference_not_ready`; keep practice accessible. |
| `module.averageScore` (optional) | `statistics.similarityGroups[]` | `averageScore: number \| null`, `sampleCount: number` | **Derived** | Only when exactly one group matches the module slug and `sampleCount > 0`; otherwise omit to avoid picking an arbitrary analyzer version. |
| `statistics.totalDurationSeconds` | same | `number` | **Unused in BE** | Not in the Figma hero; do not add. |
| `statistics.durationSampleCount` | same | `number` | **Unused in BE** | — |
| `statistics.scoredSessionCount` | same | `number` | **Match** | Use as the second hero stat if the accuracy slot is not used. |
| `statistics.excludedScoreCount` | same | `number` | **Unused in BE** | Could be a tooltip later. |
| `similarityGroups[].method/analyzerVersion/featureVersion/referenceVersion` | same | `string` | **Unused in BE** | Technical provenance; do not surface. |

### 3.2 Preparation — `/latihan/[slug]`

| FE need | BE field | Type / nullability / enum | Status | Decision |
|---|---|---|---|---|
| `slug` | path param + `module.slug` | enum of 4 | **Match** | Validate the route against the enum; `notFound()` on mismatch. |
| `eyebrow` | `module.name` | `string` | **Derived** | `module.name.toUpperCase()`. |
| `accuracyLabel`, `accuracyValue` (“≥ 88%”) | — | — | **Missing in BE** | No target score in the contract. Replace with capability status (`scoringAvailable` / `reference_not_ready`); do not show a numeric target. |
| `title` | `module.name` | `string` | **Match** | Direct. |
| `description` | `module.description` | `string \| null` | **Mismatch (nullable)** | Fallback `""`; hide when empty. |
| `coachQuote` | — | — | **Missing in BE** | No coach quote or coach identity. Repurpose the instruction card as “Panduan Gerakan” using `guides[0]` + `source`, or hide it. Do not invent a coach. |
| `readinessLabel` (“100% SIAP”) | — | — | **Missing in BE** | Readiness is a browser/camera property, not BE data. Derive it from the live `CameraExperience` state or omit it. |
| `checks[].title/detail/stateLabel` | `checklist[]` | `GuideItem { id, text, source }` | **Mismatch (shape)** | Render `text` + `source` as a checklist; no fake “Aktif/Optimal/Terkunci” state labels. |
| `guides[].term/detail` | `guides[]` | `GuideItem { id, text, source }` | **Mismatch (shape)** | Render `text` + `source`; no `term` split. |
| `module.level` | same | `string \| null` | **Match** | Show as a caption. |
| `module.estimatedDurationSeconds` | same | `number \| null` | **Mismatch (unit)** | Format “10 menit”. |
| `module.capability` | same | `Capability` | **Match** | Show “Penilaian aktif” / “Penilaian segera hadir”; `referenceVersions` may stay technical. |
| `checklist[].id`, `guides[].id`, `.source` | same | `string` | **Match** | Stable keys; source as caption. |

### 3.3 Recording — `/latihan/[slug]/rekam`

| FE need | BE field | Type / nullability / enum | Status | Decision |
|---|---|---|---|---|
| `slug` | path param | enum of 4 | **Match** | Validate. |
| `trainingName` | `record-config` has no name | — | **Derived** | Use the static `PILAR_NAMES` map, or fetch `TrainingPrep.module.name` if the BE name must be authoritative. |
| `eyebrow` | — | — | **FE-only** | “MULAI LATIHAN”. |
| `countdownSec` | — | — | **FE-only** | 3 s UI countdown. |
| `targetDurationSec` | `recommendedDurationSeconds` / `maxDurationSeconds` | `number \| null` / `number` | **Mismatch** | `recommendedDurationSeconds ?? maxDurationSeconds`; auto-stop at `maxDurationSeconds`. |
| `camera` | — | — | **FE-only** | Browser `enumerateDevices` + `getSettings`; never sent to the BE (README §6.3). |
| `maxBytes` | `maxBytes` | `number` (int) | **Match** | Client-side pre-upload check; re-check server-side. |
| `acceptedMimeTypes` | `acceptedMimeTypes` | `string[]` | **Match** | Pick the first `MediaRecorder.isTypeSupported()` value; show a clear error if none. |
| `maxDurationSeconds` | `maxDurationSeconds` | `number` (int) | **Match** | Hard stop; disable “Selesai” only at the limit (or auto-stop). |
| `retentionSeconds` | `retentionSeconds` | `86400` (optional, default) | **Match** | Show “Rekaman tersedia 24 jam” on the review page. |
| `movementSlug` | `movementSlug` | enum of 4 | **Match** | Must equal the route slug. |
| `recommendedDurationSeconds` | same | `number \| null` | **Match** | Prefer over `maxDurationSeconds` for the visible target. |

### 3.4 Session review — `/latihan/[slug]/sesi/[sessionId]`

| FE need | BE field | Type / nullability / enum | Status | Decision |
|---|---|---|---|---|
| `id` | `id` | `string` | **Match** | Route key. |
| `slug` | `movementSlug` | enum of 4 | **Match** | If it differs from the route slug, `notFound()` or redirect to the correct slug. |
| `trainingName` | — | — | **Derived** | Static `PILAR_NAMES[movementSlug]`, or `TrainingPrep.module.name` if available. |
| `eyebrow` | — | — | **FE-only** | “ULASAN SESI”. |
| `durationSec` | `media.durationSeconds` | `number \| null` | **Mismatch (nullable)** | Fallback: `completedAt - startedAt` when both exist; else `null` → `"—"`. |
| `durationLabel` | same | — | **Derived** | `mm:ss`. |
| `recordedAtLabel` | `startedAt` / `createdAt` | ISO string \| null | **Mismatch (semantics)** | “Direkam” = `startedAt ?? createdAt`; “Diunggah” = `uploadedAt`; both formatted `id-ID`, `Asia/Jakarta`. |
| `fileSizeLabel` | `media.byteSize` | `number \| null` (bytes) | **Mismatch (format)** | Humanize (`18,2 MB`); `"—"` when null. |
| `camera.label` | — | — | **Missing in BE** | No camera label. Remove the “Kamera” row. |
| `camera.resolution` | `media.width` / `media.height` | `number \| null` | **Mismatch** | `"${width}×${height}"`; `"—"` if either is null. |
| `camera.fps` | — | — | **Missing in BE** | No FPS. Remove the “FPS” row; do not infer from the client device. |
| `videoStatus` | `media.status` | `"available" \| "expired" \| "deleted" \| "unavailable"` | **Mismatch (enum)** | Map to Indonesian status copy; only `available` renders a playable video. |
| `createdAt` | same | ISO string | **Match** | Technical; show in “Detail” if needed. |
| `uploadedAt` | same | ISO string \| null | **Match** | “Diunggah” row. |
| `startedAt` | same | ISO string \| null | **Match** | “Mulai” row. |
| `completedAt` | same | ISO string \| null | **Match** | “Selesai” row. |
| `processingStatus` | same | `"queued" \| "processing" \| "completed" \| "failed"` | **Match** | Drive the status card + poller. |
| `analysisStatus` | same | `string \| null` | **Mismatch (untyped)** | Do not assume the `EvaluationOut` enum; display a known mapping or the raw value. |
| `evaluationId` | same | `string \| null` | **Match** | Gate “Lihat Evaluasi”; fall back to `processingStatus === "completed"` if null. |
| `reviewStatus`, `reviewAvailable` | same | enum / boolean | **Match (out of scope)** | Coach review is not in this module; do not surface yet. |
| `retryOf` | same | `string \| null` | **Match** | Show “Perbaikan dari sesi …” when set. |
| `acknowledgedAt` | same | ISO string \| null | **Match** | Disable “Selesai dan Simpan” when set. |
| `error` | same | `SessionFailure \| null` | **Match** | Show `detail`; map known `code` values if enumerated. |
| `media.expiresAt` | same | ISO string \| null | **Match** | Show retention/expiry copy. |
| `media.mimeType` | same | `string \| null` | **Match** | “Format” row. |
| `media.playbackPath` | same | `string \| null` | **Match (semantics unclear)** | Prefer the authenticated BFF video route; do not use `playbackPath` directly unless it is a signed URL. |

### 3.5 Evaluation — `/latihan/[slug]/evaluasi/[sessionId]`

| FE need | BE field | Type / nullability / enum | Status | Decision |
|---|---|---|---|---|
| `slug` | `movementSlug` | enum of 4 | **Match** | Validate against the route. |
| `techniqueName` | — | — | **Derived** | `PILAR_NAMES[movementSlug]`; if the BE module name differs, use `TrainingPrep.module.name`. |
| `evaluatedAtLabel` | `evaluatedAt` | ISO string | **Match** | `id-ID`, `Asia/Jakarta`, e.g. `28 Sep 2026, 16.45 WIB`. |
| `validReps`, `deviatedReps` | `validRepetitions`, `deviatedRepetitions` | `null` (always) | **Missing in BE (unavailable)** | `Capability.repetitionCountingAvailable` is `false`. Remove the two repetition badges; show “Penghitungan repetisi segera hadir” inactive. |
| `qualityLabel` (“1080p@60FPS”) | — | — | **Missing in BE** | No quality label or FPS. Use `SessionOut.media.width/height/mimeType` for `"1080×1920 · video/webm"`; never invent FPS. |
| `score.value` | `score` | `number \| null`, schema 0..100 | **Mismatch (semantics)** | Label “Skor Kemiripan”; unit “poin”; no `%`. |
| `score.unit` | `scoreUnit` | `"similarity_points"` | **Mismatch** | Display “poin”, not “%”. |
| `score.targetPct`, `score.targetLabel` (“≥ 85%”) | — | — | **Missing in BE** | No pass target. Remove the target marker and delta until product confirms that the similarity scale is the pass scale. |
| `score.deltaLabel` | — | — | **Missing in BE** | Derived from the target, which does not exist; remove. |
| `score.alertLabel` | `analysisStatus` | enum of 4 | **Mismatch** | Map: `experimental` → “Eksperimental”, `reference_not_ready` → “Referensi belum siap”, `insufficient_pose` → “Pose tidak terdeteksi”, `insufficient_features` → “Fitur tidak cukup”. |
| `score.summary` | `scoreReason` + `unavailableReasons` + `issues` | `string \| null`, `string[]`, `AnalysisIssue[]` | **Derived** | Use the BE reason verbatim; otherwise a factual count of issues/measurements. No invented prose. |
| `postures[].id` | `measurements[].feature` | `string` | **Mismatch (not enum)** | Change the FE type from `PostureParamId` to `string`; do not force the 5 old IDs. |
| `postures[].name` | `measurements[].bodyPart` | `string` | **Mismatch (free string)** | Humanize separators/case; keep the BE wording. |
| `postures[].status` | `measurements[].assessment` | `"within_reference" \| "deviates" \| "not_assessed"` | **Mismatch (3 states)** | Add `"tidak-dinilai"`; map `within_reference` → `sesuai`, `deviates` → `perlu-koreksi`, `not_assessed` → `tidak-dinilai`. |
| `postures[].statusLabel` | same | — | **Derived** | “SESUAI” / “PERLU KOREKSI” / “TIDAK DINILAI”. |
| `postures[].reading` | `value`, `unit`, `referenceMedian`, `referenceIqr`, `deviation` | `number \| null`, `"deg" \| "shoulder_width"` | **Derived** | `"142° → target 130–138°"` only when the reference fields exist; otherwise `"142°"` or `"—"`. |
| `postures[].detail` | `reason` | `string \| null` | **Derived** | `reason ?? "Tidak ada catatan dari analisis."` Do not write anatomical prose that the BE did not produce. |
| `postures[].correctionCue` | `issues[].feedback` | `string` | **Mismatch (separate array)** | Match by `feature` (preferred) or `bodyPart`; empty when no issue. |
| `postures[].thumbnailLabel` | `bodyPart` | `string` | **Derived** | Humanized body part. |
| `postures[].thumbnailSrc` | — | — | **Missing in BE** | No per-measurement image. Keep the “Pratinjau visual segera hadir” placeholder; `pose` gives one session keyframe, not per-issue images. |
| `videoStatus` | `SessionOut.media.status` | enum | **Match** | Same mapping as the session page. |
| `matchedVariant` | same | `string \| null` | **Match** | Show “Varian: …” when present. |
| `analysisStatus` | same | enum of 4 | **Match** | Show as a badge + explanation when the score is null. |
| `poseStatus` | same | `"detected" \| "not_detected"` | **Match** | If `not_detected`, explain why the score is unavailable. |
| `framesProcessed`, `validPoseFrames` | same | `number` | **Match** | Show “Kualitas pose: 84/90 frame valid” as an active stat. |
| `featuresCompared` | same | `number \| null` | **Match** | Show in a technical caption only. |
| `keyFrame` | same | `KeyFrame \| null` | **Match (unused)** | Optional: seek the video to `timeSeconds`; not required for this phase. |
| `issues[]` | same | `AnalysisIssue[]` | **Match** | Used for `correctionCue` and the issue count. |
| `unavailableReasons` | same | `string[]` | **Match** | Render in the empty state when `score === null`. |
| `method`, `analyzerVersion`, `featureVersion`, `referenceVersion` | same | strings | **Unused in BE** | Technical provenance; optional “Detail teknis” block. |

### 3.6 FE TODOs that point at non-existent endpoints

These comments must be deleted, not implemented:

| FE TODO | Reality |
|---|---|
| `GET /member/cameras` | No such endpoint. Cameras are browser hardware; use `enumerateDevices`. |
| `GET /member/sessions/:slug` | No such endpoint. Use `GET /member/sessions/{session_id}`. |
| `GET /member/evaluations/:slug` | No such endpoint. Use `GET /member/sessions/{session_id}/evaluation`. |
| `POST /member/evaluations/:slug/ack` | No such endpoint. Use `POST /member/sessions/{session_id}/acknowledge`. |
| `GET /member/evaluations/:slug/pose/:id` | No such endpoint. `GET /member/sessions/{session_id}/pose` returns one session keyframe. |

### 3.7 Cross-cutting audit

| Concern | Current FE | BE contract | Gap / decision |
|---|---|---|---|
| **Auth** | No training read uses a token; all are public dummy reads. | All 11 endpoints require `HTTPBearer`. | Every read/action/BFF route calls `getAccessToken()` and sends `Authorization: Bearer`. 401 on a read → `null`; 5xx/network → throw. |
| **Caching** | `'use cache'` + `cacheLife("minutes")` on every reader. | Per-user data. | **Forbidden** by README §9. Replace with React `cache()` + `cache: "no-store"`. |
| **Static params** | `generateStaticParams()` on all training leaves. | Session IDs are dynamic and user-specific. | Remove from all training routes. `[sessionId]` cannot be enumerated. |
| **Pagination** | None. | None in these endpoints. | No cursor/page handling. |
| **Dates** | Hardcoded strings (`"10 Okt 2026 • 09.41"`). | ISO 8601 UTC strings; `z.iso.datetime()`. | Format server-side with `Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta" })`; pass strings across the RSC boundary. |
| **Enums** | Local unions and free strings. | 4-value movement enum; status enums; free `bodyPart`/`feature`. | Use generated unions for movement/status; do not assume free strings are enumerated. |
| **Errors** | Fake toasts; no mapping. | `DomainErrorOut`; 413/415/416/409/410 are meaningful. | Normalize once; map 413/415/410/409 to specific Indonesian messages; log `requestId`. |
| **Upload** | Simulated interval; no file. | Multipart + `Idempotency-Key`; 202 `AcceptedSession`. | Implement real `MediaRecorder` + upload; transport is decided by the B2 spike (§11). |
| **Video** | Empty `<video>`. | Authenticated binary, Range 200/206. | Same-origin BFF stream route; cannot use `<video src={BE URL}>` with Bearer. |
| **CORS** | Server-side only today. | `OPTIONS` on `/member/sessions` returns `Access-Control-Allow-Origin` echoing the origin, `Allow-Credentials: true`, and allows `Authorization`, `Idempotency-Key`, `Range` (verified 2026-11-04). | Only relevant if direct browser→BE upload is chosen; the HttpOnly token still blocks it. |
| **Rate limit** | No handling. | `429 DomainErrorOut`. | No auto-retry; show “Terlalu banyak percobaan”. |
| **Idempotency** | None. | Header required 1–128 chars on upload and retry. | `crypto.randomUUID()` per attempt; reuse across network retries of the same blob; new key for a new recording. |
| **`Idempotency-Key` TTL** | — | Not documented. | Open question; assume the BE dedupes for a reasonable window. |
| **Media retention** | None. | `retentionSeconds: 86400`; `media.status` can be `expired`. | Show “Rekaman tersedia 24 jam”; handle `expired`/`deleted` gracefully. |
| **Camera provenance** | Fake `CameraDevice` from server. | None; `MediaOut` has width/height only. | Client-only; remove camera label/FPS rows. |
| **Score semantics** | “Akurasi %” with an 85% target. | 0–100 similarity points; no target. | Relabel “Skor Kemiripan (poin)”; remove target/delta until product confirms. |
| **Repetitions** | 12 valid / 3 deviated. | Always `null`; `repetitionCountingAvailable: false`. | Inactive “Segera hadir”; do not fabricate. |
| **Coach review** | Not shown. | `reviewStatus`/`reviewAvailable` on `SessionOut`. | Out of scope; do not surface in this module. |
| **Localization** | Mixed hardcoded Indonesian. | BE strings may be English/Indonesian. | Keep UI labels Indonesian; render BE `text`/`feedback`/`reason` verbatim. |

---

## 4. Decisions

### D1 — Move session routes to `[sessionId]` path segments

**Decision:** `/latihan/[slug]/sesi` → `/latihan/[slug]/sesi/[sessionId]`; `/latihan/[slug]/evaluasi` → `/latihan/[slug]/evaluasi/[sessionId]`.

**Why:** the BE has no slug-keyed session endpoint; `sessionId` is returned by upload and is the only key for status/evaluation/video/acknowledge/retry. A path segment survives refresh, deep links, and the router cache; a query parameter would force dynamic `searchParams` access and is easier to lose.

**Consequence:** delete the old route files and layouts; update `SesiActions`, `RekamSelesaiCta`, `EvaluasiActions`, and the shell tests. `[sessionId]` is opaque; only non-empty validation is possible client-side.

**BE change:** none.

### D2 — Record on `/rekam`, upload there, then navigate to `/sesi/[sessionId]`

**Decision:** `/rekam` owns the `MediaRecorder` lifecycle and the upload. On a successful `202`, `router.push()` to `/latihan/[slug]/sesi/[sessionId]`. `/sesi/[sessionId]` is a read-only status/review page.

**Why:** the blob lives in browser memory and cannot cross a server-component boundary. Keeping it on `/rekam` until upload avoids a fragile global blob store or `sessionStorage` handoff. The upload response supplies the session ID, so the next route is stable and refresh-safe.

**Consequence:** move the upload card from `SesiActions` to a new `RecordingControls`; `SesiActions` becomes `SessionActions` (delete/retry/evaluate). The old “Selesai” link is replaced by stop → preview → “Gunakan Rekaman” → upload progress.

**BE change:** none.

### D3 — Binary transport uses same-origin BFF route handlers (architecture exception)

**Decision:** add two transport-only route handlers:

- `POST /api/member/sessions` — multipart upload proxy.
- `GET /api/member/sessions/[sessionId]/video` — authenticated video stream proxy with Range forwarding.

**Why:** `<video src>` cannot attach a Bearer header, and XHR upload progress requires a browser-visible endpoint. Server Actions cannot report progress and default to a 1 MB body limit (`serverActions.bodySizeLimit`). These routes forward bytes and auth only: no business logic, no data shaping, no shared caching.

**Consequence:** this is an explicit exception to README §2 (“`app/api/` is for external clients only”). It is justified as a BFF transport seam, not a page-data path. Page reads stay in `features/member/data/` and RSC. If the team rejects the exception, the alternative is a BE-issued short-lived upload token + signed video URL (BE change).

**BE change:** none for the proxy itself; see D4 for the upload limit.

### D4 — Upload transport: B2 rejected, BFF interim, pre-signed requested

**Decision (spike complete 2026-11-04):** the same-origin `proxy.ts` rewrite (B2) buffers the whole body, defaults to a 10 MB cap, and truncates over the cap into a `500` socket hang-up. It is not a streaming transport. Use option B (BFF route handler) with a `Content-Length` guard as the interim, and request a BE pre-signed upload (D) for production. Details and measurements: §11.

**Why:** the access token is HttpOnly on the FE origin, so browser JS cannot call the BE with `Authorization`. The BE does allow CORS (`Authorization`, `Idempotency-Key`, `Range`), but that does not solve the missing credential. A same-origin BFF proxy works functionally, but a Vercel-style serverless host caps request bodies at ~4.5 MB, which a normal 60 s video exceeds. Server Actions have the same platform cap plus a 1 MB default.

**Options:**

| Option | Auth | Progress | Size limit | Verdict |
|---|---|---|---|---|
| A. Browser → BE direct | Needs a short-lived upload token or signed URL; HttpOnly token is unreadable | Native XHR | BE `maxBytes` | **Requires BE change**; best long-term. |
| B. Browser → FE route handler → BE | Works today | Native XHR | Platform request-body cap (~4.5 MB on Vercel) | **Interim only** if recordings fit; otherwise fails. |
| B2. Browser → same-origin rewrite → BE, `proxy.ts` injects `Authorization` | Works today | Native XHR | Buffers the body; 10 MB default cap; truncates to `500` | **Rejected by the 2026-11-04 spike** (§11.2). |
| C. Browser → Server Action → BE | Works today | None (indeterminate only) | 1 MB default + platform cap | **Rejected.** |
| D. Browser → pre-signed object storage → BE registers key | BE-issued signed URL | Native XHR | Object storage | **Recommended production design**; requires BE change. |

**Consequence:** the rest of the module (catalog, prep, session status, evaluation, acknowledge, delete) ships independently. Upload is gated on the B2 spike outcome.

**BE change:** add one of: a pre-signed upload endpoint, a short-lived upload token, or an object-key registration flow. Also document the `Idempotency-Key` TTL and reuse semantics.

### D5 — Similarity points are not accuracy percentages

**Decision:** rename the evaluation score UI from “Akurasi Kinematika” to “Skor Kemiripan”. Render `score` as a 0–100 number with the unit “poin” and a 100-max bar. Remove the 85% target marker, target label, delta, and pass/fail alert.

**Why:** `scoreUnit` is `"similarity_points"`, and the contract exposes no target or pass threshold. Calling it “Akurasi %” and comparing it to 85% is a semantic lie even if the number is 0–100. `analysisStatus` is the honest state signal.

**Consequence:** the score card becomes simpler; `KinematicScore` VM changes. If product wants the 85 threshold back, it must confirm that the similarity scale is the pass scale and own it as static policy copy; a BE `targetScore` is preferable.

**BE change (recommended):** document the score's meaning/range in the OpenAPI description and optionally expose `scoreMax`/`targetScore`.

### D6 — Repetition counts are unavailable

**Decision:** remove the “12 Repetisi Sah / 3 Terdeviasi” badges from `EvaluasiHeader`. Replace them with:

- Active: “Kualitas pose: {validPoseFrames}/{framesProcessed} frame valid”.
- Inactive: “Penghitungan repetisi — Segera hadir” (dashed/dimmed, per README §6).

**Why:** `validRepetitions` and `deviatedRepetitions` are always `null`, and `Capability.repetitionCountingAvailable` is `false`. The current dummy numbers are fabricated.

**BE change:** none (BE already signals unavailability). If the analyzer later counts repetitions, add non-null fields and a capability flag.

### D7 — Posture rows are dynamic, not a fixed five

**Decision:** map `EvaluationOut.measurements[]` 1:1 to posture rows. `id = measurement.feature`, `name = humanize(measurement.bodyPart)`, `status` from `assessment` (three states), `reading` from `value/unit/reference*`, `detail` from `reason`, `correctionCue` from the matching `AnalysisIssue.feedback`. Change `PostureAssessment.id` from `PostureParamId` to `string` and add the `"tidak-dinilai"` state.

**Why:** `Measurement.bodyPart` and `feature` are free strings; the analyzer decides how many measurements exist per movement. Forcing the old five IDs (bahu, siku-kanan, pinggul, lutut, pergelangan) would silently drop or mislabel data.

**Consequence:** `EvaluasiPostureList` must derive its count and sorting dynamically; `EvaluasiPostureItem` needs neutral styling for `not_assessed`; `EvaluasiPoseThumb` stays a placeholder because there is no per-measurement image.

**BE change (recommended):** enumerate `bodyPart`/`feature` values and document whether they are stable across analyzer versions. If per-posture thumbnails are required, add a per-issue keyframe/pose reference.

### D8 — Camera and device data stay client-side

**Decision:** delete `getCameras()` and the server `dummyCameras` list. `CameraExperience` and `RekamViewport` own `enumerateDevices`, `getUserMedia`, and the `localStorage` camera preference. `RecordConfig` supplies only the recording constraints.

**Why:** README §6.3: hardware settings are browser-session properties, not backend entity data. The BE has no camera endpoint and `MediaOut` has no camera label/fps.

**Consequence:** remove the “Kamera” and “FPS” rows from `SesiInfoCard`; show resolution/format from `MediaOut`. Keep the live quality badge from `getSettings()`.

**BE change:** none. If product requires camera provenance, the BE must add fields to `MediaOut`; do not infer them from the client after the fact.

### D9 — Request-time auth and caching only

**Decision:** remove `'use cache'` and `cacheLife("minutes")` from every training reader. Use React `cache()` for per-request memoization, `getAccessToken()`, `Authorization: Bearer`, `cache: "no-store"`, `throwOnError: false`. Remove `generateStaticParams()` from all training routes. Wrap async sections in `<Suspense>`.

**Why:** README §9 forbids `'use cache'` on authenticated reads; cookie/token access inside a cached scope either throws under Cache Components or leaks data across users. Session and evaluation pages are per-user and dynamic.

**Consequence:** each page streams its sections; the `AuthGate` in `app/(member)/layout.tsx` remains the authoritative role gate. No client-side TanStack query hooks for reads, because the generated query functions would call the BE from the browser without the HttpOnly token.

**BE change:** none.

### D10 — Poll processing with `router.refresh()`, not a client fetch

**Decision:** on `/sesi/[sessionId]`, a small client `<SessionStatusPoller active={processingStatus === "queued" || processingStatus === "processing"}>` calls `router.refresh()` every 3 seconds, stopping when the server-rendered status becomes terminal. No new API route, no token exposure, no TanStack query.

**Why:** the session status is RSC data; `router.refresh()` re-renders the same server tree with fresh `cache: "no-store"` data. A client `useQuery` would need a server action or BFF route just to attach the token, adding surface for no benefit. The poller only refreshes while processing; the video element is not mounted until media is available.

**Consequence:** cap polling (e.g. 5 minutes) and show a manual “Muat ulang” after the cap. If the user navigates away, polling stops with the component.

**BE change:** none, but confirm typical processing time and whether `GET /evaluation` is ready exactly at `processingStatus === "completed"` (open question).

### D11 — Honest UI for missing catalog/prep metrics

**Decision:** follow README §6 rather than inventing values:

- Catalog hero: `completedSessionCount` active; aggregate accuracy inactive (“Segera hadir”).
- Prep target accuracy: no numeric target; show capability status.
- Prep coach quote: repurpose as “Panduan Gerakan” from `guides[0]` or hide.
- Prep sensor checks: remove the fake lux/distance/joint counts; the live camera status is the real check.
- Recording: use `recommendedDurationSeconds`, `maxDurationSeconds`, `maxBytes`, `acceptedMimeTypes`, `retentionSeconds`.
- Session: show only `MediaOut` metadata; no camera label/FPS.
- Evaluation: similarity points, no target; repetition counts inactive; dynamic measurements.

**Why:** the alternative is fabricated telemetry, which the repo explicitly forbids.

**Consequence:** some Figma copy disappears or becomes dimmed. Each removed metric gets a “Segera hadir” badge where the layout expects a value.

**BE change:** only if product insists on a specific metric (target score, coach quote, camera provenance, per-posture image). Each would be a new BE field, not an FE guess.

### D12 — Date/time and number formatting live in the mapper

**Decision:** add `features/member/data/format.ts` with:

- `formatDateTimeId(iso: string | null): string | null` — `Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" })`, output with `WIB`.
- `formatDateId`, `formatDuration(seconds)`, `formatBytes(bytes)`, `formatMinutes(seconds)`.

**Why:** BE dates are ISO 8601 UTC; the current dummy strings are hand-written and inconsistent (`"10 Okt 2026 • 09.41"`, `"28 Sep 2026, 16:45 WIB"`). Formatting in the server mapper avoids Node/browser locale drift and keeps client props serializable.

**Consequence:** no `Date` objects cross the RSC boundary; client components receive strings. If a client-only timestamp must be formatted (e.g. upload started at), use the same helper in the client bundle.

**BE change:** none.

### D13 — Idempotency keys are per logical attempt

**Decision:** generate `crypto.randomUUID()` when a recording is confirmed for upload. Reuse the same key if the request fails at the network layer and the user taps “Coba lagi” for the same blob. Generate a new key for a new recording, and for each follow-up retry request. Send it as `Idempotency-Key` on both upload and follow-ups.

**Why:** the BE requires the header (1–128 chars) and likely dedupes retries. A new key on every retry of the same blob risks duplicate sessions; reusing a key with a different blob risks returning the wrong session.

**Consequence:** keep the key in a `useRef` alongside the blob; clear both on “Rekam Ulang” or successful navigation. If the BE returns `409`, treat it as “already submitted” and fetch the existing session if the response identifies it; otherwise show a clear error (open question).

**BE change:** document the dedupe window and the response when a key is reused with a different body.

### D14 — Server actions return `ActionResult`, BFF routes return JSON errors

**Decision:** all mutations (`acknowledge`, `delete`, `retry`) are server actions with Zod at the boundary, returning `ActionResult<T>`. The upload/video BFF routes forward BE errors as JSON (`DomainErrorOut` shape) for the upload, and as status + text for the video. `normalizeApiError` is the single mapper.

**Why:** README §4/§5. Client components must not throw domain errors across the boundary; the upload XHR needs a parseable error body.

**Consequence:** map `413` → “Ukuran rekaman melebihi batas”, `415` → “Format video tidak didukung”, `410` → “Rekaman telah kedaluwarsa”, `409` → context-specific, `429` → “Terlalu banyak percobaan”. Log `requestId` on unexpected failures.

**BE change:** none.

### D15 — Retry opens a fresh recording

**Decision (approved 2026-11-04):** “Ulangi” calls `POST /follow-ups` (`{ intent: "retry" }`) to register the retry intent, then routes to `/latihan/[slug]/rekam?retryOf={sourceSessionId}` instead of expecting the follow-up to contain a video. The new recording is uploaded with `retryOf: sourceSessionId` on `POST /sessions`.

**Why:** `RetryOut` contains only `id`, `sourceSessionId`, and `createdAt`; it exposes no media or evaluation, so it cannot be a finished retake. A fresh recording is the only flow the current contract supports end to end.

**Consequence:** `retrySessionAction` returns the follow-up id and the source session id; the `/rekam` page reads `retryOf` as an optional search param and passes it to the upload body. `SesiActions` no longer navigates straight to a session route. If the BE later confirms that a follow-up session accepts an attach/upload call, this decision can move to “navigate to the follow-up session”.

**Open detail (non-blocking):** whether the upload's `retryOf` expects `RetryOut.sourceSessionId` or `RetryOut.id`. Start with `sourceSessionId`; pin the choice in one mapper so it is a one-line change.

### D16 — Out of scope for this phase

- Coach review (`reviewStatus`, `reviewAvailable`, coach feedback).
- `/riwayat` session detail and history integration.
- Pose skeleton overlay and per-posture thumbnails (`GET /pose` is documented but not consumed).
- Frame-accurate scrubber, slow-motion, annotation overlays.
- Offline recording / background upload / resumable uploads.
- Notifications and follow-up task list (`/member/follow-up-tasks`).

**Why:** keeps the phase shippable and avoids the Phase-7 bloat pattern noted in the roadmap.

---

## 5. Target Architecture

```text
Browser
  │
  ├─ RSC: /latihan
  │    app/(member)/latihan/(list)/page.tsx
  │      └─ features/member/pages/latihan-page.tsx
  │           └─ <Suspense> → getTrainingCatalog()
  │                └─ React cache() + getAccessToken()
  │                     └─ modulesApiV1MemberTrainingModulesGet({ headers: Bearer, cache: "no-store" })
  │                          └─ GET /api/v1/member/training-modules → TrainingCatalog
  │                               └─ toTrainingCatalogViewModel()
  │
  ├─ RSC: /latihan/[slug]
  │    └─ getPersiapan(slug)
  │         └─ prepApiV1MemberTrainingPrepSlugGet → TrainingPrep
  │              └─ toPersiapanViewModel()
  │    └─ <CameraExperience> (client, real devices)
  │
  ├─ RSC: /latihan/[slug]/rekam
  │    └─ getRekam(slug)
  │         └─ recordConfigApiV1MemberRecordConfigSlugGet → UploadConfig
  │              └─ toRekamViewModel()
  │    └─ <RecordingControls> (client)
  │         ├─ MediaRecorder → Blob + duration + mimeType
  │         ├─ createRecordingSchema(config) validation
  │         └─ XHR POST /api/member/sessions
  │              └─ app/api/member/sessions/route.ts
  │                   ├─ getAccessToken()
  │                   ├─ client.post({ body: FormData, headers: { Authorization, Idempotency-Key } })
  │                   └─ zAcceptedSession.parse(data)
  │         └─ router.push(`/latihan/${slug}/sesi/${sessionId}`)
  │
  ├─ RSC: /latihan/[slug]/sesi/[sessionId]
  │    └─ getSession(sessionId)
  │         └─ sessionStatusApiV1MemberSessionsSessionIdGet → SessionOut
  │              └─ toSessionViewModel()
  │    ├─ <SessionStatusPoller> (client) → router.refresh() while queued/processing
  │    ├─ <video src="/api/member/sessions/[id]/video">
  │    │    └─ app/api/.../video/route.ts
  │    │         ├─ getAccessToken()
  │    │         └─ client.get({ parseAs: "stream", headers: { Range } })
  │    │              └─ GET /api/v1/member/sessions/{id}/video → 200/206
  │    └─ <SessionActions> → server actions (delete / retry)
  │
  ├─ RSC: /latihan/[slug]/evaluasi/[sessionId]
  │    ├─ getEvaluation(sessionId) → EvaluationOut → toEvaluationViewModel()
  │    └─ getSession(sessionId) → SessionOut (media metadata, in parallel)
  │    ├─ <video src="/api/member/sessions/[id]/video">
  │    └─ <EvaluasiActions> → acknowledge server action
  │
  └─ Mutations
       ├─ acknowledgeSessionAction({ sessionId })
       ├─ deleteSessionAction({ sessionId })
       └─ retrySessionAction({ sessionId })
            └─ Zod → generated SDK → normalizeApiError → ActionResult<T>
                 └─ revalidatePath("/latihan", `/latihan/${slug}/sesi/${id}`) + router.refresh()
```

### 5.1 Route tree after integration

```text
app/(member)/latihan/
├─ layout.tsx
├─ (list)/
│  ├─ layout.tsx
│  └─ page.tsx
└─ [slug]/
   ├─ layout.tsx
   ├─ (persiapan)/
   │  ├─ layout.tsx
   │  └─ page.tsx
   ├─ rekam/
   │  ├─ layout.tsx
   │  └─ page.tsx
   ├─ sesi/
   │  └─ [sessionId]/
   │     ├─ layout.tsx
   │     └─ page.tsx
   └─ evaluasi/
      └─ [sessionId]/
         ├─ layout.tsx
         └─ page.tsx
```

`app/api/member/sessions/route.ts` and `app/api/member/sessions/[sessionId]/video/route.ts` sit outside the member layout; they authenticate via `getAccessToken()` and return `401` when absent.

---

## 6. Route Changes

| Current | New | Action |
|---|---|---|
| `app/(member)/latihan/[slug]/sesi/page.tsx` | `app/(member)/latihan/[slug]/sesi/[sessionId]/page.tsx` | Move + adapt `params` to `{ slug, sessionId }`. |
| `app/(member)/latihan/[slug]/sesi/layout.tsx` | `app/(member)/latihan/[slug]/sesi/[sessionId]/layout.tsx` | Move; keep trail “Ulasan Sesi”. |
| `app/(member)/latihan/[slug]/evaluasi/page.tsx` | `app/(member)/latihan/[slug]/evaluasi/[sessionId]/page.tsx` | Move + adapt `params`. |
| `app/(member)/latihan/[slug]/evaluasi/layout.tsx` | `app/(member)/latihan/[slug]/evaluasi/[sessionId]/layout.tsx` | Move; keep trail “Evaluasi”. |
| `app/(member)/latihan/[slug]/(persiapan)/page.tsx` | same | Remove `generateStaticParams()`. |
| `app/(member)/latihan/[slug]/rekam/page.tsx` | same | Remove `generateStaticParams()`. |
| — | `app/api/member/sessions/route.ts` | New upload BFF. |
| — | `app/api/member/sessions/[sessionId]/video/route.ts` | New video BFF. |

No redirects are needed: the old session/evaluation URLs have no meaning without a session ID, and they were never public.

---

## 7. FE File Changes

### 7.1 New files

| Path | Purpose |
|---|---|
| `features/member/data/training-mapper.ts` | Pure mappers: `toTrainingCatalogViewModel`, `toTrainingModuleViewModel`, `toPersiapanViewModel`, `toRekamViewModel`. |
| `features/member/data/session-mapper.ts` | Pure mappers: `toSessionViewModel`, `toEvaluationViewModel`, `toPostureAssessmentViewModel`, `toScoreViewModel`. |
| `features/member/data/format.ts` | `formatDateTimeId`, `formatDateId`, `formatDuration`, `formatBytes`, `formatMinutes`. |
| `features/member/data/upload-session.ts` | Server-only: build `FormData`, call `client.post`, validate `zAcceptedSession`, normalize errors. |
| `features/member/data/get-session-video.ts` | Server-only: `client.get({ parseAs: "stream" })`, forward status/headers/Range. |
| `features/member/actions/acknowledge-session.ts` | `"use server"` + Zod + `acknowledgeSessionApiV1MemberSessionsSessionIdAcknowledgePost`. |
| `features/member/actions/delete-session.ts` | `"use server"` + Zod + `removeSessionApiV1MemberSessionsSessionIdDelete`. |
| `features/member/actions/retry-session.ts` | `"use server"` + Zod + `retryApiV1MemberSessionsSessionIdFollowUpsPost`. |
| `features/member/schemas/recording.ts` | `movementSlugSchema` from `zTrainingModule.shape.slug`; `createRecordingSchema(config)`; `sessionIdSchema`; `idempotencyKeySchema`. |
| `features/member/hooks/use-media-recorder.ts` | Client hook: `start`, `stop`, countdown, max-duration auto-stop, MIME selection, blob + duration. |
| `features/member/components/recording-controls.tsx` | Client: record/stop/preview/upload, progress, errors. Replaces `rekam-selesai-cta.tsx`. |
| `features/member/components/upload-progress.tsx` | Client: attachment card + progress + retry. Extracted from the old `sesi-actions.tsx`. |
| `features/member/components/session-status-poller.tsx` | Client: `router.refresh()` while processing, capped. |
| `features/member/components/session-actions.tsx` | Client: delete, retry analysis, retake, view evaluation. Replaces `sesi-actions.tsx`. |
| `app/api/member/sessions/route.ts` | Upload BFF: auth, size/MIME guard, forward multipart, return `AcceptedSession` JSON. |
| `app/api/member/sessions/[sessionId]/video/route.ts` | Video BFF: auth, forward `Range`, stream `200/206`. |
| `tests/unit/member/training-mapper.test.ts` | Catalog/prep/record-config mapping, nullability, enums, formatting. |
| `tests/unit/member/session-mapper.test.ts` | Session/evaluation mapping, score nullability, 3-state assessments, dates. |
| `tests/unit/member/training-actions.test.ts` | Ack/delete/retry payload parsing, error mapping, idempotency. |
| `tests/unit/member/training-schemas.test.ts` | Recording schema boundaries (size, MIME, duration), slug enum. |
| `tests/unit/member/upload-route.test.ts` | BFF auth, 413/415 mapping, FormData forwarding, idempotency header. |
| `tests/unit/member/video-route.test.ts` | BFF auth, Range forwarding, 206 headers, no-store. |

### 7.2 Modified files

| Path | Changes |
|---|---|
| `features/member/types.ts` | Replace dummy VMs with the shapes in §7.4; add `PostureStatus = "sesuai" \| "perlu-koreksi" \| "tidak-dinilai"`; `PostureAssessment.id: string`; remove `CameraDevice` from server VMs (keep as client type); remove `validReps`/`deviatedReps`; add `ActionResult<T>`. |
| `features/member/data/get-training-modules.ts` | Rewrite: `cache()`, token, `modulesApi...Get`, `toTrainingCatalogViewModel()`. |
| `features/member/data/get-persiapan.ts` | Rewrite: `cache()`, token, `prepApi...Get`, `toPersiapanViewModel()`; delete `getCameras()`. |
| `features/member/data/get-rekam.ts` | Rewrite: `cache()`, token, `recordConfigApi...Get`, `toRekamViewModel()`; return `null` on 404. |
| `features/member/data/get-sesi.ts` | Rename to `get-session.ts`; signature `getSession(sessionId: string)`; `sessionStatusApi...Get`; 404 → `null`. |
| `features/member/data/get-evaluasi.ts` | Rename to `get-evaluation.ts`; signature `getEvaluation(sessionId: string)`; `evaluationApi...Get`; 404 → `null`. |
| `features/member/pages/latihan-page.tsx` | One `getTrainingCatalog()` read; pass the VM to hero + list. |
| `features/member/pages/persiapan-page.tsx` | One `getPersiapan(slug)` read; no `getCameras`; pass VM sections. |
| `features/member/pages/rekam-page.tsx` | One `getRekam(slug)` read; pass config to `RecordingControls`. |
| `features/member/pages/sesi-page.tsx` | `{ slug, sessionId }`; one `getSession`; polling; video; actions. |
| `features/member/pages/evaluasi-page.tsx` | `{ slug, sessionId }`; parallel `getEvaluation` + `getSession`; real sections. |
| `features/member/components/latihan-hero.tsx` | Active sessions count; inactive accuracy slot; static badges. |
| `features/member/components/module-card.tsx` | Real labels; capability badge; optional per-module average. |
| `features/member/components/coach-instruction-card.tsx` | Repurpose as “Panduan Gerakan” from `guides[0]` + `source`; no coach identity. |
| `features/member/components/calibration-card.tsx` | Render `checklist`/`guides` as text lists; remove fake sensor states and “100% SIAP”. |
| `features/member/components/camera-experience.tsx` | Client-only camera list + `localStorage` preference; no server `cameras` prop. |
| `features/member/components/camera-source-card.tsx` | Handle empty/placeholder camera list; keep scan/select. |
| `features/member/components/rekam-viewport.tsx` | Real `MediaRecorder`, countdown, max-duration auto-stop, preview; no mount timer. |
| `features/member/components/rekam-selesai-cta.tsx` | Delete/replace with `recording-controls.tsx`. |
| `features/member/components/sesi-playback.tsx` | Real video via BFF; `media.status` states; no empty shell. |
| `features/member/components/sesi-info-card.tsx` | BE-only rows: Latihan, Durasi, Mulai, Diunggah, Ukuran, Resolusi, Format. Remove Kamera/FPS. |
| `features/member/components/sesi-actions.tsx` | Delete/replace with `session-actions.tsx`. |
| `features/member/components/evaluasi-header.tsx` | Remove repetition badges; show pose-quality + inactive repetition note. |
| `features/member/components/evaluasi-score-card.tsx` | Similarity points, 0–100 bar, no target/delta; null/status state. |
| `features/member/components/evaluasi-playback.tsx` | Real video; media metadata badge; keep scrubber shell/TODO. |
| `features/member/components/evaluasi-posture-list.tsx` | Dynamic count/description; 3-state sort; no hardcoded “5 parameter … pukulan lurus”. |
| `features/member/components/evaluasi-posture-item.tsx` | Neutral styling for `tidak-dinilai`; cue only when present. |
| `features/member/components/evaluasi-actions.tsx` | Wire acknowledge action; retake link; remove dead `<span>`. |
| `features/member/components/evaluasi-pose-thumb.tsx` | Keep placeholder; note `GET /pose` is one session keyframe, not per-measurement. |
| `features/member/components/persiapan-cta.tsx` | Keep link; optionally show capability badge. |
| `app/(member)/latihan/[slug]/(persiapan)/page.tsx` | Remove `generateStaticParams()`. |
| `app/(member)/latihan/[slug]/rekam/page.tsx` | Remove `generateStaticParams()`. |
| `tests/unit/member/*-shell.test.ts` | Update props/routes; remove simulated upload/empty-video assertions; assert inactive “Segera hadir” and real states. |

### 7.3 Deleted files

| Path | Reason |
|---|---|
| `features/member/data/member-training-dummy.ts` | Replaced by mapper from `TrainingCatalog`. |
| `features/member/data/persiapan-dummy.ts` | Replaced by `TrainingPrep` + client camera state. |
| `features/member/data/rekam-dummy.ts` | Replaced by `UploadConfig`. |
| `features/member/data/sesi-dummy.ts` | Replaced by `SessionOut`. |
| `features/member/data/evaluasi-dummy.ts` | Replaced by `EvaluationOut`. |
| `tests/unit/member/training-data.test.ts` | Dummy-literal assertions replaced by mapper tests. |
| `tests/unit/member/persiapan-data.test.ts` | Ditto. |
| `tests/unit/member/rekam-data.test.ts` | Ditto. |
| `tests/unit/member/sesi-data.test.ts` | Ditto. |
| `tests/unit/member/evaluasi-data.test.ts` | Ditto. |

### 7.4 Proposed ViewModel shapes

These are FE-only; the generated DTOs remain the wire types.

```ts
export type TrainingModuleSlug = "kuda-kuda" | "pukulan" | "tangkisan" | "tendangan";

export interface TrainingCatalogViewModel {
  hero: {
    badges: string[];
    title: string;
    subtitle: string;
    completedSessionsLabel: string;
    scoredSessionsLabel: string;
    accuracy: { available: false; label: "Segera hadir" };
  };
  modules: TrainingModuleViewModel[];
}

export interface TrainingModuleViewModel {
  slug: TrainingModuleSlug;
  order: number;
  orderLabel: string;
  name: string;
  levelLabel: string;
  description: string;
  estimateLabel?: string;
  scoringAvailable: boolean;
  scoringReason?: "reference_not_ready";
  similarity?: { averageScore: number; sampleCount: number };
}

export interface GuideItemViewModel {
  id: string;
  text: string;
  source: string;
}

export interface PersiapanViewModel {
  slug: TrainingModuleSlug;
  eyebrow: string;
  title: string;
  description: string;
  levelLabel: string;
  estimatedDurationLabel?: string;
  capability: {
    scoringAvailable: boolean;
    reason: "reference_not_ready" | null;
    method: "static-reference-pose";
    referenceVersions: string[];
  };
  checklist: GuideItemViewModel[];
  guides: GuideItemViewModel[];
}

export interface RekamViewModel {
  slug: TrainingModuleSlug;
  trainingName: string;
  eyebrow: string;
  countdownSec: number;
  targetDurationSec: number;
  maxDurationSec: number;
  maxBytes: number;
  acceptedMimeTypes: string[];
  retentionSeconds: number;
  scoringAvailable: boolean;
}

export interface SessionViewModel {
  id: string;
  slug: TrainingModuleSlug;
  trainingName: string;
  eyebrow: string;
  processingStatus: "queued" | "processing" | "completed" | "failed";
  processingLabel: string;
  analysisStatus: string | null;
  analysisStatusLabel: string | null;
  evaluationId: string | null;
  canViewEvaluation: boolean;
  canRetryAnalysis: boolean;
  startedAtLabel: string | null;
  uploadedAtLabel: string | null;
  completedAtLabel: string | null;
  durationSec: number | null;
  durationLabel: string;
  byteSize: number | null;
  fileSizeLabel: string;
  resolutionLabel: string;
  formatLabel: string;
  mediaStatus: "available" | "expired" | "deleted" | "unavailable";
  mediaStatusLabel: string;
  mediaExpiresAtLabel: string | null;
  error: { code: string; detail: string } | null;
  acknowledgedAtLabel: string | null;
  retryOf: string | null;
}

export type PostureStatus = "sesuai" | "perlu-koreksi" | "tidak-dinilai";

export interface PostureAssessmentViewModel {
  id: string;
  name: string;
  status: PostureStatus;
  statusLabel: string;
  reading: string;
  detail: string;
  correctionCue: string;
  thumbnailLabel: string;
  thumbnailSrc: null;
}

export interface EvaluationScoreViewModel {
  available: boolean;
  value: number | null;
  unitLabel: "poin";
  max: 100;
  status:
    | "experimental"
    | "reference_not_ready"
    | "insufficient_pose"
    | "insufficient_features";
  statusLabel: string;
  reason: string | null;
  variantLabel: string | null;
  summary: string;
}

export interface EvaluationViewModel {
  id: string;
  sessionId: string;
  slug: TrainingModuleSlug;
  techniqueName: string;
  evaluatedAtLabel: string;
  framesProcessed: number;
  validPoseFrames: number;
  featuresCompared: number | null;
  poseStatus: "detected" | "not_detected";
  postureQualityLabel: string;
  repetitionCountingAvailable: false;
  score: EvaluationScoreViewModel;
  postures: PostureAssessmentViewModel[];
  unavailableReasons: string[];
  mediaStatus: "available" | "expired" | "deleted" | "unavailable";
  mediaMetaLabel: string;
}
```

---

## 8. Generated SDK / Query / Mutation Mapping

| BE endpoint | Generated SDK function | Generated TanStack artifact | Used where |
|---|---|---|---|
| `GET /member/training-modules` | `modulesApiV1MemberTrainingModulesGet` | `modulesApiV1MemberTrainingModulesGetOptions()` / `...QueryKey()` | RSC `getTrainingCatalog()`; no client hook. |
| `GET /member/training-prep/{slug}` | `prepApiV1MemberTrainingPrepSlugGet` | `prepApiV1MemberTrainingPrepSlugGetOptions()` / `...QueryKey()` | RSC `getPersiapan(slug)`. |
| `GET /member/record-config/{slug}` | `recordConfigApiV1MemberRecordConfigSlugGet` | `recordConfigApiV1MemberRecordConfigSlugGetOptions()` / `...QueryKey()` | RSC `getRekam(slug)`. |
| `POST /member/sessions` | `uploadSessionApiV1MemberSessionsPost` **do not call** | `uploadSessionApiV1MemberSessionsPostMutation()` **do not use** | BFF `client.post` with `FormData`; response validated with `zAcceptedSession`. |
| `GET /member/sessions/{id}` | `sessionStatusApiV1MemberSessionsSessionIdGet` | `sessionStatusApiV1MemberSessionsSessionIdGetOptions()` / `...QueryKey()` | RSC `getSession(id)`; client poll uses `router.refresh()`. |
| `DELETE /member/sessions/{id}` | `removeSessionApiV1MemberSessionsSessionIdDelete` | `removeSessionApiV1MemberSessionsSessionIdDeleteMutation()` | Server action `deleteSessionAction`. |
| `GET /member/sessions/{id}/evaluation` | `evaluationApiV1MemberSessionsSessionIdEvaluationGet` | `evaluationApiV1MemberSessionsSessionIdEvaluationGetOptions()` / `...QueryKey()` | RSC `getEvaluation(id)`. |
| `GET /member/sessions/{id}/pose` | `poseApiV1MemberSessionsSessionIdPoseGet` | `poseApiV1MemberSessionsSessionIdPoseGetOptions()` / `...QueryKey()` | Not consumed in this phase. |
| `GET /member/sessions/{id}/video` | `videoApiV1MemberSessionsSessionIdVideoGet` **do not call** | `videoApiV1MemberSessionsSessionIdVideoGetOptions()` **do not use** | BFF `client.get({ parseAs: "stream" })`; forward `Range`. |
| `POST /member/sessions/{id}/acknowledge` | `acknowledgeSessionApiV1MemberSessionsSessionIdAcknowledgePost` | `...Mutation()` | Server action `acknowledgeSessionAction`. |
| `POST /member/sessions/{id}/follow-ups` | `retryApiV1MemberSessionsSessionIdFollowUpsPost` | `...Mutation()` | Server action `retrySessionAction`. |

Why no client query hooks for reads: the generated query functions call the BE from the browser, where the HttpOnly access token is unavailable. Reads stay in RSC/server actions; mutations are server actions. This matches README §10 (“Do not call the generated `useMutation` hook for cookie-writing or token-dependent flows directly from the browser”).

If a future client cache is needed, use the generated query keys for invalidation only, and route every `queryFn` through a server action or BFF endpoint.

---

## 9. Zod Strategy

### 9.1 Wire validators (generated)

The SDK validates responses for endpoints 1–3, 5–8, 10–11 with the generated schemas (`zTrainingCatalog`, `zTrainingPrep`, `zUploadConfig`, `zSessionOut`, `zEvaluationOut`, `zPoseOut`, `zAcknowledgedOut`, `zRetryOut`). Do not re-declare these shapes.

For the two binary endpoints, validate manually:

```ts
import { zAcceptedSession } from "@/api/zod.gen";

const parsed = zAcceptedSession.safeParse(data);
if (!parsed.success) {
  return {
    ok: false,
    error: { message: "Respons server tidak dikenali", code: "SCHEMA_MISMATCH" },
  };
}
```

Do not use `zUploadSessionApiV1MemberSessionsPostBody` or `zVideoApiV1MemberSessionsSessionIdVideoGetResponse`; both are wrong for binary payloads.

### 9.2 Action payload validators

```ts
import { z } from "zod";
import { zRetryInput, zTrainingModule } from "@/api/zod.gen";

export const movementSlugSchema = zTrainingModule.shape.slug; // 4-value enum, no drift
export const sessionIdSchema = z.string().trim().min(1).max(128);
export const idempotencyKeySchema = z.string().min(1).max(128);
export const retryPayloadSchema = zRetryInput; // { intent: "retry" }
```

### 9.3 Recording validator

The limits come from `UploadConfig`; the schema is a factory so the BE remains the source of truth:

```ts
import { z } from "zod";

export function createRecordingSchema(config: {
  maxBytes: number;
  acceptedMimeTypes: string[];
  maxDurationSeconds: number;
}) {
  return z
    .object({
      file: z.instanceof(File),
      durationSec: z.number().positive(),
    })
    .superRefine(({ file, durationSec }, ctx) => {
      if (file.size > config.maxBytes) {
        ctx.addIssue({
          code: "custom",
          path: ["file"],
          message: `Ukuran maksimum ${formatBytes(config.maxBytes)}`,
        });
      }
      if (!config.acceptedMimeTypes.includes(file.type)) {
        ctx.addIssue({
          code: "custom",
          path: ["file"],
          message: "Format video tidak didukung",
        });
      }
      if (durationSec > config.maxDurationSeconds) {
        ctx.addIssue({
          code: "custom",
          path: ["durationSec"],
          message: `Durasi maksimum ${config.maxDurationSeconds} detik`,
        });
      }
    });
}
```

The BFF upload route must re-check `Content-Length`, the `video` part's `type`, and the `movementSlug` value. Client validation is never trusted.

### 9.4 Error validators

Parse BFF error bodies with `zDomainErrorOut` when the content type is JSON; otherwise fall back to `normalizeApiError`. Preserve `detail`, `code`, and `requestId`.

---

## 10. Auth, Caching, Polling, Error Handling

### 10.1 Reads

```ts
import "server-only";
import { cache } from "react";
import { modulesApiV1MemberTrainingModulesGet } from "@/api";
import { getAccessToken } from "@/features/auth/data/session";
import { toTrainingCatalogViewModel } from "./training-mapper";

export const getTrainingCatalog = cache(async () => {
  const token = await getAccessToken();
  if (!token) return null;

  const { data, error, response } = await modulesApiV1MemberTrainingModulesGet({
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    throwOnError: false,
  });

  if (response?.status === 401) return null;
  if (error || !data) {
    throw new Error(
      `Gagal mengambil katalog latihan (status: ${response?.status ?? "unknown"})`
    );
  }
  return toTrainingCatalogViewModel(data);
});
```

Apply the same pattern to prep, record config, session, and evaluation. Return `null` for `404` so the page can `notFound()`; throw for `5xx`/network so the error boundary shows a retry.

### 10.2 Mutations

```ts
"use server";
import "server-only";

export async function acknowledgeSessionAction(input: unknown): Promise<ActionResult<AcknowledgedOut>> {
  const parsed = z.object({ sessionId: sessionIdSchema }).safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  const token = await getAccessToken();
  if (!token) return { ok: false, error: { message: "Sesi berakhir. Silakan masuk kembali." } };

  const { data, error, response } = await acknowledgeSessionApiV1MemberSessionsSessionIdAcknowledgePost({
    path: { session_id: parsed.data.sessionId },
    headers: { Authorization: `Bearer ${token}` },
    throwOnError: false,
  });

  if (error || !data) return apiFailure(error, response);
  revalidatePath("/latihan");
  return { ok: true, data };
}
```

`apiFailure` uses `normalizeApiError` and logs `X-Request-Id`.

### 10.3 Polling

`SessionStatusPoller`:

```tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function SessionStatusPoller({ active }: { active: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => router.refresh(), 3000);
    return () => window.clearInterval(id);
  }, [active, router]);
  return null;
}
```

Add a max-duration guard (e.g. stop after 5 minutes) and a manual “Muat ulang” button.

### 10.4 Error mapping

| Status | User-facing message |
|---|---|
| `401` | Session expired → layout redirects; read returns `null`. |
| `403` | “Kamu tidak memiliki akses ke sesi ini.” |
| `404` | `notFound()` for pages; “Sesi tidak ditemukan.” for actions. |
| `409` | Context-specific: already acknowledged / retry conflict / duplicate upload. |
| `410` | “Rekaman telah kedaluwarsa.” |
| `413` | “Ukuran rekaman melebihi batas.” |
| `415` | “Format video tidak didukung.” |
| `416` | “Rentang video tidak valid.” |
| `422` | Field errors from `DomainErrorOut.errors` or FastAPI `detail[]`. |
| `429` | “Terlalu banyak percobaan. Coba lagi sebentar.” |
| `500/503` | “Layanan latihan sedang bermasalah.” + request ID. |
| Network | “Tidak dapat terhubung ke server.” |

---

## 11. Upload Transport (Decided Detail)

This section is the only part of the module that could not be resolved from the OpenAPI contract alone.

### 11.1 Facts

- The BE upload is `multipart/form-data` with `movementSlug`, `video`, optional `retryOf`, and a required `Idempotency-Key`.
- The BE CORS preflight allows `Authorization`, `Idempotency-Key`, and `Range` (verified 2026-11-04), so a direct browser call is *technically* possible if a browser-visible credential existed.
- The FE access token is HttpOnly (`ss_at`) and is only read server-side by `getAccessToken()`. Exposing it to JS would break the auth model.
- Next.js Server Actions default to a 1 MB body limit (`serverActions.bodySizeLimit`), and platform hosts may cap request bodies further (Vercel serverless functions: 4.5 MB).
- A normal 60 s 720p WebM/MP4 is well above 4.5 MB.

### 11.2 Spike result (2026-11-04)

B2 was measured with Next.js 16.3.8, a local echo server, and the proxy rewrite injecting `Authorization`:

| Test | Result |
|---|---|
| 8 MB multipart, default config | Full body forwarded (8,388,926 bytes), but only after the proxy had buffered it. |
| 5 MB at 512 KB/s, default config | Upstream received its first chunk at `0 ms` and all 5,243,198 bytes in `14 ms` — proof the proxy waits for the full body before opening the upstream request. |
| 20 MB, default config | `Request body exceeded 10MB ... Only the first 10MB will be available`, then `Failed to proxy ... socket hang up`; the client got `500`. |
| 20 MB, `proxyClientMaxBodySize: "30mb"` | Full body forwarded (20,971,839 bytes), still fully buffered (321 chunks in `46 ms`). |

**Conclusion:** `proxy.ts` clones and buffers the request body (`proxyClientMaxBodySize`, default **10 MB**). It does not stream, it truncates above the cap, and the upstream request dies with a socket hang-up instead of a clean `413`. Raising the cap only moves the memory ceiling; it does not remove buffering. B2 is **rejected as the production upload transport**.

### 11.3 Decision

1. **Interim: option B (BFF route handler) with a hard size guard.** Read `Content-Length` before consuming the body; return a `DomainErrorOut`-shaped `413` when it exceeds the floor of `UploadConfig.maxBytes` and the platform cap. Exclude `/api/member/sessions` from the `proxy.ts` matcher so the proxy does not buffer the body first — the matcher currently covers `/api/*`, which would double-buffer and cap the route at 10 MB before it runs. Use `runtime = "nodejs"` and a `maxDuration` sized for the upload.
2. **Production: ask the BE for a pre-signed upload flow** (option D): `POST /member/sessions/uploads` returns `{ uploadUrl, objectKey, expiresAt }`; the browser PUTs directly to object storage with progress; then `POST /member/sessions` registers `objectKey` + `movementSlug`. This keeps the token server-side, avoids both proxies, and gives real progress for any clip size.
3. **Do not use B2 for uploads**, even with a raised cap. It is acceptable only if a future measurement proves the deployment runs the rewrite at the edge *and* the BE `maxBytes` is below the buffer ceiling.

### 11.4 Remaining unknowns

- Production deployment target (Vercel vs self-hosted) and its actual request-body cap.
- Production `UploadConfig.maxBytes`; the UI must compare it to the deployment cap and show the tighter one.
- Whether the BE will ship a pre-signed flow in this phase.

### 11.5 What not to do

- Do not return the access token to the browser.
- Do not store the token in `localStorage`/`sessionStorage`.
- Do not upload via a Server Action and pretend the progress bar is real.
- Do not ship the current simulated fail-at-72% upload.
- Do not silently reduce the recording duration to fit the proxy without a product decision.

---

## 12. Formatting Rules

| Value | BE type | FE format |
|---|---|---|
| `estimatedDurationSeconds` | `number \| null` | `"10 Menit"` (round to minutes); omit when null. |
| `recommendedDurationSeconds` / `maxDurationSeconds` | `number` | `"60 detik"` / `"01:00"`; use `formatDuration`. |
| `media.durationSeconds` | `number \| null` | `"00:47"`. |
| `media.byteSize` | `number \| null` | `"18,2 MB"` (Indonesian decimal comma). |
| `media.width × height` | `number \| null` | `"1280×720"`; `"—"` when either is null. |
| `createdAt`, `uploadedAt`, `startedAt`, `completedAt`, `evaluatedAt`, `acknowledgedAt`, `expiresAt` | ISO 8601 string | `"10 Okt 2026, 09.41 WIB"`; `Asia/Jakarta`; `"—"` when null. |
| `score` | `number \| null` (0..100) | `"82 poin"`; `"—"` when null. |
| `value` + `unit` | `number \| null`, `"deg" \| "shoulder_width"` | `"142°"` / `"1,2× shoulder width"`. |
| `referenceMedian` / `referenceIqr` | `number \| null` | `"target 130–138°"` only when both sides exist; never invent a range. |
| `deviation` | `number \| null` | `"+8°"` / `"-0,15"` with the unit. |

All formatting happens in the mapper/format helper, not in components. Client components receive already-formatted strings.

---

## 13. Verification Plan

### 13.1 Automated gates (before `In Review`)

```bash
pnpm build
pnpm exec tsc --noEmit
pnpm lint
pnpm test
```

`pnpm gen:api` is not needed unless the BE contract changes; if it is run, `git diff src/api` must be empty.

### 13.2 Unit tests

- **Mappers:** null description/level/estimate; 0 sessions; multiple similarity groups; `recommendedDurationSeconds` null; `media.status` all four values; `processingStatus` all four; `score` null with each `analysisStatus`; `assessment` all three states; missing `AnalysisIssue`; date formatting in `Asia/Jakarta`; byte/duration formatting.
- **Schemas:** slug enum; recording size/MIME/duration boundaries; session ID empty/too long; idempotency key 1/128 chars.
- **Actions:** payload parsing; token missing; 401/403/404/409/410/413/415/422/429 mapping; `requestId` logging; `revalidatePath` called.
- **BFF routes:** upload auth, size/MIME guard, FormData forwarding, idempotency header, `202` JSON; video auth, `Range` forwarding, `206` headers, `Cache-Control: private, no-store`, 401/404/410.
- **Data reads:** 401 → `null`; 404 → `null`; 5xx/network → throw; `cache: "no-store"`; no `'use cache'`.

### 13.3 Browser checks (Playwright, fresh port)

1. `/latihan` authenticated: real module names/order/descriptions; session count; accuracy slot is dimmed with “Segera hadir”; no overflow at 390 px (`document.documentElement.scrollWidth <= window.innerWidth`).
2. `/latihan/kuda-kuda`: `checklist`/`guides` from BE; no fake “540 Lux / 2.48 m / 33 titik / 100% SIAP”; camera scan works; invalid slug 404.
3. `/latihan/kuda-kuda/rekam`: real camera preview; countdown; record/stop; preview; upload progress; success navigates to `/sesi/{id}`; simulate 413/415 and confirm the error message; simulate network failure and confirm the same idempotency key is reused.
4. `/latihan/kuda-kuda/sesi/{id}`: processing state polls; completed state shows video/metadata; expired/deleted/unavailable states show the correct copy; delete confirmation → 204 → redirect; retry analysis → new session route.
5. `/latihan/kuda-kuda/evaluasi/{id}`: similarity score/poin; null score shows reason + status; measurements render dynamically (including `not_assessed`); correction cues come from issues; acknowledge → toast → disabled state; retake link.
6. Video: seek in the `<video>` element, confirm `206` responses in the network panel; no token in the URL/HTML; no `Authorization` in client JS.
7. Hydration: no locale/timezone mismatch warnings; all dates show WIB.
8. Auth: signed-out access to each route redirects to `/sign-in?next=...`; a session belonging to another member returns 404 (BE ownership enforcement).

### 13.4 Manual API probes (optional)

With a real member token, verify:

- `GET /training-modules` → 4 modules + statistics.
- `GET /training-prep/kuda-kuda` → checklist/guides content.
- `GET /record-config/kuda-kuda` → actual `maxBytes`, `acceptedMimeTypes`, `maxDurationSeconds`.
- `POST /sessions` with a small file + UUID → `202`; repeat the same key → same `sessionId`.
- `GET /sessions/{id}` until `completed`; `GET /evaluation`; `POST /acknowledge`; `DELETE`.
- `GET /video` with and without `Range` → `206`/`200`.

Do not commit tokens or recordings.

---

## 14. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Upload proxy exceeds the platform body cap | **High** | B2 rejected (§11.2); use the guarded BFF route, exclude `/api/member/sessions` from the proxy matcher, and request a pre-signed BE flow. Do not fake progress. |
| Similarity score misrepresented as accuracy | **High** | D5: “Skor Kemiripan (poin)”; remove the 85% target until product/BE confirms the scale. |
| `bodyPart`/`feature` free strings break fixed UI assumptions | **Medium** | D7: dynamic rows; change `PostureAssessment.id` to `string`; add `tidak-dinilai`; unit-test unknown values. |
| Retry semantics unclear (`RetryOut` has no status/evaluation URLs) | **Medium** | Open question; do not navigate blindly. If `RetryOut.id` is a new session, route to `/sesi/{id}`; otherwise show a confirmation. |
| Processing never completes / evaluation 404 after `completed` | **Medium** | Poll cap + manual refresh; show `processingStatus` and `analysisStatus`; open question on readiness. |
| Browser `MediaRecorder` codec/MIME mismatch | **Medium** | Use `acceptedMimeTypes` + `MediaRecorder.isTypeSupported`; fall back to `video/webm`; show a clear unsupported-browser message. |
| Video proxy memory/CPU on large files | **Medium** | Stream with `parseAs: "stream"`; never buffer the whole blob; forward `Range`; test 206. |
| Idempotency TTL/reuse behavior undocumented | **Medium** | Reuse the key for the same blob; open question; handle 409. |
| `app/api` architecture exception rejected | **Medium** | Keep the routes transport-only; document the exception; fall back to BE signed URLs. |
| Old tests pin dummy literals/simulated upload | **Low** | Rewrite around mappers; treat as expected churn. |
| Date/locale hydration mismatch | **Low** | Format server-side with fixed `id-ID` + `Asia/Jakarta`; pass strings. |
| `playbackPath` is a signed URL vs a BE path | **Low** | Prefer the BFF video route; open question; never assume. |
| 401 vs 5xx on reads signs users out | **Low** | 401 → `null`; 5xx → throw; `AuthGate` remains authoritative. |
| Old `/sesi` and `/evaluasi` links in tests/docs | **Low** | Grep and update; no public links exist. |

---

## 15. Open Questions

All former blocking questions were resolved on 2026-11-04; residual unknowns are noted inline.

1. **Upload transport (decided 2026-11-04):** B2 rejected, BFF interim, pre-signed requested, per D4 and §11. Residual unknowns: the production deployment target and its request-body cap, the production `record-config.maxBytes`, and whether the BE will ship a pre-signed flow.
2. **Score semantics (decided 2026-11-04):** the UI ships “Skor Kemiripan” in points with no target, per D5. Residual unknowns: whether 100 is perfect similarity, whether a pass threshold exists, and whether product wants a normalized `%` later.
3. **Retry follow-up (decided 2026-11-04):** fresh recording flow per D15. Residual unknown: whether upload `retryOf` expects `RetryOut.sourceSessionId` or `RetryOut.id`.
4. **Acknowledge semantics:** what does `POST /acknowledge` change? Is it required for history? Can it be called when `score === null`? Is a second call `409` or idempotent `200`?
5. **Evaluation readiness:** is `GET /evaluation` guaranteed to return `200` exactly when `processingStatus === "completed"`, or is there a lag? What are typical processing times?
6. **`SessionOut.analysisStatus`:** it is `string | null`, not the `EvaluationOut` enum. What values can appear? Should the FE map only the known four and display the raw value otherwise?
7. **`measurements`/`issues` enums:** can the BE enumerate `bodyPart` and `feature`? Are they stable across analyzer versions? If per-posture thumbnails are required, can the BE add a per-issue keyframe/pose reference?
8. **`checklist` vs `guides`:** are they distinct? Can either be empty? Is `GuideItem.source` a citation, a coach name, or a URL?
9. **`acceptedMimeTypes`:** what values are actually accepted in production? Does the BE accept `video/webm` from Chrome, or only MP4/QuickTime?
10. **`media.playbackPath`:** is it a BE-relative path requiring `Authorization`, a signed URL, or a CDN URL? Can it be used directly by `<video>`?
11. **`retentionSeconds`:** always 86400? What happens to `SessionOut`/`EvaluationOut` after expiry — `media.status = expired` and the evaluation remains, or both disappear?
12. **`TrainingCatalog.statistics` scope:** all-time or current period? Does `completedSessionCount` include failed sessions? Does `scoredSessionCount` count only non-null scores?
13. **`TrainingModule.level`:** what values can appear? Should the FE localize them or render verbatim?
14. **`Capability.scoringAvailable`:** which modules are unavailable today? Should the “Mulai Latihan” CTA be disabled, or is practice still allowed with an inactive score?
15. **`SessionFailure.code`:** can the BE enumerate the codes so the FE can show localized messages instead of raw `detail`?
16. **`Idempotency-Key`:** what is the dedupe window? What happens on reuse with a different body — `409`, the original response, or a new session?
17. **`DELETE` semantics:** soft delete or hard delete? Does it delete the media and evaluation? Is a second delete `404` or `410`?
18. **`reviewStatus`/`reviewAvailable`:** should the member see coach review status in this module, or is it strictly coach-side? (Currently out of scope.)
19. **`Assessment` naming:** product uses “Perlu Koreksi”; the BE uses `deviates`. Confirm the Indonesian label for `not_assessed` (“Tidak Dinilai” vs “Belum Dinilai”).
20. **CORS production origin:** the preflight echoed `http://localhost:3000`; is the production FE origin allowed? (Only matters if direct upload is chosen.)

---

## 16. Approval Checklist

- [x] Scope confirmed: whole `/latihan` module, no `/riwayat` detail, no coach review. (2026-11-04)
- [x] D1 session-ID routes approved. (2026-11-04)
- [x] D2 upload-on-`/rekam` flow approved. (2026-11-04)
- [x] D3 `app/api` transport exception approved. (2026-11-04)
- [x] D4 upload transport decided: spike B2 first. (2026-11-04)
- [x] D5 similarity-points UI approved: points only, no 85% target. (2026-11-04)
- [x] D6 repetition counts inactive approved. (2026-11-04)
- [x] D7 dynamic posture rows approved. (2026-11-04)
- [x] D10 honest-UI removals approved (fake sensor checks, coach quote, aggregate accuracy). (2026-11-04)
- [x] D15 retry flow approved: fresh recording. (2026-11-04)
- [x] Open questions 1–3 answered. (2026-11-04)
- [x] Spec committed on `docs/training-integration-spec`.
- [ ] Linear parent + sub-issues created after this approval.
- [x] B2 upload spike complete: rejected (buffers, 10 MB cap, truncates to 500). BFF interim + pre-signed request. (2026-11-04)
