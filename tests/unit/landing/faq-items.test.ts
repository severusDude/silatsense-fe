import { describe, expect, it } from "vitest";
import { faqItems } from "@/features/landing/components/faq-items";

describe("faqItems", () => {
  it("exposes four Figma questions in order", () => {
    // Arrange + Act
    const questions = faqItems.map((item) => item.question);

    // Assert
    expect(questions).toEqual([
      "Apakah butuh kamera khusus atau sensor baju untuk menggunakan sistem ini?",
      "Apakah sistem ini khusus untuk mahasiswa Universitas Siliwangi?",
      "Bagaimana jika ruangan latihan saya memiliki pencahayaan minim?",
      "Apakah sistem ini menggantikan peran pelatih silat fisik?",
    ]);
  });

  it("gives every question a non-empty placeholder answer", () => {
    // Arrange + Act
    const empty = faqItems.filter((item) => item.answer.trim().length === 0);

    // Assert
    expect(faqItems).toHaveLength(4);
    expect(empty).toEqual([]);
  });

  it("marks answers as lorem placeholders pending UKM copy", () => {
    // Arrange + Act
    const nonLorem = faqItems.filter((item) => !item.answer.startsWith("Lorem ipsum"));

    // Assert
    expect(nonLorem).toEqual([]);
  });
});
