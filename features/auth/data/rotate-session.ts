import "server-only";
import { refreshApiV1AuthRefreshSessionPost } from "@/api";
import type { AuthTokens } from "@/api";
import { extractCookieValue } from "./session-cookies";

export type RotateSessionResult =
  | { ok: true; data: AuthTokens & { rotatedRefreshToken?: string } }
  | { ok: false; status: number; error: unknown };

export async function rotateSession(refreshToken: string): Promise<RotateSessionResult> {
  const { data, error, response } = await refreshApiV1AuthRefreshSessionPost({
    headers: {
      Cookie: `refresh_token=${refreshToken}`,
    },
    throwOnError: false,
  });

  if (error || !data || !response) {
    return {
      ok: false,
      status: response?.status ?? 500,
      error,
    };
  }

  const setCookies = response.headers.getSetCookie?.() ?? [response.headers.get("set-cookie") ?? ""];
  const rotatedRefreshToken = extractCookieValue(setCookies, "refresh_token");

  return {
    ok: true,
    data: {
      ...data,
      rotatedRefreshToken: rotatedRefreshToken || refreshToken,
    },
  };
}
