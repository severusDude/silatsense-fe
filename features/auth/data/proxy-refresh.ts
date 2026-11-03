export type ShouldRefreshParams = {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  now?: number;
};

export function shouldRefresh({
  accessToken,
  refreshToken,
  expiresAt,
  now = Math.floor(Date.now() / 1000),
}: ShouldRefreshParams): boolean {
  if (!refreshToken) return false;
  if (!accessToken) return true;
  if (!expiresAt) return true;

  // Refresh if within 60 seconds of expiry
  return expiresAt - now < 60;
}

export function isProtectedRoute(pathname: string): boolean {
  const protectedPrefixes = ["/dashboard", "/latihan", "/riwayat", "/profil", "/coach"];
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isAuthRoute(pathname: string): boolean {
  return pathname === "/sign-in" || pathname === "/sign-up";
}
