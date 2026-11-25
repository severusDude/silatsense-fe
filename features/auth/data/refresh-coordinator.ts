import "server-only";

// Per-process only. Successful rotation is shared for 30s across parallel requests.
type Rotation = { expires: number; result: Promise<Response> };
const processState = globalThis as typeof globalThis & { silatsenseRotations?: Map<string, Rotation> };
const rotations = processState.silatsenseRotations ??= new Map<string, Rotation>();
export async function coordinatedRefresh(refreshToken: string): Promise<Response> {
  const now = Date.now();
  for (const [key, entry] of rotations) if (entry.expires <= now) rotations.delete(key);
  let entry = rotations.get(refreshToken);
  if (!entry) {
    const result = fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "https://silatsense-be.vercel.app"}/api/v1/auth/refresh-session`, {
      method: "POST", headers: { Cookie: `refresh_token=${refreshToken}` },
      cache: "no-store", signal: AbortSignal.timeout(15_000),
    });
    entry = { expires: Number.POSITIVE_INFINITY, result };
    rotations.set(refreshToken, entry);
    void result.then((response) => {
      if (response.ok) {
        entry!.expires = Date.now() + 30_000;
        const timer = setTimeout(() => { if (rotations.get(refreshToken) === entry) rotations.delete(refreshToken); }, 30_000);
        timer.unref?.();
      }
      else rotations.delete(refreshToken);
    }, () => rotations.delete(refreshToken));
  }
  return (await entry.result).clone();
}
