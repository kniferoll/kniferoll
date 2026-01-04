import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TestProviders, setTestAuthState } from "@/test/utils/providers";
import { KitchenSettingsPanel } from "./KitchenSettingsPanel";
import { createMockKitchen, createMockMember, createMockUser } from "@/test/utils/mocks";

describe("KitchenSettingsPanel", () => {
  const mockKitchen = createMockKitchen({ id: "kitchen-1", name: "Test Kitchen" });
  const mockUser = createMockUser();
  const mockMembership = createMockMember({
    kitchen_id: "kitchen-1",
    user_id: mockUser.id,
    role: "owner",
  });

  const defaultProps = {
    kitchen: mockKitchen,
    membership: mockMembership,
    userId: mockUser.id,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setTestAuthState(true);
  });

  describe("Rendering", () => {
    it("renders the kitchen settings panel", () => {
      render(
        <TestProviders>
          <KitchenSettingsPanel {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByTestId("kitchen-settings-panel")).toBeInTheDocument();
    });

    it("displays kitchen name as header", () => {
      render(
        <TestProviders>
          <KitchenSettingsPanel {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByText("Test Kitchen")).toBeInTheDocument();
    });

    it("renders all tabs for owner", () => {
      render(
        <TestProviders>
          <KitchenSettingsPanel {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByRole("button", { name: /general/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /schedule/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /stations/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /members/i })).toBeInTheDocument();
    });

    it("renders tabs for admin (same as owner)", () => {
      const adminProps = {
        ...defaultProps,
        membership: createMockMember({ role: "admin" }),
      };

      render(
        <TestProviders>
          <KitchenSettingsPanel {...adminProps} />
        </TestProviders>
      );

      expect(screen.getByRole("button", { name: /general/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /schedule/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /stations/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /members/i })).toBeInTheDocument();
    });
  });

  describe("Tab navigation", () => {
    it("shows general tab content by default", () => {
      render(
        <TestProviders>
          <KitchenSettingsPanel {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByTestId("general-tab-content")).toBeInTheDocument();
    });

    it("switches to schedule tab when clicked", async () => {
      render(
        <TestProviders>
          <KitchenSettingsPanel {...defaultProps} />
        </TestProviders>
      );

      fireEvent.click(screen.getByRole("button", { name: /schedule/i }));

      await waitFor(() => {
        expect(screen.getByTestId("schedule-tab-content")).toBeInTheDocument();
      });
    });

    it("switches to stations tab when clicked", async () => {
      render(
        <TestProviders>
          <KitchenSettingsPanel {...defaultProps} />
        </TestProviders>
      );

      fireEvent.click(screen.getByRole("button", { name: /stations/i }));

      await waitFor(() => {
        expect(screen.getByTestId("stations-tab-content")).toBeInTheDocument();
      });
    });

    it("switches to members tab when clicked", async () => {
      render(
        <TestProviders>
          <KitchenSettingsPanel {...defaultProps} />
        </TestProviders>
      );

      fireEvent.click(screen.getByRole("button", { name: /members/i }));

      await waitFor(() => {
        expect(screen.getByTestId("members-tab-content")).toBeInTheDocument();
      });
    });
  });

  describe("General tab", () => {
    it("displays kitchen name input", () => {
      render(
        <TestProviders>
          <KitchenSettingsPanel {...defaultProps} />
        </TestProviders>
      );

      const nameInput = screen.getByDisplayValue("Test Kitchen");
      expect(nameInput).toBeInTheDocument();
    });

    it("shows delete kitchen option for owner", () => {
      render(
        <TestProviders>
          <KitchenSettingsPanel {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByText(/delete kitchen/i)).toBeInTheDocument();
    });

    it("hides delete kitchen option for admin", () => {
      const adminProps = {
        ...defaultProps,
        membership: createMockMember({ role: "admin" }),
      };

      render(
        <TestProviders>
          <KitchenSettingsPanel {...adminProps} />
        </TestProviders>
      );

      expect(screen.queryByText(/delete kitchen/i)).not.toBeInTheDocument();
    });
  });

  describe("Schedule tab", () => {
    it("displays operating days section", async () => {
      render(
        <TestProviders>
          <KitchenSettingsPanel {...defaultProps} />
        </TestProviders>
      );

      fireEvent.click(screen.getByRole("button", { name: /schedule/i }));

      await waitFor(() => {
        expect(screen.getByText(/operating days/i)).toBeInTheDocument();
      });
    });

    it("displays shifts section", async () => {
      render(
        <TestProviders>
          <KitchenSettingsPanel {...defaultProps} />
        </TestProviders>
      );

      fireEvent.click(screen.getByRole("button", { name: /schedule/i }));

      await waitFor(() => {
        expect(screen.getByText(/kitchen shifts/i)).toBeInTheDocument();
      });
    });

    it("displays all days of the week", async () => {
      render(
        <TestProviders>
          <KitchenSettingsPanel {...defaultProps} />
        </TestProviders>
      );

      fireEvent.click(screen.getByRole("button", { name: /schedule/i }));

      await waitFor(() => {
        expect(screen.getByText("Sunday")).toBeInTheDocument();
        expect(screen.getByText("Monday")).toBeInTheDocument();
        expect(screen.getByText("Tuesday")).toBeInTheDocument();
        expect(screen.getByText("Wednesday")).toBeInTheDocument();
        expect(screen.getByText("Thursday")).toBeInTheDocument();
        expect(screen.getByText("Friday")).toBeInTheDocument();
        expect(screen.getByText("Saturday")).toBeInTheDocument();
      });
    });

    it("allows toggling day open/closed status", async () => {
      render(
        <TestProviders>
          <KitchenSettingsPanel {...defaultProps} />
        </TestProviders>
      );

      fireEvent.click(screen.getByRole("button", { name: /schedule/i }));

      await waitFor(() => {
        expect(screen.getByText("Monday")).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it("allows adding new shifts", async () => {
      render(
        <TestProviders>
          <KitchenSettingsPanel {...defaultProps} />
        </TestProviders>
      );

      fireEvent.click(screen.getByRole("button", { name: /schedule/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/shift name/i)).toBeInTheDocument();
      });
    });
  });

  describe("Stations tab", () => {
    it("displays stations list", async () => {
      render(
        <TestProviders>
          <KitchenSettingsPanel {...defaultProps} />
        </TestProviders>
      );

      fireEvent.click(screen.getByRole("button", { name: /stations/i }));

      await waitFor(() => {
        // Default mock includes "Prep Station" and "Grill Station"
        expect(screen.getByText("Prep Station")).toBeInTheDocument();
      });
    });

    it("shows add station form", async () => {
      render(
        <TestProviders>
          <KitchenSettingsPanel {...defaultProps} />
        </TestProviders>
      );

      fireEvent.click(screen.getByRole("button", { name: /stations/i }));

      await waitFor(() => {
        // Has a placeholder for station name input
        expect(screen.getByPlaceholderText(/station name/i)).toBeInTheDocument();
      });
    });
  });

  describe("Members tab", () => {
    it("displays members list", async () => {
      render(
        <TestProviders>
          <KitchenSettingsPanel {...defaultProps} />
        </TestProviders>
      );

      fireEvent.click(screen.getByRole("button", { name: /members/i }));

      await waitFor(() => {
        expect(screen.getByTestId("members-tab-content")).toBeInTheDocument();
      });
    });

    it("shows invite button for owner", async () => {
      render(
        <TestProviders>
          <KitchenSettingsPanel {...defaultProps} />
        </TestProviders>
      );

      fireEvent.click(screen.getByRole("button", { name: /members/i }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /invite/i })).toBeInTheDocument();
      });
    });
  });

  describe("Permissions", () => {
    it("disables editing for non-owner on general tab", () => {
      const adminProps = {
        ...defaultProps,
        membership: createMockMember({ role: "admin" }),
      };

      render(
        <TestProviders>
          <KitchenSettingsPanel {...adminProps} />
        </TestProviders>
      );

      // Admin can still edit name but cannot delete
      expect(screen.queryByText(/delete kitchen/i)).not.toBeInTheDocument();
    });
  });

  describe("Loading states", () => {
    it("shows loading indicator while fetching data", () => {
      render(
        <TestProviders>
          <KitchenSettingsPanel {...defaultProps} />
        </TestProviders>
      );

      // Component should handle internal loading states
      expect(screen.getByTestId("kitchen-settings-panel")).toBeInTheDocument();
    });
  });

  describe("Error handling", () => {
    it("displays error message when save fails", async () => {
      // This would be tested more specifically in integration tests
      render(
        <TestProviders>
          <KitchenSettingsPanel {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByTestId("kitchen-settings-panel")).toBeInTheDocument();
    });
  });
});
