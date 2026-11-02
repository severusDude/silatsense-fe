# Authentication — FE ↔ BE Integration Spec

- **Status:** Approved — implementation may start. Reusable conventions: [`README.md`](./README.md).
- **Date:** 2026-11-02 (approved 2026-11-02)
- **Scope:** `features/auth`, `app/sign-in`, `app/sign-up`, protected layouts, root `proxy.ts`, generated-client runtime config, and the auth consumers in `features/profile` (logout only).
- **BE source of truth:** `https://silatsense-be.vercel.app/openapi.json` (fetched 2026-11-02).
- **FE baseline:** `development` plus the uncommitted generated client (`openapi-ts.config.ts`, `src/api/**`).

---

## 0. TL;DR

The current auth module is a UI shell. Sign-in and sign-up `useMutation` stubs throw `"Backend belum tersambung"`, there is no session read, no refresh, no route guard, no logout, and the hand-written DTOs duplicate what the generated client already exposes.

The backend already ships the full contract: sign-in/up, session, rotating refresh, logout, password reset, email verification, and email linking. The integration therefore has three jobs:

1. **Replace the stubs** with server actions that call the generated SDK.
2. **Own the session server-side** with `httpOnly` cookies, a `proxy.ts` refresh path, and server-side role gates.
3. **Delete the duplicated auth DTOs** and align the Zod schemas with the real BE constraints.

Recommended approach: **Next server actions → generated `@hey-api` SDK → `httpOnly` FE cookies → `proxy.ts` proactive refresh**. No tokens in `localStorage`, no hand-written fetchers, no duplicate DTOs.

Three items need a product/BE answer before the recovery flows ship: NPM-only accounts cannot reset a password, the BE refresh endpoint has no rotation grace window, and the BE refresh cookie is missing `Secure`.

---

## 1. Backend contract snapshot

### 1.1 Endpoints

| # | Method + path | Auth | Request | Success | Notes |
|---|---|---|---|---|---|
| 1 | `POST /api/v1/auth/sign-up` | public | `SignUp` | `201 AuthTokens` | Sets `refresh_token` cookie |
| 2 | `POST /api/v1/auth/sign-in` | public | `SignIn` | `200 AuthTokens` | Sets `refresh_token`; `Max-Age=604800` only when `rememberMe: true` |
| 3 | `GET /api/v1/auth/session` | Bearer | — | `200 AuthUser` | Used to validate the access token |
| 4 | `POST /api/v1/auth/refresh-session` | refresh cookie | — | `200 AuthTokens` | Rotates the refresh token; the previous token becomes invalid immediately |
| 5 | `POST /api/v1/auth/logout` | optional Bearer + refresh cookie | — | `204` | Bearer alone does **not** revoke the refresh session; the cookie must be forwarded |
| 6 | `POST /api/v1/auth/password-reset/request` | public | `ResetRequest` `{ identifier }` | `202 RecoveryAccepted` | Documented as 202; verify enumeration behavior (unknown vs known identifier) in Phase 4 |
| 7 | `POST /api/v1/auth/password-reset/confirm` | public | `ResetConfirm` `{ token, newPassword }` | `204` | Token comes from the email link |
| 8 | `POST /api/v1/auth/email-verification/request` | Bearer | `Reauthenticate` `{ currentPassword }` | `202 RecoveryAccepted` | Re-authentication required |
| 9 | `POST /api/v1/auth/email-verification/confirm` | Bearer | `TokenConfirm` `{ token }` | `204` | Confirmed from an email link, yet documented as Bearer-protected — see Q5 |
| 10 | `POST /api/v1/auth/email-link/request` | Bearer | `EmailLinkRequest` `{ currentPassword, email }` | `202 RecoveryAccepted` | Links an email to an NPM-only account |
| 11 | `POST /api/v1/auth/email-link/confirm` | Bearer | `TokenConfirm` `{ token }` | `204` | Same Bearer-on-email-link awkwardness as #9 |

### 1.2 DTOs (generated, single source of truth)

```ts
type AuthTokens = {
  user: AuthUser;
  accessToken: string;
  expiresIn: number; // 900 seconds (15 minutes)
};

type AuthUser = {
  id: string;
  fullName: string;
  identifier: string;
  role: "member" | "coach";
};

type SignIn = {
  identifier: string;
  password: string;
  rememberMe?: boolean;
};

type SignUp = {
  fullName: string;
  identifier: string;
  password: string;
};
```

`AuthUser` intentionally has **no email field**. Email lives on the profile endpoints (`ProfileOut.email`) and can be `null` for NPM-only accounts.

### 1.3 Session mechanics (verified against the live BE)

