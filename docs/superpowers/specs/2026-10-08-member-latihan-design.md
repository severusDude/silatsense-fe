# Member Latihan Design — /latihan (PSR-40)

Date: 2026-10-08. Status: approved. Linear parent: PSR-40 (`[member] Ship member latihan page`), milestone `[Phase 5] Member latihan`. Subs: PSR-41 route/nav, PSR-43 hero/cards, PSR-42 data/tests.

## 1. Goal

Figma-faithful member training-list frontend at `/latihan` (Figma `94:38430`, "Latihan Member"). Role-domain feature `features/member/` (extends the dashboard move PSR-32). All data-backed elements render from dummy data behind a `TODO: connect backend` fetch function; all images are placeholders; all graphics are lucide icons. Card CTAs stay dead with a `TODO → /latihan/[slug]` until the Persiapan detail move lands.

## 2. Figma source

- Top nav (reused): `SILATSENSE` logo + red quick-start icon button + avatar `AS` (online dot) + `Dashboard / Latihan` breadcrumb + `Cloud Sinkron` pill.
- Hero header: badges [transcribed — confirm] `MODUL LATIHAN` + `Standar PB IPSI Resmi` + `4 Pilar Teknik`; title `Pilih Latihan Gerakan Dasar` (verbatim); subtitle `Pilih salah satu dari 4 pilar teknik dasar pencak silat untuk memulai panduan gerak dan kalibrasi sensor biomekanika AI.` (verbatim); stats micro-bar [transcribed — confirm] `26 Sesi Tersimpan` + `Akurasi: 84.0%`.
- Module cards (Figm order): Kuda-kuda, Pukulan, Tangkisan, Tendangan. Each: dojo image (→ placeholder) + order badge [transcribed — confirm] (`Latihan 01 · Fondasi Inti`, `Latihan 02 · Serangan Tangan`, `Latihan 03 · Pertahanan`, `Latihan 04 · Serangan Kaki`) + title row (title + level subtitle [transcribed — confirm], estimate badge at inline-end, optional — omitted when unknown) + Figma-verbatim description + dead `Mulai Latihan →` button. No sensor copy anywhere on the cards.
- Descriptions (verbatim): Kuda-kuda `Fondasi utama stabilitas tubuh, distribusi bobot simetris 50:50, serta kekuatan tumpuan paha dan lutut sejajar 135°.` / Pukulan `Melatih linearitas dorongan kepalan tangan segaris ulu hati, kekokohan Kuda Kuda (135°), dan efisiensi rotasi sendi panggul 45°.` / Tangkisan `Teknik menangkis serangan lawan dengan sudut perisai lengan 45° terhadap dahi serta menjaga elastisitas bahu dan leher tetap rileks.` / Tendangan `Melatih daya dorong tumit/sabit, ketinggian lintasan ujung kaki, dan kelurusan sentakan sendi lutut tumpuan saat eksekusi.`
- Bottom nav (reused): Dashboard, Latihan (active, badge `4`), Riwayat, Profil.

## 3. Architecture

- Routes (thin RSC, no logic): `app/(member)/latihan/page.tsx` → `LatihanPage`. Shell ownership lives in per-route leaf layouts: `app/(member)/dashboard/layout.tsx` (`<MemberLayout>` defaults, dashboard DOM unchanged) and `app/(member)/latihan/layout.tsx` (`activeTab="latihan"`, trail `["Dashboard", "Latihan"]`); the `(member)` group layout is a pure pass-through. (Decision 2026-10-08: nesting `MemberLayout` in both group and leaf layouts rendered double header/nav chrome on `/latihan` — single ownership per leaf instead.)
- Compositions: `features/member/pages/latihan-page.tsx` (static shell + two `<Suspense>` units: hero, card list).
- Client components: none expected — nav + cards are dead links this move; `member-bottom-nav.tsx` gains an `activeTab` prop (`"dashboard" | "latihan"`) instead of hardcoded Dashboard-active.
- Components (`features/member/components/`): `latihan-hero.tsx`, `module-card-list.tsx`, `module-card.tsx`. Shared placeholder mirrors `features/landing/components/shared/image-placeholder.tsx` (same as dashboard move).
- Data: `features/member/data/get-training-modules.ts` (server-only, `'use cache'` + `cacheLife('minutes')`, dummy return). No `schemas/` (read-only). No `app/api/`. `@/` imports only.

