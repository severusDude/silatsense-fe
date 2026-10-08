# Member Dashboard Design — /dashboard (PSR-32)

Date: 2026-10-08. Status: approved. Linear parent: PSR-32 (`[member] Ship member dashboard`), milestone `[Phase 4] Member dashboard`. Subs: PSR-35 shell/nav, PSR-36 hero/visual, PSR-34 pillars/feedback, PSR-33 weekly/data/tests.

## 1. Goal

Figma-faithful Member dashboard frontend at `/dashboard` (Figma `94:38108`, "Dashboard - Member"). Role-domain feature `features/member/` (member dashboard now, latihan/riwayat later; `features/coach/` stays a separate future move). All data-backed elements render from dummy data behind a `TODO: connect backend` fetch function; all images are placeholders; all graphics are lucide icons.

## 2. Figma source

- Top nav: `SILATSENSE` logo + red quick-start icon button + avatar `AS` (online dot) + `Dashboard` breadcrumb + `Cloud Sinkron` pill.
- Hero greeting: `Halo, Aced.` + `Siap melatih presisi gerakan hari ini?` + description (focus `Pukulan Lurus` + rotasi pinggul) + primary `Mulai Sesi Latihan →` + secondary `Lihat Panduan Biomekanik`.
- Visual pose card (dark): `Kamera Siap` pill + `82% AKURASI TERKINI` + `Toleransi sudut siku: 14° (Target: <8°)` + `Jarak 2.5m` chip.
- Pillar grid 2×2: Kuda-kuda (Stabil, `Tuntas 4/4 Variasi`, 94.8%), Pukulan active (`Pukulan Lurus`, 82.0%, `Lanjut →`), Tangkisan (Optimal, `Tuntas 3/4 Variasi`, 89.5%), Tendangan (Perlu Koreksi, `Harus Evaluasi`, 76.0%). Header `Kategori Gerakan Dasar` + `4 pilar kurikulum baku pesilat pemula UNSIL` + `Gasal 2024`.
- Session feedback: `EVALUASI SESI MANDIRI` + `Pukulan Lurus (Serangan Tangan)` + `Kemarin, 16:40 WIB • 30 Repetisi` + `82% — Perlu Ditingkatkan`; rows: good (`Keseimbangan Kaki & Kuda-kuda`, lutut 135°), warning (`Ketinggian Siku Tangan`, siku turun 8 cm), recommendation (`Rekomendasi Koreksi`, pinggul 45°) + `Ulangi Latihan Gerakan Ini`.
- Weekly: `Konsistensi Latihan` + `Target: 4 dari 5 Hari Target` + `Minggu Ke-3`; bars Sen 88 / Sel 92 / Rab Rest / Kam 82 (highlight) / Jum–Min empty; coach note (`KF`, `Kang Fauzan`, postur quote).
- Bottom nav: Dashboard (active), Latihan (badge `4`), Riwayat, Profil.

## 3. Architecture

- Routes (thin RSC, no logic): `app/(member)/layout.tsx` → `MemberLayout`, `app/(member)/dashboard/page.tsx` → `DashboardPage`.
- Compositions: `features/member/pages/member-layout.tsx` (flex column shell, `max-w-[448px]` mobile container like landing, sticky top/bottom nav), `features/member/pages/dashboard-page.tsx` (static shell + `<Suspense>` units).
- Client components: only where interactivity demands (none expected this move — nav/CTAs are dead links; if a toggle appears it lives in `components/` with `"use client"`).
- Components (`features/member/components/`): `member-top-nav.tsx`, `hero-greeting.tsx`, `hero-visual-card.tsx`, `pillar-grid.tsx`, `session-feedback.tsx`, `weekly-progress.tsx`, `member-bottom-nav.tsx`. Shared placeholder mirrors `features/landing/components/shared/image-placeholder.tsx` (promote to `components/ui/` in a later move if reused a third time).
- Data: `features/member/data/get-member-dashboard.ts` (server-only, `'use cache'` + `cacheLife('minutes')`, dummy return). No `schemas/` (read-only). No `app/api/` (external clients only). `@/` imports only. Implementation deletes the empty generic `features/dashboard/` scaffold dirs (they ship nothing) so `features/member/` is the single owner.
- Missing primitive: none — `Card`, `Badge`, `Button`, `Skeleton` already exist (base-nova, Base UI). No Radix. `lucide-react` icons only.

