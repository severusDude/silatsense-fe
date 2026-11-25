"use client";
import { useEffect, useRef, useState } from "react";
import type { CoachComparison, PoseTimeline } from "@/api";
import { overlayLines, videoRect } from "@/features/member/pose-overlay";
const COLORS: Record<string, string> = { green: "#22c55e", yellow: "#facc15", red: "#ef4444", gray: "#9ca3af" };
export function PoseVideoPlayer({ src, timeline, comparison, poseError }: {
  src: string; timeline?: PoseTimeline | null; comparison?: CoachComparison | null; poseError?: string;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const [time, setTime] = useState(0);
  const [size, setSize] = useState({ width: 1, height: 1 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [fullscreenError, setFullscreenError] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    let id = 0;
    const update = () => { setTime(element.currentTime); id = requestAnimationFrame(update); };
    const start = () => { cancelAnimationFrame(id); update(); };
    const stop = () => { cancelAnimationFrame(id); setTime(element.currentTime); };
    element.addEventListener("play", start); element.addEventListener("pause", stop); element.addEventListener("ended", stop);
    if (!element.paused) start();
    return () => { cancelAnimationFrame(id); element.removeEventListener("play", start); element.removeEventListener("pause", stop); element.removeEventListener("ended", stop); };
  }, []);
  const rect = timeline ? videoRect(size.width, size.height, dimensions.width || timeline.imageWidth, dimensions.height || timeline.imageHeight) : null;
  const lines = timeline ? overlayLines(timeline, comparison, time) : [];
  return <div className="min-w-0">
    <div ref={container} className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      <video ref={video} src={src} controls controlsList="nofullscreen" disablePictureInPicture preload="metadata"
        className="size-full object-contain" aria-label="Rekaman asli dengan overlay referensi"
        onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
        onSeeked={(event) => setTime(event.currentTarget.currentTime)} onLoadedMetadata={(event) => { setTime(event.currentTarget.currentTime); setDimensions({ width: event.currentTarget.videoWidth, height: event.currentTarget.videoHeight }); }}
        onError={() => setFailed(true)} />
      {rect ? <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full" viewBox={`0 0 ${size.width} ${size.height}`}>
        {lines.map((line) => <line key={line.key} x1={rect.x + line.a.x * rect.width} y1={rect.y + line.a.y * rect.height}
          x2={rect.x + line.b.x * rect.width} y2={rect.y + line.b.y * rect.height} stroke={COLORS[line.color]} strokeWidth="3" />)}
      </svg> : null}
      <button type="button" className="absolute right-2 top-2 rounded bg-black/80 px-2 py-1 text-xs text-white"
        onClick={() => { if (document.fullscreenElement) void document.exitFullscreen(); else void container.current?.requestFullscreen().catch(() => setFullscreenError(true)); }}>Layar penuh</button>
    </div>
    {fullscreenError ? <p role="status" className="text-xs">Layar penuh tidak tersedia pada browser ini.</p> : null}
    {failed ? <p role="alert" className="text-xs">Video tidak dapat dimuat atau masa aksesnya berakhir. Hasil dan ulasan tetap tersedia. <button type="button" className="underline" onClick={() => { setFailed(false); video.current?.load(); }}>Coba muat ulang</button></p> : null}
    {poseError ? <p role="status" className="text-xs text-muted-foreground">{poseError}</p> : null}
    {timeline && comparison ? <p className="mt-2 text-xs text-muted-foreground">Warna menunjukkan penyimpangan dari referensi eksperimen: hijau, kuning, merah. Abu-abu berarti tidak dinilai. Bukan keputusan benar/salah.</p> : null}
  </div>;
}
