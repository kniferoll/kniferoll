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
      expect(state.loading).toBe(false);
    });

    it("returns error message on failure", async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: "Invalid credentials" },
      });

      const result = await useAuthStore.getState().signIn("test@example.com", "wrong");

      expect(result.error).toBe("Invalid credentials");
      expect(useAuthStore.getState().loading).toBe(false);
    });

    it("sets loading to true during sign in", async () => {
      mockSupabase.auth.signInWithPassword.mockImplementation(() => {
        expect(useAuthStore.getState().loading).toBe(true);
        return Promise.resolve({
          data: { session: mockSession, user: mockUser },
          error: null,
        });
      });

      await useAuthStore.getState().signIn("test@example.com", "password");
    });
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
      expect(state.loading).toBe(false);
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

    it("returns error message on failure", async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: "Email already registered" },
      });

      const result = await useAuthStore.getState().signUp("test@example.com", "password", "Test");

      expect(result.error).toBe("Email already registered");
      expect(useAuthStore.getState().loading).toBe(false);
    });

    it("handles signup without immediate session (email confirmation required)", async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { session: null, user: mockUser },
        error: null,
      });

      const result = await useAuthStore.getState().signUp("test@example.com", "password", "Test");

      expect(result.error).toBeUndefined();
      expect(useAuthStore.getState().loading).toBe(false);
    });
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
