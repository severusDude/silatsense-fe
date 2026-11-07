import { NextResponse, type NextRequest } from "next/server";
import {
  AUTH_ACCESS_TOKEN_COOKIE,
  AUTH_EXPIRY_COOKIE,
  AUTH_REFRESH_TOKEN_COOKIE,
  AUTH_REMEMBER_COOKIE,
  extractCookieValue,
  getCookieBaseOptions,
} from "./features/auth/data/session-cookies";
import { isAuthRoute, isProtectedRoute, shouldRefresh } from "./features/auth/data/proxy-refresh";

export const config = {
  matcher: [
    "/((?!api/member/sessions/?$|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-silatsense-access");

  let accessToken = request.cookies.get(AUTH_ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(AUTH_REFRESH_TOKEN_COOKIE)?.value;
  const expStr = request.cookies.get(AUTH_EXPIRY_COOKIE)?.value;
  const remember = request.cookies.get(AUTH_REMEMBER_COOKIE)?.value === "1";
  const expiresAt = expStr ? Number.parseInt(expStr, 10) : undefined;

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const baseCookieOptions = getCookieBaseOptions();

  // Proactive refresh
  if (shouldRefresh({ accessToken, refreshToken, expiresAt })) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://silatsense-be.vercel.app";
    try {
      const res = await fetch(`${apiUrl}/api/v1/auth/refresh-session`, {
        method: "POST",
        headers: {
          Cookie: `refresh_token=${refreshToken}`,
        },
      });

      if (res.ok) {
        const body = (await res.json()) as {
          accessToken: string;
          expiresIn: number;
          user: unknown;
        };

        accessToken = body.accessToken;
        const newExpiresAt = Math.floor(Date.now() / 1000) + body.expiresIn;

        // Extract rotated refresh token from BE Set-Cookie
        const setCookies = res.headers.getSetCookie?.() ?? [res.headers.get("set-cookie") ?? ""];
        const rotatedRt = extractCookieValue(setCookies, "refresh_token") ?? refreshToken;

        // Forward fresh token on request for the current server component render
        requestHeaders.set("x-silatsense-access", accessToken);
        response = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });

        // Set fresh cookies on response
        response.cookies.set(AUTH_ACCESS_TOKEN_COOKIE, accessToken, {
          ...baseCookieOptions,
          maxAge: body.expiresIn,
        });
        response.cookies.set(AUTH_EXPIRY_COOKIE, newExpiresAt.toString(), {
          ...baseCookieOptions,
          maxAge: body.expiresIn,
        });
        response.cookies.set(AUTH_REMEMBER_COOKIE, remember ? "1" : "0", {
          ...baseCookieOptions,
          maxAge: remember ? SEVEN_DAYS_SECONDS : undefined,
        });
        if (rotatedRt) {
          response.cookies.set(AUTH_REFRESH_TOKEN_COOKIE, rotatedRt, {
            ...baseCookieOptions,
            maxAge: remember ? SEVEN_DAYS_SECONDS : undefined,
          });
        }
      } else if (res.status === 401) {
        // Refresh token invalid or revoked
        accessToken = undefined;
        response.cookies.delete({ name: AUTH_ACCESS_TOKEN_COOKIE, ...baseCookieOptions });
        response.cookies.delete({ name: AUTH_REFRESH_TOKEN_COOKIE, ...baseCookieOptions });
        response.cookies.delete({ name: AUTH_EXPIRY_COOKIE, ...baseCookieOptions });
        response.cookies.delete({ name: AUTH_REMEMBER_COOKIE, ...baseCookieOptions });
      }
    } catch {
      // Network failure: do not clear session
    }
  }

  // Optimistic redirect checks
  const hasValidAuth = Boolean(accessToken || refreshToken);

  if (isProtectedRoute(pathname) && !hasValidAuth) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (isAuthRoute(pathname) && hasValidAuth) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}
