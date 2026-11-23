"use client";

import { useState, useSyncExternalStore } from "react";
import type { UploadActions } from "@/features/member/direct-upload";
import { qualityLabel } from "@/features/member/camera-format";
import { RecordingControls } from "@/features/member/components/recording-controls";
import { RekamViewport } from "@/features/member/components/rekam-viewport";
import { formatBytes } from "@/features/member/data/format";
import { useCamera } from "@/features/member/hooks/use-camera";
import { useMediaRecorder } from "@/features/member/hooks/use-media-recorder";
import { effectiveUploadMaxBytes } from "@/features/member/recorder";
import type { RekamViewModel } from "@/features/member/types";

const subscribeTarget = () => () => {};

export function RekamRecorder({
  detail,
  retryOf,
  initialMovementId,
  initAction,
  completeAction,
}: {
  detail: RekamViewModel;
  retryOf: string | null;
  initialMovementId?: string;
  initAction: UploadActions["initAction"];
  completeAction: UploadActions["completeAction"];
}) {
  const savedTarget = useSyncExternalStore(subscribeTarget, () => {
    try { return retryOf ? sessionStorage.getItem(`silatsense:target:${retryOf}`) ?? "" : ""; } catch { return ""; }
  }, () => "");
  const [selectedTarget, setMovementId] = useState<string | null>(null);
  const candidate = selectedTarget ?? initialMovementId ?? savedTarget;
  const movementId = detail.movements?.some((item) => item.id === candidate) ? candidate : "";
  const camera = useCamera();
  const recorder = useMediaRecorder({
    slug: detail.slug,
    movementId: movementId || undefined,
    movements: detail.movements,
    movementIdRequired: detail.movementIdRequired,
    initAction,
    completeAction,
    stream: camera.stream,
    countdownSec: detail.countdownSec,
    maxDurationSec: detail.maxDurationSec,
    maxBytes: detail.maxBytes,
    acceptedMimeTypes: detail.acceptedMimeTypes,
    retryOf,
    onRecordingComplete: camera.stop,
  });

  const badge = camera.live
    ? qualityLabel(camera.live.width, camera.live.height, camera.live.fps)
    : null;
  const uploadLimit = effectiveUploadMaxBytes(detail.maxBytes);
  const canStart =
    (!detail.movementIdRequired || Boolean(detail.movements?.some((item) => item.id === movementId))) &&
    camera.status === "live" &&
    Boolean(camera.stream) &&
    recorder.phase === "idle";
  const canUpload = Boolean(
    recorder.result &&
      recorder.result.byteSize > 0 &&
      recorder.result.byteSize <= uploadLimit,
  );

  function handleDiscard() {
    recorder.discard();
    void camera.scan();
  }

  return (
    <div className="flex flex-col gap-3.5">
      {retryOf ? (
        <p
          role="status"
          className="rounded-xl bg-secondary/50 p-3 text-[11px] leading-relaxed text-muted-foreground"
        >
          Rekaman ini akan disimpan sebagai perbaikan sesi sebelumnya.
        </p>
      ) : null}

      {detail.movements?.length ? (
        <label className="flex min-w-0 flex-col gap-2 text-sm">Target gerakan
          <select className="w-full min-w-0 rounded-lg border bg-background p-3" value={movementId}
            disabled={recorder.phase !== "idle"} onChange={(event) => setMovementId(event.target.value)}>
            <option value="">Pilih gerakan</option>
            {detail.movements.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <span className="text-xs text-muted-foreground">Target dikunci selama rekaman. Rekam ulang untuk mengganti target.</span>
        </label>
      ) : null}
      {recorder.phase === "uploading" ? <p role="status" className="text-xs">{recorder.uploadStage}</p> : null}
      {recorder.phase === "uploading" ? <button type="button" onClick={recorder.cancelUpload} className="text-sm underline">Batalkan unggahan</button> : null}
      <RekamViewport
        trainingName={detail.trainingName}
        targetDurationSec={detail.targetDurationSec}
        maxDurationSec={detail.maxDurationSec}
        stream={camera.stream}
        previewUrl={recorder.result?.previewUrl ?? null}
        qualityBadge={badge}
        phase={recorder.phase}
        countdownRemaining={recorder.countdownRemaining}
        elapsedSec={recorder.elapsedSec}
        cameras={camera.cameras}
        selectedCameraId={camera.selectedId}
        cameraStatus={camera.status}
        cameraError={camera.error}
        onSelectCamera={(deviceId) => {
          void camera.select(deviceId);
        }}
        onScanCamera={() => {
          void camera.scan();
        }}
      />

      <RecordingControls
        phase={recorder.phase}
        countdownRemaining={recorder.countdownRemaining}
        elapsedSec={recorder.elapsedSec}
        progress={recorder.progress}
        error={recorder.error}
        result={recorder.result}
        canStart={canStart}
        canUpload={canUpload}
        maxDurationSec={detail.maxDurationSec}
        uploadLimitLabel={formatBytes(uploadLimit)}
        onStart={recorder.start}
        onCancel={recorder.cancelCountdown}
        onStop={recorder.stop}
        onDiscard={handleDiscard}
        onUpload={recorder.upload}
      />
    </div>
  );
}