- Access token lifetime: `expiresIn: 900` (15 minutes).
- Refresh cookie name: `refresh_token`.
- Refresh cookie flags observed: `HttpOnly; Path=/api/v1/auth; SameSite=strict`; `Max-Age=604800` only for `rememberMe: true`. **No `Secure` flag observed.**
- Refresh rotates the token. A second concurrent refresh with the previous token returns `401 {"detail":"Sesi berakhir. Silakan masuk kembali."}`.
- Sign-up also sets the refresh cookie, so sign-up can auto-login.
- Sign-up with an NPM succeeds, but the resulting profile has `email: null`. Password reset by email is impossible until an email is linked.
- Identifier accepts either an email or an 8–12 digit NPM. OpenAPI only documents `string`, max 254.

### 1.4 Error shapes (inconsistent)

| Source | Body |
|---|---|
| FastAPI validation (`422`) | `{ "detail": [{ "type", "loc", "msg", "input", "ctx" }] }` |
| Auth domain (`401`/`409`) | `{ "detail": "string" }` |
| Data domain (`401`/`403`) | `{ "detail": "string", "code": "string", "requestId": "string" }` |
| Rate limiting (observed under probe load) | `429` (body not yet documented) |

OpenAPI only documents `422` for the auth endpoints. The FE must normalize all shapes and must not assume `error instanceof Error`.

### 1.5 CORS

`http://localhost:3000` is allowlisted; the BE echoes the allowed origin, sets `Access-Control-Allow-Credentials: true`, and exposes `X-Request-ID`. A disallowed origin gets a `400` preflight. The recommended server-mediated design does not rely on CORS, but direct browser calls remain possible if the design changes.

---

## 2. Gap analysis

| Capability | FE today | BE contract | Gap / action |
|---|---|---|---|
| Sign-in | Stub `useMutation` throwing `"Backend belum tersambung"`; form validates but never calls anything | `POST /auth/sign-in` returns `AuthTokens` + cookie | Wire a server action; map errors; redirect by role |
| Sign-up | Stub `useMutation`; sends no payload; client-only fields not stripped | `POST /auth/sign-up` returns `AuthTokens` + cookie | Wire action; require email as the identifier (A1); strip `confirmPassword`/`terms`; auto-login and redirect |
| Session read | None | `GET /auth/session` | Add `getSession()` with Bearer; server-side role gate |
| Refresh | None | `POST /auth/refresh-session`, rotating | Add proactive refresh in `proxy.ts`; handle rotation |
| Logout | Dead button in `features/profile/components/profile-logout-button.tsx` with `TODO: wire sign-out` | `POST /auth/logout`, cookie must be forwarded | Add sign-out action; clear FE cookies; call BE best-effort |
| Password reset | Dead "Lupa sandi?" button; no routes | request + confirm endpoints | Add flows (design dependency — Q9) |
| Email verification | None | request + confirm (Bearer, re-auth) | Profile-security flow, not public auth — phase 4 |
| Email linking | None | request + confirm (Bearer, re-auth) | Profile-security flow, not public auth — phase 4 |
| DTOs | Hand-written `AuthUser`, `SignInRequest`, `SignInResponse`, `SignUpRequest`, `SignUpResponse` in `features/auth/types.ts` | Generated `AuthTokens`, `AuthUser`, `SignIn`, `SignUp` | Delete duplicates; import from `@/api` |
| Transport | `lib/api-client.ts` does not exist; generated client hardcodes the Vercel base URL | REST | Add runtime base-URL config; add a thin server-only API seam |
| Route protection | No `middleware.ts`/`proxy.ts`, no guards | Role in `AuthUser` | Add optimistic redirect in `proxy.ts` + authoritative role checks in layouts |
| Configuration | `.env.example` says `NEXT_PUBLIC_API_URL=http://localhost:8000`; generated client uses prod | — | Add `runtimeConfigPath`; document env behavior |
| Tests | `tests/unit/auth/stubs.test.ts` pins the old TODO strings and DTO names | — | Replace stub pins with schema/action/session tests |

---

## 3. Decisions

### D1 — Server-mediated transport (server actions + generated SDK)

All auth mutations go through server actions in `features/auth/actions/`. Server actions call the generated SDK functions (`signInApiV1AuthSignInPost`, …) with `throwOnError: false`.

Why:

- The BE refresh cookie is set on the **BE origin** with `Path=/api/v1/auth` and `SameSite=strict`. A browser talking directly to the BE from the FE origin cannot share that cookie with FE server components, and strict cross-site behavior is unreliable.
- A server action receives the BE `Set-Cookie` header, extracts the refresh token, and re-issues it as an `httpOnly` FE cookie. FE server components, actions, and `proxy.ts` can then read it.
- Tokens never enter JS-readable storage.
- The `lib/api-client.ts` + generated SDK seam stays server-side, which matches `docs/CODE_STANDARD.md` §4.

Rejected: browser-side `fetch` with `credentials: "include"` + BE cookie. It would leave FE server components unable to read the session and would force all session logic into the client.

### D2 — Cookie model

