import "server-only";
import { cookies } from "next/headers";

export const AUTH_ACCESS_TOKEN_COOKIE = "ss_at";
export const AUTH_REFRESH_TOKEN_COOKIE = "ss_rt";
export const AUTH_EXPIRY_COOKIE = "ss_exp";
export const AUTH_REMEMBER_COOKIE = "ss_remember";

const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

export function extractCookieValue(
  setCookieHeader: string | string[] | null | undefined,
  name: string
): string | undefined {
  if (!setCookieHeader) return undefined;
  const headers = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  for (const header of headers) {
    const parts = header.split(";");
    for (const part of parts) {
      const [cookieName, ...cookieVal] = part.trim().split("=");
      if (cookieName === name) {
        return cookieVal.join("=");
      }
    }
  }
  return undefined;
}

export function getCookieBaseOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

export type SessionCookieValues = {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  rememberMe: boolean;
};

export async function getSessionCookies(): Promise<SessionCookieValues> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = cookieStore.get(AUTH_REFRESH_TOKEN_COOKIE)?.value;
  const expStr = cookieStore.get(AUTH_EXPIRY_COOKIE)?.value;
  const rememberStr = cookieStore.get(AUTH_REMEMBER_COOKIE)?.value;

  const expiresAt = expStr ? Number.parseInt(expStr, 10) : undefined;
  const rememberMe = rememberStr === "1";

  return {
    accessToken,
    refreshToken,
    expiresAt: Number.isFinite(expiresAt) ? expiresAt : undefined,
    rememberMe,
  };
}

export type SetSessionCookiesParams = {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number; // in seconds (e.g. 900)
  rememberMe?: boolean;
};

export async function setSessionCookies(params: SetSessionCookiesParams): Promise<void> {
  const cookieStore = await cookies();
  const baseOptions = getCookieBaseOptions();
  const remember = params.rememberMe ?? false;

  // Access token cookie lives for expiresIn seconds
  cookieStore.set(AUTH_ACCESS_TOKEN_COOKIE, params.accessToken, {
    ...baseOptions,
    maxAge: params.expiresIn,
  });

  // Expiry timestamp (epoch seconds)
  const expiresAt = Math.floor(Date.now() / 1000) + params.expiresIn;
  cookieStore.set(AUTH_EXPIRY_COOKIE, expiresAt.toString(), {
    ...baseOptions,
    maxAge: params.expiresIn,
  });

  // Remember flag
  cookieStore.set(AUTH_REMEMBER_COOKIE, remember ? "1" : "0", {
    ...baseOptions,
    maxAge: remember ? SEVEN_DAYS_SECONDS : undefined,
  });

  // Refresh token cookie (7 days if rememberMe, otherwise browser session cookie)
  if (params.refreshToken) {
    cookieStore.set(AUTH_REFRESH_TOKEN_COOKIE, params.refreshToken, {
      ...baseOptions,
      maxAge: remember ? SEVEN_DAYS_SECONDS : undefined,
    });
  }
}

export async function clearSessionCookies(): Promise<void> {
  const cookieStore = await cookies();
  const baseOptions = getCookieBaseOptions();

  cookieStore.delete({ name: AUTH_ACCESS_TOKEN_COOKIE, ...baseOptions });
  cookieStore.delete({ name: AUTH_REFRESH_TOKEN_COOKIE, ...baseOptions });
  cookieStore.delete({ name: AUTH_EXPIRY_COOKIE, ...baseOptions });
  cookieStore.delete({ name: AUTH_REMEMBER_COOKIE, ...baseOptions });
}
