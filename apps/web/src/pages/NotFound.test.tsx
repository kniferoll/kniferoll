import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { NotFound } from "./NotFound";

// Mock stores and context
vi.mock("@/stores", () => ({
  useAuthStore: vi.fn(() => ({ user: null })),
}));

vi.mock("@/context", () => ({
  useDarkModeContext: vi.fn(() => ({ isDark: false })),
}));

import { useAuthStore } from "@/stores";

describe("NotFound", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders 404 message", () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );

    expect(screen.getByTestId("page-not-found")).toBeInTheDocument();
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("Page not found")).toBeInTheDocument();
  });

  it("shows homepage link for unauthenticated users", () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: null } as ReturnType<typeof useAuthStore>);

    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "Go to Homepage" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("link", { name: "Homepage" })).not.toBeInTheDocument();
  });

  it("shows dashboard link for authenticated users", () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: { id: "user-123" } } as ReturnType<
      typeof useAuthStore
    >);

    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "Go to Dashboard" })).toHaveAttribute(
      "href",
      "/dashboard"
    );
    expect(screen.getByRole("link", { name: "Homepage" })).toHaveAttribute("href", "/");
  });
});