| Cookie | Contents | Flags | Lifetime |
|---|---|---|---|
| `ss_at` | Access token | `httpOnly`, `secure` in prod, `sameSite=lax`, `path=/` | `expiresIn` seconds |
| `ss_exp` | Access-token expiry, epoch seconds | same | `expiresIn` seconds |
| `ss_rt` | BE refresh token | same | 7 days if `rememberMe`, otherwise session cookie |
| `ss_remember` | `"1"` when `rememberMe: true` | same | 7 days or session |

`sameSite=lax` (not `strict`) so that a top-level navigation from an email link still carries the session. CSRF for mutations is covered by Next's Server Action origin check plus the fact that all mutations are POST server actions; no `GET` mutation exists.

`secure` is enabled only in production because local checks run over `http://localhost`. Do not use `__Host-` prefixes in development.

### D3 — Refresh in `proxy.ts`, not in every data read

`proxy.ts` runs before routes and server actions. On each matched request:

1. Read `ss_at`, `ss_exp`, `ss_rt`.
2. If `ss_at` is missing, or `ss_exp - now < 60`, call `POST /auth/refresh-session` with `Cookie: refresh_token=<ss_rt>`.
3. On `200`: extract the rotated `refresh_token` from `Set-Cookie` (`headers.getSetCookie?.() ?? [headers.get("set-cookie")]`), write `ss_at`/`ss_exp`/`ss_rt`, and forward the fresh access token upstream as `x-silatsense-access` (deleting any inbound value first) so the **current** render sees the new token.
4. On `401`: clear FE cookies and let the route render signed-out; protected layouts redirect to `/sign-in`.
5. On network/5xx: keep cookies and continue; do not log the user out on a transient BE failure.

Why proxy:

- Refresh requires writing cookies; Server Components cannot write cookies during render.
- Refreshing only near expiry keeps the network cost low (roughly once per 15 minutes per active session).
- Forwarding the fresh token as a request header avoids the one-request lag that would otherwise make the first request after expiry fail.

`getSession()` prefers `x-silatsense-access` (set only by proxy) and falls back to the `ss_at` cookie. The header name is internal and stripped from inbound requests.

### D4 — Role redirect and authorization

- After sign-in/sign-up: `role === "coach" ? "/coach" : "/dashboard"`.
- `next` query parameter is validated against a same-origin allowlist (`/dashboard`, `/latihan`, `/riwayat`, `/profil`, `/coach`) before use; otherwise ignore it.
- `proxy.ts` does only optimistic checks: no session cookie + protected path → `/sign-in?next=...`.
- Authoritative checks live in the `(member)` and `(coach)` layouts via a server `AuthGate` that calls `getSession()` and redirects on missing session or role mismatch. Proxy is never the only authorization layer.

### D5 — Generated DTOs are the only wire types

Delete `features/auth/types.ts` DTO declarations. Any code that needs a wire shape imports from `@/api` (`AuthTokens`, `AuthUser`, `SignIn`, `SignUp`). `features/auth/types.ts` may remain only for FE-only action-result types (`ActionResult`, `AuthActionError`).

### D6 — Zod has three layers

1. **Wire validators (generated):** `zSignIn`, `zSignUp`, `zAuthTokens`, `zAuthUser`, … used automatically by the SDK because `@hey-api/sdk` is configured with `validator: true`. Never hand-write these.
2. **Form validators (RHF):** client-side UX only. `signInSchema` and `signUpSchema` stay in `features/auth/schemas/`, aligned to BE limits.
3. **Action boundary validators:** every server action parses its input with a payload schema derived from the generated wire schema before calling the SDK. Client validation is never trusted.

### D7 — Server actions return serializable results

Server actions must not throw domain errors across the boundary. They return:

```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string; code?: string; fieldErrors?: Record<string, string> } };
```

`redirect()` is not called inside the action. The action returns `redirectTo`, and the client calls `router.replace(redirectTo)` + `router.refresh()`. This keeps `toast.promise` usable and avoids `NEXT_REDIRECT` being treated as a failure.

### D8 — Runtime API configuration, no generated-file edits

Use the hey-api Runtime API:

```ts
// openapi-ts.config.ts
plugins: [
  { name: "@hey-api/client-fetch", runtimeConfigPath: "./src/api/hey-api.ts" },
  "zod",
  { name: "@hey-api/sdk", validator: true },
  "@tanstack/react-query",
]
```

```ts
// src/api/hey-api.ts
import type { CreateClientConfig } from "@/api/client.gen";

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? config.baseUrl,
});
```

`src/api/**` stays untouched by hand. `NEXT_PUBLIC_API_URL` is a public origin, not a secret; using the public prefix makes the same config safe if a generated hook is ever imported by a client component.

### D9 — Sign-out forwards the refresh cookie

`POST /auth/logout` returns `204` even with an invalid token, but it only revokes the refresh session when the cookie is forwarded. The action therefore sends both:

