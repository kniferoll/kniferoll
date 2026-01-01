import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Alert } from "./Alert";

// Mock the dark mode context
vi.mock("@/context", () => ({
  useDarkModeContext: vi.fn(() => ({ isDark: false })),
}));

import { useDarkModeContext } from "@/context";

describe("Alert", () => {
  it("renders children content", () => {
    render(<Alert>Test message</Alert>);
    expect(screen.getByText("Test message")).toBeInTheDocument();
  });

  it("defaults to info variant", () => {
    const { container } = render(<Alert>Info message</Alert>);
    expect(container.firstChild).toHaveClass("bg-blue-50");
  });

  it("renders error variant in light mode", () => {
    const { container } = render(<Alert variant="error">Error message</Alert>);
    expect(container.firstChild).toHaveClass("bg-red-50");
  });

  it("renders success variant in light mode", () => {
    const { container } = render(<Alert variant="success">Success message</Alert>);
    expect(container.firstChild).toHaveClass("bg-green-50");
  });

  it("renders warning variant in light mode", () => {
    const { container } = render(<Alert variant="warning">Warning message</Alert>);
    expect(container.firstChild).toHaveClass("bg-amber-50");
  });

  it("renders info variant in dark mode", () => {
    vi.mocked(useDarkModeContext).mockReturnValue({ isDark: true, toggle: vi.fn() });
    const { container } = render(<Alert variant="info">Info message</Alert>);
    expect(container.firstChild).toHaveClass("bg-blue-950/50");
  });

  it("renders error variant in dark mode", () => {
    vi.mocked(useDarkModeContext).mockReturnValue({ isDark: true, toggle: vi.fn() });
    const { container } = render(<Alert variant="error">Error message</Alert>);
    expect(container.firstChild).toHaveClass("bg-red-950/50");
  });

  it("renders success variant in dark mode", () => {
    vi.mocked(useDarkModeContext).mockReturnValue({ isDark: true, toggle: vi.fn() });
    const { container } = render(<Alert variant="success">Success message</Alert>);
    expect(container.firstChild).toHaveClass("bg-green-950/50");
  });

  it("renders warning variant in dark mode", () => {
    vi.mocked(useDarkModeContext).mockReturnValue({ isDark: true, toggle: vi.fn() });
    const { container } = render(<Alert variant="warning">Warning message</Alert>);
    expect(container.firstChild).toHaveClass("bg-amber-950/50");
  });

  it("applies custom className", () => {
    const { container } = render(<Alert className="custom-class">Test</Alert>);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("has correct base styles", () => {
    const { container } = render(<Alert>Test</Alert>);
    expect(container.firstChild).toHaveClass("p-3");
    expect(container.firstChild).toHaveClass("rounded-lg");
    expect(container.firstChild).toHaveClass("text-sm");
  });
});
