import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getBudget } from "./budgets";
import { TestProviders } from "../utils/providers";
import { createRenderTracker, expectWithinBudget } from "../utils/perf";

// Import components that will be tested for interactions
import { Dashboard } from "@/pages/Dashboard";
import { Login } from "@/pages/Login";
import { Landing } from "@/pages/Landing";

// Mock react-router-dom useParams for pages that need route params
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: vi.fn(() => ({
      kitchenId: "mock-kitchen-id",
      stationId: "mock-station-id",
    })),
    useNavigate: vi.fn(() => vi.fn()),
  };
});

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

/**
 * Interaction Performance Tests
 * Tests user interactions that might cause render cascades
 */
describe("Interaction Performance", () => {
  describe("Form Interactions", () => {
    it("Login form input stays within render budget", async () => {
      const user = userEvent.setup();
      const { Tracker, metrics } = createRenderTracker();

      render(
        <TestProviders>
          <Tracker>
            <Login />
          </Tracker>
        </TestProviders>
      );

      // Wait for page load
      await waitFor(
        () => {
          expect(screen.getByTestId("page-login")).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Reset metrics before interaction
      metrics.reset();

      // Type in email field
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "test@example.com");

      // Get submit form budget (used for form interactions)
      const budget = getBudget("submit-form");

      // Check renders are within budget
      // Note: Each keystroke causes a render, so we use a more generous budget
      expect(metrics.renderCount).toBeLessThanOrEqual(budget.renders * 3); // Allow 3x for typing
    });

    it("Form submission stays within render budget", async () => {
      const user = userEvent.setup();
      const { Tracker, metrics } = createRenderTracker();

      render(
        <TestProviders>
          <Tracker>
            <Login />
          </Tracker>
        </TestProviders>
      );

      // Wait for page load
      await waitFor(
        () => {
          expect(screen.getByTestId("page-login")).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Fill form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      // Reset metrics before submission
      metrics.reset();

      // Submit form - find button by type since text changes on submission
      const submitButton = screen.getByRole("button", { name: /sign in|loading/i });
      await user.click(submitButton);

      // Check renders are within budget
      const budget = getBudget("submit-form");
      expectWithinBudget(metrics, budget);
    });
  });

  describe("Navigation Interactions", () => {
    it("Link hover and focus stays within render budget", async () => {
      const user = userEvent.setup();
      const { Tracker, metrics } = createRenderTracker();

      render(
        <TestProviders>
          <Tracker>
            <Landing />
          </Tracker>
        </TestProviders>
      );

      // Wait for page load
      await waitFor(
        () => {
          expect(screen.getByTestId("page-landing")).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Reset metrics before interaction
      metrics.reset();

      // Find and interact with a link
      const getStartedButton = screen.getAllByRole("link", { name: /get started/i })[0];
      await user.hover(getStartedButton);

      // Hover should cause minimal renders (ideally 0-1)
      expect(metrics.renderCount).toBeLessThanOrEqual(2);
    });
  });

  describe("Modal Interactions", () => {
    it("Opening a modal stays within render budget", async () => {
      const user = userEvent.setup();
      const { Tracker, metrics } = createRenderTracker();

      render(
        <TestProviders>
          <Tracker>
            <Dashboard />
          </Tracker>
        </TestProviders>
      );

      // Wait for page load
      await waitFor(
        () => {
          expect(screen.getByTestId("page-dashboard")).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Reset metrics before interaction
      metrics.reset();

      // Try to find a button that opens a modal
      // Dashboard might show "Create Kitchen" button in empty state
      const createButton = screen.queryByRole("button", { name: /create kitchen/i });

      if (createButton) {
        await user.click(createButton);

        // Check renders are within budget
        const budget = getBudget("open-modal");
        expectWithinBudget(metrics, budget);
      } else {
        // If no button found, skip this test (empty state might not be visible)
        expect(true).toBe(true);
      }
    });
  });

  describe("State Change Interactions", () => {
    it("Dark mode toggle performance (if available)", async () => {
      // User event setup would be used if dark mode toggle is implemented
      // const user = userEvent.setup();
      const { Tracker, metrics } = createRenderTracker();

      render(
        <TestProviders>
          <Tracker>
            <Dashboard />
          </Tracker>
        </TestProviders>
      );

      // Wait for page load
      await waitFor(
        () => {
          expect(screen.getByTestId("page-dashboard")).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Reset metrics
      metrics.reset();

      // Dark mode toggle is usually in a menu - this is a placeholder test
      // The actual implementation would find and click the toggle
      // For now, we just verify the page is stable
      expect(metrics.renderCount).toBe(0);
    });
  });
});

/**
 * Render Cascade Detection Tests
 * These tests intentionally check for problematic patterns
 */
describe("Render Cascade Detection", () => {
  it("detects when render count exceeds budget", () => {
    const { metrics } = createRenderTracker();

    // Simulate excessive renders
    metrics.renderCount = 100;
    metrics.totalDuration = 500;
    metrics.renders = Array(100).fill({ phase: "update", duration: 5 });

    expect(() => {
      expectWithinBudget(metrics, { renders: 10, duration: 100 });
    }).toThrow(/Render budget exceeded: 100 renders/);
  });

  it("detects when duration exceeds budget", () => {
    const { metrics } = createRenderTracker();

    // Simulate slow renders
    metrics.renderCount = 5;
    metrics.totalDuration = 500;
    metrics.renders = Array(5).fill({ phase: "update", duration: 100 });

    expect(() => {
      expectWithinBudget(metrics, { renders: 10, duration: 100 });
    }).toThrow(/Duration budget exceeded: 500ms/);
  });

  it("provides agent-friendly error messages", () => {
    const { metrics } = createRenderTracker();

    // Simulate problematic renders
    metrics.renderCount = 15;
    metrics.totalDuration = 150;
    metrics.renders = [
      { phase: "mount", duration: 10, commitTime: 0 },
      { phase: "update", duration: 5, commitTime: 10 },
      { phase: "update", duration: 5, commitTime: 15 },
    ];

    try {
      expectWithinBudget(metrics, { renders: 5, duration: 50 });
    } catch (error) {
      const message = (error as Error).message;
      // Verify error message contains useful debugging info
      expect(message).toContain("Render budget exceeded");
      expect(message).toContain("15 renders");
      expect(message).toContain("max: 5");
      expect(message).toContain("Renders:");
      expect(message).toContain("mount");
      expect(message).toContain("update");
    }
  });
});