```ts
headers: {
  Authorization: `Bearer ${accessToken}`,
  Cookie: `refresh_token=${refreshToken}`,
}
```

It clears the FE cookies in a `finally` block regardless of the BE result. A failed BE logout must not trap the user in a signed-in FE shell.

### D10 — Recovery flows are part of auth, but split by design readiness

Password reset (request + confirm) is in scope. Email verification and email linking depend on profile-security UI and re-authentication; their actions may land now, but the UI stays a phase-4 item. See Q9.

### 3.11 Review decisions and assumptions (2026-11-02)

The six blocking questions were answered before implementation. These answers override any
earlier wording in this spec.

| # | Answer | Implementation consequence |
|---|---|---|
| A1 (Q1) | **Require email at sign-up.** | `SignUp` has no `email` field, so the FE enforces **email as the sign-up identifier**: the sign-up schema accepts only a valid email (NPM sign-up is removed from the UI). This makes the account recoverable without a BE change. Tradeoff: NPM-only registration is no longer offered. Follow-up: ask the BE to add an explicit `email` field so `identifier` can stay the NPM later. |
| A2 (Q2) | **Assume the BE refresh has a rotation grace window.** Not confirmed. | Keep proxy-only refresh + in-process single-flight. If the assumption is false, concurrent refresh can still return `401`; the proxy then clears cookies and the layout redirects to `/sign-in`, so the failure is safe but visible. Document the assumption in the PR. |
| A3 (Q3) | **Assume the missing `Secure` flag is intentional** for dev/preview. | FE cookies are always `secure` in production. Do not block implementation on the BE flag; re-check before a production rollout. |
| A4 (Q4) | **Assume the BE will not standardize error shapes.** | `normalizeApiError()` permanently covers all observed shapes (§1.4) and treats unknown shapes as a generic failure with the request ID. |
| A5 (Q5) | **Follow the OpenAPI docs** for Bearer-protected email-confirm endpoints. | `email-verification/confirm` and `email-link/confirm` are only called inside an authenticated profile session. No unauthenticated email-link landing page in this scope. |
| A6 (Q6) | **Ignore unverified-email-at-sign-in behavior**, but note it. | No unverified-email gate or message in sign-in. Add a risk note; revisit when the BE defines the behavior. |

Defaults for the non-blocking questions stay as written unless challenged: `rememberMe`
defaults to `false` (Q7), post-login homes are `/coach` and `/dashboard` (Q8), recovery UI
waits for design (Q9), dev-BE test accounts remain until a BE cleanup path exists (Q10),
plain `ss_*` cookie names are used (Q11), and `ss_at` is stored in a cookie (Q12).

---

## 4. Target architecture

```
Browser
  │  form submit (RHF + Zod)
  ▼
features/auth/actions/sign-in.ts            (server action, "use server")
  │  parse payload with generated wire schema
  ▼
signInApiV1AuthSignInPost({ body, throwOnError: false })
  │
  ▼
https://silatsense-be.vercel.app/api/v1/auth/sign-in
  │  200 AuthTokens + Set-Cookie: refresh_token=...
  ▼
action extracts refresh token → sets ss_at / ss_exp / ss_rt / ss_remember
  │
  ▼
{ ok: true, data: { user, redirectTo } }
  │
  ▼
client router.replace(redirectTo) + router.refresh()
```

Refresh path:

```
request → proxy.ts
  ├─ no ss_at/ss_rt                        → next()
  ├─ ss_exp far from expiry                → forward ss_at, next()
  ├─ near expiry + ss_rt                   → POST /auth/refresh-session
  │    ├─ 200 → set rotated cookies, forward new token, next()
  │    ├─ 401 → clear cookies, next()      (layout redirects)
  │    └─ 5xx/network → keep cookies, next()
  └─ protected path + no session           → redirect /sign-in?next=...
```

Session read:

```
server layout
  └─ <Suspense fallback={...}>
       └─ <AuthGate role="member">
            ├─ getSession() → Authorization: Bearer <x-silatsense-access ?? ss_at>
            ├─ 401 → null → redirect("/sign-in")
            └─ role mismatch → redirect(home for actual role)
```

`getSession()` is wrapped in React `cache()` so multiple calls in one request share a single BE request. It is not `'use cache'`: the value is per-request and token-dependent. The SDK call must opt out of fetch caching (`cache: "no-store"`), otherwise a session response could be reused across users. A `401` returns `null`; network/`5xx` throws so a BE outage does not silently sign everyone out.

---

## 5. FE file changes

### 5.1 New files

