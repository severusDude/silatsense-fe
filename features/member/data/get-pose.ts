import "server-only";
import { cache } from "react";
import { zPoseOut } from "@/api/zod.gen";
import { getAccessToken } from "@/features/auth/data/session";
import { client } from "@/lib/api-client";
export const getPose = cache(async (sessionId: string, role: "member" | "coach") => {
  const token = await getAccessToken();
  if (!token) return { timeline: null, error: "Masuk kembali untuk memuat overlay." };
  try {
    const result = await client.get({ url: `/api/v1/${role}/sessions/{session_id}/pose`, path: { session_id: sessionId }, headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(15_000) });
    if (!result.response?.ok) return { timeline: null, error: "Overlay belum tersedia. Hasil evaluasi tetap dapat dibaca." };
    const data = zPoseOut.parse(result.data);
    return { timeline: data.timeline ?? null, error: data.timeline ? undefined : "Timeline pose tidak tersedia untuk hasil ini." };
  } catch { return { timeline: null, error: "Overlay gagal dimuat. Muat ulang halaman untuk mencoba lagi." }; }
});
