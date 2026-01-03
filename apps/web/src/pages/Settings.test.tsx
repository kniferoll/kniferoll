import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { TestProviders, setTestAuthState } from "@/test/utils/providers";
import { Settings } from "./Settings";

// Mock react-router-dom
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: vi.fn(() => ({})),
    useSearchParams: vi.fn(() => [new URLSearchParams(), vi.fn()]),
  };
});

describe("Settings Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setTestAuthState(true);
  });

  describe("Layout", () => {
    it("renders the settings page with sidebar", async () => {
      render(
        <TestProviders initialRoute="/settings">
          <Settings />
        </TestProviders>
      );

      await waitFor(() => {
        expect(screen.getByTestId("page-settings")).toBeInTheDocument();
      });

      expect(screen.getByTestId("settings-sidebar")).toBeInTheDocument();
      expect(screen.getByTestId("settings-content")).toBeInTheDocument();
    });

    it("shows personal settings section in sidebar", async () => {
      render(
        <TestProviders initialRoute="/settings">
          <Settings />
        </TestProviders>
      );

      await waitFor(() => {
        expect(screen.getByText("Personal")).toBeInTheDocument();
      });
    });

    it("shows billing section in sidebar", async () => {
      render(
        <TestProviders initialRoute="/settings">
          <Settings />
        </TestProviders>
      );

      await waitFor(() => {
        expect(screen.getByText("Billing")).toBeInTheDocument();
      });
    });

    it("shows user's kitchens in sidebar", async () => {
      render(
        <TestProviders initialRoute="/settings">
          <Settings />
        </TestProviders>
      );

      await waitFor(() => {
        // Default mock kitchen name is "Test Kitchen"
        expect(screen.getByText("Test Kitchen")).toBeInTheDocument();
      });
    });
  });

  describe("Navigation", () => {
    it("defaults to personal settings tab", async () => {
      render(
        <TestProviders initialRoute="/settings">
          <Settings />
        </TestProviders>
      );

      await waitFor(() => {
        expect(screen.getByTestId("personal-settings-panel")).toBeInTheDocument();
      });
    });

    it("switches to billing when clicking billing in sidebar", async () => {
      render(
        <TestProviders initialRoute="/settings">
          <Settings />
        </TestProviders>
      );

      await waitFor(() => {
        expect(screen.getByTestId("page-settings")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Billing"));

      await waitFor(() => {
        expect(screen.getByTestId("billing-settings-panel")).toBeInTheDocument();
      });
    });

    it("switches to kitchen settings when clicking a kitchen in sidebar", async () => {
      render(
        <TestProviders initialRoute="/settings">
          <Settings />
        </TestProviders>
      );

      await waitFor(() => {
        expect(screen.getByTestId("page-settings")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Test Kitchen"));

      await waitFor(() => {
        expect(screen.getByTestId("kitchen-settings-panel")).toBeInTheDocument();
      });
    });
  });

  describe("Responsive behavior", () => {
    it("constrained content width on large screens", async () => {
      render(
        <TestProviders initialRoute="/settings">
          <Settings />
        </TestProviders>
      );

      await waitFor(() => {
        expect(screen.getByTestId("page-settings")).toBeInTheDocument();
      });

      const content = screen.getByTestId("settings-content");
      expect(content).toHaveClass("max-w-3xl");
    });
  });

  describe("Loading states", () => {
    it("shows loading state while data is being fetched", async () => {
      // Mock loading state
      vi.mock("@/hooks", async () => {
        const actual = await vi.importActual("@/hooks");
        return {
          ...actual,
          useKitchens: vi.fn(() => ({
            kitchens: [],
            loading: true,
            error: null,
          })),
        };
      });

      render(
        <TestProviders initialRoute="/settings">
          <Settings />
        </TestProviders>
      );

      // Should still render page structure
      await waitFor(() => {
        expect(screen.getByTestId("page-settings")).toBeInTheDocument();
      });
    });
  });

  describe("Error handling", () => {
    it("handles unauthenticated state gracefully", async () => {
      setTestAuthState(false);

      render(
        <TestProviders initialRoute="/settings">
          <Settings />
        </TestProviders>
      );

      // Should redirect or show appropriate message
      await waitFor(() => {
        // Depending on implementation, may redirect or show message
        expect(screen.queryByTestId("page-settings")).not.toBeInTheDocument();
      });
    });
  });
});
