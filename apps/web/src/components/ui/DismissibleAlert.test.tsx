import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DismissibleAlert } from "./DismissibleAlert";

// Mock the dark mode context
vi.mock("@/context", () => ({
  useDarkModeContext: vi.fn(() => ({ isDark: false })),
}));

vi.mock("@/components/icons", () => ({
  XIcon: vi.fn(({ size }) => (
    <span data-testid="x-icon" data-size={size}>
      X
    </span>
  )),
}));

import { useDarkModeContext } from "@/context";

describe("DismissibleAlert", () => {
  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDarkModeContext).mockReturnValue({ isDark: false, toggle: vi.fn() });
  });

  it("renders children content", () => {
    render(<DismissibleAlert onDismiss={mockOnDismiss}>Test message</DismissibleAlert>);
    expect(screen.getByText("Test message")).toBeInTheDocument();
  });

  it("renders dismiss button with X icon", () => {
    render(<DismissibleAlert onDismiss={mockOnDismiss}>Test</DismissibleAlert>);
    expect(screen.getByTestId("x-icon")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
  });

  it("calls onDismiss when dismiss button is clicked", () => {
    render(<DismissibleAlert onDismiss={mockOnDismiss}>Test</DismissibleAlert>);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(mockOnDismiss).toHaveBeenCalledOnce();
  });

  it("renders action button when action prop is provided", () => {
    const mockActionClick = vi.fn();
    render(
      <DismissibleAlert
        onDismiss={mockOnDismiss}
        action={{ label: "Retry", onClick: mockActionClick }}
      >
        Error occurred
      </DismissibleAlert>
    );

    const actionButton = screen.getByRole("button", { name: "Retry" });
    expect(actionButton).toBeInTheDocument();
    fireEvent.click(actionButton);
    expect(mockActionClick).toHaveBeenCalledOnce();
  });

  it("does not render action button when action prop is not provided", () => {
    render(<DismissibleAlert onDismiss={mockOnDismiss}>Test</DismissibleAlert>);
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  });

  it("defaults to info variant", () => {
    const { container } = render(
      <DismissibleAlert onDismiss={mockOnDismiss}>Info message</DismissibleAlert>
    );
    expect(container.firstChild).toHaveClass("bg-blue-50");
  });

  it("renders error variant in light mode", () => {
    const { container } = render(
      <DismissibleAlert variant="error" onDismiss={mockOnDismiss}>
        Error message
      </DismissibleAlert>
    );
    expect(container.firstChild).toHaveClass("bg-red-50");
  });

  it("renders success variant in light mode", () => {
    const { container } = render(
      <DismissibleAlert variant="success" onDismiss={mockOnDismiss}>
        Success message
      </DismissibleAlert>
    );
    expect(container.firstChild).toHaveClass("bg-green-50");
  });

  it("renders warning variant in light mode", () => {
    const { container } = render(
      <DismissibleAlert variant="warning" onDismiss={mockOnDismiss}>
        Warning message
      </DismissibleAlert>
    );
    expect(container.firstChild).toHaveClass("bg-amber-50");
  });

  it("renders variants in dark mode", () => {
    vi.mocked(useDarkModeContext).mockReturnValue({ isDark: true, toggle: vi.fn() });
    const { container } = render(
      <DismissibleAlert variant="error" onDismiss={mockOnDismiss}>
        Error message
      </DismissibleAlert>
    );
    expect(container.firstChild).toHaveClass("bg-red-950/50");
  });

  it("applies custom className", () => {
    const { container } = render(
      <DismissibleAlert onDismiss={mockOnDismiss} className="custom-class">
        Test
      </DismissibleAlert>
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("has correct base styles", () => {
    const { container } = render(
      <DismissibleAlert onDismiss={mockOnDismiss}>Test</DismissibleAlert>
    );
    expect(container.firstChild).toHaveClass("flex");
    expect(container.firstChild).toHaveClass("items-center");
    expect(container.firstChild).toHaveClass("gap-3");
    expect(container.firstChild).toHaveClass("p-3");
    expect(container.firstChild).toHaveClass("rounded-lg");
  });
});
