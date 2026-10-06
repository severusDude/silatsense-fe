<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# SilatSense Frontend — Agentic Workflow

Solo-developer agile. Code standard lives in `docs/CODE_STANDARD.md` — follow it when writing code. This file is workflow only.

Linear operations use `linear-personal_*` tools only. Never use the `linear` MCP (different auth, not set up). Workspace `stracho`, team `Personal` (key `PSR`), project `silatsense` (`P-PSR-1`). Apply the `linear-tracking` skill on every Linear write.

## Project structure

Next.js App Router. Follow strictly.

- `app/` holds route segments (`layout.tsx`, `page.tsx`, `providers.tsx`, `api/`) and nothing else. Every file under `app/` except `api/` route handlers is a React Server Component — never add `"use client"` under `app/` (sole exception: `app/providers.tsx` owns TanStack + `next-themes` client boundary). Route files contain no business logic, fetch, or validation; they call a feature's `pages/` composition (e.g. `features/auth/pages/sign-in.tsx`). Client interactivity lives in `features/<name>/components/`.
- `app/api/` is allowlisted for external clients only (companion extension, downloads). Page data flows use `features/<name>/data/` reads + `actions/` mutations.
- `features/<name>/`: `actions/` (server actions, mutations only) · `components/` (+ `components/shared/`) · `data/` (queries, if needed) · `pages/` (compositions called from `app/` routes) · `schemas` · `types`. `schemas` and `types` may each be a file (`schemas.ts`) or a directory (`schemas/index.ts`, `schemas/<name>.ts`); directory form preferred at 2+ items.
- `actions/` + `data/` are server-only (`import "server-only"` first line), never imported from client components. Pass serializable props only. `schemas` Zod-validates at the `actions/` boundary.
- Shared UI in `components/ui/` (shadcn `base-nova` on `@base-ui/react` — not Radix). Singletons in `lib/` (`api-client.ts`, `utils.ts`). Import with `@/` alias only. Backend is external REST; no Prisma in this repo (`data/` + `actions/` call `lib/api-client.ts`).

## Workflow (in order)

1. Never work on `main` or `development`. Cut a task branch from `development`: `git fetch origin development && git checkout -b <linear-gitBranchName|experiment/*> origin/development`. Use the Linear-generated branch as-is; delete after merge.
2. Check the issue via `linear-personal_list_issues` / `get_issue`. If missing: read `docs/superpowers/specs/*`, create parent + sub-issues (`save_issue`, `parentId` for subs), copy `gitBranchName`, cut the branch.
3. Read the PRD (parent description + linked spec doc) for related instructions.
4. Read and adhere to the spec file for the move.
5. Implement per `docs/CODE_STANDARD.md`. One parent + sub-issues per move (max 1 level: parent = 1–3 day shippable, sub = <4h). Title `[area] Verb outcome`, ≤60 chars. Description 4-field header only (`Goal / Scope(+Out:) / Acceptance boxes / Links`), ≤15 lines; longer specs go in a Linear Doc linked under `Links:`.
6. Solo-agile tracking: assignee always `me`; exactly one label (`feature|bug|chore|docs|spike`); `feature`/`bug` carry exactly one milestone (max 2 open, `[Phase N] Outcome`); 1-week Mon–Mon cycles, only committed issues in-cycle, spillover explicitly re-committed. Specs in `docs/superpowers/specs/`, plans in `docs/superpowers/plans/`. Progress `save_comment` per completed move (`Done X, next Y.`); `decision` comments update Scope/Acceptance to match; `In Review` carries PR URL + 2–4 test steps.
7. Verify per `docs/CODE_STANDARD.md` §6: `pnpm build` + `tsc --noEmit` + `eslint` + `pnpm test` green, plus browser `scrollWidth <= innerWidth` check for visual moves. Zero errors before `In Review`.
8. Merges: PR to `development` with squash. `development` → `main` with merge commit, no squash.

## Commits

`<type>(<scope>): <summary>` + optional body + footers. Types: `feat|fix|docs|style|refactor|perf|test|chore|ci`. Breaking: `!` before `:` (e.g. `feat(api)!: change auth payload`). One task = one commit = one review.
