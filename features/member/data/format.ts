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

const measurementFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 2,
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

export function formatMeasurementValue(
  value: number | null,
  unit: "deg" | "shoulder_width",
): string {
  if (value === null) return "—";
  return unit === "deg"
    ? `${measurementFormatter.format(value)}°`
    : `${measurementFormatter.format(value)}× shoulder width`;
}

export function formatReferenceTarget(
  median: number | null,
  iqr: number | null,
  unit: "deg" | "shoulder_width",
): string | null {
  if (median === null) return null;
  const suffix = unit === "deg" ? "°" : "× shoulder width";
  if (iqr !== null && iqr > 0) {
    const half = iqr / 2;
    return `${measurementFormatter.format(Math.max(0, median - half))}–${measurementFormatter.format(
      median + half,
    )}${suffix}`;
  }
  return `${measurementFormatter.format(median)}${suffix}`;
}

export function formatReading(
  value: number | null,
  unit: "deg" | "shoulder_width",
  referenceMedian: number | null,
  referenceIqr: number | null,
): string {
  const current = formatMeasurementValue(value, unit);
  if (current === "—") return current;
  const target = formatReferenceTarget(referenceMedian, referenceIqr, unit);
  return target ? `${current} → target ${target}` : current;
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