| Path | Purpose |
|---|---|
| `proxy.ts` | Optimistic route gate + proactive refresh + token forwarding |
| `src/api/hey-api.ts` | `createClientConfig()` runtime base URL |
| `lib/api-client.ts` | Server-only seam: configured client re-export, auth headers, error normalizer |
| `features/auth/data/session.ts` | `getSession()`, `requireSession()`, `requireRole()`, `getAccessToken()` (server-only) |
| `features/auth/data/session-cookies.ts` | Cookie names, options, read/write/clear helpers (server-only) |
| `features/auth/data/rotate-session.ts` | Calls the refresh SDK function, parses the rotated cookie, returns tokens |
| `features/auth/actions/sign-in.ts` | Sign-in server action |
| `features/auth/actions/sign-up.ts` | Sign-up server action (auto-login) |
| `features/auth/actions/sign-out.ts` | Sign-out server action (BE revoke + FE clear) |
| `features/auth/actions/password-reset.ts` | `requestPasswordReset`, `confirmPasswordReset` |
| `features/auth/actions/email-account.ts` | `requestEmailVerification`, `confirmEmailVerification`, `requestEmailLink`, `confirmEmailLink` |
| `features/auth/components/auth-gate.tsx` | Server component: session + role gate |
| `features/auth/schemas/password-reset.ts` | Request/confirm form schemas |
| `features/auth/schemas/email-account.ts` | Re-auth + token form schemas |
| `app/forgot-password/page.tsx` | Thin RSC route |
| `app/reset-password/page.tsx` | Thin RSC route; reads `?token=` |
| `features/auth/pages/forgot-password-page.tsx` | Composition for the request flow |
| `features/auth/pages/reset-password-page.tsx` | Composition for the confirm flow |
| `tests/unit/auth/actions.test.ts` | Payload stripping, cookie capture, error mapping |
| `tests/unit/auth/session.test.ts` | Session read, role checks, 401 vs 5xx behavior |
| `tests/unit/auth/session-cookies.test.ts` | Cookie options and lifetime rules |
| `tests/unit/auth/proxy-refresh.test.ts` | Pure `shouldRefresh()` + token-forwarding decisions |

### 5.2 Modified files

| Path | Change |
|---|---|
| `features/auth/components/sign-in-form.tsx` | Replace stub with `useMutation` → `signInAction`; field errors; redirect |
| `features/auth/components/sign-up-form.tsx` | Replace stub with `signUpAction`; email-only identifier label; strip `confirmPassword`/`terms`; auto-login redirect |
| `features/auth/schemas/sign-in.ts` | Add trim, max lengths, align identifier with BE |
| `features/auth/schemas/sign-up.ts` | `fullName` 3–120, email-only identifier (A1), password 8–128, keep client-only fields |
| `features/auth/schemas/index.ts` | Re-export the new recovery schemas |
| `features/auth/types.ts` | Delete duplicate DTOs; keep only FE-only action-result types |
| `features/profile/components/profile-logout-button.tsx` | Call `signOutAction` and redirect; no business logic in the button |
| `app/(member)/layout.tsx` | Wrap children in `Suspense` + `AuthGate role="member"` |
| `app/(coach)/layout.tsx` | Wrap children in `Suspense` + `AuthGate role="coach"` |
| `openapi-ts.config.ts` | Add `runtimeConfigPath` |
| `.env.example` | Document that `NEXT_PUBLIC_API_URL` is the BE origin and is required in production |
| `tests/unit/auth/stubs.test.ts` | Delete or rewrite; it currently pins the stub strings and old DTO names |
| `tests/unit/auth/schemas.test.ts` | Add boundary cases for the new limits |

### 5.3 Generated files (regenerate, never hand-edit)

`src/api/client.gen.ts` changes when `runtimeConfigPath` is added. Commit the regenerated `src/api/**` in the same task as `openapi-ts.config.ts` so a clean checkout can build.

### 5.4 Deleted files

- `features/auth/types.ts` DTO block (the file may survive with action-result types only).
- Stub assertions in `tests/unit/auth/stubs.test.ts` that encode the old TODO strings.

---

## 6. Generated SDK / query / mutation mapping

