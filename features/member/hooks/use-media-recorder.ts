"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { MovementOption, UploadRequest } from "@/api";
import { checksum, directUpload, putVideo, type UploadActions, type UploadState } from "@/features/member/direct-upload";
import { formatBytes } from "@/features/member/data/format";
import {
  baseMimeType,
  effectiveUploadMaxBytes,
  pickRecorderMimeType,
  recordingFileName,
} from "@/features/member/recorder";
import type {
  RecordedClip,
  RecorderPhase,
  TrainingModuleSlug,
} from "@/features/member/types";

export function useMediaRecorder({
  slug,
  movementId,
  movements = [],
  movementIdRequired = false,
  initAction,
  completeAction,
  stream,
  countdownSec,
  maxDurationSec,
  maxBytes,
  acceptedMimeTypes,
  retryOf = null,
  onRecordingComplete,
}: {
  slug: TrainingModuleSlug;
  movementId?: string;
  movements?: MovementOption[];
  movementIdRequired?: boolean;
  initAction: UploadActions["initAction"];
  completeAction: UploadActions["completeAction"];
  stream: MediaStream | null;
  countdownSec: number;
  maxDurationSec: number;
  maxBytes: number;
  acceptedMimeTypes: string[];
  retryOf?: string | null;
  onRecordingComplete?: () => void;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<RecorderPhase>("idle");
  const [countdownRemaining, setCountdownRemaining] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecordedClip | null>(null);

  const uploadStateRef = useRef<UploadState>({});
  const abortRef = useRef<AbortController | null>(null);
  const targetRef = useRef<string | undefined>(undefined);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const mimeTypeRef = useRef<string | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const stoppingRef = useRef(false);
  const mountedRef = useRef(true);
  const onRecordingCompleteRef = useRef(onRecordingComplete);

  useEffect(() => {
    onRecordingCompleteRef.current = onRecordingComplete;
  }, [onRecordingComplete]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;

      abortRef.current?.abort();
      const xhr = xhrRef.current;
      if (xhr) {
        xhr.upload.onprogress = null;
        xhr.onload = null;
        xhr.onerror = null;
        xhr.ontimeout = null;
        xhr.onabort = null;
        xhr.abort();
        xhrRef.current = null;
      }

      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        recorder.onerror = null;
        recorder.stop();
      }
      recorderRef.current = null;

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (stoppingRef.current) return;
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    stoppingRef.current = true;
    recorder.stop();
  }, []);

  const beginRecording = useCallback(() => {
    if (recorderRef.current) return;

    const videoTrack = stream?.getVideoTracks()[0];
    if (!stream || !videoTrack || videoTrack.readyState !== "live") {
      setPhase("idle");
      setError("Kamera terputus. Pindai ulang lalu coba lagi.");
      return;
    }

    const limit = Math.max(1, maxDurationSec);

    try {
      const recorder = new MediaRecorder(
        stream,
        mimeTypeRef.current ? { mimeType: mimeTypeRef.current } : undefined,
      );

      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        recorder.onstop = null;
        recorderRef.current = null;
        stoppingRef.current = false;
        chunksRef.current = [];
        if (!mountedRef.current) return;
        setPhase("idle");
        setError("Perekaman gagal. Pindai ulang kamera lalu coba lagi.");
      };
      recorder.onstop = () => {
        const mimeType =
          recorder.mimeType || mimeTypeRef.current || "video/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        const startedAt = startedAtRef.current ?? Date.now();
        const duration = Math.min(
          limit,
          Math.max(0, (Date.now() - startedAt) / 1000),
        );
        const previewUrl = URL.createObjectURL(blob);

        recorderRef.current = null;
        stoppingRef.current = false;
        startedAtRef.current = null;
        previewUrlRef.current = previewUrl;

        if (!mountedRef.current) {
          URL.revokeObjectURL(previewUrl);
          previewUrlRef.current = null;
          return;
        }

        const uploadLimit = effectiveUploadMaxBytes(maxBytes);
        const clip: RecordedClip = {
          blob,
          previewUrl,
          durationSec: duration,
          byteSize: blob.size,
          mimeType,
          fileName: recordingFileName(slug, mimeType),
        };

        idempotencyKeyRef.current = crypto.randomUUID();
        setElapsedSec(duration);
        setResult(clip);
        setPhase("recorded");
        setProgress(0);
        setError(
          blob.size === 0
            ? "Rekaman kosong. Coba rekam ulang."
            : blob.size > uploadLimit
              ? `Ukuran rekaman ${formatBytes(blob.size)} melebihi batas ${formatBytes(uploadLimit)}.`
              : null,
        );
        onRecordingCompleteRef.current?.();
      };

      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      recorder.start(1000);
      setPhase("recording");
      setError(null);
    } catch {
      recorderRef.current = null;
      stoppingRef.current = false;
      chunksRef.current = [];
      setPhase("idle");
      setError(
        "Perekaman tidak dapat dimulai. Tutup aplikasi lain yang memakai kamera lalu coba lagi.",
      );
    }
  }, [maxBytes, maxDurationSec, slug, stream]);

  const start = useCallback(() => {
    if (phase !== "idle") return;
    if ((movementIdRequired && !movementId) || (movementId && !movements.some((item) => item.id === movementId))) {
      setError("Pilih target gerakan sebelum merekam."); return;
    }
    targetRef.current = movementId;
    uploadStateRef.current = {};

    if (
      typeof window === "undefined" ||
      typeof MediaRecorder === "undefined"
    ) {
      setError(
        "Browser ini tidak mendukung perekaman video. Gunakan Chrome, Edge, atau Safari terbaru.",
      );
      return;
    }

    const videoTrack = stream?.getVideoTracks()[0];
    if (!stream || !videoTrack || videoTrack.readyState !== "live") {
      setError("Kamera belum siap. Pindai dan pilih kamera terlebih dahulu.");
      return;
    }

    const mimeType = pickRecorderMimeType(acceptedMimeTypes, (candidate) =>
      MediaRecorder.isTypeSupported(candidate),
    );
    if (!mimeType) {
      setError(
        "Tidak ada format rekaman yang didukung browser ini. Gunakan browser terbaru lalu coba lagi.",
      );
      return;
    }

    mimeTypeRef.current = mimeType;
    chunksRef.current = [];
    idempotencyKeyRef.current = null;
    setProgress(0);
    setElapsedSec(0);
    setCountdownRemaining(Math.max(0, Math.round(countdownSec)));
    setError(null);
    setPhase("countdown");
  }, [acceptedMimeTypes, countdownSec, phase, stream, movementId, movementIdRequired, movements]);

  const cancelCountdown = useCallback(() => {
    setPhase("idle");
    setCountdownRemaining(0);
    setElapsedSec(0);
    setError(null);
  }, []);

  const discard = useCallback(() => {
    abortRef.current?.abort();
    uploadStateRef.current = {};
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.onerror = null;
      recorder.stop();
    }
    recorderRef.current = null;
    stoppingRef.current = false;
    chunksRef.current = [];
    startedAtRef.current = null;
    mimeTypeRef.current = null;
    idempotencyKeyRef.current = null;

    const xhr = xhrRef.current;
    if (xhr) {
      xhr.upload.onprogress = null;
      xhr.onload = null;
      xhr.onerror = null;
      xhr.ontimeout = null;
      xhr.onabort = null;
      xhr.abort();
      xhrRef.current = null;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setResult(null);
    setPhase("idle");
    setCountdownRemaining(0);
    setElapsedSec(0);
    setProgress(0);
    setError(null);
  }, []);

  useEffect(() => {
    if (phase !== "countdown") return;

    if (countdownRemaining <= 0) {
      const id = window.setTimeout(() => beginRecording(), 0);
      return () => window.clearTimeout(id);
    }

    const id = window.setTimeout(() => {
      setCountdownRemaining((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(id);
  }, [beginRecording, countdownRemaining, phase]);

  useEffect(() => {
    if (phase !== "recording") return;

    const limit = Math.max(1, maxDurationSec);
    const id = window.setInterval(() => {
      const startedAt = startedAtRef.current;
      if (startedAt === null) return;
      const next = Math.min(limit, (Date.now() - startedAt) / 1000);
      setElapsedSec(next);
      if (next >= limit) stop();
    }, 250);

    return () => window.clearInterval(id);
  }, [maxDurationSec, phase, stop]);

  const upload = useCallback(() => {
    if (!result) return;
    if (
      phase === "uploading" ||
      phase === "countdown" ||
      phase === "recording"
    ) {
      return;
    }

    const uploadLimit = effectiveUploadMaxBytes(maxBytes);
    if (result.byteSize <= 0) {
      setPhase("failed");
      setError("Rekaman kosong. Coba rekam ulang.");
      return;
    }
    if (result.byteSize > uploadLimit) {
      setPhase("failed");
      setError(
        `Ukuran rekaman ${formatBytes(result.byteSize)} melebihi batas ${formatBytes(uploadLimit)}.`,
      );
      return;
    }

    const idempotencyKey =
      idempotencyKeyRef.current ?? crypto.randomUUID();
    idempotencyKeyRef.current = idempotencyKey;

    setPhase("uploading"); setProgress(0); setError(null);
    const controller = new AbortController();
    abortRef.current = controller;
    void (async () => {
      try {
        const state = uploadStateRef.current;
        if (!state.metadata) state.metadata = {
          movementSlug: slug, movementId: targetRef.current as UploadRequest["movementId"],
          filename: result.fileName, mimeType: baseMimeType(result.mimeType) as UploadRequest["mimeType"],
          byteSize: result.byteSize, sha256: await checksum(result.blob), ...(retryOf ? { retryOf } : {}),
        };
        const accepted = await directUpload(state, state.metadata, idempotencyKey, result.blob,
          { initAction, completeAction },
          (ticket, blob) => putVideo(ticket, blob, (value) => { if (mountedRef.current) setProgress(value); }, controller.signal, (xhr) => { xhrRef.current = xhr; }), controller.signal);
        if (mountedRef.current && !controller.signal.aborted) {
          if (targetRef.current) { try { sessionStorage.setItem(`silatsense:target:${accepted.sessionId}`, targetRef.current); } catch {} }
          setProgress(100); router.push(`/latihan/${slug}/sesi/${accepted.sessionId}`); }
      } catch (error) {
        if (mountedRef.current && !controller.signal.aborted) {
          setPhase("failed"); setError(error instanceof Error ? error.message : "Unggahan gagal. Coba lagi.");
        }
      } finally { if (abortRef.current === controller) xhrRef.current = null; }
    })();
  }, [maxBytes, phase, result, retryOf, router, slug, initAction, completeAction]);

  const cancelUpload = useCallback(() => {
    abortRef.current?.abort(); setPhase("failed"); setError("Unggahan dibatalkan. Coba lagi untuk melanjutkan.");
  }, []);

  return {
    phase,
    countdownRemaining,
    elapsedSec,
    progress,
    error,
    result,
    start,
    cancelCountdown,
    stop,
    discard,
    upload,
    cancelUpload,
  };
}
