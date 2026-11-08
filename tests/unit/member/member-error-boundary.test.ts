import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  MemberErrorCard,
  MemberMainErrorBoundary,
  MemberSegmentFallback,
  runMemberSegmentRecovery,
} from "@/features/member/components/member-error-boundary";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe("member error boundary", () => {
  it("renders MemberErrorCard with expected title, description, retry CTA, and dashboard link", () => {
    const error = new Error("Koneksi latihan terputus");
    const html = renderToStaticMarkup(
      createElement(MemberErrorCard, { error, reset: vi.fn() }),
    );

    expect(html).toContain("Gagal Memuat Data Latihan");
    expect(html).toContain(
      "Terjadi gangguan koneksi ke server. Data latihan Anda tetap aman.",
    );
    expect(html).toContain("Coba Lagi");
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain("Ke Dashboard");
    expect(html).not.toContain("ID:");
  });

  it("renders error digest when present on error", () => {
    const error = Object.assign(new Error("API timeout"), {
      digest: "ERR_MEMBER_99",
    });
    const html = renderToStaticMarkup(
      createElement(MemberErrorCard, { error, reset: vi.fn() }),
    );

    expect(html).toContain("ID: ERR_MEMBER_99");
  });

  it("renders MemberSegmentFallback with main container and member bottom nav", () => {
    const error = new Error("Segment crashed");
    const html = renderToStaticMarkup(
      createElement(MemberSegmentFallback, { error, reset: vi.fn() }),
    );

    expect(html).toContain("<main");
    expect(html).toContain("Navigasi member");
    expect(html).toContain("Gagal Memuat Data Latihan");
  });

  it("manages error state via MemberMainErrorBoundary and derives state on error", () => {
    const err = new Error("Boom");
    const derived = MemberMainErrorBoundary.getDerivedStateFromError(err);
    expect(derived).toEqual({ error: err });

    // Initial state: error is null -> renders children
    const boundary = new MemberMainErrorBoundary({
      children: createElement("span", null, "Safe Child Content"),
    });
    expect(boundary.state).toEqual({ error: null });

    const initialRender = boundary.render();
    const initialHtml = renderToStaticMarkup(initialRender as ReactElement);
    expect(initialHtml).toContain("Safe Child Content");

    // When state.error is set -> renders MemberErrorCard
    boundary.state = { error: err };
    boundary.setState = vi.fn().mockImplementation((updater) => {
      const nextState =
        typeof updater === "function" ? updater(boundary.state) : updater;
      boundary.state = { ...boundary.state, ...nextState };
    });

    const errorRender = boundary.render() as ReactElement<{
      error: Error;
      reset: () => void;
    }>;
    expect(errorRender).not.toBeNull();
    expect(errorRender.type).toBe(MemberErrorCard);
    expect(errorRender.props.error).toBe(err);

    // Calling reset clears state.error back to null
    const capturedReset = errorRender.props.reset;
    expect(typeof capturedReset).toBe("function");
    capturedReset();
    expect(boundary.state.error).toBeNull();
  });

  it("runs segment recovery by calling router.refresh() before reset()", () => {
    const callOrder: string[] = [];
    const router = {
      refresh: vi.fn().mockImplementation(() => {
        callOrder.push("refresh");
      }),
    };
    const reset = vi.fn().mockImplementation(() => {
      callOrder.push("reset");
    });

    runMemberSegmentRecovery(router, reset);

    expect(router.refresh).toHaveBeenCalledOnce();
    expect(reset).toHaveBeenCalledOnce();
    expect(callOrder).toEqual(["refresh", "reset"]);
  });

  it("has thin app/(member)/error.tsx re-export and MemberLayout wrapping children in boundary", () => {
    const root = process.cwd();
    const errorRoute = readFileSync(
      join(root, "app/(member)/error.tsx"),
      "utf8",
    );
    const layout = readFileSync(
      join(root, "features/member/pages/member-layout.tsx"),
      "utf8",
    );

    // error.tsx must be a thin client delegate without inline JSX
    expect(errorRoute).toContain('"use client";');
    expect(errorRoute).toContain(
      'export { MemberSegmentFallback as default } from "@/features/member/components/member-error-boundary";',
    );
    expect(errorRoute).not.toContain("<");

    // MemberLayout must wrap children in MemberMainErrorBoundary inside <main>
    expect(layout).toContain("MemberMainErrorBoundary");
    expect(layout).toMatch(
      /<main[^>]*>\s*<MemberMainErrorBoundary>\s*\{children\}\s*<\/MemberMainErrorBoundary>\s*<\/main>/,
    );
  });
});
