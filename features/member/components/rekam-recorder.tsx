"use client";

import { qualityLabel } from "@/features/member/camera-format";
import { RecordingControls } from "@/features/member/components/recording-controls";
import { RekamViewport } from "@/features/member/components/rekam-viewport";
import { formatBytes } from "@/features/member/data/format";
import { useCamera } from "@/features/member/hooks/use-camera";
import { useMediaRecorder } from "@/features/member/hooks/use-media-recorder";
import { effectiveUploadMaxBytes } from "@/features/member/recorder";
import type { RekamViewModel } from "@/features/member/types";

export function RekamRecorder({
  detail,
  retryOf,
}: {
  detail: RekamViewModel;
  retryOf: string | null;
}) {
  const camera = useCamera();
  const recorder = useMediaRecorder({
    slug: detail.slug,
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
