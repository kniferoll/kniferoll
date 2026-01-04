import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockAuthStore = {
  user: null as { id: string } | null,
};

vi.mock("@/stores", () => ({
  useAuthStore: vi.fn((selector?: (state: unknown) => unknown) => {
    const state = mockAuthStore;
    return selector ? selector(state) : state;
  }),
}));

vi.mock("@/components/ui/Button", () => ({
  Button: vi.fn(({ children, onClick, variant, size }) => (
    <button onClick={onClick} data-variant={variant} data-size={size}>
      {children}
    </button>
  )),
}));

import { AuthButtons } from "./AuthButtons";

describe("AuthButtons", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthStore.user = null;
  });

  it("renders login and signup buttons when user is not authenticated", () => {
    render(
      <MemoryRouter>
        <AuthButtons />
      </MemoryRouter>
    );

    expect(screen.getByText("Log In")).toBeInTheDocument();
    expect(screen.getByText("Sign Up")).toBeInTheDocument();
  });

  it("navigates to /login when Log In button is clicked", () => {
    render(
      <MemoryRouter>
        <AuthButtons />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Log In"));
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("navigates to /signup when Sign Up button is clicked", () => {
    render(
      <MemoryRouter>
        <AuthButtons />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Sign Up"));
    expect(mockNavigate).toHaveBeenCalledWith("/signup");
  });

  it("returns null when user is authenticated", () => {
    mockAuthStore.user = { id: "user-1" };

    const { container } = render(
      <MemoryRouter>
        <AuthButtons />
      </MemoryRouter>
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders buttons with correct variants", () => {
    render(
      <MemoryRouter>
        <AuthButtons />
      </MemoryRouter>
    );

    const loginButton = screen.getByText("Log In");
    const signupButton = screen.getByText("Sign Up");

    expect(loginButton).toHaveAttribute("data-variant", "ghost");
    expect(signupButton).toHaveAttribute("data-variant", "primary");
  });

  it("renders buttons with sm size", () => {
    render(
      <MemoryRouter>
        <AuthButtons />
      </MemoryRouter>
    );

    const loginButton = screen.getByText("Log In");
    const signupButton = screen.getByText("Sign Up");

    expect(loginButton).toHaveAttribute("data-size", "sm");
    expect(signupButton).toHaveAttribute("data-size", "sm");
  });
});
