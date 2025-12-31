import { describe, it, expect, vi, beforeEach } from "vitest";

// Create mocks using vi.hoisted so they're available when vi.mock runs
const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      signInAnonymously: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      updateUser: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onAuthStateChange: vi.fn((_callback: (event: string, session: unknown) => void) => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(),
  },
}));

vi.mock("@/lib/supabase", () => ({
  supabase: mockSupabase,
}));

// Import after mocking
import {
  getCurrentSession,
  getCurrentUser,
  isCurrentUserAnonymous,
  signInAnonymously,
  signUp,
  signIn,
  signOut,
  getCurrentUserProfile,
  updateUserProfile,
  updateUserDisplayName,
  onAuthStateChange,
} from "@/lib/auth";

describe("auth", () => {
  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    is_anonymous: false,
    user_metadata: { display_name: "Test User" },
  };

  const mockSession = {
    access_token: "token",
    user: mockUser,
  };

  const mockProfile = {
    id: "user-123",
    plan: "free" as const,
    stripe_customer_id: null,
    updated_at: "2024-01-01T00:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCurrentSession", () => {
    it("returns session on success", async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const result = await getCurrentSession();

      expect(result).toEqual(mockSession);
    });

    it("returns null on error", async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: "Session error" },
      });

      const result = await getCurrentSession();

      expect(result).toBeNull();
    });

    it("returns null when no session", async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await getCurrentSession();

      expect(result).toBeNull();
    });
  });

  describe("getCurrentUser", () => {
    it("returns user on success", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await getCurrentUser();

      expect(result).toEqual(mockUser);
    });

    it("returns null on error", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "User error" },
      });

      const result = await getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe("isCurrentUserAnonymous", () => {
    it("returns true for anonymous user", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { ...mockUser, is_anonymous: true } },
        error: null,
      });

      const result = await isCurrentUserAnonymous();

      expect(result).toBe(true);
    });

    it("returns false for regular user", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await isCurrentUserAnonymous();

      expect(result).toBe(false);
    });

    it("returns false when no user", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await isCurrentUserAnonymous();

      expect(result).toBe(false);
    });
  });

  describe("signInAnonymously", () => {
    it("returns user on success", async () => {
      const anonUser = { ...mockUser, is_anonymous: true };
      mockSupabase.auth.signInAnonymously.mockResolvedValue({
        data: { user: anonUser },
        error: null,
      });

      const result = await signInAnonymously();

      expect(result).toEqual({ user: anonUser, error: null });
    });

    it("returns error on failure", async () => {
      const error = { message: "Anonymous sign-in disabled" };
      mockSupabase.auth.signInAnonymously.mockResolvedValue({
        data: { user: null },
        error,
      });

      const result = await signInAnonymously();

      expect(result).toEqual({ user: null, error });
    });
  });

  describe("signUp", () => {
    it("signs up user with email and password", async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await signUp("test@example.com", "password123");

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        options: {
          data: { display_name: null },
        },
      });
      expect(result).toEqual({ user: mockUser, error: null });
    });

    it("includes display name when provided", async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      await signUp("test@example.com", "password123", "John Doe");

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        options: {
          data: { display_name: "John Doe" },
        },
      });
    });

    it("returns error on failure", async () => {
      const error = { message: "Email already registered" };
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error,
      });

      const result = await signUp("test@example.com", "password123");

      expect(result).toEqual({ user: null, error });
    });
  });

  describe("signIn", () => {
    it("signs in with email and password", async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await signIn("test@example.com", "password123");

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
      expect(result).toEqual({ user: mockUser, error: null });
    });

    it("returns error on invalid credentials", async () => {
      const error = { message: "Invalid login credentials" };
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error,
      });

      const result = await signIn("test@example.com", "wrongpassword");

      expect(result).toEqual({ user: null, error });
    });
  });

  describe("signOut", () => {
    it("signs out successfully", async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      const result = await signOut();

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      expect(result).toEqual({ error: null });
    });

    it("returns error on failure", async () => {
      const error = { message: "Sign out failed" };
      mockSupabase.auth.signOut.mockResolvedValue({ error });

      const result = await signOut();

      expect(result).toEqual({ error });
    });
  });

  describe("getCurrentUserProfile", () => {
    it("returns user profile when authenticated", async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const queryChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
      };
      mockSupabase.from.mockReturnValue(queryChain);

      const result = await getCurrentUserProfile();

      expect(mockSupabase.from).toHaveBeenCalledWith("user_profiles");
      expect(result).toEqual(mockProfile);
    });

    it("returns null when not authenticated", async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await getCurrentUserProfile();

      expect(result).toBeNull();
    });

    it("returns null on database error", async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const queryChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        }),
      };
      mockSupabase.from.mockReturnValue(queryChain);

      const result = await getCurrentUserProfile();

      expect(result).toBeNull();
    });
  });

  describe("updateUserProfile", () => {
    it("updates profile successfully", async () => {
      const updates = { plan: "pro" as const };
      const updatedProfile = { ...mockProfile, ...updates };

      const queryChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedProfile, error: null }),
      };
      mockSupabase.from.mockReturnValue(queryChain);

      const result = await updateUserProfile("user-123", updates);

      expect(mockSupabase.from).toHaveBeenCalledWith("user_profiles");
      expect(result).toEqual({ data: updatedProfile, error: null });
    });

    it("returns error on failure", async () => {
      const error = { message: "Update failed" };

      const queryChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error }),
      };
      mockSupabase.from.mockReturnValue(queryChain);

      const result = await updateUserProfile("user-123", {});

      expect(result).toEqual({ error });
    });
  });

  describe("updateUserDisplayName", () => {
    it("updates display name successfully", async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: { ...mockUser, user_metadata: { display_name: "New Name" } } },
        error: null,
      });

      const result = await updateUserDisplayName("New Name");

      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        data: { display_name: "New Name" },
      });
      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
    });

    it("returns error on failure", async () => {
      const error = { message: "Update failed" };
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: null,
        error,
      });

      const result = await updateUserDisplayName("New Name");

      expect(result).toEqual({ error });
    });
  });

  describe("onAuthStateChange", () => {
    it("subscribes to auth state changes", () => {
      const callback = vi.fn();
      const mockUnsubscribe = vi.fn();
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      });

      const subscription = onAuthStateChange(callback);

      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled();
      expect(subscription.unsubscribe).toBe(mockUnsubscribe);
    });

    it("calls callback with user from session", () => {
      let capturedCallback: (event: string, session: unknown) => void;
      mockSupabase.auth.onAuthStateChange.mockImplementation(
        (cb: (event: string, session: unknown) => void) => {
          capturedCallback = cb;
          return {
            data: { subscription: { unsubscribe: vi.fn() } },
          };
        }
      );

      const callback = vi.fn();
      onAuthStateChange(callback);

      // Simulate auth state change
      capturedCallback!("SIGNED_IN", mockSession);

      expect(callback).toHaveBeenCalledWith(mockUser);
    });

    it("calls callback with null when session is null", () => {
      let capturedCallback: (event: string, session: unknown) => void;
      mockSupabase.auth.onAuthStateChange.mockImplementation(
        (cb: (event: string, session: unknown) => void) => {
          capturedCallback = cb;
          return {
            data: { subscription: { unsubscribe: vi.fn() } },
          };
        }
      );

      const callback = vi.fn();
      onAuthStateChange(callback);

      // Simulate sign out
      capturedCallback!("SIGNED_OUT", null);

      expect(callback).toHaveBeenCalledWith(null);
    });
  });
});
