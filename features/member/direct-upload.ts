import type { AcceptedSession, UploadRequest, UploadTicket } from "@/api";
import type { ActionResult } from "@/features/member/types";
export type UploadActions = {
  initAction: (input: unknown, key: string) => Promise<ActionResult<UploadTicket>>;
  completeAction: (uploadId: string) => Promise<ActionResult<AcceptedSession>>;
};
export type UploadState = { ticket?: UploadTicket; putComplete?: boolean; metadata?: UploadRequest };
export async function checksum(blob: Blob): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(hash), (value) => value.toString(16).padStart(2, "0")).join("");
}
export async function directUpload(state: UploadState, metadata: UploadRequest, key: string, blob: Blob, actions: UploadActions,
  put: (ticket: UploadTicket, blob: Blob) => Promise<void>, signal: AbortSignal): Promise<AcceptedSession> {
  signal.throwIfAborted();
  if (!state.ticket || (!state.putComplete && Date.parse(state.ticket.expiresAt) <= Date.now())) {
    const result = await actions.initAction(metadata, key);
    if (!result.ok) throw new Error(result.error.message);
    state.ticket = result.data;
  }
  signal.throwIfAborted();
  if (state.ticket.acceptedSession) return state.ticket.acceptedSession;
  if (!state.putComplete) {
    if (!state.ticket.uploadUrl) throw new Error("Tiket unggahan tidak memiliki alamat penyimpanan.");
    await put(state.ticket, blob);
    state.putComplete = true;
  }
  signal.throwIfAborted();
  const result = await actions.completeAction(state.ticket.uploadId);
  if (!result.ok) throw new Error(`Video sudah terunggah. ${result.error.message}`);
  return result.data;
}
export function putVideo(ticket: UploadTicket, blob: Blob, onProgress: (value: number) => void, signal: AbortSignal, onXhr: (xhr: XMLHttpRequest) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const xhr = new XMLHttpRequest();
    onXhr(xhr);
    xhr.open("PUT", ticket.uploadUrl!);
    xhr.withCredentials = false;
    xhr.timeout = 120_000;
    // Only storage ticket headers. Never attach backend cookies or Authorization.
    for (const [key, value] of Object.entries(ticket.headers)) {
      if (/^(authorization|cookie)$/i.test(key)) { reject(new Error("Header tiket penyimpanan tidak aman.")); return; }
      xhr.setRequestHeader(key, value);
    }
    const abort = () => xhr.abort();
    signal.addEventListener("abort", abort, { once: true });
    const finish = (error?: string) => { signal.removeEventListener("abort", abort); if (error) reject(new Error(error)); else resolve(); };
    xhr.upload.onprogress = (event) => { if (event.lengthComputable) onProgress(Math.min(99, Math.round(event.loaded / event.total * 100))); };
    xhr.onload = () => finish(xhr.status >= 200 && xhr.status < 300 ? undefined : "Penyimpanan menolak unggahan. Coba lagi dengan tiket yang sama.");
    xhr.onerror = () => finish("Unggahan ke penyimpanan gagal. Periksa koneksi dan konfigurasi CORS.");
    xhr.ontimeout = () => finish("Unggahan ke penyimpanan melewati batas waktu. Coba lagi.");
    xhr.onabort = () => finish("Unggahan dibatalkan.");
    xhr.send(blob);
  });
}
