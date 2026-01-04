import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase, setSentryUser } from "@/lib";
import type { User, Session } from "@supabase/supabase-js";

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
        return { error: error?.message };
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
        return { error: error?.message };
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
