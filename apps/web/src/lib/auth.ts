import { supabase } from "./supabase";
import { ensureUserProfile } from "./entitlements";
import type { UserProfile } from "@kniferoll/types";

/**
 * Get current authenticated user session
 */
export async function getCurrentSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("Error getting session:", error);
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
    console.error("Error getting current user:", error);
    return null;
  }

  return user;
}

/**
 * Get or create anonymous user for device
 */
export async function getOrCreateAnonymousUser(deviceToken: string) {
  // Try to find existing anonymous user
  const { data: existing, error: fetchError } = await supabase
    .from("anonymous_users")
    .select("*")
    .eq("device_token", deviceToken)
    .single();

  if (!fetchError && existing) {
    // Update last_active_at
    await supabase
      .from("anonymous_users")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", existing.id);

    return existing;
  }

  // Create new anonymous user
  const { data: newUser, error: createError } = await supabase
    .from("anonymous_users")
    .insert({
      device_token: deviceToken,
      display_name: `Guest ${Math.random().toString(36).substring(7)}`,
    })
    .select()
    .single();

  if (createError) {
    console.error("Error creating anonymous user:", createError);
    return null;
  }

  return newUser;
}

/**
 * Sign up with email and password
 */
export async function signUp(
  email: string,
  password: string,
  displayName?: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error("Error signing up:", error);
    return { user: null, error };
  }

  // Create user profile
  if (data.user) {
    const profile = await ensureUserProfile(data.user.id);
    if (profile && displayName) {
      await supabase
        .from("user_profiles")
        .update({ display_name: displayName })
        .eq("id", data.user.id);
    }
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
    console.error("Error signing in:", error);
    return { user: null, error };
  }

  // Ensure profile exists
  if (data.user) {
    await ensureUserProfile(data.user.id);
  }

  return { user: data.user, error: null };
}

/**
 * Sign out current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error signing out:", error);
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
    console.error("Error fetching user profile:", error);
    return null;
  }

  return data;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
) {
  const { data, error } = await supabase
    .from("user_profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating user profile:", error);
    return { error };
  }

  return { data, error: null };
}

/**
 * Update anonymous user display name
 */
export async function updateAnonymousUserName(
  anonymousUserId: string,
  displayName: string
) {
  const { data, error } = await supabase
    .from("anonymous_users")
    .update({ display_name: displayName })
    .eq("id", anonymousUserId)
    .select()
    .single();

  if (error) {
    console.error("Error updating anonymous user:", error);
    return { error };
  }

  return { data, error: null };
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (user: any | null) => void) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      // Ensure profile exists for authenticated users
      await ensureUserProfile(session.user.id);
      callback(session.user);
    } else {
      callback(null);
    }
  });

  return subscription;
}
