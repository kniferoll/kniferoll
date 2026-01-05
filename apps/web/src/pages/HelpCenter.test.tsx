import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TestProviders } from "@/test/utils/providers";
import { HelpCenter } from "./HelpCenter";

// Mock useSearchParams
const mockSetSearchParams = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useSearchParams: () => [new URLSearchParams(), mockSetSearchParams],
  };
});

// Mock scrollTo since it's not available in jsdom
Element.prototype.scrollTo = vi.fn();

describe("HelpCenter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders the Help Center heading", () => {
      render(
        <TestProviders initialRoute="/help">
          <HelpCenter />
        </TestProviders>
      );

      expect(screen.getByText("Help Center")).toBeInTheDocument();
    });

    it("renders the description", () => {
      render(
        <TestProviders initialRoute="/help">
          <HelpCenter />
        </TestProviders>
      );

      expect(screen.getByText("Guides and documentation for Kniferoll")).toBeInTheDocument();
    });

    it("renders the mobile menu button", () => {
      render(
        <TestProviders initialRoute="/help">
          <HelpCenter />
        </TestProviders>
      );

      expect(screen.getByRole("button", { name: /open navigation menu/i })).toBeInTheDocument();
    });

    it("renders the sidebar on desktop", () => {
      render(
        <TestProviders initialRoute="/help">
          <HelpCenter />
        </TestProviders>
      );

      expect(screen.getByTestId("help-sidebar")).toBeInTheDocument();
    });

    it("renders the default guide content (Getting Started)", () => {
      render(
        <TestProviders initialRoute="/help">
          <HelpCenter />
        </TestProviders>
      );

      // The Getting Started guide should be rendered by default
      expect(screen.getByText(/Welcome to Kniferoll/i)).toBeInTheDocument();
    });
  });

  describe("Mobile menu", () => {
    it("opens mobile menu when hamburger button is clicked", () => {
      render(
        <TestProviders initialRoute="/help">
          <HelpCenter />
        </TestProviders>
      );

      const menuButton = screen.getByRole("button", { name: /open navigation menu/i });
      fireEvent.click(menuButton);

      // Mobile menu should show Documentation header
      const docHeaders = screen.getAllByText("Documentation");
      expect(docHeaders.length).toBeGreaterThan(1); // One in sidebar, one in mobile menu
    });

    it("closes mobile menu when close button is clicked", () => {
      render(
        <TestProviders initialRoute="/help">
          <HelpCenter />
        </TestProviders>
      );

      // Open menu
      const menuButton = screen.getByRole("button", { name: /open navigation menu/i });
      fireEvent.click(menuButton);

      // Close menu
      const closeButton = screen.getByRole("button", { name: /close menu/i });
      fireEvent.click(closeButton);

      // Menu should close (we can verify by checking body overflow is restored)
      expect(document.body.style.overflow).toBe("");
    });
  });

  describe("Navigation", () => {
    it("changes topic when clicking a guide in sidebar", () => {
      render(
        <TestProviders initialRoute="/help">
          <HelpCenter />
        </TestProviders>
      );

      // Click on FAQ in sidebar (get the first one, which is in the sidebar)
      const faqButtons = screen.getAllByRole("button", { name: /^faq$/i });
      fireEvent.click(faqButtons[0]);

      expect(mockSetSearchParams).toHaveBeenCalledWith({ topic: "faq" });
    });
  });
});
