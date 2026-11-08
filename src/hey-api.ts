import type { CreateClientConfig } from "@/api/client.gen";
import { fetchWithTransientRetry } from "@/lib/api-client";

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? config?.baseUrl ?? "https://silatsense-be.vercel.app",
  fetch: fetchWithTransientRetry,
});
