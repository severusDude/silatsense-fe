/** Round fractional sensor FPS (e.g. 60.00024, 29.97) for display. */
export function formatFps(fps: number): number {
  return Math.round(fps);
}

/** Live quality badge from an open stream's settings; null while idle. */
export function qualityLabel(
  width: number | undefined,
  height: number | undefined,
  fps: number | undefined,
): string | null {
  if (!width || !height || fps === undefined) return null;
  return `${height}p @ ${Math.round(fps)} FPS`;
}
