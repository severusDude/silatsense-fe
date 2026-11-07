import { describe, expect, it } from "vitest";
import {
  baseMimeType,
  describeUploadFailure,
  effectiveUploadMaxBytes,
  pickRecorderMimeType,
  readRetryOf,
  recordingFileName,
} from "@/features/member/recorder";
import { MEMBER_UPLOAD_MAX_BYTES } from "@/lib/upload-limits";

describe("pickRecorderMimeType", () => {
  it("prefers an accepted base type the browser can encode", () => {
    // Arrange
    const accepted = ["video/webm", "video/mp4"];
    const supported = new Set(["video/mp4"]);

    // Act
    const result = pickRecorderMimeType(accepted, (type) =>
      supported.has(type),
    );

    // Assert
    expect(result).toBe("video/mp4");
  });

  it("falls back to a codec-qualified variant when the bare type is rejected", () => {
    // Arrange
    const accepted = ["video/webm"];
    const supported = new Set(["video/webm;codecs=vp8"]);

    // Act
    const result = pickRecorderMimeType(accepted, (type) =>
      supported.has(type),
    );

    // Assert
    expect(result).toBe("video/webm;codecs=vp8");
  });

  it("normalizes accepted types before testing them", () => {
    // Arrange
    const accepted = [" VIDEO/WEBM ; codecs=vp9 "];
    const seen: string[] = [];

    // Act
    const result = pickRecorderMimeType(accepted, (type) => {
      seen.push(type);
      return type === "video/webm";
    });

    // Assert
    expect(result).toBe("video/webm");
    expect(seen).toEqual(["video/webm"]);
  });

  it("returns null when the browser supports none of the accepted types", () => {
    // Arrange + Act
    const result = pickRecorderMimeType(
      ["video/x-matroska"],
      () => false,
    );

    // Assert
    expect(result).toBeNull();
  });
});

describe("recordingFileName", () => {
  it("adds the extension that matches the recorder MIME type", () => {
    // Arrange + Act + Assert
    expect(recordingFileName("kuda-kuda", "video/webm;codecs=vp9")).toBe(
      "rekaman-kuda-kuda.webm",
    );
    expect(recordingFileName("pukulan", "video/mp4")).toBe(
      "rekaman-pukulan.mp4",
    );
    expect(recordingFileName("tendangan", "video/quicktime")).toBe(
      "rekaman-tendangan.mov",
    );
  });

  it("keeps a usable file name when the slug is empty", () => {
    // Arrange + Act + Assert
    expect(recordingFileName("", "video/webm")).toBe("rekaman-latihan.webm");
  });
});

describe("baseMimeType", () => {
  it("strips codec parameters and falls back to webm", () => {
    // Arrange + Act + Assert
    expect(baseMimeType("video/webm;codecs=vp9")).toBe("video/webm");
    expect(baseMimeType(" VIDEO/MP4 ")).toBe("video/mp4");
    expect(baseMimeType("")).toBe("video/webm");
  });
});

describe("effectiveUploadMaxBytes", () => {
  it("uses the tighter of the backend config and the deployment cap", () => {
    // Arrange + Act + Assert
    expect(effectiveUploadMaxBytes(10_000_000)).toBe(MEMBER_UPLOAD_MAX_BYTES);
    expect(effectiveUploadMaxBytes(1_500_000)).toBe(1_500_000);
  });

  it("keeps an explicit zero and ignores a non-finite config", () => {
    // Arrange + Act + Assert
    expect(effectiveUploadMaxBytes(0)).toBe(0);
    expect(effectiveUploadMaxBytes(Number.NaN)).toBe(MEMBER_UPLOAD_MAX_BYTES);
  });
});

describe("readRetryOf", () => {
  it("returns a trimmed retry source id", () => {
    // Arrange + Act + Assert
    expect(readRetryOf(" session-1 ")).toBe("session-1");
    expect(readRetryOf(["first", "second"])).toBe("first");
  });

  it("returns null for missing, empty, or absent values", () => {
    // Arrange + Act + Assert
    expect(readRetryOf(undefined)).toBeNull();
    expect(readRetryOf("   ")).toBeNull();
    expect(readRetryOf([])).toBeNull();
  });
});

describe("describeUploadFailure", () => {
  it("prefers a specific domain detail when the BFF provides one", () => {
    // Arrange + Act
    const message = describeUploadFailure(
      413,
      "Ukuran rekaman melebihi batas 4,3 MB.",
    );

    // Assert
    expect(message).toBe("Ukuran rekaman melebihi batas 4,3 MB.");
  });

  it("maps known statuses to actionable fallback copy", () => {
    // Arrange + Act + Assert
    expect(describeUploadFailure(413, null)).toContain("melebihi batas");
    expect(describeUploadFailure(415, null)).toContain("Format video");
    expect(describeUploadFailure(429, null)).toContain("Terlalu banyak");
    expect(describeUploadFailure(401, null)).toContain("masuk kembali");
  });

  it("distinguishes network, server, and unknown failures", () => {
    // Arrange + Act + Assert
    expect(describeUploadFailure(null)).toContain("koneksi");
    expect(describeUploadFailure(503, null)).toContain("bermasalah");
    expect(describeUploadFailure(418, null)).toBe(
      "Gagal mengunggah rekaman.",
    );
  });
});
