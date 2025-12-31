import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { readdirSync } from "fs";
import { resolve } from "path";
import { PAGE_BUDGETS, EXCLUDED_PAGES, getBudget, type PageBudgetName } from "./budgets";
import { TestProviders, setTestAuthState } from "../utils/providers";
import { createRenderTracker, expectWithinBudget } from "../utils/perf";

// Import pages for testing
import { Dashboard } from "@/pages/Dashboard";
import { Landing } from "@/pages/Landing";
import { Login } from "@/pages/Login";
import { Signup } from "@/pages/Signup";
import { InviteJoin } from "@/pages/InviteJoin";
import { JoinWithCode } from "@/pages/JoinWithCode";
import { KitchenDashboard } from "@/pages/KitchenDashboard";
import { KitchenSettings } from "@/pages/KitchenSettings";
import { StationView } from "@/pages/StationView";

// Mock react-router-dom useParams for pages that need route params
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: vi.fn(() => ({
      kitchenId: "mock-kitchen-id",
      stationId: "mock-station-id",
      token: "mock-token",
    })),
  };
});

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
  // Default to unauthenticated state
  setTestAuthState(false);
});

/**
 * Budget Coverage Test
 * Ensures all pages have budgets defined (except excluded ones)
 * This test FAILS if a new page is added without a corresponding budget entry
 */
describe("Budget Coverage", () => {
  const pagesDir = resolve(__dirname, "../../pages");
  const pageFiles = readdirSync(pagesDir)
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => f.replace(".tsx", ""))
    .filter((f) => !EXCLUDED_PAGES.includes(f as typeof EXCLUDED_PAGES[number]));

  it.each(pageFiles)("%s has a defined budget", (page) => {
    expect(PAGE_BUDGETS).toHaveProperty(page);
  });

  it("all budgeted pages exist in the pages directory", () => {
    const budgetedPages = Object.keys(PAGE_BUDGETS);
    const actualPages = readdirSync(pagesDir)
      .filter((f) => f.endsWith(".tsx"))
      .map((f) => f.replace(".tsx", ""));

    for (const budgetedPage of budgetedPages) {
      expect(actualPages).toContain(budgetedPage);
    }
  });
});

/**
 * Page mount performance tests
 * Tests each page's initial render performance against its budget
 */
