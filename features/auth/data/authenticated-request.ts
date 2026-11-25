import "server-only";
import { getAccessToken } from "@/features/auth/data/session";
import { getSessionCookies, setSessionCookies } from "@/features/auth/data/session-cookies";
import { rotateSession } from "@/features/auth/data/rotate-session";

/** Replay only safe reads or mutations explicitly protected by backend idempotency. */
export async function authenticatedRequest<T>(request: (token: string) => Promise<T & { response?: Response }>): Promise<T & { response?: Response }> {
  const token = await getAccessToken();
  const result = await request(token ?? "");
  if (result.response?.status !== 401) return result;
  const cookies = await getSessionCookies();
  if (!cookies.refreshToken) return result;
  const rotated = await rotateSession(cookies.refreshToken);
  if (!rotated.ok) return result;
  await setSessionCookies({ accessToken: rotated.data.accessToken, refreshToken: rotated.data.rotatedRefreshToken,
    expiresIn: rotated.data.expiresIn, rememberMe: cookies.rememberMe });
  return request(rotated.data.accessToken);
}
