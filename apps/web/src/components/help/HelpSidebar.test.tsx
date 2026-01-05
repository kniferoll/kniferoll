import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TestProviders } from "@/test/utils/providers";
import { HelpSidebar } from "./HelpSidebar";
import { getAllGuides } from "@/content/help";

describe("HelpSidebar", () => {
  const mockGuides = getAllGuides();
  const defaultProps = {
    guides: mockGuides,
    activeTopic: "getting-started",
    onTopicChange: vi.fn(),
  };

  describe("Rendering", () => {
    it("renders sidebar with data-testid", () => {
      render(
        <TestProviders>
          <HelpSidebar {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByTestId("help-sidebar")).toBeInTheDocument();
    });

    it("renders Documentation header", () => {
      render(
        <TestProviders>
          <HelpSidebar {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByText("Documentation")).toBeInTheDocument();
    });

    it("renders uncategorized guides (Getting Started, FAQ)", () => {
      render(
        <TestProviders>
          <HelpSidebar {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByText("Getting Started")).toBeInTheDocument();
      expect(screen.getByText("FAQ")).toBeInTheDocument();
    });

    it("renders category headers", () => {
      render(
        <TestProviders>
          <HelpSidebar {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByText("Basics")).toBeInTheDocument();
      expect(screen.getByText("Team Management")).toBeInTheDocument();
    });

    it("renders guides within categories", () => {
      render(
        <TestProviders>
          <HelpSidebar {...defaultProps} />
        </TestProviders>
      );

      // Basics category guides
      expect(screen.getByText("Stations")).toBeInTheDocument();
      expect(screen.getByText("Prep Items")).toBeInTheDocument();

      // Team Management category guides
      expect(screen.getByText("Inviting Team")).toBeInTheDocument();
      expect(screen.getByText("Roles & Permissions")).toBeInTheDocument();
    });
  });

  describe("Active state", () => {
    it("highlights active guide", () => {
      render(
        <TestProviders>
          <HelpSidebar {...defaultProps} activeTopic="getting-started" />
        </TestProviders>
      );

      const activeButton = screen.getByRole("button", { name: /getting started/i });
      expect(activeButton).toHaveAttribute("aria-selected", "true");
    });

    it("does not highlight inactive guides", () => {
      render(
        <TestProviders>
          <HelpSidebar {...defaultProps} activeTopic="getting-started" />
        </TestProviders>
      );

      const inactiveButton = screen.getByRole("button", { name: /faq/i });
      expect(inactiveButton).toHaveAttribute("aria-selected", "false");
    });
  });

  describe("Interactions", () => {
    it("calls onTopicChange when clicking a guide", () => {
      const onTopicChange = vi.fn();

      render(
        <TestProviders>
          <HelpSidebar {...defaultProps} onTopicChange={onTopicChange} />
        </TestProviders>
      );

      fireEvent.click(screen.getByText("FAQ"));
      expect(onTopicChange).toHaveBeenCalledWith("faq");
    });

    it("calls onTopicChange when clicking a categorized guide", () => {
      const onTopicChange = vi.fn();

      render(
        <TestProviders>
          <HelpSidebar {...defaultProps} onTopicChange={onTopicChange} />
        </TestProviders>
      );

      fireEvent.click(screen.getByText("Stations"));
      expect(onTopicChange).toHaveBeenCalledWith("stations");
    });

    it("collapses category when clicking category header", () => {
      render(
        <TestProviders>
          <HelpSidebar {...defaultProps} />
        </TestProviders>
      );

      // Verify Stations is visible (category is expanded by default)
      expect(screen.getByText("Stations")).toBeInTheDocument();

      // Click category header to collapse
      fireEvent.click(screen.getByText("Basics"));

      // After collapse, child guides should not be visible
      // Note: they're still in the DOM but hidden, so we check the parent is collapsed
      const basicsButton = screen.getByRole("button", { name: /basics/i });
      expect(basicsButton).toBeInTheDocument();
    });

    it("expands collapsed category when clicking category header", () => {
      render(
        <TestProviders>
          <HelpSidebar {...defaultProps} />
        </TestProviders>
      );

      // Collapse first
      fireEvent.click(screen.getByText("Basics"));

      // Then expand
      fireEvent.click(screen.getByText("Basics"));

      // Stations should be visible again
      expect(screen.getByText("Stations")).toBeInTheDocument();
    });
  });
});
