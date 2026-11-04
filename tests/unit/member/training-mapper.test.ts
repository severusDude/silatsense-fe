import { describe, expect, it } from "vitest";
import type {
  ActivitySummary,
  Capability,
  SimilarityGroup,
  TrainingCatalog,
  TrainingModule,
  TrainingPrep,
  UploadConfig,
} from "@/api";
import {
  TRAINING_MODULE_SLUGS,
  isTrainingModuleSlug,
  toPersiapanViewModel,
  toRekamViewModel,
  toTrainingCatalogViewModel,
  toTrainingModuleViewModel,
} from "@/features/member/data/training-mapper";

const capability: Capability = {
  scoringAvailable: true,
  reason: null,
  method: "static-reference-pose",
  referenceVersions: ["ref-v1"],
};

function moduleFixture(
  overrides: Partial<TrainingModule> = {},
): TrainingModule {
  return {
    slug: "kuda-kuda",
    name: "Kuda-kuda",
    order: 1,
    description: "Fondasi stabilitas tubuh.",
    level: "Pemula",
    estimatedDurationSeconds: 600,
    capability,
    ...overrides,
  };
}

function summaryFixture(
  overrides: Partial<ActivitySummary> = {},
): ActivitySummary {
  return {
    completedSessionCount: 6,
    totalDurationSeconds: 420,
    durationSampleCount: 6,
    scoredSessionCount: 4,
    excludedScoreCount: 2,
    similarityGroups: [],
    ...overrides,
  };
}

function similarityGroup(
  overrides: Partial<SimilarityGroup> = {},
): SimilarityGroup {
  return {
    movementSlug: "kuda-kuda",
    method: "static-reference-pose",
    analyzerVersion: "1.0.0",
    featureVersion: "1.0.0",
    referenceVersion: "ref-v1",
    averageScore: 82.4,
    sampleCount: 4,
    ...overrides,
  };
}

function prepFixture(overrides: Partial<TrainingPrep> = {}): TrainingPrep {
  return {
    module: moduleFixture(),
    checklist: [
      { id: "camera", text: "Izinkan akses kamera.", source: "Panduan perangkat" },
      { id: "light", text: "Pastikan ruangan terang.", source: "Panduan latihan" },
    ],
    guides: [
      { id: "stance", text: "Buka kaki selebar dua bahu.", source: "PB IPSI" },
    ],
    ...overrides,
  };
}

function uploadConfigFixture(
  overrides: Partial<UploadConfig> = {},
): UploadConfig {
  return {
    movementSlug: "kuda-kuda",
    acceptedMimeTypes: ["video/webm", "video/mp4"],
    maxBytes: 20 * 1024 * 1024,
    maxDurationSeconds: 120,
    retentionSeconds: 86400,
    recommendedDurationSeconds: 60,
    ...overrides,
  };
}

describe("toTrainingModuleViewModel", () => {
  it("maps wire fields and derives the order and estimate labels", () => {
    // Arrange + Act
    const vm = toTrainingModuleViewModel(moduleFixture());

    // Assert
    expect(vm).toMatchObject({
      slug: "kuda-kuda",
      order: 1,
      orderLabel: "Latihan 01",
      name: "Kuda-kuda",
      levelLabel: "Pemula",
      description: "Fondasi stabilitas tubuh.",
      estimateLabel: "10 Menit",
      scoringAvailable: true,
      scoringReason: null,
    });
  });

  it("falls back honestly when optional catalog fields are null", () => {
    // Arrange + Act
    const vm = toTrainingModuleViewModel(
      moduleFixture({
        level: null,
        description: null,
        estimatedDurationSeconds: null,
      }),
    );

    // Assert
    expect(vm.levelLabel).toBe("Semua Tingkat");
    expect(vm.description).toBe("");
    expect(vm.estimateLabel).toBeUndefined();
  });

  it("surfaces an unavailable scoring capability", () => {
    // Arrange + Act
    const vm = toTrainingModuleViewModel(
      moduleFixture({
        capability: {
          scoringAvailable: false,
          reason: "reference_not_ready",
          referenceVersions: [],
        },
      }),
    );

    // Assert
    expect(vm.scoringAvailable).toBe(false);
    expect(vm.scoringReason).toBe("reference_not_ready");
  });

  it("shows a similarity average only for one matching group", () => {
    // Arrange
    const single = toTrainingModuleViewModel(
      moduleFixture(),
      summaryFixture({ similarityGroups: [similarityGroup()] }),
    );
    const duplicated = toTrainingModuleViewModel(
      moduleFixture(),
      summaryFixture({
        similarityGroups: [
          similarityGroup(),
          similarityGroup({ referenceVersion: "ref-v2", sampleCount: 8 }),
        ],
      }),
    );
    const nullScore = toTrainingModuleViewModel(
      moduleFixture(),
      summaryFixture({
        similarityGroups: [similarityGroup({ averageScore: null })],
      }),
    );

    // Act + Assert
    expect(single.similarity).toEqual({
      averageScore: 82.4,
      sampleCount: 4,
    });
    expect(duplicated.similarity).toBeNull();
    expect(nullScore.similarity).toBeNull();
  });
});

