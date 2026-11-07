# Roadmap Template — SilatSense FE (Member closeout + Coach)

Mirror of the Linear Doc `[Roadmap] SilatSense FE — Member closeout + Coach`.
The Linear Doc is source of truth; this file keeps agents productive offline.
Sync both when phases change. Parent issue: PSR-69.

Phase 13 was the first backend-connected phase. Its spec and the reusable integration
conventions live in `docs/integration/`; later modules start from that guide.

## 0. Operating rules (linear-tracking, non-negotiable)

- Milestones are shippable phases (`[Phase N] Outcome`), 3–10 issues, 1–4 cycles. Max 2 open. Create just-in-time at phase start — never pre-create the roadmap.
- One parent (1–3 days, shippable) + subs (each <4h), max 1 level. Title `[area] Verb outcome`, ≤60 chars.
- Exactly one label (`feature|bug|chore|docs|spike`); `feature`/`bug` carry exactly one milestone. Assignee `me`.
- Description = 4-field header only (Goal / Scope+Out / Acceptance boxes / Links), ≤15 lines. Longer specs → Linear Doc linked under `Links:`.
- Close `[Phase 14] Profile integration` before opening Phase 15. Phase 7 shipped with 19 issues — do not repeat; split oversized phases.
- Backend-not-yet-built: dummy in `data/*-dummy.ts` (pure, no `server-only`), TODO names exact endpoint (`TODO (GET /path)`), DTOs in `types` + copied into spec, characterization test pins shape.
- Backend-connected (Phase 13+): generated `src/api` client is the only wire layer; specs live in `docs/integration/`; never hand-write a duplicate DTO.

## 1. Now / Next / Later

| Slot | Phase | Outcome |
|---|---|---|
| Done | 7 | Rekam/sesi/evaluasi shipped; phase closed |
| Done | 8 | `[Phase 8] Riwayat history` — shipped `/riwayat` + `/riwayat/[id]` before/after |
| Done | 9 | `[Phase 9] Member profile` — shipped `/profil` biodata + kamera + keamanan |
| Done | 10 | `[Phase 10] Coach foundation` — shipped `/coach` dashboard + `/coach/members` list + coach shell |
| Done | 11 | `[Phase 11] Coach detail` — shipped `/coach/members/[id]` + feedback mutation + riwayat log |
| Done | 12 | `[Phase 12] Coach member history` — shipped `/coach/members/[id]/riwayat` |
| Done | 13 | `[Phase 13] Auth integration` — real BE auth: generated client seam, session cookies, proxy refresh, role guards, sign-in/up, sign-out |
| Done | 14 | `[Phase 14] Profile integration` — real profile read/update, ViewModel mapper, honest stats, camera decoupling |
| Review | 15 | `[Phase 15] Training integration` — `/latihan` catalog, prep, record, session review, evaluation against the real BE; upload transport spike first. PR #33; BE storage is now `ok` and `POST /member/sessions` returns `503 direct_upload_required` in favor of `POST /member/uploads` + B2 `PUT` + `complete` (B2 bucket lacks browser CORS; queued sessions wait on BE worker) |

## 2. Phase table

