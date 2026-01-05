import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

// Create mock stores that can be configured per test
const mockAuthStore = {
  user: null as { id: string; email: string } | null,
};

// Mock dependencies
vi.mock("@/stores", () => ({
  useAuthStore: vi.fn((selector?: (state: unknown) => unknown) => {
    const state = mockAuthStore;
    return selector ? selector(state) : state;
  }),
}));

vi.mock("@/context", () => ({
  HeaderProvider: vi.fn(({ children }) => <div data-testid="header-provider">{children}</div>),
  useDarkModeContext: vi.fn(() => ({ isDark: false })),
}));

vi.mock("@/hooks", () => ({
  useDefaultHeaderConfig: vi.fn(),
  useHeader: vi.fn(() => ({
    config: {
      visible: true,
      startContent: null,
      centerContent: null,
      endContent: null,
    },
  })),
}));

vi.mock("@/components", () => ({
  Logo: vi.fn(() => <div data-testid="logo">Logo</div>),
  NavLinks: vi.fn(({ end }) => <div data-testid="nav-links">{end}</div>),
  UserAvatarMenu: vi.fn(() => <div data-testid="user-avatar-menu">Avatar</div>),
  PageHeader: vi.fn(() => <header data-testid="page-header">Header</header>),
}));

vi.mock("@/layouts/LayoutShell", () => ({
  LayoutShell: vi.fn(({ children }) => <div data-testid="layout-shell">{children}</div>),
}));

import { AppLayout } from "@/layouts/AppLayout";

describe("AppLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to unauthenticated state
    mockAuthStore.user = null;
  });

  it("redirects to login when user is not authenticated", () => {
    mockAuthStore.user = null;

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<AppLayout />} />
          <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId("login-page")).toBeInTheDocument();
  });

  it("renders layout when user is authenticated", () => {
    mockAuthStore.user = { id: "user-1", email: "test@example.com" };

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<AppLayout />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId("header-provider")).toBeInTheDocument();
    expect(screen.getByTestId("layout-shell")).toBeInTheDocument();
  });

  it("renders child routes via Outlet when authenticated", () => {
    mockAuthStore.user = { id: "user-1", email: "test@example.com" };

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route
              path="/dashboard"
              element={<div data-testid="dashboard-content">Dashboard</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId("dashboard-content")).toBeInTheDocument();
  });
});
