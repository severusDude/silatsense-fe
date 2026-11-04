import { describe, expect, it } from "vitest";
import { config } from "@/proxy";

describe("proxy matcher", () => {
  const pattern = new RegExp(`^${config.matcher[0]}$`);

  it("skips the upload route so the proxy does not buffer the multipart body", () => {
    expect(pattern.test("/api/member/sessions")).toBe(false);
    expect(pattern.test("/api/member/sessions/")).toBe(false);
  });

  it("still refreshes the session for the video stream route", () => {
    expect(pattern.test("/api/member/sessions/session-1/video")).toBe(true);
  });
});
