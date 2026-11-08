import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  CoachErrorCard,
  CoachMainErrorBoundary,
  CoachSegmentFallback,
  runSegmentRecovery,
} from "@/features/coach/components/coach-error-boundary";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe("coach error boundary", () => {
  it("renders CoachErrorCard with expected title, description, retry CTA, and home link", () => {
    const error = new Error("Koneksi gateway terputus");
    const html = renderToStaticMarkup(
      createElement(CoachErrorCard, { error, reset: vi.fn() }),
    );

    expect(html).toContain("Layanan Sedang Mengalami Kendala");
    expect(html).toContain(
      "Gagal menghubungkan ke server analisis silat. Silakan coba muat ulang halaman.",
    );
    expect(html).toContain("Coba Muat Ulang");
    expect(html).toContain('href="/coach"');
    expect(html).toContain("Kembali ke Dasbor");
    expect(html).not.toContain("ID:");
  });

  it("renders error digest when present on error", () => {
    const error = Object.assign(new Error("API timeout"), {
      digest: "ERR_COACH_42",
    });
    const html = renderToStaticMarkup(
      createElement(CoachErrorCard, { error, reset: vi.fn() }),
    );

    expect(html).toContain("ID: ERR_COACH_42");
  });

  it("renders CoachSegmentFallback with main container and coach bottom nav", () => {
    const error = new Error("Segment crashed");
    const html = renderToStaticMarkup(
      createElement(CoachSegmentFallback, { error, reset: vi.fn() }),
    );

    expect(html).toContain("<main");
    expect(html).toContain("Navigasi pelatih");
    expect(html).toContain("Layanan Sedang Mengalami Kendala");
  });

  it("manages error state via CoachMainErrorBoundary and derives state on error", () => {
    const err = new Error("Boom");
    const derived = CoachMainErrorBoundary.getDerivedStateFromError(err);
    expect(derived).toEqual({ error: err });

    // Initial state: error is null -> renders children
    const boundary = new CoachMainErrorBoundary({
      children: createElement("span", null, "Safe Child Content"),
    });
    expect(boundary.state).toEqual({ error: null });

    const initialRender = boundary.render();
    const initialHtml = renderToStaticMarkup(initialRender as any);
    expect(initialHtml).toContain("Safe Child Content");

    // When state.error is set -> renders CoachErrorCard
    boundary.state = { error: err };
    boundary.setState = vi.fn().mockImplementation((updater) => {
      const nextState =
        typeof updater === "function" ? updater(boundary.state) : updater;
      boundary.state = { ...boundary.state, ...nextState };
    });

    const errorRender = boundary.render() as any;
    expect(errorRender).not.toBeNull();
    expect(errorRender.type).toBe(CoachErrorCard);
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

    runSegmentRecovery(router, reset);

    expect(router.refresh).toHaveBeenCalledOnce();
    expect(reset).toHaveBeenCalledOnce();
    expect(callOrder).toEqual(["refresh", "reset"]);
  });

  it("has thin app/(coach)/error.tsx re-export and CoachLayout wrapping children in boundary", () => {
    const root = process.cwd();
    const errorRoute = readFileSync(
      join(root, "app/(coach)/error.tsx"),
      "utf8",
    );
    const layout = readFileSync(
      join(root, "features/coach/pages/coach-layout.tsx"),
      "utf8",
    );

    // error.tsx must be a thin client delegate without inline JSX
    expect(errorRoute).toContain('"use client";');
    expect(errorRoute).toContain(
      'export { CoachSegmentFallback as default } from "@/features/coach/components/coach-error-boundary";',
    );
    expect(errorRoute).not.toContain("<");

    // CoachLayout must wrap children in CoachMainErrorBoundary inside <main>
    expect(layout).toContain("CoachMainErrorBoundary");
    expect(layout).toMatch(
      /<main[^>]*>\s*<CoachMainErrorBoundary>\s*\{children\}\s*<\/CoachMainErrorBoundary>\s*<\/main>/,
    );
  });
});
