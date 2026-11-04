const JAKARTA_TIME_ZONE = "Asia/Jakarta";

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: JAKARTA_TIME_ZONE,
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeZone: JAKARTA_TIME_ZONE,
});

const decimalFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 1,
});

export function formatDateTimeId(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${dateTimeFormatter.format(date)} WIB`;
}

export function formatDateId(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateFormatter.format(date);
}

export function formatClock(totalSeconds: number | null): string {
  if (totalSeconds === null || totalSeconds < 0) return "—";
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function formatDurationId(totalSeconds: number | null): string {
  if (totalSeconds === null || totalSeconds < 0) return "—";
  return `${Math.round(totalSeconds)} detik`;
}

export function formatMinutesId(totalSeconds: number | null): string | undefined {
  if (totalSeconds === null || totalSeconds <= 0) return undefined;
  const minutes = Math.max(1, Math.round(totalSeconds / 60));
  return `${minutes} Menit`;
}

export function formatScore(value: number): string {
  return decimalFormatter.format(value);
}

export function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes < 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${decimalFormatter.format(value)} ${units[unitIndex]}`;
}

export function formatResolution(
  width: number | null,
  height: number | null,
): string {
  if (width === null || height === null) return "—";
  return `${width}×${height}`;
}

export function humanizeIdentifier(value: string): string {
  const normalized = value.replace(/[_-]+/g, " ").trim();
  if (!normalized) return "—";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}
