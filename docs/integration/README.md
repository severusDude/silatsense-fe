# FE ↔ BE Integration Guide

Reusable conventions for every SilatSense feature that talks to the backend. Auth-specific
decisions live in [`authentication.md`](./authentication.md); this file is the canonical default that
all feature modules start from to maintain a high degree of architectural consistency.

- **Status:** active convention (updated 2026-11-03)
- **Applies to:** any `features/<name>` that reads or mutates backend data
- **Canonical contract:** `https://silatsense-be.vercel.app/openapi.json`
- **Baseline:** Next.js 16 App Router, generated `@hey-api` client, TanStack Query 5, Zod 4

---

## 1. Contract first

The OpenAPI document is the only wire contract. The FE never invents a parallel shape.

1. Fetch/read the OpenAPI document before designing a module.
2. Regenerate the client (`pnpm gen:api`) and read the generated types, SDK functions, Zod
   schemas, and query options.
3. Write the module spec (`docs/integration/<module>.md`) with an endpoint table: method +
   path, auth requirement, request DTO, success DTO/status, error statuses.
4. If a screen needs a field the contract does not expose, **flag it as a FE/BE conflict** in
   the spec. Do not add a hand-written type, a shadow fetcher, or a guessed field.
5. Copy the exact DTO shapes from `src/api/types.gen.ts` into the spec, marked as generated.
   A contract change then shows up as a failing type/test, not as silent drift.

Rules:

- `src/api/**` is generated. Never edit it by hand.
- `pnpm gen:api` needs network access. After regeneration, `git diff src/api` must be empty
  unless the BE contract intentionally changed. Review that diff before updating consumers.
- Commit the generated output together with `openapi-ts.config.ts` changes so a clean
  checkout builds without regenerating.
- Import wire types from `@/api` (the generated barrel), never from deep `src/api/*.gen`
  paths unless the barrel does not re-export the symbol.

### 1.1 The ViewModel & Mapper Pattern

Generated wire DTOs (`src/api/types.gen.ts`) mirror backend database structures and serializers,
which often differ from UI presentation models (field naming, nullability, formatting).

- **Never modify generated DTOs** or tack client-only fields onto them.
- In `features/<name>/data/<name>-mapper.ts`, define a pure, testable mapper function:
  `to<Entity>ViewModel(dto: WireDto): EntityViewModel`.
- The mapper is responsible for:
  - Providing safe nullability fallbacks (`null` / `undefined` -> readable defaults like `"-"`).
  - Formatting ISO 8601 datetimes into localized relative or absolute human-readable strings.
  - Generating avatar initials, handle slugs, and badge labels.
  - Categorizing metrics into **active** (BE-supported) vs **inactive / coming soon** (unsupported).
- Every mapper must be covered by unit tests in `tests/unit/<name>/<name>-mapper.test.ts`.

---

## 2. Layering

```
app/<route>/page.tsx                  thin RSC route: composition only
  └─ features/<name>/pages/*.tsx      server composition: Suspense + prefetch
       ├─ features/<name>/components/ client UI (RHF, TanStack Query, Sonner)
       └─ features/<name>/data/       server-only reads
            └─ lib/api-client.ts      configured client + auth + error normalization
                 └─ src/api/sdk.gen   generated SDK
                      └─ BE REST API

client mutation
  └─ features/<name>/actions/*.ts     "use server" mutation, Zod at the boundary
       └─ lib/api-client.ts → src/api/sdk.gen → BE
```

Hard boundaries:

- `app/**` (except `app/api/` handlers and `app/providers.tsx`) contains no `"use client"`,
  no fetch, no validation, no business logic.
- `features/*/actions/` and `features/*/data/` start with `import "server-only"` (actions
  also carry `"use server"`). They are never imported by client components.
- Client components receive serializable props only. No tokens, `Date`, `Map`, class
  instances, or SDK response objects cross the boundary.
- Only `lib/api-client.ts` imports the generated client for app code. Feature code imports
  the seam, so base URL, auth header, and error handling stay in one place.
- `app/api/` is for external clients only (extension, downloads). Page data never flows
  through it.

