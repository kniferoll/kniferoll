import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BackButton } from "./BackButton";

vi.mock("@/context", () => ({
  useDarkModeContext: vi.fn(() => ({ isDark: false })),
}));

import { useDarkModeContext } from "@/context";

describe("BackButton", () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDarkModeContext).mockReturnValue({ isDark: false, toggle: vi.fn() });
  });

  it("renders with default label", () => {
    render(<BackButton onClick={mockOnClick} />);
    expect(screen.getByText("Back")).toBeInTheDocument();
  });

  it("renders with custom label", () => {
    render(<BackButton onClick={mockOnClick} label="Go Back" />);
    expect(screen.getByText("Go Back")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    render(<BackButton onClick={mockOnClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockOnClick).toHaveBeenCalledOnce();
  });

  it("renders SVG arrow icon", () => {
    const { container } = render(<BackButton onClick={mockOnClick} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("applies light mode styles by default", () => {
    const { container } = render(<BackButton onClick={mockOnClick} />);
    const button = container.querySelector("button");
    expect(button).toHaveClass("text-gray-600");
  });

  it("applies dark mode styles when isDark is true", () => {
    vi.mocked(useDarkModeContext).mockReturnValue({ isDark: true, toggle: vi.fn() });
    const { container } = render(<BackButton onClick={mockOnClick} />);
    const button = container.querySelector("button");
    expect(button).toHaveClass("text-gray-300");
  });

  it("has screen-reader accessible label", () => {
    render(<BackButton onClick={mockOnClick} />);
    const span = screen.getByText("Back");
    expect(span).toHaveClass("sr-only");
  });
});