| BE endpoint | Generated SDK function | Generated TanStack artifact | Wire Zod |
|---|---|---|---|
| `POST /auth/sign-up` | `signUpApiV1AuthSignUpPost` | `signUpApiV1AuthSignUpPostMutation` | `zSignUp` → `zAuthTokens` |
| `POST /auth/sign-in` | `signInApiV1AuthSignInPost` | `signInApiV1AuthSignInPostMutation` | `zSignIn` → `zAuthTokens` |
| `GET /auth/session` | `authSessionApiV1AuthSessionGet` | `authSessionApiV1AuthSessionGetOptions` / `…QueryKey` | `zAuthUser` |
| `POST /auth/refresh-session` | `refreshApiV1AuthRefreshSessionPost` | `refreshApiV1AuthRefreshSessionPostMutation` | `zAuthTokens` |
| `POST /auth/logout` | `logoutApiV1AuthLogoutPost` | `logoutApiV1AuthLogoutPostMutation` | `void` (204) |
| `POST /auth/password-reset/request` | `resetRequestApiV1AuthPasswordResetRequestPost` | `resetRequestApiV1AuthPasswordResetRequestPostMutation` | `zResetRequest` → `zRecoveryAccepted` |
| `POST /auth/password-reset/confirm` | `resetConfirmApiV1AuthPasswordResetConfirmPost` | `resetConfirmApiV1AuthPasswordResetConfirmPostMutation` | `zResetConfirm` → `void` (204) |
| `POST /auth/email-verification/request` | `emailVerifyApiV1AuthEmailVerificationRequestPost` | `emailVerifyApiV1AuthEmailVerificationRequestPostMutation` | `zReauthenticate` → `zRecoveryAccepted` |
| `POST /auth/email-verification/confirm` | `verifyConfirmApiV1AuthEmailVerificationConfirmPost` | `verifyConfirmApiV1AuthEmailVerificationConfirmPostMutation` | `zTokenConfirm` → `void` (204) |
| `POST /auth/email-link/request` | `emailLinkApiV1AuthEmailLinkRequestPost` | `emailLinkApiV1AuthEmailLinkRequestPostMutation` | `zEmailLinkRequest` → `zRecoveryAccepted` |
| `POST /auth/email-link/confirm` | `linkConfirmApiV1AuthEmailLinkConfirmPost` | `linkConfirmApiV1AuthEmailLinkConfirmPostMutation` | `zTokenConfirm` → `void` (204) |

Usage notes:

- Auth mutations use the **SDK functions inside server actions**, not the generated `useMutation` hooks. The generated hooks would run in the browser and could not set `httpOnly` cookies.
- The generated `useMutation` variables are `Options<...>` (for example `{ body: SignIn }`), not a bare `SignIn`. Keep that shape if a hook is ever used.
- `authSessionApiV1AuthSessionGetOptions` is useful only if a client component needs the session. For the initial implementation, layouts call `getSession()` server-side and pass serializable props; no client session query is needed.
- Generated keys follow the pattern `createQueryKey("authSessionApiV1AuthSessionGet", options)`. If a client session query is added later, invalidate `authSessionApiV1AuthSessionGetQueryKey()` after sign-in/out.

---

## 7. Zod strategy

### 7.1 Limits to align

The generated wire schemas already enforce the BE limits: `zSignUp` has `fullName` 3–120, `password` 8–128, `identifier` max 254; `zSignIn` has `password` 8–128 and `identifier` max 254. The FE form schemas must not be weaker than those.

| Field | Current FE | BE / generated | Action |
|---|---|---|---|
| `fullName` | `trim().min(3)` | 3–120 | Add `.max(120)` |
| `password` | `.min(8)` | 8–128 | Add `.max(128)` on sign-in and sign-up |
| `identifier` (NPM) | `^\d{8,12}$` | 8–12 digits | Sign-in keeps the NPM branch; sign-up accepts email only (A1) |
| `identifier` (email) | `z.string().email()` | string, max 254 | Add `.max(254)`; use this as the sign-up identifier |
| `rememberMe` | default `false` | optional boolean, generated default `false` | Keep |
| `confirmPassword` | required | client-only | Keep in form schema, strip before action |
| `terms` | required `true` | client-only | Keep in form schema, strip before action |

### 7.2 Shape of the schemas

```ts
// features/auth/schemas/sign-in.ts
const identifierSchema = z
  .string()
  .trim()
  .max(254, "NPM atau email terlalu panjang")
  .refine(
    (value) => /^\d{8,12}$/.test(value) || z.string().email().safeParse(value).success,
    "Masukkan NPM atau email yang valid",
  );
```

The exact union shape can stay as today; the important change is `trim()` + `max(254)` and a single user-facing message.

```ts
// features/auth/schemas/sign-up.ts
export const signUpFormSchema = z
  .object({
    fullName: z.string().trim().min(3).max(120),
    identifier: emailIdentifierSchema, // A1: email required, NPM sign-up removed
    password: z.string().min(8).max(128),
    confirmPassword: z.string(),
    terms: z.boolean().refine((v) => v === true),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
  });
```

### 7.3 Action payload schemas

Derive from the generated wire schemas so a BE field rename breaks the build/test rather than silently drifting:

```ts
import { zSignIn, zSignUp } from "@/api/zod.gen";

export const signInPayloadSchema = zSignIn.extend({
  identifier: identifierSchema,
  password: z.string().min(8).max(128),
});

export const signUpPayloadSchema = zSignUp.extend({
  fullName: z.string().trim().min(3).max(120),
  identifier: emailIdentifierSchema, // A1
  password: z.string().min(8).max(128),
});
```

Note: `zSignIn` has `.default(false)` on `rememberMe`, so its input and output types differ. Server actions should accept `z.input<typeof signInPayloadSchema>` and use the parsed output (`rememberMe: boolean`) when calling the SDK.

Server actions parse with the payload schema. `confirmPassword` and `terms` are dropped by the form's explicit mapping:

