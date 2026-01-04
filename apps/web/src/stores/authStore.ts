import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase, setSentryUser } from "@/lib";
import type { User, Session, AuthError } from "@supabase/supabase-js";

/**
 * Transforms Supabase auth errors into user-friendly messages.
 * Uses error codes from Supabase Auth API for reliable matching.
 * @see https://supabase.com/docs/guides/auth/debugging/error-codes
 */
function getAuthErrorMessage(error: AuthError | null, context: "signup" | "password"): string | undefined {
  if (!error) return undefined;

  const code = error.code;

  // Rate limiting (applies to all contexts)
  if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit") {
    return "Too many attempts. Please wait a moment and try again.";
  }

  // Signup-specific errors
  if (context === "signup") {
    if (code === "user_already_exists" || code === "email_exists") {
      return "An account with this email already exists. Try signing in instead.";
    }
    if (code === "weak_password") {
      return "Password is too weak. Please use a stronger password.";
    }
    if (code === "email_address_invalid" || code === "validation_failed") {
      return "Please enter a valid email address.";
    }
    if (code === "email_provider_disabled" || code === "signup_disabled") {
      return "Sign ups are currently disabled.";
    }
  }

  // Password update errors
  if (context === "password") {
    if (code === "same_password") {
      return "New password must be different from your current password.";
    }
    if (code === "weak_password") {
      return "Password is too weak. Please use a stronger password.";
    }
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
        console.log("[authStore] signIn called");
        set({ loading: true });
        try {
          console.log("[authStore] Calling supabase.auth.signInWithPassword...");
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          console.log("[authStore] Supabase response:", { data, error });
          set({ loading: false });

          if (error) {
            // Handle specific error codes from Supabase
            const code = error.code;
            console.log("[authStore] Error code:", code);
            if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit") {
              return { error: "Too many attempts. Please wait a moment and try again." };
            }
            // Generic message for security - don't reveal if email exists
            console.log("[authStore] Returning error: Invalid email or password");
            return { error: "Invalid email or password" };
          }

          if (data.session) {
            set({
              session: data.session,
              user: data.session.user,
            });
          }
          return { error: undefined };
        } catch (err) {
          console.error("[authStore] Caught exception:", err);
          set({ loading: false });
          return { error: "Invalid email or password" };
        }
      },

      signUp: async (email, password, name) => {
        set({ loading: true });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { name },
            },
          });
          set({ loading: false });

          if (error) {
            return { error: getAuthErrorMessage(error, "signup") };
          }

          if (data.session) {
            set({
              session: data.session,
              user: data.session.user,
            });
          }
          return { error: undefined };
        } catch {
          set({ loading: false });
          return { error: "Something went wrong. Please try again." };
        }
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
