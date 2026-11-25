"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zAcceptedSession, zUploadConfig, zUploadRequest, zUploadTicket } from "@/api/zod.gen";
import type { AcceptedSession, UploadTicket } from "@/api";
import { authenticatedRequest } from "@/features/auth/data/authenticated-request";
import { client, normalizeApiError } from "@/lib/api-client";
import type { ActionResult } from "@/features/member/types";
const keySchema = z.string().trim().min(1).max(128);
export async function initUpload(input: unknown, key: string): Promise<ActionResult<UploadTicket>> {
  const parsed = zUploadRequest.safeParse(input);
  if (!parsed.success || !keySchema.safeParse(key).success) return { ok: false, error: { message: "Metadata unggahan tidak valid." } };
  try {
    const configResult = await authenticatedRequest((token) => client.get({ url: "/api/v1/member/record-config/{slug}", path: { slug: parsed.data.movementSlug }, headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20_000), cache: "no-store" }));
    if (!configResult.response?.ok) return { ok: false, error: normalizeApiError(configResult.error, configResult.response) };
    const config = zUploadConfig.parse(configResult.data);
    if (parsed.data.byteSize > config.maxBytes || !config.acceptedMimeTypes.includes(parsed.data.mimeType)) return { ok: false, error: { message: "Ukuran atau format rekaman tidak sesuai konfigurasi." } };
    if ((config.movementIdRequired && !parsed.data.movementId) || (parsed.data.movementId && !config.movements?.some((item) => item.id === parsed.data.movementId))) return { ok: false, error: { message: "Pilih target gerakan yang sesuai kategori." } };
    const result = await authenticatedRequest((token) => client.post({ url: "/api/v1/member/uploads", body: parsed.data, headers: { Authorization: `Bearer ${token}`, "Idempotency-Key": key }, signal: AbortSignal.timeout(20_000), cache: "no-store" }));
    if (!result.response?.ok) return { ok: false, error: normalizeApiError(result.error, result.response) };
    return { ok: true, data: zUploadTicket.parse(result.data) };
  } catch { return { ok: false, error: { message: "Gagal meminta tiket unggahan. Periksa koneksi lalu coba lagi." } }; }
}
export async function completeUpload(uploadId: string): Promise<ActionResult<AcceptedSession>> {
  if (!z.string().min(1).max(128).safeParse(uploadId).success) return { ok: false, error: { message: "Identitas unggahan tidak valid." } };
  try {
    // Backend complete is idempotent by uploadId; never allocate another ticket here.
    const result = await authenticatedRequest((token) => client.post({ url: "/api/v1/member/uploads/{upload_id}/complete", path: { upload_id: uploadId }, headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20_000), cache: "no-store" }));
    if (!result.response?.ok) return { ok: false, error: normalizeApiError(result.error, result.response) };
    const data = zAcceptedSession.parse(result.data);
    revalidatePath("/riwayat"); revalidatePath("/dashboard");
    return { ok: true, data };
  } catch { return { ok: false, error: { message: "Konfirmasi unggahan gagal. Coba konfirmasi lagi tanpa merekam ulang." } }; }
}
