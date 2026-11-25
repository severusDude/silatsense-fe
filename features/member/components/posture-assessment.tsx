import type { PostureAssessment } from "@/api";
import { humanizeIdentifier } from "@/features/member/data/format";

const STATUS_LABELS: Record<PostureAssessment["status"], string> = {
  assessed: "Penilaian selesai",
  partial: "Dinilai sebagian",
  not_assessable: "Belum dapat dinilai",
};

const ASPECT_LABELS: Record<string, string> = {
  knees_bend: "Tekukan kedua lutut",
  knee_symmetry: "Simetri tekukan lutut",
  stance_width: "Lebar posisi kaki",
  front_knee_bend: "Tekukan lutut depan",
  rear_leg_extension: "Kelurusan kaki belakang",
  torso_inclination: "Kemiringan badan",
  bent_knee: "Tekukan lutut",
  other_leg_extension: "Kelurusan kaki satunya",
  elbow_extension: "Rentangan siku",
  wrist_path: "Lintasan pergelangan tangan",
  curved_wrist_path: "Lintasan melengkung pergelangan tangan",
  elbow_change: "Perubahan sudut siku",
  upward_wrist_path: "Lintasan pergelangan tangan ke atas",
  knee_change: "Perubahan sudut lutut",
  ankle_path: "Lintasan pergelangan kaki",
  swing_ankle_path: "Lintasan ayunan pergelangan kaki",
  hip_change: "Perubahan sudut pinggul",
  lateral_leg_position: "Posisi kaki saat merentang ke samping",
  knee_extension: "Kelurusan lutut",
  wrist_end_position: "Posisi akhir pergelangan tangan",
  elbow_bend: "Tekukan siku",
  inward_wrist_path: "Lintasan pergelangan tangan ke dalam",
  downward_wrist_path: "Lintasan pergelangan tangan ke bawah",
};

const CORRECTIONS: Record<string, string> = {
  knee_bend_excessive: "Lutut lebih menekuk daripada referensi Coach.",
  knee_bend_insufficient: "Lutut kurang menekuk dibanding referensi Coach.",
  elbow_bend_excessive: "Siku lebih menekuk daripada referensi Coach.",
  elbow_bend_insufficient: "Siku kurang menekuk dibanding referensi Coach.",
  elbow_extension_insufficient: "Siku kurang lurus dibanding referensi Coach.",
  elbow_extension_excessive: "Siku lebih lurus daripada referensi Coach.",
  knee_extension_insufficient: "Lutut kurang lurus dibanding referensi Coach.",
  knee_extension_excessive: "Lutut lebih lurus daripada referensi Coach.",
  rear_leg_extension_insufficient: "Kaki belakang kurang lurus dibanding referensi Coach.",
  rear_leg_extension_excessive: "Kaki belakang lebih lurus daripada referensi Coach.",
  other_leg_extension_insufficient: "Kaki satunya kurang lurus dibanding referensi Coach.",
  other_leg_extension_excessive: "Kaki satunya lebih lurus daripada referensi Coach.",
  torso_lean_insufficient: "Badan kurang condong dibanding referensi Coach.",
  torso_lean_excessive: "Badan lebih condong daripada referensi Coach.",
  stance_too_narrow: "Posisi kaki lebih sempit daripada referensi Coach.",
  stance_too_wide: "Posisi kaki lebih lebar daripada referensi Coach.",
  knee_asymmetry_less_than_reference: "Selisih tekukan kedua lutut lebih kecil daripada referensi Coach.",
  knee_asymmetry_excessive: "Selisih tekukan kedua lutut lebih besar daripada referensi Coach.",
  wrist_raise_excessive: "Gerak naik pergelangan tangan lebih jauh daripada referensi Coach.",
  wrist_raise_insufficient: "Gerak naik pergelangan tangan kurang jauh dibanding referensi Coach.",
  wrist_lower_insufficient: "Gerak turun pergelangan tangan kurang jauh dibanding referensi Coach.",
  wrist_lower_excessive: "Gerak turun pergelangan tangan lebih jauh daripada referensi Coach.",
  wrist_position_too_high: "Posisi akhir pergelangan tangan lebih tinggi daripada referensi Coach.",
  wrist_position_too_low: "Posisi akhir pergelangan tangan lebih rendah daripada referensi Coach.",
};

const REASONS: Record<string, string> = {
  comparison_not_assessable: "Perbandingan dengan referensi Coach belum bisa digunakan.",
  formed_stance_not_observable: "Posisi kuda-kuda pada referensi Coach belum terbaca jelas.",
  active_side_unclear: "Sisi tubuh yang bergerak belum terbaca jelas.",
  reference_motion_not_observable: "Bagian gerakan pada referensi Coach belum terbaca jelas.",
  insufficient_comparison_samples: "Sampel untuk bagian gerakan ini belum cukup.",
  joint_not_observable: "Data sendi atau fitur pada bagian ini belum cukup.",
  camera_or_pose_inadequate: "Pose atau sudut kamera belum cukup jelas untuk dinilai.",
  required_aspect_unavailable: "Sebagian atau seluruh aspek utama belum dapat dinilai.",
};

const pointFormat = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

function lookup(labels: Record<string, string>, code: string, fallback: string) {
  return Object.hasOwn(labels, code) ? labels[code] : fallback;
}

export function PostureAssessmentPanel({ assessment }: { assessment: PostureAssessment }) {
  return (
    <section aria-label="Poin postur eksperimental" className="min-w-0 space-y-3 rounded-lg bg-secondary/50 p-3">
      <div className="space-y-1">
        <h3 className="font-semibold">Poin postur eksperimental</h3>
        <p className="text-xs text-muted-foreground">{STATUS_LABELS[assessment.status]}</p>
        {assessment.points !== null && (
          <p className="text-xl font-bold">
            {pointFormat.format(assessment.points)}/{assessment.maxPoints ?? 100} poin
          </p>
        )}
        {assessment.reason && (
          <p className="text-xs text-muted-foreground">
            {lookup(REASONS, assessment.reason, "Poin postur belum dapat ditampilkan untuk rekaman ini.")}
          </p>
        )}
      </div>
      {assessment.aspects.length > 0 && (
        <ul className="divide-y rounded-md border">
          {assessment.aspects.map((aspect) => (
            <li key={aspect.id} className="space-y-1 p-2">
              <p className="font-medium">
                {lookup(ASPECT_LABELS, aspect.id, humanizeIdentifier(aspect.id))}
              </p>
              <p className="text-xs font-medium">
                {aspect.points === null ? "Belum dapat dinilai" : `${pointFormat.format(aspect.points)}/100 poin`}
              </p>
              {aspect.correctionCode && (
                <p className="text-xs">
                  {lookup(CORRECTIONS, aspect.correctionCode, "Periksa perbedaan aspek ini dengan referensi Coach.")}
                </p>
              )}
              {aspect.reason && (
                <p className="text-xs text-muted-foreground">
                  {lookup(REASONS, aspect.reason, "Data untuk aspek ini belum cukup.")}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