---

## 3. Generated client setup

`openapi-ts.config.ts` is the single generator config:

```ts
export default defineConfig({
  input: "https://silatsense-be.vercel.app/openapi.json",
  output: "src/api",
  plugins: [
    { name: "@hey-api/client-fetch", runtimeConfigPath: "./src/api/hey-api.ts" },
    "zod",
    { name: "@hey-api/sdk", validator: true },
    "@tanstack/react-query",
  ],
});
```

- `runtimeConfigPath` points at a hand-written runtime config outside the generated output.
  This is how the base URL becomes environment-driven without patching `client.gen.ts`.
- `validator: true` makes the SDK validate requests and responses against the generated Zod
  schemas. A contract mismatch fails before feature code sees the data.
- The generated TanStack plugin produces options, query keys, and mutation hooks. Feature
  code may use the options/keys; server actions call the SDK functions directly.

Runtime config:

```ts
// src/api/hey-api.ts
import type { CreateClientConfig } from "@/api/client.gen";

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? config.baseUrl,
});
```

- `NEXT_PUBLIC_API_URL` is the BE origin, not a secret.
- The value must be documented in `.env.example`; production must set it explicitly.
- Never put tokens or other secrets in `NEXT_PUBLIC_*`.

Calling convention:

```ts
const { data, error, response } = await signInApiV1AuthSignInPost({
  body,
  throwOnError: false,
});
```

`throwOnError: false` is the default for this repo. Callers branch on `error` and never rely
on exceptions for expected failures. `response` carries status and headers (`Set-Cookie`,
`X-Request-ID`).

---

## 4. Server actions

Every mutation is a server action under `features/<name>/actions/`.

```ts
"use server";

import "server-only";

export async function doThingAction(input: unknown): Promise<ActionResult<Thing>> {
  const parsed = doThingPayloadSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  const { data, error, response } = await doThingApiV1ThingPost({
    body: parsed.data,
    throwOnError: false,
  });

  if (error) return apiFailure(error, response);
  return { ok: true, data };
}
```

Rules:

- Parse the payload with a Zod schema on the first line. Client validation is never trusted.
- Strip client-only fields (`confirmPassword`, `terms`, UI toggles) explicitly before the
  call. Do not send unknown keys and hope the generator filters them.
- Return a serializable `ActionResult<T>`; never throw domain errors across the boundary.
- Do not call `redirect()` inside an action. Return `redirectTo` and let the client call
  `router.replace()` + `router.refresh()`. This keeps `toast.promise` usable and avoids
  `NEXT_REDIRECT` being treated as a failure.
- Read auth tokens from server-side cookies inside the action via `getAccessToken()`. Never accept a token from the client payload.
- After a mutation, revalidate/invalidate the affected query key (read-your-own-write), or
  return the fresh object when the BE already does.
- Log `X-Request-ID` from `response.headers` on unexpected failures.

Result shape:

```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        message: string;
        code?: string;
        fieldErrors?: Record<string, string>;
      };
    };
```

Keep this type in `features/<name>/types.ts` (or a shared `lib` type) — it is FE-only and
must not be added to the generated API.

---

## 5. Error normalization

The BE currently emits several shapes. Normalize once in `lib/api-client.ts`; feature code
only sees `ActionResult`.

| Source | Body | Mapping |
|---|---|---|
| FastAPI validation (`422`) | `{ detail: [{ type, loc, msg, input, ctx }] }` | `fieldErrors` keyed by the last string in `loc`; message = first `msg` |
| Auth/domain (`401`, `409`) | `{ detail: "string" }` | `{ message: detail }` |
| Data domain (`401`, `403`) | `{ detail, code, requestId }` | `{ message: detail, code }` |
| Rate limit (`429`) | body not documented | dedicated "too many attempts" message, no auto-retry |
| Network/unknown | — | `"Tidak dapat terhubung ke server"` |
| Schema mismatch | SDK validator throw | generic "unrecognized response" + request ID |

Rules:

