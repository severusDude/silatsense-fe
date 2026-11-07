export type PilarSlug = "kuda-kuda" | "pukulan" | "tangkisan" | "tendangan";

export const PILAR_NAMES: Record<PilarSlug, string> = {
  "kuda-kuda": "Kuda-kuda",
  pukulan: "Pukulan Lurus",
  tangkisan: "Tangkisan",
  tendangan: "Tendangan",
};

export type PostureParamId = "bahu" | "siku-kanan" | "pinggul" | "lutut" | "pergelangan";

export const POSTURE_PARAM_NAMES: Record<PostureParamId, string> = {
  bahu: "Bahu",
  "siku-kanan": "Siku Kanan",
  pinggul: "Pinggul",
  lutut: "Lutut",
  pergelangan: "Pergelangan",
};

export type PerformanceBadgeKey = "sesuai" | "remediasi" | "tidak-sesuai" | "evaluasi";

const PERFORMANCE_BADGE_LABEL: Record<PerformanceBadgeKey, string> = {
  sesuai: "Sesuai",
  remediasi: "Remediasi",
  "tidak-sesuai": "Tidak Sesuai",
  evaluasi: "Evaluasi",
};

const PERFORMANCE_BADGE_VARIANT = {
  sesuai: "success",
  remediasi: "warning",
  "tidak-sesuai": "destructive",
  evaluasi: "secondary",
} as const;

export function performanceBadgeLabel(key: PerformanceBadgeKey): string {
  return PERFORMANCE_BADGE_LABEL[key];
}

export function performanceBadgeVariant(key: PerformanceBadgeKey): "success" | "warning" | "destructive" | "secondary" {
  return PERFORMANCE_BADGE_VARIANT[key];
}

export type MetaBadgeSlot = "sesi" | "standar" | "date" | "repetisi" | "count";

export const META_BADGE_VARIANT: Record<MetaBadgeSlot, "secondary" | "success" | "outline"> = {
  sesi: "secondary",
  standar: "success",
  date: "outline",
  repetisi: "outline",
  count: "secondary",
};

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
