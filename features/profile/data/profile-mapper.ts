import type { ProfileOut } from "@/api";
import type { ProfileViewModel } from "@/features/profile/types";

export function getInitials(name: string): string {
  if (!name) return "SS";
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "SS";
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return (words[0][0] + words[1][0]).toUpperCase();
}

export function deriveHandle(fullName: string): string {
  if (!fullName) return "@silatsense";
  const sanitized = fullName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return sanitized ? `@${sanitized}` : "@silatsense";
}

export function formatRelativeTime(
  dateString: string | null | undefined,
  baseDate?: Date
): string {
  if (!dateString) {
    return "Belum pernah diperbarui";
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "Belum pernah diperbarui";
  }

  const now = baseDate ?? new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHours = Math.round(diffMin / 60);
  const diffDays = Math.round(diffHours / 24);
  const diffMonths = Math.round(diffDays / 30);
  const diffYears = Math.round(diffDays / 365);

  const rtf = new Intl.RelativeTimeFormat("id", { numeric: "auto" });

  if (Math.abs(diffSec) < 60) {
    return "Baru saja diperbarui";
  }
  if (Math.abs(diffMin) < 60) {
    return `Terakhir diperbarui ${rtf.format(diffMin, "minute")}`;
  }
  if (Math.abs(diffHours) < 24) {
    return `Terakhir diperbarui ${rtf.format(diffHours, "hour")}`;
  }
  if (Math.abs(diffDays) < 30) {
    return `Terakhir diperbarui ${rtf.format(diffDays, "day")}`;
  }
  if (Math.abs(diffMonths) < 12) {
    return `Terakhir diperbarui ${rtf.format(diffMonths, "month")}`;
  }
  return `Terakhir diperbarui ${rtf.format(diffYears, "year")}`;
}

export function toProfileViewModel(
  dto: ProfileOut,
  options?: { baseDate?: Date }
): ProfileViewModel {
  const isMember = dto.role === "member";
  const completedSessions = dto.statistics?.completedSessionCount ?? 0;

  return {
    id: dto.id,
    role: dto.role,
    name: dto.fullName,
    initials: getInitials(dto.fullName),
    handle: deriveHandle(dto.fullName),
    npm: dto.npm ?? "-",
    email: dto.email ?? "Email belum ditautkan",
    title: dto.title ?? "",
    roleLabel: isMember
      ? "Pesilat Binaan (Anggota Pemula)"
      : dto.title ?? "Pelatih Kepala UKM",
    division: dto.division ?? "UKM Pencak Silat Universitas Siliwangi",
    beltLabel: dto.belt ?? "Belum ditentukan",
    beltTargetLabel: dto.beltTarget
      ? `Target: ${dto.beltTarget}`
      : "Belum ditentukan",
    passwordUpdatedLabel: formatRelativeTime(
      dto.passwordChangedAt,
      options?.baseDate
    ),
    totalSessionsLabel: `${completedSessions} Sesi`,
    avgAccuracyPct: null,
    accuracyNote: null,
    totalPosturesLabel: null,
    teamAccuracyPct: null,
    coachedSessionsLabel: null,
    sessionStat: isMember
      ? {
          isAvailable: true,
          label: "Total Sesi Latihan",
          value: `${completedSessions} Sesi`,
        }
      : {
          isAvailable: false,
          label: "Sesi Ulasan",
          badge: "Coming soon",
        },
    accuracyStat: {
      isAvailable: false,
      label: isMember ? "Akurasi Rata-Rata Biomekanika" : "Akurasi Tim",
      badge: "Coming soon",
      note: isMember
        ? "Analisis gabungan belum tersedia"
        : "Analisis tim belum tersedia",
    },
    postureStat: {
      isAvailable: false,
      label: isMember ? "Pencatatan Sudut" : "Perangkat",
      badge: "Coming soon",
    },
    raw: dto,
  };
}
