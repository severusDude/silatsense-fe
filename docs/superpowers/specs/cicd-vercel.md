# Spec: CI gates + Vercel deployment

Parent: PSR-8. Single system — this file is the spec, no `docs/spec/` duplicate.

## Decision

Vercel **Git integration** owns all deployments. GitHub Actions owns **verify gates only**
(typecheck, lint, test, build). No CLI `vercel deploy` workflow — building in Actions
then deploying without `--prebuilt` doubles builds and CI minutes (Vercel KB, Jul 2026).

- Production branch: `main`. Every push to `main` promotes to production.
- Preview: every PR and every other branch gets a preview URL automatically.
- Branch model mapping: PR → `development` (squash) gets preview + CI; `development` → `main`
  (merge commit, no squash) promotes to production.

## CI workflow (`.github/workflows/ci.yml`)

- Triggers: `pull_request` (any target) + `push` to `development` / `main`.
- `concurrency: ci-${{ github.ref }}` with `cancel-in-progress: true`.
- Runner `ubuntu-latest`, Node 22 (pnpm 11 requires Node ≥22.13 via `node:sqlite`),
  `pnpm/action-setup@v4` with **no `version` input**
  (the action reads `packageManager: pnpm@11.17.0` — passing both fails with
  `ERR_PNPM_BAD_PM_VERSION`), `actions/setup-node@v4` with pnpm cache,
  `pnpm install --frozen-lockfile`.
- Steps in order: `next typegen` (generates `.next/types` for `LayoutProps`, absent on
  fresh checkouts) → `pnpm typecheck` (fail fast) → `pnpm lint` → `pnpm test` → `pnpm build`.
  `.next/cache` cached via `actions/cache@v4`.
- No secrets required for CI. No E2E job yet (explicit out of scope).

## package.json scripts

- `typecheck: tsc --noEmit` — also enables Vercel native typecheck Deployment Check
  (Vercel auto-detects `lint` + `typecheck` script names; existing `lint` script already qualifies).
- `test: vitest run` + minimal vitest bootstrap (config + one smoke test under `tests/unit/`).
  Full per-feature characterization tests remain follow-up work per CODE_STANDARD §6.

## Vercel dashboard wiring (manual, once)

1. Import `severusDude/silatsense-fe`, framework auto-detect Next.js, no custom build settings.
2. Production branch = `main`. Keep Git integration **enabled** (no `deploymentEnabled: false`,
   no CLI workflow — that flag would hand deploys to Actions and is the opposite of this design).
3. Optional hardening later: Deployment Checks requiring the `verify` workflow; `VERCEL_AUTOMATION_BYPASS_SECRET`
   when E2E lands. Neither blocks this move.

## Acceptance (mirrors PSR-8)

- [ ] ci.yml green on PR
- [ ] preview deploy per PR, production on main only (dashboard setting, verified on first PR after merge)
- [ ] tsc + eslint + test + build green locally