- Never assume `error instanceof Error`; the SDK may return a parsed body or an `Error`.
- Preserve user-facing BE messages when they are safe to show; map only the known cases.
- No automatic retry loop for `429` or `5xx` in a mutation.
- For reads, distinguish `401` (signed out → `null`) from `5xx`/network (throw) so a BE
  outage does not silently sign every user out.

---

## 6. Honest UI: Unmet Backend Capabilities & Statistical Data Policy

When integrating screens designed in Figma, discrepancies often emerge where the UI displays
metrics, aggregations, or actions that the backend REST contract does not currently support.

### 6.1 Strict Policy on Unsupported Metrics
1. **Never fabricate data:** Do not invent mock numbers, random averages, or synthetic computations that pretend backend endpoints exist.
2. **Never silently delete UI elements:** Do not quietly erase a card or metric without explicit product agreement.
3. **Visually "Inactive" (Greyed Out):** Render the container with dimmed, inactive styling:
   - Container classes: `opacity-60 bg-muted/20 border-dashed border-border/80`
   - Text classes: `text-muted-foreground/70`
   - Icon styling: `opacity-50`
4. **Explicit "Coming soon" Badge / Tag:**
   - Display a distinct status indicator: `<Badge variant="outline" className="text-[10px] uppercase font-semibold text-muted-foreground">Coming soon</Badge>` or localized text `"Segera hadir"`.
   - Users and QA immediately recognize that the feature is intentionally scheduled for future backend phases rather than broken.

### 6.2 Policy on Immutable & Auth-Governed Identity Fields
- Identifiers such as student numbers (`npm`) or institutional IDs are permanent database identity anchors. If the backend update endpoint does not permit mutating them, render them as **read-only / disabled inputs** with informative helper captions (`"NPM terdaftar permanen"`).
- Security-sensitive attributes (such as `email` or `password`) that require verification or password re-authentication must not be bundled into generic entity PATCH forms. They belong to dedicated security flows or dialogs.

### 6.3 Policy on Hardware / Browser Preferences
- Device settings (e.g. camera selection, microphone devices, local playback preferences) are hardware properties specific to the client's current browser session.
- **Do not send client hardware settings to backend entity PATCH endpoints.** Persist them in browser `localStorage` or client React context.

---

## 7. Zod has three layers

1. **Wire validators (generated)** — `zSignIn`, `zSignUp`, `zAuthTokens`, … used by the SDK.
    Never hand-write or edit these.
2. **Form validators (RHF)** — client UX in `features/<name>/schemas/`. May be stricter than
    the wire schema, never looser. Keep messages in Indonesian and field-specific.
3. **Action payload validators** — derived from the generated schema, plus FE-only tightening:

```ts
import { zSignIn } from "@/api/zod.gen";

export const signInPayloadSchema = zSignIn.extend({
  identifier: identifierSchema,
  password: z.string().min(8).max(128),
});
```

- If a generated schema has `.default()`, its input and output types differ. Accept
  `z.input<typeof schema>` at the action boundary and use `z.output` internally.
- Do not rely on `.transform()` alone to drop client-only fields; explicit destructuring is
  easier to test and review.
- A BE limit change must break the FE test, not silently pass. Assert the boundary values in
  `tests/unit/<name>/schemas.test.ts`.

---

## 8. Sessions and authorization

The full model is in [`authentication.md`](./authentication.md). Module code only needs the
invariants:

- Tokens live in `httpOnly` FE cookies (`ss_at`, `ss_rt`, `ss_exp`, `ss_remember`). Nothing
  auth-related goes to `localStorage`/`sessionStorage`.
- `proxy.ts` refreshes near expiry and forwards the fresh access token as an internal
  request header. It is an optimistic gate, never the only authorization layer.
- `features/auth/data/session.ts` owns `getSession()`, `requireSession()`, `requireRole()`, `getAccessToken()`.
  Other modules consume these helpers; they do not parse cookies themselves.
- Authoritative role checks run in the `(member)` and `(coach)` layouts through `AuthGate`.
  Session reads sit behind `<Suspense>` because Cache Components forbids cookie reads in a
  static shell.
