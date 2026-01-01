import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock dependencies before importing component
vi.mock("@/context", () => ({
  useDarkModeContext: vi.fn(() => ({ isDark: false })),
}));

vi.mock("@/hooks", () => ({
  useHeader: vi.fn(() => ({
    config: {
      visible: true,
      startContent: <div>Start</div>,
      centerContent: <div>Center</div>,
      endContent: <div>End</div>,
    },
  })),
}));

vi.mock("@/components", () => ({
  PageHeader: vi.fn(({ startContent, centerContent, endContent }) => (
    <header data-testid="page-header">
      {startContent}
      {centerContent}
      {endContent}
    </header>
  )),
}));

import { LayoutShell } from "@/layouts/LayoutShell";
import { useDarkModeContext } from "@/context";
import { useHeader } from "@/hooks";

describe("LayoutShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders children correctly", () => {
    render(
      <LayoutShell>
        <div data-testid="child-content">Test Content</div>
      </LayoutShell>
    );

    expect(screen.getByTestId("child-content")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("renders PageHeader when visible is true", () => {
    render(
      <LayoutShell>
        <div>Content</div>
      </LayoutShell>
    );

    expect(screen.getByTestId("page-header")).toBeInTheDocument();
  });

  it("hides PageHeader when visible is false", () => {
    vi.mocked(useHeader).mockReturnValue({
      config: {
        visible: false,
        startContent: null,
        centerContent: null,
        endContent: null,
      },
      setHeader: vi.fn(),
      resetHeader: vi.fn(),
    });

    render(
      <LayoutShell>
        <div>Content</div>
      </LayoutShell>
    );

    expect(screen.queryByTestId("page-header")).not.toBeInTheDocument();
  });

  it("applies light mode styles when isDark is false", () => {
    vi.mocked(useDarkModeContext).mockReturnValue({
      isDark: false,
      toggle: vi.fn(),
    });

    const { container } = render(
      <LayoutShell>
        <div>Content</div>
      </LayoutShell>
    );

    // Check that the main container has light mode gradient classes
    const mainContainer = container.firstChild as HTMLElement;
    expect(mainContainer.className).toContain("from-amber-50");
  });

  it("applies dark mode styles when isDark is true", () => {
    vi.mocked(useDarkModeContext).mockReturnValue({
      isDark: true,
      toggle: vi.fn(),
    });

    const { container } = render(
      <LayoutShell>
        <div>Content</div>
      </LayoutShell>
    );

    // Check that the main container has dark mode gradient classes
    const mainContainer = container.firstChild as HTMLElement;
    expect(mainContainer.className).toContain("from-slate-900");
  });

  it("renders header content from config", () => {
    vi.mocked(useHeader).mockReturnValue({
      config: {
        visible: true,
        startContent: <div>Custom Start</div>,
        centerContent: <div>Custom Center</div>,
        endContent: <div>Custom End</div>,
      },
      setHeader: vi.fn(),
      resetHeader: vi.fn(),
    });

    render(
      <LayoutShell>
        <div>Content</div>
      </LayoutShell>
    );

    expect(screen.getByText("Custom Start")).toBeInTheDocument();
    expect(screen.getByText("Custom Center")).toBeInTheDocument();
    expect(screen.getByText("Custom End")).toBeInTheDocument();
  });
});
