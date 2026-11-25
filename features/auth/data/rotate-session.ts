import "server-only";
import { coordinatedRefresh } from "@/features/auth/data/refresh-coordinator";
import { zAuthTokens } from "@/api/zod.gen";
import type { AuthTokens } from "@/api";
import { extractCookieValue } from "./session-cookies";

export type RotateSessionResult =
  | { ok: true; data: AuthTokens & { rotatedRefreshToken?: string } }
  | { ok: false; status: number; error: unknown };

export async function rotateSession(refreshToken: string): Promise<RotateSessionResult> {
  let response: Response;
  try { response = await coordinatedRefresh(refreshToken); }
  catch { return { ok: false, status: 503, error: { detail: "Layanan sesi tidak terhubung." } }; }
  if (!response.ok) return { ok: false, status: response.status, error: undefined };
  const parsed = zAuthTokens.safeParse(await response.json());
  if (!parsed.success) return { ok: false, status: 502, error: undefined };
  const data = parsed.data;

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
