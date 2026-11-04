import type {
  ActivitySummary,
  GuideItem,
  TrainingCatalog,
  TrainingModule,
  TrainingPrep,
  UploadConfig,
} from "@/api";
import { formatMinutesId } from "@/features/member/data/format";
import type {
  GuideItemViewModel,
  PersiapanViewModel,
  RekamViewModel,
  TrainingCatalogViewModel,
  TrainingModuleSlug,
  TrainingModuleViewModel,
} from "@/features/member/types";

export const TRAINING_MODULE_SLUGS = [
  "kuda-kuda",
  "pukulan",
  "tangkisan",
  "tendangan",
] as const satisfies readonly TrainingModuleSlug[];

const CATALOG_BADGES = ["MODUL LATIHAN", "Standar PB IPSI Resmi"];

const FALLBACK_LEVEL = "Semua Tingkat";

function toSimilarity(
  moduleSlug: string,
  statistics: ActivitySummary | null,
): TrainingModuleViewModel["similarity"] {
  const groups = statistics?.similarityGroups ?? [];
  const matching = groups.filter(
    (group) => group.movementSlug === moduleSlug && group.averageScore !== null,
  );

  // Only show a per-module average when a single analyzer/reference group
  // exists; choosing between versions would be arbitrary.
  if (matching.length !== 1) return null;

  const best = matching[0];
  if (!best || best.averageScore === null || best.sampleCount <= 0) return null;

  return {
    averageScore: best.averageScore,
    sampleCount: best.sampleCount,
  };
}

export function toTrainingModuleViewModel(
  trainingModule: TrainingModule,
  statistics: ActivitySummary | null = null,
): TrainingModuleViewModel {
  return {
    slug: trainingModule.slug,
    order: trainingModule.order,
    orderLabel: `Latihan ${trainingModule.order.toString().padStart(2, "0")}`,
    name: trainingModule.name,
    levelLabel: trainingModule.level ?? FALLBACK_LEVEL,
    description: trainingModule.description ?? "",
    estimateLabel: formatMinutesId(trainingModule.estimatedDurationSeconds),
    scoringAvailable: trainingModule.capability.scoringAvailable,
    scoringReason: trainingModule.capability.reason,
    similarity: toSimilarity(trainingModule.slug, statistics),
  };
}

export function toTrainingCatalogViewModel(
  catalog: TrainingCatalog,
): TrainingCatalogViewModel {
  const modules = [...catalog.modules]
    .sort((a, b) => a.order - b.order)
    .map((module) => toTrainingModuleViewModel(module, catalog.statistics));

  return {
    hero: {
      badges: [...CATALOG_BADGES, `${modules.length} Pilar Teknik`],
      title: "Pilih Latihan Gerakan Dasar",
      subtitle:
        "Pilih salah satu pilar teknik dasar pencak silat untuk memulai panduan gerak dan kalibrasi biomekanika.",
      completedSessionsLabel: `${catalog.statistics.completedSessionCount} Sesi Tersimpan`,
      scoredSessionsLabel: `${catalog.statistics.scoredSessionCount} Sesi Dinilai`,
      accuracy: { available: false, label: "Segera hadir" },
    },
    modules,
  };
}

function toGuideItemViewModel(item: GuideItem): GuideItemViewModel {
  return {
    id: item.id,
    text: item.text,
    source: item.source,
  };
}

export function toPersiapanViewModel(prep: TrainingPrep): PersiapanViewModel {
  const trainingModule = prep.module;

  return {
    slug: trainingModule.slug,
    eyebrow: trainingModule.name.toUpperCase(),
    title: trainingModule.name,
    description: trainingModule.description ?? "",
    levelLabel: trainingModule.level ?? FALLBACK_LEVEL,
    estimatedDurationLabel: formatMinutesId(
      trainingModule.estimatedDurationSeconds,
    ),
    capability: {
      scoringAvailable: trainingModule.capability.scoringAvailable,
      reason: trainingModule.capability.reason,
      method: trainingModule.capability.method ?? "static-reference-pose",
      referenceVersions: trainingModule.capability.referenceVersions,
    },
    checklist: prep.checklist.map(toGuideItemViewModel),
    guides: prep.guides.map(toGuideItemViewModel),
  };
}

export function toRekamViewModel(
  config: UploadConfig,
  prep: TrainingPrep,
): RekamViewModel {
  const trainingModule = prep.module;
  const targetDuration = Math.min(
    config.recommendedDurationSeconds ?? config.maxDurationSeconds,
    config.maxDurationSeconds,
  );

  return {
    slug: config.movementSlug,
    trainingName: trainingModule.name,
    eyebrow: "MULAI LATIHAN",
    countdownSec: 3,
    targetDurationSec: targetDuration,
    maxDurationSec: config.maxDurationSeconds,
    maxBytes: config.maxBytes,
    acceptedMimeTypes: config.acceptedMimeTypes,
    retentionSeconds: config.retentionSeconds ?? 86_400,
    scoringAvailable: trainingModule.capability.scoringAvailable,
  };
}

export function isTrainingModuleSlug(
  value: string,
): value is TrainingModuleSlug {
  return (TRAINING_MODULE_SLUGS as readonly string[]).includes(value);
}
