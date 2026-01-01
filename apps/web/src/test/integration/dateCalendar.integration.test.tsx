import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TestProviders, setTestAuthState } from "../utils/providers";
import { DateCalendar } from "@/components/kitchen/DateCalendar";
import { useKitchenStore } from "@/stores";

// Mock date utilities for consistent test behavior
vi.mock("@/lib", async () => {
  const actual = await vi.importActual("@/lib");
  return {
    ...actual,
    getTodayLocalDate: () => "2024-06-15",
    toLocalDate: (dateStr: string) => new Date(dateStr + "T12:00:00"),
    formatToDateString: (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    },
    jsDateToDatabaseDayOfWeek: (jsDay: number) => (jsDay + 6) % 7,
    isClosedDay: () => false,
    findNextOpenDay: () => null,
  };
});

describe("DateCalendar Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setTestAuthState(true);
  });

  describe("Date Selection Flow", () => {
    it("updates store when date is selected", async () => {
      const user = userEvent.setup();
      const setSelectedDate = vi.fn();

      // Mock useKitchenStore to capture setSelectedDate calls
      vi.mocked(useKitchenStore).mockImplementation((selector) => {
        const store = {
          currentKitchen: { id: "kitchen-1", name: "Test Kitchen" },
          loadKitchen: vi.fn(),
          selectedDate: "2024-06-15",
          setSelectedDate,
          selectedShift: "Lunch",
          setSelectedShift: vi.fn(),
          clearKitchen: vi.fn(),
        };
        return selector ? selector(store) : store;
      });

      render(
        <TestProviders>
          <DateCalendar
            selectedDate="2024-06-15"
            onDateSelect={setSelectedDate}
          />
        </TestProviders>
      );

      // Open calendar
      await user.click(screen.getByRole("button"));

      // Select a different date (June 20)
      await user.click(screen.getByRole("button", { name: /20/ }));

      // Verify the date was selected
      expect(setSelectedDate).toHaveBeenCalledWith("2024-06-20");
    });

    it("preserves closed days when navigating months", async () => {
      const user = userEvent.setup();
      const closedDays = ["sunday"];

      render(
        <TestProviders>
          <DateCalendar
            selectedDate="2024-06-15"
            onDateSelect={vi.fn()}
            closedDays={closedDays}
          />
        </TestProviders>
      );

      // Open calendar
      await user.click(screen.getByRole("button"));

      // Navigate to July
      await user.click(screen.getByRole("button", { name: /next/i }));

      // July 7, 2024 is a Sunday - should still be disabled
      await waitFor(() => {
        expect(screen.getByText("July 2024")).toBeInTheDocument();
      });
      const sundayInJuly = screen.getByRole("button", { name: /^7$/ });
      expect(sundayInJuly).toBeDisabled();
    });
  });

  describe("Visual State Synchronization", () => {
    it("shows selected date in trigger button after selection", async () => {
      const user = userEvent.setup();
      let selectedDate = "2024-06-15";
      const onDateSelect = vi.fn((date: string) => {
        selectedDate = date;
      });

      const { rerender } = render(
        <TestProviders>
          <DateCalendar
            selectedDate={selectedDate}
            onDateSelect={onDateSelect}
          />
        </TestProviders>
      );

      // Open calendar
      await user.click(screen.getByRole("button"));

      // Select June 20
      await user.click(screen.getByRole("button", { name: /20/ }));

      // Rerender with new date (simulating parent state update)
      rerender(
        <TestProviders>
          <DateCalendar selectedDate="2024-06-20" onDateSelect={onDateSelect} />
        </TestProviders>
      );

      // Trigger button should now show June 20
      expect(screen.getByRole("button")).toHaveTextContent(/Jun/i);
      expect(screen.getByRole("button")).toHaveTextContent(/20/i);
    });
  });

  describe("Kitchen Context", () => {
    it("works with kitchen closed days configuration", async () => {
      const user = userEvent.setup();
      // Simulate a kitchen closed on weekends
      const closedDays = ["saturday", "sunday"];

      render(
        <TestProviders>
          <DateCalendar
            selectedDate="2024-06-17" // Monday
            onDateSelect={vi.fn()}
            closedDays={closedDays}
          />
        </TestProviders>
      );

      // Open calendar
      await user.click(screen.getByRole("button"));

      // Get the calendar grid
      const grid = screen.getByRole("grid");

      // June 15, 2024 is a Saturday - should be disabled
      const saturday = within(grid).getByRole("gridcell", { name: /15/ });
      expect(saturday).toHaveAttribute("aria-disabled", "true");

      // June 16, 2024 is a Sunday - should be disabled
      const sunday = within(grid).getByRole("gridcell", { name: /16/ });
      expect(sunday).toHaveAttribute("aria-disabled", "true");

      // June 17, 2024 is a Monday - should be enabled
      const monday = within(grid).getByRole("gridcell", { name: /17/ });
      expect(monday).not.toHaveAttribute("aria-disabled", "true");
    });
  });

  describe("Performance", () => {
    it("calendar opens immediately on click", async () => {
      const user = userEvent.setup();

      render(
        <TestProviders>
          <DateCalendar selectedDate="2024-06-15" onDateSelect={vi.fn()} />
        </TestProviders>
      );

      const startTime = performance.now();
      await user.click(screen.getByRole("button"));
      const endTime = performance.now();

      // Calendar should be visible
      expect(screen.getByText("June 2024")).toBeInTheDocument();

      // Should open in under 100ms (interaction should feel instant)
      expect(endTime - startTime).toBeLessThan(100);
    });

    it("date selection is responsive", async () => {
      const user = userEvent.setup();
      const onDateSelect = vi.fn();

      render(
        <TestProviders>
          <DateCalendar
            selectedDate="2024-06-15"
            onDateSelect={onDateSelect}
          />
        </TestProviders>
      );

      // Open calendar
      await user.click(screen.getByRole("button"));

      // Time the date selection
      const startTime = performance.now();
      await user.click(screen.getByRole("button", { name: /20/ }));
      const endTime = performance.now();

      expect(onDateSelect).toHaveBeenCalled();

      // Selection should complete in under 50ms
      expect(endTime - startTime).toBeLessThan(50);
    });
  });

  describe("Accessibility Integration", () => {
    it("can complete full date selection with keyboard only", async () => {
      const user = userEvent.setup();
      const onDateSelect = vi.fn();

      render(
        <TestProviders>
          <DateCalendar
            selectedDate="2024-06-15"
            onDateSelect={onDateSelect}
          />
        </TestProviders>
      );

      // Tab to trigger button and open with Enter
      await user.tab();
      await user.keyboard("{Enter}");

      // Calendar should open
      expect(screen.getByText("June 2024")).toBeInTheDocument();

      // Get the calendar grid
      const grid = screen.getByRole("grid");

      // Focus should be on a day in the grid
      // Navigate to a date and select with Enter
      const day = within(grid).getByRole("gridcell", { selected: true });
      day.focus();
      await user.keyboard("{ArrowRight}"); // Move to next day
      await user.keyboard("{Enter}"); // Select

      // Should have called onDateSelect
      expect(onDateSelect).toHaveBeenCalled();
    });

    it("traps focus within calendar when open", async () => {
      const user = userEvent.setup();

      render(
        <TestProviders>
          <DateCalendar selectedDate="2024-06-15" onDateSelect={vi.fn()} />
        </TestProviders>
      );

      // Open calendar
      await user.click(screen.getByRole("button"));

      // Get all focusable elements in the calendar
      const calendarGrid = screen.getByRole("grid");
      expect(calendarGrid).toBeInTheDocument();

      // Focus the selected day first
      const selectedDay = within(calendarGrid).getByRole("gridcell", { selected: true });
      selectedDay.focus();

      // Navigate with arrow keys - focus should stay within calendar
      await user.keyboard("{ArrowRight}");
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowLeft}");

      // Focus should still be within the calendar grid
      expect(calendarGrid.contains(document.activeElement)).toBeTruthy();
    });

    it("announces month changes to screen readers", async () => {
      const user = userEvent.setup();

      render(
        <TestProviders>
          <DateCalendar selectedDate="2024-06-15" onDateSelect={vi.fn()} />
        </TestProviders>
      );

      // Open calendar
      await user.click(screen.getByRole("button"));

      // Navigate to next month
      const nextButton = screen.getByRole("button", { name: /next/i });
      await user.click(nextButton);

      // Month heading should be visible and accessible
      expect(screen.getByText("July 2024")).toBeInTheDocument();
    });
  });
});