```ts
const { confirmPassword: _confirm, terms: _terms, ...payload } = values;
await signUpAction(payload);
```

Do not send client-only fields to the BE, and do not rely on `.transform()` alone to hide them — an explicit destructure is easier to test.

### 7.4 Response and error validation

- The generated SDK's `validator: true` validates responses against the generated Zod schemas. A schema mismatch raises before the action returns data; catch it and return a generic `"Respons server tidak dikenali"` with the request ID when available.
- `normalizeApiError()` handles the three error shapes from §1.4:
  - `{ detail: string }` → `{ message: detail }`
  - `{ detail: [{ loc, msg }] }` → `fieldErrors` keyed by the last string in `loc`; message is the first `msg`
  - `{ detail, code, requestId }` → `{ message: detail, code }`
  - network/unknown → `{ message: "Tidak dapat terhubung ke server" }`
- `429` gets a dedicated message (`"Terlalu banyak percobaan. Coba lagi sebentar."`) and no automatic retry loop.

---

## 8. Implementation plan (only after approval)

Each phase is a sub-issue under one parent, per `AGENTS.md`. No code is written before the approval gate.

### Phase 0 — Contract and configuration (0.5 day)

- Commit the generated client and `openapi-ts.config.ts`.
- Add `runtimeConfigPath` + `src/api/hey-api.ts`.
- Add `lib/api-client.ts` and `normalizeApiError`.
- Update `.env.example`.
- Acceptance: `pnpm gen:api` reproduces the tree; `pnpm build` and `tsc --noEmit` pass with and without `NEXT_PUBLIC_API_URL`.

### Phase 1 — Session core and guards (1 day)

- Cookie helpers, `getSession()`, `requireRole()`.
- `proxy.ts` refresh + optimistic gate.
- `AuthGate` and protected layouts.
- Acceptance: unauthenticated `/dashboard` and `/coach` redirect to `/sign-in`; member cannot reach `/coach`; expired `ss_at` with valid `ss_rt` refreshes and the current render succeeds.

### Phase 2 — Sign-in and sign-up (1 day)

- Schemas aligned; action wiring; form error mapping; role redirect; auto-login after sign-up.
- Delete duplicate DTOs; update tests.
- Acceptance: NPM and email sign-in work; sign-up accepts email only and rejects an NPM (A1); wrong password shows the BE message; sign-up logs in and redirects; no client-only fields appear in the request body.

### Phase 3 — Sign-out (0.25 day)

- Sign-out action, logout button wiring, cookie clearing, BE revoke.
- Acceptance: after logout the BE refresh token is revoked (a second refresh with the old token fails); `/dashboard` redirects to `/sign-in`; no stale auth cookie remains.

### Phase 4 — Recovery flows (1–2 days, design-dependent)

- Password reset request/confirm.
- Email verification/link actions; profile-security UI after its own design review.
- Acceptance: 202 is shown as a generic success; invalid/expired token maps to a readable error; new password signs in; legacy NPM-only accounts get an explicit "link an email first" message (A1 keeps new accounts recoverable).

### Phase 5 — Verification (0.5 day)

- Unit tests, build/type/lint/test gates, browser checks, cookie inspection.
- Acceptance: all gates green; `document.documentElement.scrollWidth <= window.innerWidth` on sign-in/sign-up; no token appears in `localStorage`/`sessionStorage`; `ss_at`/`ss_rt` are `HttpOnly`.

---

## 9. Verification plan

Per `docs/CODE_STANDARD.md` §6:

```bash
pnpm gen:api
pnpm build
pnpm exec tsc --noEmit
pnpm lint
pnpm test
```

Browser checks (Playwright, fresh port per run):

1. Sign in with an NPM account → lands on `/dashboard`; sign in with a coach account → lands on `/coach`.
2. Wrong password → toast/inline error, no redirect.
3. Visit `/dashboard` signed out → `/sign-in?next=/dashboard`; after sign-in, returns to `/dashboard`.
4. Force `ss_exp` into the past while keeping a valid `ss_rt` → navigation refreshes once, rotates `refresh_token`, and the page renders.
5. Logout → refresh with the old token returns `401`; protected route redirects.
6. `document.documentElement.scrollWidth <= window.innerWidth` on both auth pages at mobile and desktop widths.
7. DevTools: `ss_at` and `ss_rt` show `HttpOnly`; nothing auth-related in `localStorage`/`sessionStorage`.

Tests to add:

- Schema boundaries: 2/3/120/121 chars for `fullName`; 7/8/128/129 for password; 7/8/12/13 digits for NPM; 254/255 email.
- Action payload: `confirmPassword` and `terms` never reach the SDK; `rememberMe` is sent.
- Cookie capture: a mocked `Set-Cookie` yields the right `ss_rt`; missing `Set-Cookie` returns a contract error.
- Error normalization: all three BE shapes plus network and `429`.
- Session: 401 → `null`; 5xx → throw; role mismatch redirects.
- Proxy: `shouldRefresh()` true at 59s remaining, false at 61s; 401 clears cookies; network failure preserves them.
- Sign-out: clears cookies even when the BE call fails.