- After sign-in/out, redirect by role (`/coach` vs `/dashboard`) and refresh the router.

---

## 9. Caching in Next 16 (Cache Components Rule)

Under Next.js 16 with `cacheComponents: true`:

- **STRICT PROHIBITION:** **Never use `'use cache'` on user-authenticated or token-dependent data reads.**
  - `'use cache'` memoizes results across requests and attempts to pre-render static HTML.
  - Accessing cookies or `headers()` inside a `'use cache'` scope throws a build error under Cache Components or leaks private session data between users.
- Authenticated reads must execute at request time:
  - Memoize within the single request lifecycle using React `cache()` from `'react'`.
  - Pass `cache: "no-store"` to the underlying generated SDK call.
  - Wrap async server components in `<Suspense fallback={<Skeleton />}>` so the outer shell remains instantly streamable.
- Server Actions must revalidate data upon mutation:
  - Return fresh updated entities directly to the client.
  - Invalidate TanStack Query cache keys in `useMutation.onSuccess`.
  - Invoke `router.refresh()` to update surrounding Server Component trees.

---

## 10. TanStack Query usage

- Server prefetch: `queryClient.query({ queryKey, queryFn })` inside the page composition.
  Client components use the same key with `useQuery`/`useSuspenseQuery`.
- Generated query options/keys are preferred over hand-written strings:
  `memberProfileApiV1MemberProfileGetOptions()` and its `QueryKey`.
- Mutations stay in client components and call server actions. Do not call the generated
  `useMutation` hook for cookie-writing or token-dependent flows directly from the browser.
- If a generated mutation hook is ever used, its variables are `Options<...>` (for example
  `{ body: SignIn }`), not a bare DTO.
- After a mutation, invalidate the exact generated key; do not reload the page.

---

## 11. Testing and gates

Per `docs/CODE_STANDARD.md` §6:

```bash
pnpm gen:api      # only when the contract or generator config changed
pnpm build
pnpm exec tsc --noEmit
pnpm lint
pnpm test
```

Test layers:

- **Schemas:** main path + boundary values + error messages.
- **Actions:** payload parsing, client-only field stripping, error mapping, cookie capture.
  Mock the SDK module (or `lib/api-client`), not the network.
- **Mappers & ViewModels:** mapping logic, nullability fallbacks, initials generation, inactive metric labeling.
- **Data reads:** `401` vs `5xx` behavior, cache options, role checks.
- **Proxy/pure logic:** `shouldRefresh()`, header forwarding, cookie clear/preserve decisions.
- **Browser:** layout overflow (`scrollWidth <= innerWidth`), mutation freshness, redirects,
  and cookie flags for auth work. Use a fresh port per run and clean up artifacts.

No task moves to `In Review` with a red gate.

---

## 12. Standard Module Integration Checklist & Playbook

For every new module integration (Latihan, Riwayat, Evaluasi, Coach, Profile):

1. **Contract Analysis:** Fetch the live OpenAPI JSON. Verify generated SDK, Zod schemas, and query options in `src/api/`.
2. **Gap Analysis Table:** Catalog every FE screen need against BE endpoints. Categorize fields as:
   - `Match`: Directly supported.
   - `Mismatch`: Field name, enum, or nullability difference (resolved via ViewModel mapper).
   - `Missing in BE`: Unmet metric or endpoint (resolved via Inactive/Coming Soon styling or read-only treatment).
   - `Unused in BE`: BE field not currently needed by FE.
3. **Spec Document:** Write `docs/integration/<module>.md` following this structure. Include architecture diagram, decisions, and Zod strategy.
4. **ViewModel & Mapper:** Create `features/<name>/data/<name>-mapper.ts` + unit tests.
5. **Server Actions & Reads:** Implement `features/<name>/actions/` and `data/` using `getAccessToken()` and React `cache()`.
6. **UI States:** Update components with RHF + Zod form validation, read-only identity indicators, and inactive "Coming soon" badges for unmet metrics.
7. **Verification:** Pass Vitest unit tests, `tsc --noEmit`, ESLint, `pnpm build`, and browser layout checks.