## 4. Types / DTOs (expected backend shape)

```ts
interface TrainingModule {
  slug: "kuda-kuda" | "pukulan" | "tangkisan" | "tendangan";
  order: number; // 1–4, Figma card order
  orderLabel: string; // e.g. "Latihan 01 · Fondasi Inti" [transcribed — confirm]
  name: string; // "Kuda-kuda" | "Pukulan" | "Tangkisan" | "Tendangan"
  levelLabel: string; // card subtitle [transcribed — confirm]
  description: string; // Figma-verbatim (§2)
  estimateLabel?: string; // e.g. "10 Menit" | "3×10 Repetisi" [transcribed — confirm]; badge hidden when absent
}

interface TrainingHero {
  badges: string[]; // [transcribed — confirm]
  title: string; // "Pilih Latihan Gerakan Dasar"
  subtitle: string; // Figma-verbatim (§2)
  sessionsLabel: string; // e.g. "26 Sesi Tersimpan" [transcribed — confirm]
  accuracyLabel: string; // e.g. "Akurasi: 84.0%" [transcribed — confirm]
}

interface MemberTraining {
  hero: TrainingHero;
  modules: TrainingModule[];
}
```

Dummy values mirror Figma verbatim where exact (§2); every `[transcribed — confirm]` value is pinned in the spec and flagged for reviewer confirmation before `In Review`.

## 5. UI pattern

- Flex layouts only — no absolute/hard placement (the order badge renders as a flex caption row directly beneath the placeholder image, not overlaid on it — a deliberate stacked adaptation of the Figma overlay to satisfy the no-absolute constraint).
- Images: `ImagePlaceholder` (`role="img"`, `ImageIcon`, dashed border) for all 4 card visuals + logo mark (same component as dashboard move).
- Icons (lucide 1.x names, never emoji): `Dumbbell` (Latihan nav + hero), `Clock` (duration), `Repeat` (reps), `ArrowRight` (Mulai Latihan), `Play` (quick-start), `CloudCheck` (sync). Order badge via `Badge` neutral tint.
- Card header is a flex row: title + level subtitle stacked at inline-start, optional estimate badge (`Badge`, secondary/muted tint) at inline-end — e.g. duration `10 Menit` or reps `3×10 Repetisi` [transcribed — confirm]; the badge is omitted entirely when `estimateLabel` is absent. No sensor copy is rendered.
- CTAs render as dead affordances with `TODO: wire to /latihan/[slug] (Figma 94:38628 Persiapan detail)` comments; bottom-nav Latihan tab becomes the active link on this route (`aria-current="page"`), Riwayat/Profil keep their existing dead TODOs.

## 6. Data / feedback

```ts
// features/member/data/get-training-modules.ts
import "server-only";
import { cacheLife } from "next/cache";

export async function getTrainingModules(): Promise<MemberTraining> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /member/training-modules) — dummy for now
  return dummyMemberTraining;
}
```

Static shell calls it directly in the RSC; hero + card list each sit behind `<Suspense fallback={<Skeleton/>}>`. TanStack prefetch + `HydrationBoundary` arrive with the REST contract (`lib/api-client.ts` still missing — out of scope). No mutations this move.

## 7. Verification

- `tests/unit/member/training.test.ts`: module order + count (4, kuda-kuda first), estimate badge optional (renders label when present, absent when `estimateLabel` undefined), DTO shape (hero title verbatim, 4 modules, all slugs unique). Arrange-act-assert, one behavior per test.
- Green: `pnpm build` + `tsc --noEmit` + `eslint` + `pnpm test`.
- Browser (Playwright): `document.documentElement.scrollWidth <= window.innerWidth` at 390px + desktop with both navs visible; exactly 4 `role="img"` placeholders; dead-CTA TODOs spot-checked; no navigation to 404 (buttons are non-links).

## 8. Out of scope

Detail `/latihan/[slug]` (Figma `94:38628` Persiapan — camera viewport, source selector, coach card, calibration checklist, countdown CTA), backend connect + `lib/api-client.ts`, session/cookie handling, riwayat/profil routes, real photos, chart library, E2E tests.