describe("toTrainingCatalogViewModel", () => {
  it("sorts modules, derives hero stats, and keeps accuracy inactive", () => {
    // Arrange
    const catalog: TrainingCatalog = {
      modules: [
        moduleFixture({
          slug: "pukulan",
          name: "Pukulan",
          order: 2,
          estimatedDurationSeconds: null,
        }),
        moduleFixture(),
      ],
      statistics: summaryFixture(),
    };

    // Act
    const vm = toTrainingCatalogViewModel(catalog);

    // Assert
    expect(vm.modules.map((module) => module.slug)).toEqual([
      "kuda-kuda",
      "pukulan",
    ]);
    expect(vm.hero.badges).toEqual([
      "MODUL LATIHAN",
      "Standar PB IPSI Resmi",
      "2 Pilar Teknik",
    ]);
    expect(vm.hero.completedSessionsLabel).toBe("6 Sesi Tersimpan");
    expect(vm.hero.scoredSessionsLabel).toBe("4 Sesi Dinilai");
    expect(vm.hero.accuracy).toEqual({
      available: false,
      label: "Segera hadir",
    });
  });
});

describe("toPersiapanViewModel", () => {
  it("maps module copy and guide items without inventing coach data", () => {
    // Arrange + Act
    const vm = toPersiapanViewModel(prepFixture());

    // Assert
    expect(vm).toMatchObject({
      slug: "kuda-kuda",
      eyebrow: "KUDA-KUDA",
      title: "Kuda-kuda",
      levelLabel: "Pemula",
      estimatedDurationLabel: "10 Menit",
    });
    expect(vm.checklist).toEqual([
      { id: "camera", text: "Izinkan akses kamera.", source: "Panduan perangkat" },
      { id: "light", text: "Pastikan ruangan terang.", source: "Panduan latihan" },
    ]);
    expect(vm.guides).toEqual([
      { id: "stance", text: "Buka kaki selebar dua bahu.", source: "PB IPSI" },
    ]);
  });

  it("defaults the capability method and keeps reference versions", () => {
    // Arrange + Act
    const vm = toPersiapanViewModel(
      prepFixture({
        module: moduleFixture({
          capability: {
            scoringAvailable: false,
            reason: "reference_not_ready",
            referenceVersions: ["ref-v1", "ref-v2"],
          },
        }),
      }),
    );

    // Assert
    expect(vm.capability).toEqual({
      scoringAvailable: false,
      reason: "reference_not_ready",
      method: "static-reference-pose",
      referenceVersions: ["ref-v1", "ref-v2"],
    });
  });
});

describe("toRekamViewModel", () => {
  it("uses the recommended duration as the target and keeps the max", () => {
    // Arrange + Act
    const vm = toRekamViewModel(uploadConfigFixture(), prepFixture());

    // Assert
    expect(vm).toMatchObject({
      slug: "kuda-kuda",
      trainingName: "Kuda-kuda",
      eyebrow: "MULAI LATIHAN",
      countdownSec: 3,
      targetDurationSec: 60,
      maxDurationSec: 120,
      maxBytes: 20 * 1024 * 1024,
      acceptedMimeTypes: ["video/webm", "video/mp4"],
      retentionSeconds: 86400,
      scoringAvailable: true,
    });
  });

  it("falls back to the max duration and clamps an oversized recommendation", () => {
    // Arrange
    const withoutRecommendation = toRekamViewModel(
      uploadConfigFixture({ recommendedDurationSeconds: null }),
      prepFixture(),
    );
    const oversized = toRekamViewModel(
      uploadConfigFixture({ recommendedDurationSeconds: 300 }),
      prepFixture(),
    );

    // Act + Assert
    expect(withoutRecommendation.targetDurationSec).toBe(120);
    expect(oversized.targetDurationSec).toBe(120);
  });

  it("defaults the retention window when the server omits it", () => {
    // Arrange + Act
    const vm = toRekamViewModel(
      uploadConfigFixture({ retentionSeconds: undefined }),
      prepFixture(),
    );

    // Assert
    expect(vm.retentionSeconds).toBe(86400);
  });
});

describe("isTrainingModuleSlug", () => {
  it("accepts exactly the four training modules", () => {
    // Arrange + Act + Assert
    expect([...TRAINING_MODULE_SLUGS]).toEqual([
      "kuda-kuda",
      "pukulan",
      "tangkisan",
      "tendangan",
    ]);
    for (const slug of TRAINING_MODULE_SLUGS) {
      expect(isTrainingModuleSlug(slug)).toBe(true);
    }
    expect(isTrainingModuleSlug("jurus-tak-bernama")).toBe(false);
  });
});
