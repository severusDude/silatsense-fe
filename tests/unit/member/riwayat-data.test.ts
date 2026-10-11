import { describe, expect, it } from "vitest";
import { dummyMemberHistory } from "@/features/member/data/riwayat-dummy";

describe("dummyMemberHistory", () => {
  it("carries the summary verbatim with four entries in order", () => {
    // Arrange + Act
    const { summary, entries } = dummyMemberHistory;

    // Assert
    expect(summary.totalSessionsLabel).toBe("24 Sesi");
    expect(summary.sessionsDeltaLabel).toBe("↗ +4 minggu ini");
    expect(summary.avgAccuracyPct).toBe(84.6);
    expect(summary.accuracyNote).toBe("Mendekati IPSI ≥85%");
    expect(summary.dominantFocus).toBe("Kuda Kuda");
    expect(summary.dominantSessionsLabel).toBe("12 Sesi terekam");
    expect(summary.sensorHoursLabel).toBe("08j 45m");
    expect(summary.sensorNote).toBe("Telemetri aktif");
    expect(entries.map((entry) => entry.slug)).toEqual([
      "kuda-kuda",
      "pukulan",
      "tangkisan",
      "tendangan",
    ]);
  });

  it("carries the pukulan entry verbatim with title-case status", () => {
    // Arrange + Act
    const entry = dummyMemberHistory.entries[1];

    // Assert
    expect(entry.techniqueName).toBe("Pukulan Lurus Depan");
    expect(entry.dateLabel).toBe("28 SEP 2026");
    expect(entry.timeLabel).toBe("16:45 WIB");
    expect(entry.status).toBe("perlu-koreksi");
    expect(entry.statusLabel).toBe("Perlu Koreksi");
    expect(entry.scorePct).toBe(80);
    expect(entry.scoreCaption).toBe("Standar ≥85%");
    expect(entry.params.map((param) => param.name)).toEqual([
      "Bahu",
      "Siku Kanan",
      "Pinggul",
      "Lutut",
      "Pergelangan",
    ]);
    expect(entry.params.map((param) => param.deviated)).toEqual([
      false,
      true,
      false,
      false,
      true,
    ]);
    expect(entry.coachNote).toContain("Rapatkan siku kanan");
  });

  it("pins scores and title-case statuses on all entries", () => {
    // Arrange + Act
    const entries = dummyMemberHistory.entries;

    // Assert
    expect(entries.map((entry) => entry.scorePct)).toEqual([91, 80, 86, 76]);
    expect(entries.map((entry) => entry.statusLabel)).toEqual([
      "Sesuai",
      "Perlu Koreksi",
      "Sesuai",
      "Perlu Koreksi",
    ]);
    expect(entries.map((entry) => entry.params)).toHaveLength(4);
    for (const entry of entries) {
      expect(entry.params).toHaveLength(5);
    }
  });

  it("carries no pilar, numbering, telemetry, or speed keys", () => {
    // Arrange + Act
    const raw = JSON.stringify(dummyMemberHistory);

    // Assert
    expect(raw).not.toContain("PILAR");
    expect(raw).not.toContain("pilar");
    expect(raw).not.toContain("speed");
    expect(raw).not.toContain("4.18");
    expect(raw).not.toContain("telemetry");
    expect(raw).not.toContain("15 Reps");
    expect(raw).not.toContain("Perlu Perbaikan");
    expect(raw).not.toContain("Sesuai Standar");
  });
});
