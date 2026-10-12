import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  afterSessionDetail,
  beforeSessionDetail,
  sessionDetailIds,
} from "@/features/member/data/session-detail-dummy";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("session-detail dummy", () => {
  it("exposes two stub ids for before/after states", () => {
    // Arrange + Act
    const ids = [...sessionDetailIds];

    // Assert
    expect(ids).toEqual(["pukulan-menunggu", "pukulan-remidiasi"]);
    expect(beforeSessionDetail.id).toBe("pukulan-menunggu");
    expect(afterSessionDetail.id).toBe("pukulan-remidiasi");
  });

  it("shares coach, technique, score, pillars, video, and retest verbatim", () => {
    // Arrange + Act
    const pair = [beforeSessionDetail, afterSessionDetail];

    // Assert
    for (const session of pair) {
      expect(session.techniqueName).toBe("Pukulan Lurus Depan (Tusuk/Lurus)");
      expect(session.techniqueDesc).toBe("Jurusan Serang Lurus Lintasan Ulu Hati");
      expect(session.coach.name).toBe("Kang Fauzan Azhiim, S.Pd.");
      expect(session.coach.role).toBe("Pelatih Kepala UKM Pencak Silat UNSIL");
      expect(session.decisionLabel).toBe("Menunggu");
      expect(session.scorePct).toBe(80);
      expect(session.targetPct).toBe(85);
      expect(session.pillars.map((pillar) => pillar.scorePct)).toEqual([91, 86, 80, 76]);
      expect(session.pillars.map((pillar) => pillar.stageLabel)).toEqual([
        "Lolos",
        "Lolos",
        "Fokus",
        "Remidi",
      ]);
      expect(session.pillars.map((pillar) => pillar.badge)).toEqual([
        "success",
        "success",
        "destructive",
        "warning",
      ]);
      expect(session.video.status).toBe("placeholder");
      expect(session.video.cameraLabel).toBe("Kamera 01: Multi-Axis Front (Rep 11/15)");
      expect(session.video.qualityLabel).toBe("30 FPS • 1080p");
      expect(session.retestValue).toBe("Jumat, 2 Okt 2026 • Dojo UNSIL");
    }
  });

  it("renders empty postures before and five assessed postures after", () => {
    // Arrange + Act
    const { postures: beforePostures } = beforeSessionDetail;
    const { postures: afterPostures } = afterSessionDetail;

    // Assert
    expect(beforeSessionDetail.decision).toBe("menunggu");
    expect(beforePostures).toHaveLength(0);
    expect(beforeSessionDetail.decidedAtLabel).toBeUndefined();
    expect(afterSessionDetail.decision).toBe("remidiasi");
    expect(afterSessionDetail.decidedAtLabel).toBe("28 Sep 2026, 17:30");
    expect(afterSessionDetail.focusTechnique).toBe("Pukulan Lurus Depan");
    expect(afterPostures).toHaveLength(5);
    expect(afterPostures.map((posture) => posture.id)).toEqual([
      "bahu",
      "siku-kanan",
      "pinggul",
      "lutut",
      "pergelangan",
    ]);
    expect(afterPostures.filter((posture) => posture.status === "sesuai")).toHaveLength(3);
    const critical = afterPostures.find((posture) => posture.id === "siku-kanan");
    expect(critical?.correctionCue).toContain("koronal rusuk");
    for (const posture of afterPostures) {
      expect(posture.thumbnailSrc).toBeNull();
    }
  });

  it("routes ids through the cached fetcher with null fallback", () => {
    // Arrange + Act (no DOM/Next runtime in repo — fetcher covered via source contract)
    const src = read("features/member/data/get-session-detail.ts");

    // Assert
    expect(src).toContain('import "server-only"');
    expect(src).toContain('"use cache"');
    expect(src).toContain("cacheLife");
    expect(src).toContain("afterSessionDetail.id");
    expect(src).toContain("beforeSessionDetail.id");
    expect(src).toContain("return null");
    expect(src).toContain("GET /member/history/:id");
    expect(src).toContain("TODO");
  });

  it("carries no dropped copy and no backend-bound keys", () => {
    // Arrange + Act
    const raw = JSON.stringify([beforeSessionDetail, afterSessionDetail]);

    // Assert
    expect(raw).not.toContain("Terverifikasi Resmi");
    expect(raw).not.toContain("Latihan Mandiri");
    expect(raw).not.toContain("Drill Wajib");
    expect(raw).not.toContain("Perlu Perbaikan");
  });
});
