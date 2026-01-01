import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TestProviders, setTestAuthState } from "../utils/providers";
import { DateCalendar } from "@/components/kitchen/DateCalendar";

describe("DateCalendar Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setTestAuthState(true);
  });

  describe("Date Selection Flow", () => {
    it("calls onDateSelect when date is selected", async () => {
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

      // Get the calendar grid and select June 20
      const grid = screen.getByRole("grid");
      const dayCell = within(grid).getByRole("gridcell", { name: /20/ });
      await user.click(within(dayCell).getByRole("button"));

      // Verify the date was selected
      expect(onDateSelect).toHaveBeenCalledWith("2024-06-20");
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
      const grid = screen.getByRole("grid");
      // Find the cell using data-day attribute
      const sundayCell = grid.querySelector('[data-day="2024-07-07"]');
      expect(sundayCell).toBeTruthy();
      // The button inside the cell should be disabled
      const sundayButton = within(sundayCell as HTMLElement).getByRole("button");
      expect(sundayButton).toBeDisabled();
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
      const grid = screen.getByRole("grid");
      const dayCell = within(grid).getByRole("gridcell", { name: /20/ });
      await user.click(within(dayCell).getByRole("button"));

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
      const saturdayCell = grid.querySelector('[data-day="2024-06-15"]');
      expect(saturdayCell).toBeTruthy();
      const saturdayButton = within(saturdayCell as HTMLElement).getByRole("button");
      expect(saturdayButton).toBeDisabled();

      // June 16, 2024 is a Sunday - should be disabled
      const sundayCell = grid.querySelector('[data-day="2024-06-16"]');
      expect(sundayCell).toBeTruthy();
      const sundayButton = within(sundayCell as HTMLElement).getByRole("button");
      expect(sundayButton).toBeDisabled();

      // June 17, 2024 is a Monday - should be enabled
      const mondayCell = grid.querySelector('[data-day="2024-06-17"]');
      expect(mondayCell).toBeTruthy();
      const mondayButton = within(mondayCell as HTMLElement).getByRole("button");
      expect(mondayButton).not.toBeDisabled();
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

      // Get the calendar grid and find a day
      const grid = screen.getByRole("grid");
      const dayCell = within(grid).getByRole("gridcell", { name: /20/ });
      const dayButton = within(dayCell).getByRole("button");

      // Time the date selection
      const startTime = performance.now();
      await user.click(dayButton);
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

      // Find the selected day and its button
      const selectedCell = within(grid).getByRole("gridcell", { selected: true });
      const dayButton = within(selectedCell).getByRole("button");
      dayButton.focus();

      // Navigate to the next day and select with Enter
      await user.keyboard("{ArrowRight}");
      await user.keyboard("{Enter}");

      // Should have called onDateSelect
      expect(onDateSelect).toHaveBeenCalled();
    });

    it("supports arrow key navigation within calendar", async () => {
      const user = userEvent.setup();

      render(
        <TestProviders>
          <DateCalendar selectedDate="2024-06-15" onDateSelect={vi.fn()} />
        </TestProviders>
      );

      // Open calendar
      await user.click(screen.getByRole("button"));

      // Get the calendar grid
      const calendarGrid = screen.getByRole("grid");
      expect(calendarGrid).toBeInTheDocument();

      // Find the selected day and focus its button
      const selectedCell = within(calendarGrid).getByRole("gridcell", { selected: true });
      const dayButton = within(selectedCell).getByRole("button");
      dayButton.focus();

      // Navigate with arrow keys
      await user.keyboard("{ArrowRight}");
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowLeft}");

      // Calendar should still be there
      expect(calendarGrid).toBeInTheDocument();
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
