import { describe, it, expect, vi, beforeEach } from "vitest";

// Create mocks using vi.hoisted so they're available when vi.mock runs
const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: {
    auth: {
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

vi.mock("@/lib/supabase", () => ({
  supabase: mockSupabase,
}));

vi.mock("@/lib/sentry", () => ({
  setSentryUser: vi.fn(),
}));

vi.mock("@/lib", () => ({
  supabase: mockSupabase,
  setSentryUser: vi.fn(),
}));

// Import after mocking
import { useAuthStore } from "@/stores/authStore";

describe("authStore", () => {
  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    user_metadata: { name: "Test User" },
  };

  const mockSession = {
    access_token: "token",
    user: mockUser,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the store state
    useAuthStore.setState({
      user: null,
      session: null,
      loading: true,
      initialized: false,
    });
  });

  describe("initial state", () => {
    it("has correct initial values", () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.loading).toBe(true);
      expect(state.initialized).toBe(false);
    });
  });

  describe("initialize", () => {
    it("fetches session and sets user on success", async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.session).toEqual(mockSession);
      expect(state.user).toEqual(mockUser);
      expect(state.loading).toBe(false);
      expect(state.initialized).toBe(true);
    });

    it("sets null user when no session", async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.session).toBeNull();
      expect(state.user).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.initialized).toBe(true);
    });

    it("does not re-initialize if already initialized", async () => {
      useAuthStore.setState({ initialized: true });

      await useAuthStore.getState().initialize();

      expect(mockSupabase.auth.getSession).not.toHaveBeenCalled();
    });

    it("sets up auth state change listener", async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await useAuthStore.getState().initialize();

      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled();
    });
  });

  describe("signIn", () => {
    it("signs in user and sets session on success", async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: mockSession, user: mockUser },
        error: null,
      });

      const result = await useAuthStore.getState().signIn("test@example.com", "password");

      expect(result.error).toBeUndefined();
      const state = useAuthStore.getState();
      expect(state.session).toEqual(mockSession);
      expect(state.user).toEqual(mockUser);
    });

    it("returns generic error message on failure for security", async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: "Invalid credentials" },
      });

      const result = await useAuthStore.getState().signIn("test@example.com", "wrong");

      // Generic message hides whether email exists (security best practice)
      expect(result.error).toBe("Invalid email or password");
    });

    // Note: signIn no longer sets loading to avoid unmounting routes in App.tsx
    // The Login component uses its own isSubmitting state for UI feedback
  });

  describe("signUp", () => {
    it("signs up user and sets session on success", async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { session: mockSession, user: mockUser },
        error: null,
      });

      const result = await useAuthStore.getState().signUp("test@example.com", "password", "Test User");

      expect(result.error).toBeUndefined();
      const state = useAuthStore.getState();
      expect(state.session).toEqual(mockSession);
      expect(state.user).toEqual(mockUser);
    });

    it("passes name in user metadata", async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { session: mockSession, user: mockUser },
        error: null,
      });

      await useAuthStore.getState().signUp("test@example.com", "password", "Test User");

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password",
        options: {
          data: { name: "Test User" },
        },
      });
    });

    it("returns user-friendly error message on failure", async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { session: null, user: null },
        error: { code: "user_already_exists", message: "User already registered" },
      });

      const result = await useAuthStore.getState().signUp("test@example.com", "password", "Test");

      expect(result.error).toBe("An account with this email already exists. Try signing in instead.");
    });

    it("handles signup without immediate session (email confirmation required)", async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { session: null, user: mockUser },
        error: null,
      });

      const result = await useAuthStore.getState().signUp("test@example.com", "password", "Test");

      expect(result.error).toBeUndefined();
    });

    // Note: signUp no longer sets loading to avoid unmounting routes in App.tsx
    // The Signup component uses its own isSubmitting state for UI feedback
  });

  describe("signOut", () => {
    it("clears user and session on sign out", async () => {
      // Set initial authenticated state
      useAuthStore.setState({
        user: mockUser as never,
        session: mockSession as never,
      });

      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      await useAuthStore.getState().signOut();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
    });

    it("calls supabase signOut", async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      await useAuthStore.getState().signOut();

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });
  });
});
