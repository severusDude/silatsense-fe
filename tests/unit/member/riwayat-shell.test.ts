import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

const serverFiles = [
  "features/member/components/riwayat-stat-grid.tsx",
  "features/member/components/riwayat-param-chips.tsx",
  "features/member/components/riwayat-coach-note.tsx",
  "features/member/components/riwayat-card-actions.tsx",
  "features/member/components/riwayat-movement-list.tsx",
];

describe("riwayat server components", () => {
  it("uses shadcn Badge with unified Sesuai/Perlu Koreksi wording", () => {
    // Arrange + Act
    const src = serverFiles.map(read).join("\n") + read("features/member/components/riwayat-movement-item.tsx");

    // Assert
    expect(src).toContain("@/components/ui/badge");
    expect(src).toContain("statusLabel");
    expect(read("features/member/data/riwayat-dummy.ts")).toContain("Perlu Koreksi");
    expect(src).not.toContain("Perlu Perbaikan");
    expect(src).not.toContain("Sesuai Standar");
  });

  it("carries no pilar suffixes, numbering, telemetry, or speed values", () => {
    // Arrange + Act
    const src = serverFiles.map(read).join("\n");

    // Assert
    expect(src).not.toContain("PILAR");
    expect(src).not.toContain("pilar");
    expect(src).not.toContain("15 Reps");
    expect(src).not.toContain("4.18");
    expect(src).not.toContain("MediaPipe");
  });

  it("keeps all riwayat server UI flex-only", () => {
    // Arrange + Act + Assert
    for (const file of serverFiles) {
      expect(read(file)).not.toContain("absolute");
    }
  });

  it("links Latihan Ulang to rekam and keeps Detail Evaluasi dead with a TODO", () => {
    // Arrange + Act
    const src = read("features/member/components/riwayat-card-actions.tsx");

    // Assert
    expect(src).toContain("Latihan Ulang");
    expect(src).toContain("/latihan/${slug}/rekam");
    expect(src).toContain("Detail Evaluasi");
    expect(src).toContain("GET /member/history/:id");
    expect(src).toContain("TODO");
  });
});

describe("riwayat movement island", () => {
  it("renders collapsed by default with independent toggles and icon TODOs", () => {
    // Arrange + Act (no DOM env in repo — interaction covered via source contract)
    const src = read("features/member/components/riwayat-movement-item.tsx");

    // Assert
    expect(src).toContain('"use client"');
    expect(src).toContain("useState(false)");
    expect(src).toContain("onOpenChange");
    expect(src).toContain("CollapsibleTrigger");
    expect(src).toContain("CollapsibleContent");
    expect(src).toContain("rotate-180");
    expect(src).toContain("motion-reduce");
    expect(src).toContain("TODO: replace with per-gerakan Lucide icon");
    expect(src).toContain("PersonStanding");
    expect(src).toContain("Footprints");
    expect(src).not.toContain("absolute");
    expect(src).not.toContain("PILAR");
  });

  it("orders title above date with no numbering", () => {
    // Arrange + Act
    const src = read("features/member/components/riwayat-movement-item.tsx");

    // Assert
    const titleAt = src.indexOf("techniqueName");
    const dateAt = src.indexOf("dateLabel");
    expect(titleAt).toBeGreaterThan(-1);
    expect(dateAt).toBeGreaterThan(titleAt);
  });
});
