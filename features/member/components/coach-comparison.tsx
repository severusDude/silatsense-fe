import type { CoachComparison } from "@/api";
import { comparisonMessage } from "@/features/member/pose-overlay";
import { assessSideStance } from "@/features/member/side-stance-posture";
const number = (value: number | null) => value === null ? "Tidak terukur" : value.toLocaleString("id-ID", { maximumFractionDigits: 3 });
const unit = (value: string) => value === "deg" ? "derajat" : "rasio panjang torso";
const label = (value: string) => value.replace(/_/g, " ");
export function CoachComparisonPanel({ comparison }: { comparison?: CoachComparison | null }) {
  if (!comparison) return null;
  const posture = assessSideStance(comparison);
  return <section aria-label="Perbandingan referensi Coach" className="min-w-0 space-y-3 rounded-xl border p-3 text-sm">
    <h2 className="font-bold">Perbandingan referensi AI</h2>
    <p>Target: {label(comparison.movementId)}</p>
    <p>{comparison.status === "compared" ? "Perbandingan referensi selesai" : "Belum dapat dibandingkan"}</p>
    {comparison.reason ? <p>{comparisonMessage(comparison.reason)}</p> : null}
    <p className="text-xs text-muted-foreground">Perbandingan eksperimental dengan demonstrasi Coach. Penilaian pelatih ditampilkan terpisah.</p>
    {comparison.movementId === "kuda_kuda_samping" && <div className="space-y-1 rounded-lg bg-secondary/50 p-3">
      <h3 className="font-semibold">Penilaian lutut eksperimental</h3>
      {posture ? <>
        <p className="text-xl font-bold">{posture.points}/100 poin</p>
        <p>{posture.correction ?? "Tekukan lutut mendekati patokan."}</p>
        <p className="text-xs text-muted-foreground">Poin perkiraan berdasarkan tekukan lutut saat kuda-kuda samping.</p>
      </> : <p>Tekukan lutut belum bisa dinilai dari rekaman ini.</p>}
    </div>}
    <h3 className="font-semibold">Ringkasan fitur</h3>
    <ul className="space-y-2">{Object.entries(comparison.features).map(([name, feature]) => <li key={name} className="rounded border p-2">
      <p>{label(name)}</p><p className="text-xs">{feature.sampleCount} sampel · ketercakupan {(feature.coverage * 100).toFixed(1)}%</p>
      <p className="text-xs">Selisih median: {number(feature.medianDeviation)} · maksimum: {number(feature.maximumDeviation)} ({unit(feature.unit)})</p>
    </li>)}</ul>
    <details><summary className="cursor-pointer font-semibold">Pengukuran per waktu ({comparison.frames.length})</summary>
      <div className="space-y-3 pt-2">{comparison.frames.map((frame, index) => <div key={index} className="min-w-0 rounded border p-2">
        <h4 className="font-semibold">{number(frame.timeSeconds)} dtk · referensi {number(frame.referenceTimeSeconds)} dtk</h4>
        <ul className="space-y-2">{Object.entries(frame.features).map(([name, feature]) => <li key={name} className="text-xs">
          <p className="font-medium">{label(name)}</p>
          <p>Nilai: {number(feature.value)} · referensi: {number(feature.referenceValue)} · selisih: {number(feature.deviation)} ({unit(feature.unit)})</p>
          <p>Keterlihatan: {feature.value === null ? "tidak teramati" : "teramati"} · {feature.color === "red" ? "penyimpangan besar" : feature.color === "yellow" ? "penyimpangan sedang" : feature.color === "green" ? "dalam rentang referensi" : "tidak dinilai"}</p>
          {feature.reason ? <p>{comparisonMessage(feature.reason)}</p> : null}
        </li>)}</ul>
        <ul>{Object.entries(frame.joints).map(([name, joint]) => joint.feedbackCode ? <li key={name} className="mt-2 text-xs">{label(name)}: {comparisonMessage(joint.feedbackCode)}</li> : null)}</ul>
      </div>)}</div>
    </details>
  </section>;
}
