"use client";

import { useEffect, useRef, useState } from "react";
import { PersiapanViewport } from "@/features/member/components/persiapan-viewport";
import {
  CameraSourceCard,
  type CameraScanStatus,
} from "@/features/member/components/camera-source-card";
import { qualityLabel } from "@/features/member/camera-format";
import type { CameraDevice } from "@/features/member/types";

const PREFERRED_CAMERA_KEY = "silatsense:preferred-camera";

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function CameraExperience({ title }: { title: string }) {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [status, setStatus] = useState<CameraScanStatus>("idle");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [live, setLive] = useState<{
    width: number;
    height: number;
    fps: number;
  } | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  useEffect(() => {
    return () => stopStream(streamRef.current);
  }, []);

  async function openDevice(deviceId: string): Promise<void> {
    stopStream(streamRef.current);
    const next = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } },
      audio: false,
    });
    const settings = next.getVideoTracks()[0]?.getSettings();
    setStream(next);
    if (settings?.width && settings?.height) {
      setLive({
        width: settings.width,
        height: settings.height,
        fps: settings.frameRate ?? 30,
      });
    } else {
      setLive(null);
    }
  }

  async function handleScan() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      setStatus("denied");
      return;
    }
    setStatus("scanning");
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices.filter((device) => device.kind === "videoinput");
      const found: CameraDevice[] = [];
      let index = 0;
      for (const input of inputs) {
        index += 1;
        try {
          const probe = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: input.deviceId } },
            audio: false,
          });
          const settings = probe.getVideoTracks()[0]?.getSettings();
          stopStream(probe);
          found.push({
            id: input.deviceId,
            label: input.label || `Kamera ${index}`,
            resolution:
              settings?.width && settings?.height
                ? `${settings.width}×${settings.height}`
                : "—",
            fps: settings?.frameRate ?? 30,
            latencyMs: null,
          });
        } catch {
          // Skip devices that refuse a probe stream; keep the rest.
        }
      }
      if (found.length === 0) {
        setStatus("denied");
        return;
      }
      const preferredId = window.localStorage.getItem(PREFERRED_CAMERA_KEY);
      const chosen = found.find((camera) => camera.id === preferredId) ?? found[0];
      setCameras(found);
      if (!chosen) {
        setStatus("denied");
        return;
      }
      setSelectedId(chosen.id);
      window.localStorage.setItem(PREFERRED_CAMERA_KEY, chosen.id);
      await openDevice(chosen.id);
      setStatus("live");
    } catch {
      setStatus("denied");
    }
  }

  async function handleSelect(nextId: string) {
    setSelectedId(nextId);
    window.localStorage.setItem(PREFERRED_CAMERA_KEY, nextId);
    if (status !== "live") return;
    try {
      await openDevice(nextId);
    } catch {
      setStatus("denied");
    }
  }

  const badge = live ? qualityLabel(live.width, live.height, live.fps) : null;

  return (
    <div className="flex flex-col gap-3.5">
      <PersiapanViewport label={title} stream={stream} qualityBadge={badge} />
      <CameraSourceCard
        cameras={cameras}
        selectedId={selectedId}
        onSelect={handleSelect}
        status={status}
        onScan={handleScan}
      />
    </div>
  );
}
