"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { describeCameraError } from "@/features/member/camera-format";
import {
  readPreferredCameraId,
  rememberPreferredCameraId,
} from "@/features/member/camera-preference";
import type {
  CameraDevice,
  CameraStatus,
} from "@/features/member/types";

const UNSUPPORTED_MESSAGE =
  "Browser ini tidak mendukung akses kamera. Gunakan browser terbaru lewat HTTPS atau localhost.";
const NO_CAMERA_MESSAGE =
  "Tidak ada kamera yang terdeteksi di perangkat ini.";

interface LiveSettings {
  width: number;
  height: number;
  fps: number;
}

function stopTracks(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function toLiveSettings(stream: MediaStream): LiveSettings | null {
  const settings = stream.getVideoTracks()[0]?.getSettings();
  if (!settings?.width || !settings.height) return null;
  return {
    width: settings.width,
    height: settings.height,
    fps: settings.frameRate ?? 30,
  };
}

function toCameraDevice(
  input: MediaDeviceInfo,
  index: number,
  stream: MediaStream | null,
): CameraDevice {
  const settings = stream?.getVideoTracks()[0]?.getSettings();
  return {
    id: input.deviceId,
    label: input.label || `Kamera ${index + 1}`,
    resolution:
      settings?.width && settings?.height
        ? `${settings.width}×${settings.height}`
        : "—",
    fps: settings?.frameRate ?? 30,
    latencyMs: null,
  };
}

/**
 * Owns browser camera discovery and the live preview stream.
 *
 * Permission is requested on interaction, never on mount. The saved device is
 * restored when it is still present, and every stream is stopped before a new
 * one opens so mobile devices with a single camera do not collide with
 * themselves.
 */
export function useCamera() {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [live, setLive] = useState<LiveSettings | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const mountedRef = useRef(true);

  const applyStream = useCallback((next: MediaStream | null) => {
    streamRef.current = next;
    setStream(next);
    setLive(next ? toLiveSettings(next) : null);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopTracks(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  const openDevice = useCallback(
    async (deviceId: string): Promise<boolean> => {
      stopTracks(streamRef.current);
      streamRef.current = null;
      setStream(null);
      setLive(null);

      try {
        const next = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId } },
          audio: false,
        });

        if (!mountedRef.current) {
          stopTracks(next);
          return false;
        }

        applyStream(next);
        setSelectedId(deviceId);
        rememberPreferredCameraId(deviceId);

        const settings = toLiveSettings(next);
        setCameras((current) =>
          current.map((camera) =>
            camera.id === deviceId
              ? {
                  ...camera,
                  resolution: settings
                    ? `${settings.width}×${settings.height}`
                    : camera.resolution,
                  fps: settings?.fps ?? camera.fps,
                }
              : camera,
          ),
        );
        setStatus("live");
        setError(null);
        return true;
      } catch (cause) {
        if (!mountedRef.current) return false;
        applyStream(null);
        setStatus("error");
        setError(describeCameraError(cause));
        return false;
      }
    },
    [applyStream],
  );

  const scan = useCallback(async () => {
    if (scanningRef.current) return;

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      !navigator.mediaDevices.enumerateDevices
    ) {
      setStatus("error");
      setError(UNSUPPORTED_MESSAGE);
      return;
    }

    scanningRef.current = true;
    setStatus("scanning");
    setError(null);
    stopTracks(streamRef.current);
    streamRef.current = null;
    setStream(null);
    setLive(null);

    const mediaDevices = navigator.mediaDevices;
    let permissionStream: MediaStream | null = null;

    try {
      // Enumerating before permission returns empty labels, so ask once first.
      permissionStream = await mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      if (!mountedRef.current) {
        stopTracks(permissionStream);
        return;
      }

      const initialSettings =
        permissionStream.getVideoTracks()[0]?.getSettings();
      const initialDeviceId = initialSettings?.deviceId ?? "";

      const inputs = (await mediaDevices.enumerateDevices()).filter(
        (device) => device.kind === "videoinput" && device.deviceId,
      );

      if (!mountedRef.current) {
        stopTracks(permissionStream);
        return;
      }

      if (inputs.length === 0) {
        stopTracks(permissionStream);
        permissionStream = null;
        setStatus("error");
        setError(NO_CAMERA_MESSAGE);
        return;
      }

      const preferredId = readPreferredCameraId();
      const chosen =
        inputs.find((input) => input.deviceId === preferredId) ??
        inputs.find((input) => input.deviceId === initialDeviceId) ??
        inputs[0];

      if (!chosen) {
        stopTracks(permissionStream);
        permissionStream = null;
        setStatus("error");
        setError(NO_CAMERA_MESSAGE);
        return;
      }

      if (chosen.deviceId === initialDeviceId) {
        applyStream(permissionStream);
        permissionStream = null;
      } else {
        stopTracks(permissionStream);
        permissionStream = null;
        const next = await mediaDevices.getUserMedia({
          video: { deviceId: { exact: chosen.deviceId } },
          audio: false,
        });
        if (!mountedRef.current) {
          stopTracks(next);
          return;
        }
        applyStream(next);
      }

      const chosenStream = streamRef.current;
      setCameras(
        inputs.map((input, index) =>
          toCameraDevice(
            input,
            index,
            input.deviceId === chosen.deviceId ? chosenStream : null,
          ),
        ),
      );
      setSelectedId(chosen.deviceId);
      rememberPreferredCameraId(chosen.deviceId);
      setStatus("live");
      setError(null);
    } catch (cause) {
      stopTracks(permissionStream);
      if (!mountedRef.current) return;
      applyStream(null);
      setStatus("error");
      setError(describeCameraError(cause));
    } finally {
      scanningRef.current = false;
    }
  }, [applyStream]);

  const select = useCallback(
    async (deviceId: string) => {
      if (!deviceId) return;
      if (deviceId === selectedId && status === "live") return;
      if (status === "scanning") return;

      setStatus("scanning");
      await openDevice(deviceId);
    },
    [openDevice, selectedId, status],
  );

  const stop = useCallback(() => {
    stopTracks(streamRef.current);
    applyStream(null);
    setStatus("idle");
  }, [applyStream]);

  return {
    cameras,
    selectedId,
    status,
    error,
    stream,
    live,
    scan,
    select,
    stop,
  };
}
