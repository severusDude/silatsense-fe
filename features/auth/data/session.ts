import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authSessionApiV1AuthSessionGet } from "@/api";
import type { AuthUser } from "@/api";
import { getSessionCookies } from "./session-cookies";

export const INTERNAL_ACCESS_HEADER = "x-silatsense-access";

export async function getAccessToken(): Promise<string | undefined> {
  const headerStore = await headers();
  const forwardedToken = headerStore.get(INTERNAL_ACCESS_HEADER);
  if (forwardedToken) {
    return forwardedToken;
  }

  const cookies = await getSessionCookies();
  return cookies.accessToken;
}

export const getSession = cache(async (): Promise<AuthUser | null> => {
  const token = await getAccessToken();
  if (!token) {
    return null;
  }

  const { data, error, response } = await authSessionApiV1AuthSessionGet({
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
    throwOnError: false,
  });

  if (response?.status === 401) {
    return null;
  }

  if (error || !data) {
    throw new Error(
      `Gagal memeriksa sesi auth (status: ${response?.status ?? "unknown"}): ${
        typeof error === "string" ? error : "Layanan auth bermasalah"
      }`
    );
  }

  return data;
});

export async function requireSession(): Promise<AuthUser> {
  const user = await getSession();
  if (!user) {
    redirect("/sign-in");
  }
  return user;
}

export async function requireRole(allowedRole: "member" | "coach"): Promise<AuthUser> {
  const user = await requireSession();
  if (user.role !== allowedRole) {
    if (user.role === "coach") {
      redirect("/coach");
    } else {
      redirect("/dashboard");
    }
  }
  return user;
}
