import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { COMPONENT_BUDGETS, getBudget } from "./budgets";
import { TestProviders } from "../utils/providers";
import { createRenderTracker, expectWithinBudget } from "../utils/perf";

// Import components for testing
import { PrepItemList } from "@/components/prep/PrepItemList";
import { ProgressBar } from "@/components/prep/ProgressBar";
import { ShiftToggle } from "@/components/kitchen/ShiftToggle";
import { DateCalendar } from "@/components/kitchen/DateCalendar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { FormInput } from "@/components/ui/FormInput";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

/**
 * Component Mount Performance Tests
 * Tests individual component render performance in isolation
 */
describe("Component Mount Performance", () => {
  describe("PrepItemList", () => {
    const mockItems = [
      { id: "1", description: "Dice onions", quantity: 5, status: "pending" as const, created_at: "2024-01-01" },
      { id: "2", description: "Prep tomatoes", quantity: 10, status: "in_progress" as const, created_at: "2024-01-01" },
      { id: "3", description: "Make stock", quantity: 2, status: "complete" as const, created_at: "2024-01-01" },
    ];

    it("mounts with empty list within budget", async () => {
      const { Tracker, metrics } = createRenderTracker();
      const budget = getBudget("PrepItemList");

      render(
        <TestProviders>
          <Tracker>
            <PrepItemList
              items={[]}
              onCycleStatus={vi.fn()}
              onDelete={vi.fn()}
            />
          </Tracker>
        </TestProviders>
      );

      expectWithinBudget(metrics, budget);
    });

    it("mounts with items within budget", async () => {
      const { Tracker, metrics } = createRenderTracker();
      const budget = getBudget("PrepItemList");

      render(
        <TestProviders>
          <Tracker>
            <PrepItemList
              items={mockItems}
              onCycleStatus={vi.fn()}
              onDelete={vi.fn()}
            />
          </Tracker>
        </TestProviders>
      );

      expectWithinBudget(metrics, budget);
    });

    it("mounts with large list within budget", async () => {
      const { Tracker, metrics } = createRenderTracker();
      // Large list should still be within reasonable bounds
      const largeList = Array.from({ length: 50 }, (_, i) => ({
        id: `item-${i}`,
        description: `Prep item ${i}`,
        quantity: i + 1,
        status: ["pending", "in_progress", "complete"][i % 3] as "pending" | "in_progress" | "complete",
        created_at: "2024-01-01",
      }));

      render(
        <TestProviders>
          <Tracker>
            <PrepItemList
              items={largeList}
              onCycleStatus={vi.fn()}
              onDelete={vi.fn()}
            />
          </Tracker>
        </TestProviders>
      );

      // Large lists get more generous budget (3x base)
      const budget = getBudget("PrepItemList");
      expect(metrics.renderCount).toBeLessThanOrEqual(budget.renders * 3);
    });
  });

  describe("ProgressBar", () => {
    it("mounts within budget", async () => {
      const { Tracker, metrics } = createRenderTracker();
      const budget = getBudget("ProgressBar");

      render(
        <TestProviders>
          <Tracker>
            <ProgressBar completed={3} partial={2} pending={5} />
          </Tracker>
        </TestProviders>
      );

      expectWithinBudget(metrics, budget);
    });

    it("updates within budget when props change", async () => {
      const { Tracker, metrics } = createRenderTracker();

      const { rerender } = render(
        <TestProviders>
          <Tracker>
            <ProgressBar completed={0} partial={0} pending={10} />
          </Tracker>
        </TestProviders>
      );

      // Reset metrics before prop change
      metrics.reset();

      rerender(
        <TestProviders>
          <Tracker>
            <ProgressBar completed={5} partial={2} pending={3} />
          </Tracker>
        </TestProviders>
      );

      const budget = getBudget("ProgressBar");
      expectWithinBudget(metrics, budget);
    });
  });

  describe("ShiftToggle", () => {
    const shifts = ["Breakfast", "Lunch", "Dinner"];

    it("mounts within budget", async () => {
      const { Tracker, metrics } = createRenderTracker();
      const budget = getBudget("ShiftToggle");

      render(
        <TestProviders>
          <Tracker>
            <ShiftToggle
              shifts={shifts}
              currentShift="Lunch"
              onShiftChange={vi.fn()}
            />
          </Tracker>
        </TestProviders>
      );

      expectWithinBudget(metrics, budget);
    });

    it("handles shift change within budget", async () => {
      const user = userEvent.setup();
      const { Tracker, metrics } = createRenderTracker();
      const onShiftChange = vi.fn();

      render(
        <TestProviders>
          <Tracker>
            <ShiftToggle
              shifts={shifts}
              currentShift="Lunch"
              onShiftChange={onShiftChange}
            />
          </Tracker>
        </TestProviders>
      );

      // Reset metrics before interaction
      metrics.reset();

      // Click a different shift
      const dinnerButton = screen.getByRole("button", { name: /dinner/i });
      await user.click(dinnerButton);

      const budget = getBudget("ShiftToggle");
      expectWithinBudget(metrics, budget);
    });
  });

  describe("DateCalendar", () => {
    it("mounts within budget", async () => {
      const { Tracker, metrics } = createRenderTracker();
      const budget = getBudget("DateCalendar");

      render(
        <TestProviders>
          <Tracker>
            <DateCalendar
              selectedDate="2024-01-15"
              onDateSelect={vi.fn()}
            />
          </Tracker>
        </TestProviders>
      );

      expectWithinBudget(metrics, budget);
    });
  });
});

