import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Import TestProviders first - it sets up all the mocks for @/lib, @/stores, etc.
// This MUST be imported before any component that uses @/lib
import { TestProviders } from "@/test/utils/providers";

import { DateCalendar } from "./DateCalendar";

describe("DateCalendar", () => {
  const defaultProps = {
    selectedDate: "2024-06-15",
    onDateSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders the trigger button with formatted date", () => {
      render(
        <TestProviders>
          <DateCalendar {...defaultProps} />
        </TestProviders>
      );

      // Should show formatted date (Sat, Jun 15 in the button)
      expect(screen.getByRole("button")).toHaveTextContent(/Jun/i);
      expect(screen.getByRole("button")).toHaveTextContent(/15/i);
    });

    it("opens calendar dropdown when trigger button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <TestProviders>
          <DateCalendar {...defaultProps} />
        </TestProviders>
      );

      const triggerButton = screen.getByRole("button");
      await user.click(triggerButton);

      // Calendar should now be visible with month header
      expect(screen.getByText("June 2024")).toBeInTheDocument();
    });

    it("closes calendar when clicking outside", async () => {
      const user = userEvent.setup();
      render(
        <TestProviders>
          <div>
            <DateCalendar {...defaultProps} />
            <button data-testid="outside">Outside</button>
          </div>
        </TestProviders>
      );

      // Open calendar
      const triggerButton = screen.getByRole("button", { name: /Jun/i });
      await user.click(triggerButton);
      expect(screen.getByText("June 2024")).toBeInTheDocument();

      // Click outside
      await user.click(screen.getByTestId("outside"));

      // Calendar should close
      await waitFor(() => {
        expect(screen.queryByText("June 2024")).not.toBeInTheDocument();
      });
    });
  });

  describe("Date Selection", () => {
    it("calls onDateSelect when a date is clicked", async () => {
      const user = userEvent.setup();
      const onDateSelect = vi.fn();
      render(
        <TestProviders>
          <DateCalendar {...defaultProps} onDateSelect={onDateSelect} />
        </TestProviders>
      );

      // Open calendar
      await user.click(screen.getByRole("button"));

      // Click on a different day (June 20)
      const dayButton = screen.getByRole("button", { name: /20/ });
      await user.click(dayButton);

      expect(onDateSelect).toHaveBeenCalledWith("2024-06-20");
    });

    it("closes calendar after selecting a date", async () => {
      const user = userEvent.setup();
      render(
        <TestProviders>
          <DateCalendar {...defaultProps} />
        </TestProviders>
      );

      // Open calendar
      await user.click(screen.getByRole("button"));
      expect(screen.getByText("June 2024")).toBeInTheDocument();

      // Click on a day
      await user.click(screen.getByRole("button", { name: /20/ }));

      // Calendar should close
      await waitFor(() => {
        expect(screen.queryByText("June 2024")).not.toBeInTheDocument();
      });
    });

    it("highlights the currently selected date", async () => {
      const user = userEvent.setup();
      render(
        <TestProviders>
          <DateCalendar {...defaultProps} selectedDate="2024-06-15" />
        </TestProviders>
      );

      // Open calendar
      await user.click(screen.getByRole("button"));

      // Get the calendar grid
      const grid = screen.getByRole("grid");
      // The selected date should have visual indication (aria-selected or class)
      const selectedDay = within(grid).getByRole("gridcell", { name: /15/ });
      // Check for selected state - react-day-picker uses aria-selected
      expect(selectedDay).toHaveAttribute("aria-selected", "true");
    });

    it("highlights today's date differently", async () => {
      const user = userEvent.setup();
      render(
        <TestProviders>
          <DateCalendar
            {...defaultProps}
            selectedDate="2024-06-10" // Different from today (June 15)
          />
        </TestProviders>
      );

      // Open calendar
      await user.click(screen.getByRole("button"));

      // Get the calendar grid
      const grid = screen.getByRole("grid");
      // Today (15th) should have today indicator
      const today = within(grid).getByRole("gridcell", { name: /15/ });
      // Today typically has aria-current="date"
      expect(today).toHaveAttribute("aria-current", "date");
    });
  });

  describe("Closed Days", () => {
    const closedDays = ["sunday", "saturday"]; // Weekend closure

    it("disables closed days", async () => {
      const user = userEvent.setup();
      render(
        <TestProviders>
          <DateCalendar
            {...defaultProps}
            selectedDate="2024-06-17" // Monday
            closedDays={closedDays}
          />
        </TestProviders>
      );

      // Open calendar
      await user.click(screen.getByRole("button"));

      // June 16, 2024 is a Sunday - should be disabled
      const sundayButton = screen.getByRole("button", { name: /16/ });
      expect(sundayButton).toBeDisabled();
    });

    it("does not call onDateSelect when clicking a closed day", async () => {
      const user = userEvent.setup();
      const onDateSelect = vi.fn();
      render(
        <TestProviders>
          <DateCalendar
            {...defaultProps}
            selectedDate="2024-06-17"
            closedDays={closedDays}
            onDateSelect={onDateSelect}
          />
        </TestProviders>
      );

      // Open calendar
      await user.click(screen.getByRole("button"));

      // Try to click on a disabled Sunday (June 16)
      const sundayButton = screen.getByRole("button", { name: /16/ });
      await user.click(sundayButton);

      // Should not have been called
      expect(onDateSelect).not.toHaveBeenCalled();
    });
  });

  describe("Navigation", () => {
    it("navigates to previous month", async () => {
      const user = userEvent.setup();
      render(
        <TestProviders>
          <DateCalendar {...defaultProps} selectedDate="2024-06-15" />
        </TestProviders>
      );

      // Open calendar
      await user.click(screen.getByRole("button"));
      expect(screen.getByText("June 2024")).toBeInTheDocument();

      // Click previous month button
      const prevButton = screen.getByRole("button", { name: /previous/i });
      await user.click(prevButton);

      // Should show May 2024
      expect(screen.getByText("May 2024")).toBeInTheDocument();
    });

    it("navigates to next month", async () => {
      const user = userEvent.setup();
      render(
        <TestProviders>
          <DateCalendar {...defaultProps} selectedDate="2024-06-15" />
        </TestProviders>
      );

      // Open calendar
      await user.click(screen.getByRole("button"));
      expect(screen.getByText("June 2024")).toBeInTheDocument();

      // Click next month button
      const nextButton = screen.getByRole("button", { name: /next/i });
      await user.click(nextButton);

      // Should show July 2024
      expect(screen.getByText("July 2024")).toBeInTheDocument();
    });

    it("shows Go to Today button when not viewing today", async () => {
      const user = userEvent.setup();
      render(
        <TestProviders>
          <DateCalendar {...defaultProps} selectedDate="2024-07-01" />
        </TestProviders>
      );

      // Open calendar (which will show July since that's selected)
      await user.click(screen.getByRole("button"));

      // Should have a "Go to Today" button
      const todayButton = screen.getByRole("button", { name: /today/i });
      expect(todayButton).toBeInTheDocument();
    });

    it("navigates to today when Go to Today is clicked", async () => {
      const user = userEvent.setup();
      const onDateSelect = vi.fn();
      render(
        <TestProviders>
          <DateCalendar
            {...defaultProps}
            selectedDate="2024-07-01"
            onDateSelect={onDateSelect}
          />
        </TestProviders>
      );

      // Open calendar
      await user.click(screen.getByRole("button"));

      // Click "Go to Today"
      const todayButton = screen.getByRole("button", { name: /today/i });
      await user.click(todayButton);

      // Should select today's date
      expect(onDateSelect).toHaveBeenCalledWith("2024-06-15");
    });
  });

  describe("Accessibility", () => {
    it("supports keyboard navigation between days", async () => {
      const user = userEvent.setup();
      render(
        <TestProviders>
          <DateCalendar {...defaultProps} selectedDate="2024-06-15" />
        </TestProviders>
      );

      // Open calendar
      await user.click(screen.getByRole("button"));

      // Get the calendar grid
      const grid = screen.getByRole("grid");
      // Focus on a day and use arrow keys
      const day15 = within(grid).getByRole("gridcell", { name: /15/ });
      day15.focus();

      // Press right arrow to move to next day
      await user.keyboard("{ArrowRight}");

      // Focus should move to the 16th
      const day16 = within(grid).getByRole("gridcell", { name: /16/ });
      expect(document.activeElement).toBe(day16);
    });

    it("selects date with Enter key", async () => {
      const user = userEvent.setup();
      const onDateSelect = vi.fn();
      render(
        <TestProviders>
          <DateCalendar {...defaultProps} onDateSelect={onDateSelect} />
        </TestProviders>
      );

      // Open calendar
      await user.click(screen.getByRole("button"));

      // Focus on a day
      const day20 = screen.getByRole("button", { name: /20/ });
      day20.focus();

      // Press Enter to select
      await user.keyboard("{Enter}");

      expect(onDateSelect).toHaveBeenCalledWith("2024-06-20");
    });

    it("has proper ARIA labels for navigation buttons", async () => {
      const user = userEvent.setup();
      render(
        <TestProviders>
          <DateCalendar {...defaultProps} />
        </TestProviders>
      );

      // Open calendar
      await user.click(screen.getByRole("button"));

      // Check for accessible labels on navigation
      expect(
        screen.getByRole("button", { name: /previous/i })
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
    });

    it("has role grid for the calendar", async () => {
      const user = userEvent.setup();
      render(
        <TestProviders>
          <DateCalendar {...defaultProps} />
        </TestProviders>
      );

      // Open calendar
      await user.click(screen.getByRole("button"));

      // Calendar grid should have proper role
      expect(screen.getByRole("grid")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles month boundaries correctly", async () => {
      const user = userEvent.setup();
      const onDateSelect = vi.fn();
      render(
        <TestProviders>
          <DateCalendar
            {...defaultProps}
            selectedDate="2024-06-30"
            onDateSelect={onDateSelect}
          />
        </TestProviders>
      );

      // Open calendar
      await user.click(screen.getByRole("button"));

      // Navigate to next month
      const nextButton = screen.getByRole("button", { name: /next/i });
      await user.click(nextButton);

      // Should show July and be able to select dates
      expect(screen.getByText("July 2024")).toBeInTheDocument();

      // Select July 1
      await user.click(screen.getByRole("button", { name: /^1$/ }));
      expect(onDateSelect).toHaveBeenCalledWith("2024-07-01");
    });

    it("handles year boundaries correctly", async () => {
      const user = userEvent.setup();
      render(
        <TestProviders>
          <DateCalendar {...defaultProps} selectedDate="2024-01-01" />
        </TestProviders>
      );

      // Open calendar
      await user.click(screen.getByRole("button"));
      expect(screen.getByText("January 2024")).toBeInTheDocument();

      // Navigate to previous month
      const prevButton = screen.getByRole("button", { name: /previous/i });
      await user.click(prevButton);

      // Should show December 2023
      expect(screen.getByText("December 2023")).toBeInTheDocument();
    });

    it("works without closedDays prop", async () => {
      const user = userEvent.setup();
      const onDateSelect = vi.fn();
      render(
        <TestProviders>
          <DateCalendar
            selectedDate="2024-06-15"
            onDateSelect={onDateSelect}
            // No closedDays prop
          />
        </TestProviders>
      );

      // Open calendar
      await user.click(screen.getByRole("button"));

      // All days should be selectable including weekends
      const sundayButton = screen.getByRole("button", { name: /16/ });
      expect(sundayButton).not.toBeDisabled();
      await user.click(sundayButton);
      expect(onDateSelect).toHaveBeenCalledWith("2024-06-16");
    });
  });
});
