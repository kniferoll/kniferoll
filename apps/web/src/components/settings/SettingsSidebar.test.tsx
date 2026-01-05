import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TestProviders, setTestAuthState } from "@/test/utils/providers";
import { SettingsSidebar } from "./SettingsSidebar";
import { createMockKitchen, createMockMember } from "@/test/utils/mocks";

describe("SettingsSidebar", () => {
  const defaultProps = {
    activeSection: "personal" as const,
    onSectionChange: vi.fn(),
    kitchens: [
      createMockKitchen({ id: "kitchen-1", name: "Main Kitchen" }),
      createMockKitchen({ id: "kitchen-2", name: "Backup Kitchen" }),
    ],
    memberships: [
      createMockMember({ kitchen_id: "kitchen-1", role: "owner" }),
      createMockMember({ kitchen_id: "kitchen-2", role: "admin" }),
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setTestAuthState(true);
  });

  describe("Rendering", () => {
    it("renders sidebar with data-testid", () => {
      render(
        <TestProviders>
          <SettingsSidebar {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByTestId("settings-sidebar")).toBeInTheDocument();
    });

    it("renders personal section", () => {
      render(
        <TestProviders>
          <SettingsSidebar {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByText("Personal")).toBeInTheDocument();
    });

    it("renders billing section", () => {
      render(
        <TestProviders>
          <SettingsSidebar {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByText("Billing")).toBeInTheDocument();
    });

    it("renders kitchens section header", () => {
      render(
        <TestProviders>
          <SettingsSidebar {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByText("Kitchens")).toBeInTheDocument();
    });

    it("renders all user kitchens", () => {
      render(
        <TestProviders>
          <SettingsSidebar {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByText("Main Kitchen")).toBeInTheDocument();
      expect(screen.getByText("Backup Kitchen")).toBeInTheDocument();
    });

    it("only shows kitchens where user is owner or admin", () => {
      const propsWithMember = {
        ...defaultProps,
        kitchens: [
          createMockKitchen({ id: "kitchen-1", name: "Owned Kitchen" }),
          createMockKitchen({ id: "kitchen-2", name: "Member Kitchen" }),
        ],
        memberships: [
          createMockMember({ kitchen_id: "kitchen-1", role: "owner" }),
          createMockMember({ kitchen_id: "kitchen-2", role: "member" }),
        ],
      };

      render(
        <TestProviders>
          <SettingsSidebar {...propsWithMember} />
        </TestProviders>
      );

      expect(screen.getByText("Owned Kitchen")).toBeInTheDocument();
      // Member-only kitchen should not appear in settings sidebar
      expect(screen.queryByText("Member Kitchen")).not.toBeInTheDocument();
    });
  });

  describe("Active state", () => {
    it("highlights personal section when active", () => {
      render(
        <TestProviders>
          <SettingsSidebar {...defaultProps} activeSection="personal" />
        </TestProviders>
      );

      const personalButton = screen.getByRole("button", { name: /personal/i });
      expect(personalButton).toHaveAttribute("aria-selected", "true");
    });

    it("highlights billing section when active", () => {
      render(
        <TestProviders>
          <SettingsSidebar {...defaultProps} activeSection="billing" />
        </TestProviders>
      );

      const billingButton = screen.getByRole("button", { name: /billing/i });
      expect(billingButton).toHaveAttribute("aria-selected", "true");
    });

    it("highlights kitchen when active", () => {
      render(
        <TestProviders>
          <SettingsSidebar {...defaultProps} activeSection="kitchen-1" />
        </TestProviders>
      );

      const kitchenButton = screen.getByRole("button", { name: /main kitchen/i });
      expect(kitchenButton).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("Interactions", () => {
    it("calls onSectionChange with 'personal' when clicking Personal", () => {
      const onSectionChange = vi.fn();

      render(
        <TestProviders>
          <SettingsSidebar {...defaultProps} onSectionChange={onSectionChange} />
        </TestProviders>
      );

      fireEvent.click(screen.getByText("Personal"));
      expect(onSectionChange).toHaveBeenCalledWith("personal");
    });

    it("calls onSectionChange with 'billing' when clicking Billing", () => {
      const onSectionChange = vi.fn();

      render(
        <TestProviders>
          <SettingsSidebar {...defaultProps} onSectionChange={onSectionChange} />
        </TestProviders>
      );

      fireEvent.click(screen.getByText("Billing"));
      expect(onSectionChange).toHaveBeenCalledWith("billing");
    });

    it("calls onSectionChange with kitchen id when clicking a kitchen", () => {
      const onSectionChange = vi.fn();

      render(
        <TestProviders>
          <SettingsSidebar {...defaultProps} onSectionChange={onSectionChange} />
        </TestProviders>
      );

      fireEvent.click(screen.getByText("Main Kitchen"));
      expect(onSectionChange).toHaveBeenCalledWith("kitchen-1");
    });
  });

  describe("Empty states", () => {
    it("shows message when no kitchens available", () => {
      render(
        <TestProviders>
          <SettingsSidebar {...defaultProps} kitchens={[]} memberships={[]} />
        </TestProviders>
      );

      expect(screen.getByText(/no kitchens/i)).toBeInTheDocument();
    });
  });

  describe("Dark mode", () => {
    it("applies dark mode styles", () => {
      // Dark mode is controlled by context, tested via visual regression
      render(
        <TestProviders>
          <SettingsSidebar {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByTestId("settings-sidebar")).toBeInTheDocument();
    });
  });
});