## 4. Types / DTOs (expected backend shape)

```ts
type PillarStatus = "stabil" | "optimal" | "perlu-koreksi";
type DayState = "filled" | "rest" | "empty" | "active";

interface MemberDashboard {
  greeting: { name: string; lastSessionDaysAgo: number; focusTechnique: string };
  heroMetric: { accuracyPct: number; elbowToleranceDeg: number; targetDeg: number; cameraDistanceM: number; cameraReady: boolean };
  pillars: { slug: string; name: string; status: PillarStatus; statusLabel: string; detail: string; avgPct: number; active?: boolean }[];
  lastSession: { technique: string; time: string; reps: number; scorePct: number; scoreLabel: string;
    observations: { tone: "good" | "warning" | "neutral"; title: string; body: string }[] };
  weekly: { title: string; targetLabel: string; weekLabel: string;
    days: { label: string; value: number | null; state: DayState }[] };
  coachNote: { initials: string; name: string; quote: string };
}
```

Dummy values mirror Figma verbatim (Aced, 2 hari, Pukulan Lurus, 82%, 14°/<8°, 2.5m, 94.8/82.0/89.5/76.0, Sen 88/Sel 92/Rab Rest/Kam 82 active, KF quote). Single `types.ts` file until 2+ types force directory form.

## 5. UI pattern

- Flex layouts only — no absolute/hard placement (overlays inside the visual card use a relative container with flex rows, not inset coordinates).
- Images: `ImagePlaceholder` (`role="img"`, `ImageIcon`, dashed border) for the pose visual + logo mark.
- Icons (lucide, never emoji — Figma `💡` becomes `Lightbulb`): `Play` (quick-start + primary CTA), `BookOpen` (panduan), `ArrowRight`/`ChevronRight` (CTAs/Lanjut), `CheckCircle2` (good), `TriangleAlert` (warning), `Lightbulb` (recommendation), `RotateCcw` (ulangi), `LayoutDashboard`/`Dumbbell`/`History`/`User` (bottom nav), `CloudCheck` (sync), `Footprints`/`Hand`/`Shield`/`Zap` (pillars).
- Status tints via `Badge`: green (`Stabil`, `Optimal`, sync, good row), amber (`Perlu Koreksi`, warning row, score chip), neutral (recommendation row, empty days). Pukulan card gets `border-primary` active ring.
- CTAs + bottom nav (Latihan/Riwayat/Profil) render as dead affordances with `TODO` comments pointing at future routes (`/latihan` session flow, `/panduan`); Latihan keeps its `4` badge. No navigation wiring this move.

## 6. Data / feedback

```ts
// features/member/data/get-member-dashboard.ts
import "server-only";
import { cacheLife } from "next/cache";

export async function getMemberDashboard(): Promise<MemberDashboard> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /member/dashboard) — dummy for now
  return dummyMemberDashboard;
}
```

Static shell calls it directly in the RSC; each async unit sits behind `<Suspense fallback={<Skeleton/>}>`. TanStack prefetch + `HydrationBoundary` arrive with the REST contract (`lib/api-client.ts` still missing — out of scope). No mutations this move.

## 7. Verification

- `tests/unit/member/dashboard.test.ts`: status→tint mapping (3 states), day-state rendering (filled/rest/empty/active), DTO shape (4 pillars, 7 days, 3 observations). Arrange-act-assert, one behavior per test.
- Green: `pnpm build` + `tsc --noEmit` + `eslint` + `pnpm test`.
- Browser: `document.documentElement.scrollWidth <= window.innerWidth` at 390px + desktop with both navs visible; dead-CTA TODOs spot-checked.

## 8. Out of scope

Backend connect + `lib/api-client.ts`, session/cookie handling, coach dashboard (`features/coach/`), real photos, chart library, dark-theme derivation (PSR-22), E2E tests.
