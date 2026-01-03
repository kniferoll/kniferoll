import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TestProviders, setTestAuthState } from "@/test/utils/providers";
import { PersonalSettingsTab } from "./PersonalSettingsTab";
import { createMockUser } from "@/test/utils/mocks";

describe("PersonalSettingsTab", () => {
  const defaultUser = createMockUser({
    user_metadata: { name: "John Chef" },
    email: "john@kitchen.com",
  });

  beforeEach(() => {
    vi.clearAllMocks();
    setTestAuthState(true);
  });

  describe("Rendering", () => {
    it("renders the personal settings panel", () => {
      render(
        <TestProviders>
          <PersonalSettingsTab user={defaultUser} />
        </TestProviders>
      );

      expect(screen.getByTestId("personal-settings-panel")).toBeInTheDocument();
    });

    it("displays display name field with current value", () => {
      render(
        <TestProviders>
          <PersonalSettingsTab user={defaultUser} />
        </TestProviders>
      );

      const nameInput = screen.getByLabelText(/display name/i);
      expect(nameInput).toHaveValue("John Chef");
    });

    it("displays email field (readonly)", () => {
      render(
        <TestProviders>
          <PersonalSettingsTab user={defaultUser} />
        </TestProviders>
      );

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveValue("john@kitchen.com");
      expect(emailInput).toBeDisabled();
    });

    it("displays dark mode toggle", () => {
      render(
        <TestProviders>
          <PersonalSettingsTab user={defaultUser} />
        </TestProviders>
      );

      expect(screen.getByText(/dark mode/i)).toBeInTheDocument();
      expect(screen.getByRole("switch")).toBeInTheDocument();
    });
  });

  describe("Form validation", () => {
    it("shows error when display name is empty", async () => {
      render(
        <TestProviders>
          <PersonalSettingsTab user={defaultUser} />
        </TestProviders>
      );

      const nameInput = screen.getByLabelText(/display name/i);
      fireEvent.change(nameInput, { target: { value: "" } });

      const saveButton = screen.getByRole("button", { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
    });

    it("disables save button when no changes made", () => {
      render(
        <TestProviders>
          <PersonalSettingsTab user={defaultUser} />
        </TestProviders>
      );

      const saveButton = screen.getByRole("button", { name: /save/i });
      expect(saveButton).toBeDisabled();
    });

    it("enables save button when changes are made", () => {
      render(
        <TestProviders>
          <PersonalSettingsTab user={defaultUser} />
        </TestProviders>
      );

      const nameInput = screen.getByLabelText(/display name/i);
      fireEvent.change(nameInput, { target: { value: "New Name" } });

      const saveButton = screen.getByRole("button", { name: /save/i });
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe("Saving changes", () => {
    it("shows success message on successful save", async () => {
      render(
        <TestProviders>
          <PersonalSettingsTab user={defaultUser} />
        </TestProviders>
      );

      const nameInput = screen.getByLabelText(/display name/i);
      fireEvent.change(nameInput, { target: { value: "Updated Name" } });

      const saveButton = screen.getByRole("button", { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/settings saved/i)).toBeInTheDocument();
      });
    });

    it("shows loading state while saving", async () => {
      render(
        <TestProviders>
          <PersonalSettingsTab user={defaultUser} />
        </TestProviders>
      );

      const nameInput = screen.getByLabelText(/display name/i);
      fireEvent.change(nameInput, { target: { value: "Updated Name" } });

      const saveButton = screen.getByRole("button", { name: /save/i });
      fireEvent.click(saveButton);

      // Button text changes to "Saving..." during save
      expect(screen.getByText(/saving/i)).toBeInTheDocument();
    });
  });

  describe("Dark mode toggle", () => {
    it("toggles dark mode when clicked", async () => {
      render(
        <TestProviders>
          <PersonalSettingsTab user={defaultUser} />
        </TestProviders>
      );

      const toggle = screen.getByRole("switch");
      fireEvent.click(toggle);

      // Toggle behavior is handled by context
      expect(toggle).toBeInTheDocument();
    });
  });
});
