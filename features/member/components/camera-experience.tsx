"use client";

import { PersiapanViewport } from "@/features/member/components/persiapan-viewport";
import { CameraSourceCard } from "@/features/member/components/camera-source-card";
import { qualityLabel } from "@/features/member/camera-format";
import { useCamera } from "@/features/member/hooks/use-camera";

export function CameraExperience({ title }: { title: string }) {
  const camera = useCamera();
  const badge = camera.live
    ? qualityLabel(camera.live.width, camera.live.height, camera.live.fps)
    : null;

  return (
    <div className="flex flex-col gap-3.5">
      <PersiapanViewport
        label={title}
        stream={camera.stream}
        qualityBadge={badge}
      />
      <CameraSourceCard
        cameras={camera.cameras}
        selectedId={camera.selectedId}
        onSelect={(deviceId) => {
          void camera.select(deviceId);
        }}
        status={camera.status}
        error={camera.error}
        onScan={() => {
          void camera.scan();
        }}
      />
    </div>
  );
}
