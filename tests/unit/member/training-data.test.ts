import { describe, expect, it } from "vitest";
import { dummyMemberTraining } from "@/features/member/data/member-training-dummy";

describe("dummyMemberTraining", () => {
  it("carries the Figma hero title and subtitle verbatim", () => {
    // Arrange + Act
    const { hero } = dummyMemberTraining;

    // Assert
    expect(hero.title).toBe("Pilih Latihan Gerakan Dasar");
    expect(hero.subtitle).toBe(
      "Pilih salah satu dari 4 pilar teknik dasar pencak silat untuk memulai panduan gerak dan kalibrasi sensor biomekanika AI.",
    );
  });

  it("exposes four modules in Figma order", () => {
    // Arrange + Act
    const slugs = dummyMemberTraining.modules.map((m) => m.slug);

    // Assert
    expect(slugs).toEqual(["kuda-kuda", "pukulan", "tangkisan", "tendangan"]);
  });

  it("keeps slugs unique with the Figma-verbatim Kuda-kuda description", () => {
    // Arrange + Act
    const modules = dummyMemberTraining.modules;

    // Assert
    expect(new Set(modules.map((m) => m.slug)).size).toBe(4);
    expect(modules[0].description).toBe(
      "Fondasi utama stabilitas tubuh, distribusi bobot simetris 50:50, serta kekuatan tumpuan paha dan lutut sejajar 135°.",
    );
  });

  it("shows an estimate badge only where the Figma duration is legible", () => {
    // Arrange + Act
    const labels = dummyMemberTraining.modules.map((m) => m.estimateLabel);

    // Assert
    expect(labels[0]).toBe("10 Menit");
    expect(labels.slice(1)).toEqual([undefined, undefined, undefined]);
  });
});
