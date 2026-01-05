import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TestProviders } from "@/test/utils/providers";
import { HelpMobileMenu } from "./HelpMobileMenu";
import { getAllGuides } from "@/content/help";

describe("HelpMobileMenu", () => {
  const mockGuides = getAllGuides();
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    guides: mockGuides,
    activeTopic: "getting-started",
    onTopicChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset body overflow
    document.body.style.overflow = "";
  });

  describe("Rendering when open", () => {
    it("renders menu when open", () => {
      render(
        <TestProviders>
          <HelpMobileMenu {...defaultProps} isOpen={true} />
        </TestProviders>
      );

      expect(screen.getByText("Documentation")).toBeInTheDocument();
    });

    it("renders close button", () => {
      render(
        <TestProviders>
          <HelpMobileMenu {...defaultProps} isOpen={true} />
        </TestProviders>
      );

      expect(screen.getByRole("button", { name: /close menu/i })).toBeInTheDocument();
    });

    it("renders uncategorized guides", () => {
      render(
        <TestProviders>
          <HelpMobileMenu {...defaultProps} isOpen={true} />
        </TestProviders>
      );

      expect(screen.getByText("Getting Started")).toBeInTheDocument();
      expect(screen.getByText("FAQ")).toBeInTheDocument();
    });

    it("renders category headers", () => {
      render(
        <TestProviders>
          <HelpMobileMenu {...defaultProps} isOpen={true} />
        </TestProviders>
      );

      expect(screen.getByText("Basics")).toBeInTheDocument();
      expect(screen.getByText("Team Management")).toBeInTheDocument();
    });

    it("renders guides within categories", () => {
      render(
        <TestProviders>
          <HelpMobileMenu {...defaultProps} isOpen={true} />
        </TestProviders>
      );

      expect(screen.getByText("Stations")).toBeInTheDocument();
      expect(screen.getByText("Prep Items")).toBeInTheDocument();
      expect(screen.getByText("Inviting Team")).toBeInTheDocument();
    });

    it("prevents body scroll when open", () => {
      render(
        <TestProviders>
          <HelpMobileMenu {...defaultProps} isOpen={true} />
        </TestProviders>
      );

      expect(document.body.style.overflow).toBe("hidden");
    });
  });

  describe("Rendering when closed", () => {
    it("allows body scroll when closed", () => {
      render(
        <TestProviders>
          <HelpMobileMenu {...defaultProps} isOpen={false} />
        </TestProviders>
      );

      expect(document.body.style.overflow).toBe("");
    });
  });

  describe("Interactions", () => {
    it("calls onClose when clicking close button", () => {
      const onClose = vi.fn();

      render(
        <TestProviders>
          <HelpMobileMenu {...defaultProps} onClose={onClose} />
        </TestProviders>
      );

      fireEvent.click(screen.getByRole("button", { name: /close menu/i }));
      expect(onClose).toHaveBeenCalled();
    });

    it("calls onClose when clicking backdrop", () => {
      const onClose = vi.fn();

      const { container } = render(
        <TestProviders>
          <HelpMobileMenu {...defaultProps} onClose={onClose} />
        </TestProviders>
      );

      // The backdrop is the first div with fixed inset-0
      const backdrop = container.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();
      fireEvent.click(backdrop!);
      expect(onClose).toHaveBeenCalled();
    });

    it("calls onClose when pressing Escape", () => {
      const onClose = vi.fn();

      render(
        <TestProviders>
          <HelpMobileMenu {...defaultProps} onClose={onClose} />
        </TestProviders>
      );

      fireEvent.keyDown(document, { key: "Escape" });
      expect(onClose).toHaveBeenCalled();
    });

    it("calls onTopicChange when clicking a guide", () => {
      const onTopicChange = vi.fn();

      render(
        <TestProviders>
          <HelpMobileMenu {...defaultProps} onTopicChange={onTopicChange} />
        </TestProviders>
      );

      fireEvent.click(screen.getByText("FAQ"));
      expect(onTopicChange).toHaveBeenCalledWith("faq");
    });

    it("collapses category when clicking category header", () => {
      render(
        <TestProviders>
          <HelpMobileMenu {...defaultProps} />
        </TestProviders>
      );

      // Click category header to collapse
      fireEvent.click(screen.getByText("Basics"));

      // Category button should still be present
      expect(screen.getByRole("button", { name: /basics/i })).toBeInTheDocument();
    });
  });

  describe("Cleanup", () => {
    it("restores body overflow on unmount", () => {
      const { unmount } = render(
        <TestProviders>
          <HelpMobileMenu {...defaultProps} isOpen={true} />
        </TestProviders>
      );

      expect(document.body.style.overflow).toBe("hidden");

      unmount();

      expect(document.body.style.overflow).toBe("");
    });
  });
});
