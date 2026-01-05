import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

// Mock dependencies
vi.mock("@/stores", () => ({
  useAuthStore: vi.fn((selector?: (state: unknown) => unknown) => {
    const state = { user: null };
    return selector ? selector(state) : state;
  }),
}));

vi.mock("@/context", () => ({
  HeaderProvider: vi.fn(({ children }) => <div data-testid="header-provider">{children}</div>),
  useDarkModeContext: vi.fn(() => ({ isDark: false })),
}));

vi.mock("@/hooks", () => ({
  useHeaderConfig: vi.fn(),
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
  AuthButtons: vi.fn(() => <div data-testid="auth-buttons">Auth Buttons</div>),
  DashboardLink: vi.fn(() => <a data-testid="dashboard-link">Dashboard</a>),
  Logo: vi.fn(() => <div data-testid="logo">Logo</div>),
  NavLinks: vi.fn(({ start, end }) => (
    <div data-testid="nav-links">
      {start}
      {end}
    </div>
  )),
  PublicFooter: vi.fn(() => <footer data-testid="public-footer">Footer</footer>),
  PublicMobileMenu: vi.fn(() => <div data-testid="public-mobile-menu">Mobile Menu</div>),
  UserAvatarMenu: vi.fn(() => <div data-testid="user-avatar-menu">Avatar</div>),
  PageHeader: vi.fn(() => <header data-testid="page-header">Header</header>),
}));

vi.mock("@/layouts/LayoutShell", () => ({
  LayoutShell: vi.fn(({ children }) => <div data-testid="layout-shell">{children}</div>),
}));

import { PublicLayout } from "@/layouts/PublicLayout";

describe("PublicLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders HeaderProvider and LayoutShell", () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="*" element={<div data-testid="outlet-content">Page Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId("header-provider")).toBeInTheDocument();
    expect(screen.getByTestId("layout-shell")).toBeInTheDocument();
  });

  it("renders PublicFooter", () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="*" element={<div>Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId("public-footer")).toBeInTheDocument();
  });

  it("renders outlet content for child routes", () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="*" element={<div data-testid="child-page">Child Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId("child-page")).toBeInTheDocument();
  });

  it("wraps content in flex-1 container", () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="*" element={<div data-testid="test-content">Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const content = screen.getByTestId("test-content");
    expect(content.parentElement).toHaveClass("flex-1");
  });
});