describe("Page Mount Performance", () => {
  // Pages that require NO authentication (show login form, etc.)
  const PUBLIC_PAGES = ["Landing", "Login", "Signup", "JoinWithCode", "InviteJoin"];

  /**
   * Test configuration for each page
   * - name: Page name (must match budget key)
   * - Component: The page component
   * - waitFor: data-testid to wait for (indicates load complete)
   * - initialRoute: Optional route for MemoryRouter
   */
  interface PageConfig {
    name: string;
    Component: () => React.JSX.Element | null;
    waitFor: string;
    initialRoute?: string;
  }

  const pageConfigs: PageConfig[] = [
    // Public pages (no auth required)
    {
      name: "Landing",
      Component: Landing,
      waitFor: "page-landing",
    },
    {
      name: "Login",
      Component: Login,
      waitFor: "page-login",
    },
    {
      name: "Signup",
      Component: Signup,
      waitFor: "page-signup",
    },
    {
      name: "JoinWithCode",
      Component: JoinWithCode,
      waitFor: "page-join-with-code",
    },
    {
      name: "InviteJoin",
      Component: InviteJoin,
      waitFor: "page-invite-join",
      initialRoute: "/invite/mock-token",
    },
    // Authenticated pages (require user)
    {
      name: "Dashboard",
      Component: Dashboard,
      waitFor: "page-dashboard",
    },
    {
      name: "KitchenDashboard",
      Component: KitchenDashboard,
      waitFor: "page-kitchen-dashboard",
      initialRoute: "/kitchen/mock-kitchen-id",
    },
    {
      name: "KitchenSettings",
      Component: KitchenSettings,
      waitFor: "page-kitchen-settings",
      initialRoute: "/kitchen/mock-kitchen-id/settings",
    },
    {
      name: "StationView",
      Component: StationView,
      waitFor: "page-station-view",
      initialRoute: "/station/mock-station-id",
    },
  ];

  describe.each(pageConfigs)("$name", ({ name, Component, waitFor: waitForTestId, initialRoute }) => {
    beforeEach(() => {
      // Set auth state based on page type
      const isPublicPage = PUBLIC_PAGES.includes(name);
      setTestAuthState(!isPublicPage);
    });

    it(`mounts within render budget`, async () => {
      const { Tracker, metrics } = createRenderTracker();
      const budget = getBudget(name as PageBudgetName);

      render(
        <TestProviders initialRoute={initialRoute}>
          <Tracker>
            <Component />
          </Tracker>
        </TestProviders>
      );

      // Wait for page load indicator
      await waitFor(
        () => {
          expect(screen.getByTestId(waitForTestId)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Assert within budget
      expectWithinBudget(metrics, budget);
    });

    it(`renders without errors`, async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      render(
        <TestProviders initialRoute={initialRoute}>
          <Component />
        </TestProviders>
      );

      // Wait for page load
      await waitFor(
        () => {
          expect(screen.getByTestId(waitForTestId)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Check no React errors were logged
      const reactErrors = consoleSpy.mock.calls.filter(
        (call) =>
          call.some((arg) =>
            typeof arg === "string" &&
            (arg.includes("React") || arg.includes("Warning"))
          )
      );

      consoleSpy.mockRestore();

      if (reactErrors.length > 0) {
        throw new Error(
          `React errors during render:\n${reactErrors.map((c) => c.join(" ")).join("\n")}`
        );
      }
    });
  });
});

/**
 * Re-render performance tests
 * Ensures subsequent renders stay within budget
 */
describe("Page Re-render Performance", () => {
  beforeEach(() => {
    // Re-render tests use authenticated pages
    setTestAuthState(true);
  });

  it("Dashboard handles re-renders efficiently", async () => {
    const { Tracker, metrics } = createRenderTracker();

    const { rerender } = render(
      <TestProviders>
        <Tracker>
          <Dashboard />
        </Tracker>
      </TestProviders>
    );

    // Wait for initial load
    await waitFor(
      () => {
        expect(screen.getByTestId("page-dashboard")).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Reset metrics for re-render measurement
    metrics.reset();

    // Force a re-render
    rerender(
      <TestProviders>
        <Tracker>
          <Dashboard />
        </Tracker>
      </TestProviders>
    );

    // Should have minimal re-renders (just the update)
    expect(metrics.renderCount).toBeLessThanOrEqual(3);
  });

  it("KitchenDashboard handles re-renders efficiently", async () => {
    const { Tracker, metrics } = createRenderTracker();

    const { rerender } = render(
      <TestProviders initialRoute="/kitchen/mock-kitchen-id">
        <Tracker>
          <KitchenDashboard />
        </Tracker>
      </TestProviders>
    );

    // Wait for initial load
    await waitFor(
      () => {
        expect(screen.getByTestId("page-kitchen-dashboard")).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Reset metrics for re-render measurement
    metrics.reset();

    // Force a re-render
    rerender(
      <TestProviders initialRoute="/kitchen/mock-kitchen-id">
        <Tracker>
          <KitchenDashboard />
        </Tracker>
      </TestProviders>
    );

    // Should have minimal re-renders
    expect(metrics.renderCount).toBeLessThanOrEqual(5);
  });

  it("StationView handles re-renders efficiently", async () => {
    const { Tracker, metrics } = createRenderTracker();

    const { rerender } = render(
      <TestProviders initialRoute="/station/mock-station-id">
        <Tracker>
          <StationView />
        </Tracker>
      </TestProviders>
    );

    // Wait for initial load
    await waitFor(
      () => {
        expect(screen.getByTestId("page-station-view")).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Reset metrics for re-render measurement
    metrics.reset();

    // Force a re-render
    rerender(
      <TestProviders initialRoute="/station/mock-station-id">
        <Tracker>
          <StationView />
        </Tracker>
      </TestProviders>
    );

    // Should have minimal re-renders
    expect(metrics.renderCount).toBeLessThanOrEqual(5);
  });
});
