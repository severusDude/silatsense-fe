const PREFERRED_CAMERA_KEY = "silatsense:preferred-camera";

export function readPreferredCameraId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(PREFERRED_CAMERA_KEY);
  } catch {
    return null;
  }
}

export function rememberPreferredCameraId(deviceId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(PREFERRED_CAMERA_KEY, deviceId);
  } catch {
    // A blocked storage API must not break recording.
  }
}