| Phase | Outcome (demo criteria) | Figma | Spec | Issues guard |
|---|---|---|---|---|
| 8 | Riwayat list renders 4 stat cards + 4 movement cards (one expanded: 5 param chips, coach note, telemetry, dual CTA); detail before/after render coach profile, keputusan banner, kelayakan 80/85, 4 pillars, video HUD placeholder, posture list, 3 drills, action stack; no overflow 390px | 94:39587, 94:38951, 94:39232 | `docs/superpowers/specs/2026-*-member-riwayat-design.md` | 1 parent + 5–6 subs; split if >10 |
| 9 | Profile renders athlete card (avatar + sabuk + akurasi + 2 mini stats + logout), biodata form (3 fields, RHF+Zod), kamera select, keamanan card, Batal/Simpan with `toast.promise` stubs | 94:41585 | `docs/superpowers/specs/2026-*-member-profile-design.md` | 1 parent + 2–3 subs |
| 10 | Coach dashboard renders 4 stats + 5 athlete cards + 4 pillars + posture grid; members list renders 4 stats + search + 5 cards; coach shell (top + bottom nav, `laporan` tab) | 94:37791, 94:40178 | `docs/superpowers/specs/2026-*-coach-foundation-design.md` | 1 parent + 4–5 subs |
| 11 | Member detail renders profile + belt/attendance + aggregate score + 4 pillars + evaluasi terbaru (score + 4 tiles + skeletal placeholder + pills + 5 params) + feedback textarea + dual CTA + riwayat log 4 cards; feedback `useMutation` stub `(POST /coach/feedback)` | 94:40427 | `docs/superpowers/specs/2026-*-coach-detail-design.md` | 1 parent + 4–5 subs |
| 12 | Member history renders reused profile + Daftar Riwayat Sesi (count badge, 10 cards/page, tone dot + bare badge, range text, ?page= clamp); no overflow 390px | 94:40907 | docs/superpowers/specs/2026-10-19-coach-member-history-design.md | 1 parent + 3 subs |
| 13 | Real auth end-to-end: runtime client seam, HttpOnly session cookies, proxy refresh + role guards, NPM/email sign-in, email-only sign-up, sign-out; no tokens in JS storage; auth pages clean at 390px | — (existing auth shell) | docs/integration/authentication.md + docs/integration/README.md | 1 parent + 7 subs |
| 14 | Real profile read/update against the BE: ViewModel mapper, honest stats, server actions, camera decoupling | 94:41585 | `docs/integration/user-profile.md` | 1 parent + 4 subs |
| 15 | `/latihan` reads TrainingCatalog; prep + record-config from BE; a recording uploads and lands on `/latihan/[slug]/sesi/[sessionId]`; session/evaluation render real status, video, measurements; no fabricated metrics; 390px clean | — (Phase 5–7 frames) | `docs/integration/Training.md` | 1 parent + 8 subs |

## 3. Figma index (skim, 2026-10-11 — structure only, no pixel audit)

