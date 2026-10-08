# CODE_STANDARD — SilatSense Frontend

Source of truth for how code is written in this repo. `AGENTS.md` is workflow only and points here.

Stack: Next.js 16.3.8 App Router, React 19, shadcn `base-nova` on `@base-ui/react` 1.8.0 (not Radix), Tailwind 4, RHF + Zod, TanStack Query 5, Sonner, `nextjs-toploader`. Backend lives outside this repo; communication is REST via `fetch`.

## 1. Partial pre-rendering (required, dynamic-heavy app)

Next 16 uses Cache Components, not `experimental_ppr`.

- `next.config.ts` must contain `cacheComponents: true`.
- Static shell: add `'use cache'` + `cacheLife('<profile>')` to data helpers or cachable UI in `features/*/data/` and `features/*/pages/*`. Pair every `'use cache'` with a `cacheLife`. Arguments become cache keys.
- Dynamic content: never opt the whole route dynamic. Keep the shell static and wrap each async dynamic unit in `<Suspense fallback={<Skeleton/>}>`. Fetch inside the suspended Server Component at request time.
- Cookies/session reads must sit behind a `Suspense` boundary, otherwise the build fails under Cache Components.

Pattern (route caller stays thin):

```tsx
// app/dashboard/page.tsx — server component, no logic
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page";

export default function Page() {
  return <DashboardPage />;
}

// features/dashboard/pages/dashboard-page.tsx
import { Suspense } from "react";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { DashboardLive } from "@/features/dashboard/components/dashboard-live";
import { dashboardSkeleton } from "@/features/dashboard/components/dashboard-skeleton";
import { getDashboard } from "@/features/dashboard/data/get-dashboard";

export async function DashboardPage() {
  const queryClient = new QueryClient();
  await queryClient.query({ queryKey: ["dashboard"], queryFn: getDashboard }).catch(() => {});

  return (
    <>
      <DashboardShell />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={dashboardSkeleton}>
          <DashboardLive />
        </Suspense>
      </HydrationBoundary>
    </>
  );
}
```

## 2. TanStack Query with App Router

- `app/providers.tsx` is the sole `'use client'` exception under `app/`. It owns `QueryClientProvider` with `staleTime: 60_000`, `refetchOnWindowFocus: false`, browser singleton + per-request server client. Do not duplicate this setup.
- Prefetch in Server `pages/` composition with a fresh `new QueryClient()` per prefetch site (avoids serializing unrelated queries), then `dehydrate()` into `HydrationBoundary` wrapping the client component. Client components use `useQuery` / `useSuspenseQuery` with the same `queryKey` / `queryFn`.
- `useSuspenseQuery` requires a `Suspense` boundary above it or TTFB stalls. `useQuery` without suspense renders `pending` and skips server rendering — only use it for below-fold or post-interaction content.
- Mutations live in client components via `useMutation` calling `features/*/actions/*` (server actions) or `lib/api-client.ts`. On success invalidate the exact `queryKey` or optimistically update; never rely on manual reload.
- Non-JSON payloads must use matching `dehydrate.serializeData` / `hydrate.deserializeData`.

## 3. Server / client boundaries

- `app/**` (except `app/api/` route handlers and `app/providers.tsx`) are React Server Components. Never add `"use client"` under `app/`. Route files contain no business logic, fetch, or validation — they call `features/*/pages/*`.
- `features/*/actions/` and `features/*/data/` are server-only: first line `import "server-only"`. Never import them from a client component. Pass serializable props across the boundary.
- Client interactivity lives in `features/*/components/`. Cross-feature UI lives in `components/ui/` (shadcn/Base UI). App-wide singletons live in `lib/`.
- `app/api/` is allowlisted for external clients only (companion extension, downloads). Page data flows use `data/` reads + `actions/` mutations, not `app/api/`.

## 4. REST + read-your-own-write (no Prisma in this repo)

- `data/` reads and `actions/` mutations call the external REST API through `lib/api-client.ts` (`fetch` wrapper: base URL from env, JSON handling, error normalization, auth header injection). No `lib/prisma.ts`, no `@prisma/client`, no `generated/` imports.
- Read-your-own-write is required: after every mutation in the same task, re-read through the corresponding `data/` query (or assert the invalidated `queryKey` refetches) and confirm the UI reflects the write.
- `schemas/` Zod validates at both edges: RHF `zodResolver` client-side + `schema.parse()` first line of the server `actions/` handler. Never trust client-validated input.

### 4a. Backend-not-yet-built stubs (dummy data + contract)

When the REST contract does not exist yet, ship the UI on stubs that carry the expected contract — never bare `TODO`s:

- Dummy lives in a pure module: `features/<name>/data/<thing>-dummy.ts` with no `import "server-only"` (keeps it Vitest-safe). The server fetcher (`data/`) keeps `'use cache'` + `cacheLife` and returns the dummy.
- Every stub TODO names the exact endpoint: `TODO: connect backend via lib/api-client.ts (METHOD /path)` — e.g. `(GET /member/dashboard)`. A TODO without an endpoint path is incomplete.
- DTO interfaces live in `features/<name>/types` (single `types.ts` until 2+ types force directory form) and are copied verbatim into the move's spec doc under a DTO section.
- A characterization test pins the dummy shape (`tests/unit/<feature>/<thing>-data.test.ts`): key fields, literal Figma values, collection lengths. The contract cannot drift silently.
- Mutations stub the same way: the `useMutation` stub's TODO names its endpoint (e.g. `(POST /auth/sign-in)`), and request/response DTOs get the same `types` + spec + test treatment.

## 5. Schemas, types, imports, UI primitives

- `schemas` and `types` may each be a file (`features/<name>/schemas.ts`) or a directory (`features/<name>/schemas/index.ts` or `schemas/<name>.ts`). Same rule for `types`. Directory form is preferred once a feature has 2+ schemas/types. Existing `features/dashboard/schemas/`, `types/` empty-dir scaffold follows this rule.
- Import with `@/` alias only (`@/features/auth/schemas`, `@/components/ui/button`). Never use relative imports across folders.
- shadcn is Base UI: `components.json` style `base-nova`, primitives from `@base-ui/react/*` via `@/components/ui/*` only. Do not install or import Radix primitives. Radix docs do not apply; check Base UI tab. `lucide-react` for icons.

## 6. Verification per change

- Vitest characterization for touched logic: `tests/unit/` mirrors source (`tests/unit/<feature>/<name>.test.ts`), `describe/it/expect` behavior names, arrange-act-assert, one behavior per test, no implementation-detail assertions. Cover main path + boundaries + error paths; spy side effects (save/publish/fetch) where present.
- `package.json` must provide `"test": "vitest run"`. If missing, adding `vitest` + script is part of the task.
- Every task ends green: `pnpm build` + `tsc --noEmit` + `eslint` + `pnpm test` (`vitest run`). Read full output; zero errors required before status moves to `In Review`.
- Visual/live behaviors (layout overflow, mutation freshness, TopLoader + Sonner feedback) are verified in a real browser: `document.documentElement.scrollWidth <= window.innerWidth` in every sidebar state (open/closed/collapsed, mobile/desktop). Paste the check result in the review comment.