---

## 10. Risks

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | Refresh rotation race: two concurrent requests refresh, the second gets `401` and the session dies | High | Proxy-only refresh; in-process single-flight promise keyed by refresh token; ask BE for a 30–60s reuse grace window (Q2) |
| R2 | Multi-instance deployments defeat in-process single-flight | Medium | Same as R1; document that BE grace is the durable fix |
| R3 | BE refresh cookie lacks `Secure` | Medium | FE cookies always set `secure` in production; ask BE to add `Secure` (Q3) |
| R4 | Error shapes differ and are not fully documented | Medium | `normalizeApiError` covers all observed shapes; log `X-Request-ID`; ask BE to standardize (Q4) |
| R5 | Legacy NPM-only accounts cannot reset a password | Medium (product) | New sign-ups require an email (A1); recovery shows an explicit "link an email first" message for legacy accounts |
| R6 | Email verification/link confirm requires Bearer, but users arrive from an email client | Medium | Keep those flows inside an authenticated profile session (A5) |
| R7 | BE rate limiting (`429`) observed during assessment | Medium | No auto-retry; friendly message; backoff guidance in the UI |
| R8 | Proxy refresh adds latency on the request that crosses the expiry threshold | Low | Refresh 60s early; only near expiry; 5xx does not sign the user out |
| R9 | Open redirect through `next` | Medium | Same-origin allowlist before `router.replace` |
| R10 | Server-side role check and proxy check drift | Medium | Single `requireRole()` helper used by both layouts; tests for wrong-role redirects |
| R11 | Generated client is still uncommitted, so a clean checkout cannot build | Medium | Phase 0 commits generated output with the config |
| R12 | Other tabs keep stale UI after logout | Low | Cookies are shared and cleared immediately; `router.refresh()` on focus is a later enhancement |
| R13 | Access token in a cookie can be replayed if the FE server is compromised | Low | `httpOnly` + short 15-minute lifetime; same risk as any server-side session |
| R14 | Unverified email at sign-in: the BE behavior is unknown, so an unverified account may be signed in silently | Low | Ignored per A6; note in the PR and revisit when the BE defines the rule |
| R15 | Email-only sign-up removes the NPM registration path | Low (product) | Recorded in A1; revisit when the BE exposes an explicit `email` field so `identifier` can accept both |

---

## 11. Open questions and review outcomes

### Resolved (2026-11-02)

| Q | Question | Answer | Record |
|---|---|---|---|
| Q1 | NPM-only password reset | Require email at sign-up; sign-up identifier is email-only until the BE adds an `email` field | A1 |
| Q2 | Refresh rotation grace | Assumed present; keep single-flight and fail safe on `401` | A2 |
| Q3 | `Secure` on the BE refresh cookie | Assumed intentional for dev/preview; FE cookies are secure in production | A3 |
| Q4 | Error contract | Assume no standardization; normalize every observed shape | A4 |
| Q5 | Bearer on email-confirm endpoints | Follow OpenAPI; keep those flows inside an authenticated session | A5 |
| Q6 | Verified email required at sign-in | Ignored for now, noted as a risk | A6 |

### Non-blocking (defaults apply unless challenged)

7. **`rememberMe` default (Q7).** Defaults to `false` (session cookie); a 7-day session only
   when the user opts in.
8. **Role destinations (Q8).** `/coach` for coaches, `/dashboard` for members, including a
   coach who lands on `/dashboard`.
9. **Recovery UI (Q9).** `/forgot-password` and `/reset-password` have no Figma. Phase 4
   reuses the auth shell until a design exists.
10. **Test-account cleanup (Q10).** Two dev-BE accounts remain until the BE exposes a delete
    path (see §13).
11. **Cookie prefix (Q11).** Plain `ss_*` names; `__Host-` would break `http://localhost`.
12. **Access token storage (Q12).** `ss_at` stays in an `httpOnly` cookie so server
    components and actions can read it.

---

## 12. Out of scope

- Profile editing, avatar, coach roster, session upload, and every other feature module.
- Backend changes (BE owns the fixes for Q2–Q5).
- Deleting the assessment accounts (Q10).
- A UI redesign of the auth pages; this spec preserves the existing layout.
- Migration of other modules to the generated client; auth is the pilot.

---

## 13. Assessment side effects

Created during live probing on the dev BE (no delete endpoint exists):

- NPM `227006104`, password `wrongpassword`, display name `Test User`.
- Email `integration.probe@student.unsil.ac.id`, password `probepass123`, display name `Integration Probe`.

Both are dev-only and should be removed once the BE exposes a cleanup path. Do not reuse them for production-like tests.
