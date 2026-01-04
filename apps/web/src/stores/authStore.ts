import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase, setSentryUser } from "@/lib";
import type { User, Session, AuthError } from "@supabase/supabase-js";

/**
 * Transforms Supabase auth errors into user-friendly messages.
 * Avoids exposing technical details while providing actionable feedback.
 */
function getAuthErrorMessage(error: AuthError | null, context: "signup" | "password"): string | undefined {
  if (!error) return undefined;

  const message = error.message.toLowerCase();

  // Signup-specific errors
  if (context === "signup") {
    if (message.includes("user already registered") || message.includes("already registered")) {
      return "An account with this email already exists. Try signing in instead.";
    }
    if (message.includes("password") && message.includes("weak")) {
      return "Password is too weak. Please use a stronger password.";
    }
    if (message.includes("email") && message.includes("invalid")) {
      return "Please enter a valid email address.";
    }
  }

  // Password update errors
  if (context === "password") {
    if (message.includes("same password") || message.includes("different from the old password")) {
      return "New password must be different from your current password.";
    }
    if (message.includes("weak")) {
      return "Password is too weak. Please use a stronger password.";
    }
  }

  // Rate limiting (applies to all contexts)
  if (message.includes("rate limit") || message.includes("too many requests")) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  // Generic fallback
  return "Something went wrong. Please try again.";
}

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ error?: string }>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: true,
      initialized: false,

      initialize: async () => {
        if (get().initialized) return;

        const {
          data: { session },
        } = await supabase.auth.getSession();
        set({
          session,
          user: session?.user ?? null,
          loading: false,
          initialized: true,
        });
        setSentryUser(session?.user?.id ?? null);

        supabase.auth.onAuthStateChange((_event, session) => {
          set({ session, user: session?.user ?? null });
          setSentryUser(session?.user?.id ?? null);
        });
      },

      signIn: async (email, password) => {
        set({ loading: true });
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (data.session) {
          set({
            session: data.session,
            user: data.session.user,
            loading: false,
          });
        } else {
          set({ loading: false });
        }
        // Return generic error message for security - don't reveal if email exists
        return { error: error ? "Invalid email or password" : undefined };
      },

      signUp: async (email, password, name) => {
        set({ loading: true });
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
          },
        });
        if (data.session) {
          set({
            session: data.session,
            user: data.session.user,
            loading: false,
          });
        } else {
          set({ loading: false });
        }
        return { error: getAuthErrorMessage(error, "signup") };
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, session: null });
      },

      resetPasswordForEmail: async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        return { error: error?.message };
      },

      updatePassword: async (newPassword) => {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        return { error: getAuthErrorMessage(error, "password") };
      },

      refreshUser: async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          set({ user });
        }
      },
    }),
    {
      name: "kniferoll-auth",
      partialize: (state) => ({ user: state.user }),
    }
  )
);