/**
 * UI Component Performance Tests
 * Tests core UI primitives for render efficiency
 */
describe("UI Component Performance", () => {
  describe("Button", () => {
    it("mounts within budget", async () => {
      const { Tracker, metrics } = createRenderTracker();
      const budget = getBudget("Button");

      render(
        <TestProviders>
          <Tracker>
            <Button variant="primary" onClick={vi.fn()}>
              Click Me
            </Button>
          </Tracker>
        </TestProviders>
      );

      expectWithinBudget(metrics, budget);
    });

    it("handles click without extra renders", async () => {
      const user = userEvent.setup();
      const { Tracker, metrics } = createRenderTracker();
      const onClick = vi.fn();

      render(
        <TestProviders>
          <Tracker>
            <Button variant="primary" onClick={onClick}>
              Click Me
            </Button>
          </Tracker>
        </TestProviders>
      );

      metrics.reset();

      await user.click(screen.getByRole("button"));

      // Button click should cause minimal re-renders
      expect(metrics.renderCount).toBeLessThanOrEqual(2);
    });
  });

  describe("Card", () => {
    it("mounts within budget", async () => {
      const { Tracker, metrics } = createRenderTracker();
      const budget = getBudget("Card");

      render(
        <TestProviders>
          <Tracker>
            <Card>
              <p>Card content</p>
            </Card>
          </Tracker>
        </TestProviders>
      );

      expectWithinBudget(metrics, budget);
    });
  });

  describe("FormInput", () => {
    it("mounts within budget", async () => {
      const { Tracker, metrics } = createRenderTracker();
      const budget = getBudget("FormInput");

      render(
        <TestProviders>
          <Tracker>
            <FormInput
              label="Email"
              type="email"
              value=""
              onChange={vi.fn()}
            />
          </Tracker>
        </TestProviders>
      );

      expectWithinBudget(metrics, budget);
    });

    it("handles typing within budget", async () => {
      const user = userEvent.setup();
      const { Tracker, metrics } = createRenderTracker();
      const onChange = vi.fn();

      render(
        <TestProviders>
          <Tracker>
            <FormInput
              label="Email"
              type="email"
              value=""
              onChange={onChange}
            />
          </Tracker>
        </TestProviders>
      );

      metrics.reset();

      const input = screen.getByLabelText(/email/i);
      await user.type(input, "test");

      // Each keystroke may cause a render, but should be efficient
      // 4 characters = up to 4 renders per keystroke
      expect(metrics.renderCount).toBeLessThanOrEqual(8);
    });
  });

  describe("Modal", () => {
    it("mounts (closed) within budget", async () => {
      const { Tracker, metrics } = createRenderTracker();
      const budget = getBudget("Modal");

      render(
        <TestProviders>
          <Tracker>
            <Modal isOpen={false} onClose={vi.fn()}>
              <p>Modal content</p>
            </Modal>
          </Tracker>
        </TestProviders>
      );

      expectWithinBudget(metrics, budget);
    });

    it("mounts (open) within budget", async () => {
      const { Tracker, metrics } = createRenderTracker();
      const budget = getBudget("Modal");

      render(
        <TestProviders>
          <Tracker>
            <Modal isOpen={true} onClose={vi.fn()}>
              <p>Modal content</p>
            </Modal>
          </Tracker>
        </TestProviders>
      );

      expectWithinBudget(metrics, budget);
    });

    it("opens within budget", async () => {
      const { Tracker, metrics } = createRenderTracker();

      const { rerender } = render(
        <TestProviders>
          <Tracker>
            <Modal isOpen={false} onClose={vi.fn()}>
              <p>Modal content</p>
            </Modal>
          </Tracker>
        </TestProviders>
      );

      metrics.reset();

      rerender(
        <TestProviders>
          <Tracker>
            <Modal isOpen={true} onClose={vi.fn()}>
              <p>Modal content</p>
            </Modal>
          </Tracker>
        </TestProviders>
      );

      const budget = getBudget("Modal");
      expectWithinBudget(metrics, budget);
    });
  });

  describe("Tabs", () => {
    it("mounts within budget", async () => {
      const { Tracker, metrics } = createRenderTracker();
      const budget = getBudget("Tabs");

      render(
        <TestProviders>
          <Tracker>
            <Tabs value="tab1" onChange={vi.fn()}>
              <TabList>
                <Tab value="tab1">Tab 1</Tab>
                <Tab value="tab2">Tab 2</Tab>
                <Tab value="tab3">Tab 3</Tab>
              </TabList>
              <TabPanel value="tab1">Content 1</TabPanel>
              <TabPanel value="tab2">Content 2</TabPanel>
              <TabPanel value="tab3">Content 3</TabPanel>
            </Tabs>
          </Tracker>
        </TestProviders>
      );

      expectWithinBudget(metrics, budget);
    });

    it("handles tab switch within budget", async () => {
      const user = userEvent.setup();
      const { Tracker, metrics } = createRenderTracker();
      const onChange = vi.fn();

      render(
        <TestProviders>
          <Tracker>
            <Tabs value="tab1" onChange={onChange}>
              <TabList>
                <Tab value="tab1">Tab 1</Tab>
                <Tab value="tab2">Tab 2</Tab>
                <Tab value="tab3">Tab 3</Tab>
              </TabList>
              <TabPanel value="tab1">Content 1</TabPanel>
              <TabPanel value="tab2">Content 2</TabPanel>
              <TabPanel value="tab3">Content 3</TabPanel>
            </Tabs>
          </Tracker>
        </TestProviders>
      );

      metrics.reset();

      // Click on Tab 2 button
      const tab2 = screen.getByRole("button", { name: /tab 2/i });
      await user.click(tab2);

      const budget = getBudget("Tabs");
      expectWithinBudget(metrics, budget);
    });
  });

  describe("EmptyState", () => {
    it("mounts within budget", async () => {
      const { Tracker, metrics } = createRenderTracker();
      const budget = getBudget("EmptyState");

      render(
        <TestProviders>
          <Tracker>
            <EmptyState
              title="No items"
              description="Get started by adding your first item"
            />
          </Tracker>
        </TestProviders>
      );

      expectWithinBudget(metrics, budget);
    });

    it("mounts with action within budget", async () => {
      const { Tracker, metrics } = createRenderTracker();
      const budget = getBudget("EmptyState");

      render(
        <TestProviders>
          <Tracker>
            <EmptyState
              title="No items"
              description="Get started by adding your first item"
              action={{ label: "Add Item", onClick: vi.fn() }}
            />
          </Tracker>
        </TestProviders>
      );

      expectWithinBudget(metrics, budget);
    });
  });
});

/**
 * Component Budget Coverage Test
 * Ensures all key components have budgets defined
 */
describe("Component Budget Coverage", () => {
  const keyComponents = [
    "PrepItemList",
    "ProgressBar",
    "ShiftToggle",
    "DateCalendar",
    "Button",
    "Card",
    "Modal",
    "FormInput",
    "Tabs",
    "EmptyState",
  ];

  it.each(keyComponents)("%s has a defined budget", (component) => {
    expect(COMPONENT_BUDGETS).toHaveProperty(component);
  });
});