| # | Screen | Node | Route guess | Sections → components guess | DTO guess (`types` + endpoint TODO) |
|---|---|---|---|---|---|
| 1 | Riwayat list | 94:39587 `Riwayat Latihan Card` | `/riwayat` | Title + biomechanical desc; 4 stat cards (24 Sesi / akurasi IPSI≥85% / Kuda Kuda 12 sesi / 08j45m); 4 movement cards (kuda-kuda, pukulan expanded, tangkisan, tendangan); expanded = 5 param chips + coach-note banner + telemetry row + dual CTA | `HistorySummary { totalSessions: 24, avgAccuracy, dominantFocus, sensorHours }`, `HistoryEntry[]` (length 4: slug, dateLabel, pilar, summary, status `sesuai\|perlu-perbaikan`, score) — `TODO (GET /member/history)` |
| 2 | Riwayat detail before | 94:38951 `Before catatan` | `/riwayat/[id]` (state: before) | Coach profile (Kang Fauzan, Kepala UKM) + keputusan `Menunggu`; kelayakan card (80% vs 85%, 4 pillars, syarat/catatan accordions); video HUD placeholder; posture empty state (`Belum ada catatan`); 3 drills (Rib-Slide, Shadow Boxing, Pronasi Karet); action stack | `SessionDetail { coach, decision: "menunggu", score: 80, target: 85, pillars[4], drills[3] }` — `TODO (GET /member/history/:id)`; video shell placeholder, no src |
| 3 | Riwayat detail after | 94:39232 `After catatan` | `/riwayat/[id]` (state: after) | Same as #2 + keputusan `Lolos` banner + 5 posture items (3 sesuai + siku-kanan CRITICAL + pergelangan warning, each with catatan + koreksi box) + drill chevrons | Extends #2 with `postures[5]` (id, name, status, note, correction) — reuse evaluasi `PostureAssessment` wording `Perlu Koreksi` |
| 4 | Profile | 94:41585 `Profile - Member` | `/profil` | Athlete card (Aced Suryana, avatar + camera badge, peran/divisi, sabuk + target hijau, akurasi + delta pill, 48 sesi / 1.240 postur, logout); biodata form (nama, NIM 2307051, email student.unsil); kamera select (FaceTime HD); keamanan (ubah kata sandi); Batal/Simpan | `AthleteProfile { name, nim, email, belt, beltTarget, avgAccuracy, totalSessions: 48, totalPostures: 1240, cameraDevice }` — `TODO (GET /member/profile)` + `TODO (PATCH /member/profile)` + RHF+Zod schema |
| 5 | Coach dashboard | 94:37791 `Dashboard - Coach` | `/coach` | Eyebrow + heading + desc + CTA; 4 stats (5 Atlet / 84.6% / 2 Sesi antrean / Elevasi Siku +8cm); 5 athlete cards (avatar initials, name, pilar note, score, Lihat Detail); 4 pillars progress; posture 2×2 + alert banner; coach shell (KF avatar, `Dashboard` crumb, Dasbor/Member/Laporan nav) | `CoachOverview { totalAthletes: 5, teamAccuracy: 84.6, reviewQueue[2], topIssue, athletes[5], pillars[4] }` — `TODO (GET /coach/overview)` |
| 6 | Coach member list | 94:40178 `Member List - Coach` | `/coach/members` | Breadcrumb + count badge; 4 stats (5 Atlet 3 Siap/2 Remidiasi / 84.6% / 60% / 24 sesi); search input; 5 cards (avatar, name, stage pill, score + stage, movement note + status pill, Lihat Detail) | `TeamMember[]` (length 5: id, initials, name, stage `siap\|remidiasi\|lolos`, score, movementNote) — `TODO (GET /coach/members)` + client search filter (no backend) |
| 7 | Coach member detail | 94:40427 `Member detail - Coach` | `/coach/members/[id]` | Athlete header (badges, belt/attendance ×3, aggregate + 3 mini metrics); 4 pillars (pukulan = fokus); evaluasi terbaru (score + 4 tiles + skeletal placeholder + 4 pills + 5 params); feedback textarea + dual CTA; riwayat log 4 cards (#24 amber … #21 red) + more link | `CoachMemberDetail { athlete, pillars[4], latestEval, feedbackDraft, history[4] }` — `TODO (GET /coach/members/:id)` + `TODO (POST /coach/feedback)` |
| 8 | Coach member history | 94:40907 Daftar Riwayat sesi - Coach | /coach/members/[id]/riwayat | Reused athlete profile; header + 10/24 count badge + description; 24 static session cards (sesi #, date, Skor AI, tone dot, title, subtitle, repetisi + badge footer); range text + prev/pages/next pagination | MemberHistory { memberId, totalSessions: 24, pageSize: 10, sessions[24] HistoryPageSession { id, sesiLabel, dateLabel, title, subtitle, repetisiLabel, scorePct, badgeKey } } — TODO (GET /coach/members/[id]/history?page=N) |

Resolved 2026-10-11: the duplicate 8th link pointed at node 94:40427 — the intended pair is session detail without feedback (94:38951) vs with feedback (94:39232), both indexed above. Superseded 2026-10-19: Phase 12 added a genuine screen #8 — `94:40907` (coach member history, indexed above), so the "no 8th screen" note applies only to the 2026-10-11 skim. Coach §6 log cards deep-link into member `/riwayat/[id]`.

Training (Phase 15) reuses the Phase 5–7 frames already shipped; no new node in this index.

Phase 15 is in review (PR #33). Live verification on 2026-11-06 confirmed the real catalog (4 modules), prep, record config, camera capture, preview, and `/latihan/kuda-kuda/sesi/[sessionId]` live session read at 390px (`scrollWidth <= innerWidth`). `GET /health/ready` now reports `storage: ok` + `workerConfiguration: ok` (with intermittent `503 database: unavailable_or_unmigrated` under concurrent requests; `get-rekam.ts` and `get-evaluation.ts` now fetch sequentially to reduce DB spikes), and `POST /api/member/sessions` now executes the new 3-step `POST /api/v1/member/uploads` → Backblaze B2 `PUT` → `POST /api/v1/member/uploads/{upload_id}/complete` contract server-side (bypassing B2's `403 CORS is not enabled for this bucket` on browser preflights; uploaded sessions remain `queued` awaiting the BE worker).

## 4. Issue scaffolds (create JIT, titles ≤60 chars)

- Ph8 parent `[riwayat] Ship history screens` + subs `[riwayat] Add history DTOs+tests`, `[riwayat] Build history list UI`, `[riwayat] Build session detail UI`, `[riwayat] Wire riwayat routes+nav`, `[riwayat] Build coach-note+drills cards`.
- Ph9 parent `[profile] Ship profile screen` + subs `[profile] Add profile DTOs+tests`, `[profile] Build profile cards+form`, `[profile] Wire profil route+nav`.
- Ph10 parent `[coach] Ship coach foundation` + subs `[coach] Add coach DTOs+tests`, `[coach] Build coach dashboard UI`, `[coach] Build members list UI`, `[coach] Wire coach shell+routes`.
- Ph11 parent `[coach] Ship member detail` + subs `[coach] Add member-detail DTOs`, `[coach] Build detail eval UI`, `[coach] Build feedback form`, `[coach] Wire detail route+history`.
- Ph13 parent `[auth] Ship auth integration` (PSR-103) + subs `[auth] Add generated client runtime seam` (PSR-108), `[auth] Build session cookies + auth gate` (PSR-105), `[auth] Add proxy refresh + route gate` (PSR-110), `[auth] Add sign-in + sign-up actions` (PSR-106), `[auth] Wire auth forms to actions` (PSR-107), `[auth] Wire sign-out from profile` (PSR-109), `[auth] Verify auth integration` (PSR-104).
- Ph15 parent `[latihan] Ship training integration` + subs `[latihan] Spike upload transport rewrite`, `[latihan] Add catalog and prep reads`, `[latihan] Add session and evaluation reads`, `[latihan] Add BFF upload and video routes`, `[latihan] Build recorder capture flow`, `[latihan] Switch routes to session IDs`, `[latihan] Add session actions`, `[latihan] Verify training integration`.

## 5. Not-list (explicitly out — fights midnight scope creep)

- Real video playback in `/riwayat` (training video ships in Phase 15).
- Backend connect outside auth/profile/training (remaining phases stay on dummies + endpoint TODOs).
- Password recovery and email verification/link UI (design pending, Phase 14).
- Interactive charts (progress bars/rings are divs/SVG, no chart dep).
- Push notifications, native app, social features.
- Coach session-detail as separate route until distinct Figma node arrives (reuse member detail).

## 6. Risks

- Phase-7 precedent (19 issues in one milestone) — enforce split rule at Phase 8 planning.
- Coach scope confirmed ≈ member-sized (7 frames skimmed); session-detail duplicate id is the only unknown.
- `Perlu Perbaikan` (riwayat) vs `Perlu Koreksi` (evaluasi) wording — unify to `Perlu Koreksi` at Phase 8 spec time, log as decision comment.
- Amber/green failure tone (no red) except coach log #21 red card — confirm with coach at Phase 11.
- Figma card badges carry descriptive text ("Sesuai Skor Kualitas (80.0%)", "Sayap Siku Kanan (+8cm)") — user override: cards ship bare Sesuai/Remediasi/Tidak Sesuai badges only; isolated-node screenshots render component defaults, only the full frame (94:40907) is authoritative.
- Auth: BE refresh rotation grace is assumed, not verified — proxy single-flight limits the race, and a `401` fails safe to `/sign-in`.
- Auth: email-only sign-up is the current A1 workaround; ask the BE for an explicit `email` field before reopening NPM registration.
- Auth: BE error shapes are inconsistent — normalize once in `lib/api-client.ts`; no per-feature parsing.
- Training: upload transport is solved by same-origin BFF routes (D4) with a 4.5 MB request cap, idempotency keys, and `Range` forwarding; pre-signed production upload remains an open BE request.
- Training: `EvaluationOut.score` is 0–100 similarity points, not accuracy; no 85% target until product confirms the scale.
- Training: generated Zod is wrong for the multipart video body and the video response, and its request validators cannot read required headers — bypass with the low-level client (D17).

## 7. Audit script

`scripts/linear-roadmap-audit.mjs` (read-only, no network). Usage:

```bash
node scripts/linear-roadmap-audit.mjs issues.json [milestones.json]
# issues.json: array of { id, title, labels[], projectMilestone?|milestone?, parentId?, status? }
# exit 0 clean, exit 1 violations listed
```

Checks: title `^\[[a-z0-9]+\]` + ≤60 chars; exactly one of `feature|bug|chore|docs|spike`; `feature`/`bug` carry exactly one milestone; ≤2 open milestones; ≤10 issues per milestone; ≤10 subs per parent. Test: `tests/unit/scripts/linear-roadmap-audit.test.ts`.
