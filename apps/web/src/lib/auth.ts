import { supabase } from "./supabase";
import { captureError } from "./sentry";
import type { UserProfile } from "@kniferoll/types";
import type { User } from "@supabase/supabase-js";

/**
 * Get current authenticated user session
 */
export async function getCurrentSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    captureError(error, { context: "getCurrentSession" });
    return null;
  }

  return session;
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    captureError(error, { context: "getCurrentUser" });
    return null;
  }

  return user;
}

/**
 * Check if current user is anonymous
 */
export async function isCurrentUserAnonymous(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.is_anonymous ?? false;
}

/**
 * Sign in anonymously
 * Creates a temporary user that can be converted to permanent later
 */
export async function signInAnonymously() {
  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    captureError(error, { context: "signInAnonymously" });
    return { user: null, error };
  }

  return { user: data.user, error: null };
}

/**
 * Sign up with email and password
 * Note: user_profiles table is auto-created via trigger on auth.users insert
 */
export async function signUp(email: string, password: string, displayName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName || null,
      },
    },
  });

  if (error) {
    captureError(error, { context: "signUp" });
    return { user: null, error };
  }

  return { user: data.user, error: null };
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    captureError(error, { context: "signIn" });
    return { user: null, error };
  }

  return { user: data.user, error: null };
}

/**
 * Sign out current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    captureError(error, { context: "signOut" });
    return { error };
  }

  return { error: null };
}

/**
 * Get current user's profile
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const session = await getCurrentSession();
  if (!session?.user) return null;

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (error) {
    captureError(error, { context: "getCurrentUserProfile" });
    return null;
  }

  return data;
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  const { data, error } = await supabase
    .from("user_profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    captureError(error, { context: "updateUserProfile", userId });
    return { error };
  }

  return { data, error: null };
}

/**
 * Update user display name (stored in auth.users.raw_user_meta_data)
 */
export async function updateUserDisplayName(displayName: string) {
  const { data, error } = await supabase.auth.updateUser({
    data: { display_name: displayName },
  });

  if (error) {
    captureError(error, { context: "updateUserDisplayName" });
    return { error };
  }

  return { data, error: null };
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });

  return subscription;
}
