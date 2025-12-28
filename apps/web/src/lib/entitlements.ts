import { supabase } from "./supabase";
import type { Database } from "@kniferoll/types";

type UserPlan = Database["public"]["Enums"]["user_plan"];

/**
 * Get plan limits for a given user plan tier
 */
export function getUserLimits(plan: UserPlan) {
  return {
    maxKitchens: plan === "pro" ? 5 : 1,
    maxStationsPerKitchen: plan === "pro" ? Infinity : 1,
    canInviteAsOwner: plan === "pro",
  };
}

/**
 * Get the user's profile and plan
 */
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return null;
  }
  return data;
}

/**
 * Get count of kitchens owned by user
 */
export async function getOwnedKitchenCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("kitchens")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", userId);

  if (error) {
    console.error("Error fetching kitchen count:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Check if user can create a new kitchen
 */
export async function canCreateKitchen(userId: string): Promise<boolean> {
  const profile = await getUserProfile(userId);
  if (!profile) return false;

  const kitchenCount = await getOwnedKitchenCount(userId);
  const limits = getUserLimits(profile.plan);

  return kitchenCount < limits.maxKitchens;
}

/**
 * Get count of stations in a kitchen
 */
export async function getStationCount(kitchenId: string): Promise<number> {
  const { count, error } = await supabase
    .from("stations")
    .select("*", { count: "exact", head: true })
    .eq("kitchen_id", kitchenId);

  if (error) {
    console.error("Error fetching station count:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Check if user can create a new station in a kitchen
 */
export async function canCreateStation(
  userId: string,
  kitchenId: string
): Promise<boolean> {
  // Get the kitchen to verify ownership
  const { data: kitchen, error: kitchenError } = await supabase
    .from("kitchens")
    .select("owner_id")
    .eq("id", kitchenId)
    .single();

  if (kitchenError || !kitchen) {
    console.error("Error fetching kitchen:", kitchenError);
    return false;
  }

  // Only owner can create stations
  if (kitchen.owner_id !== userId) {
    return false;
  }

  // Check plan limits
  const profile = await getUserProfile(userId);
  if (!profile) return false;

  const stationCount = await getStationCount(kitchenId);
  const limits = getUserLimits(profile.plan);

  return stationCount < limits.maxStationsPerKitchen;
}

/**
 * Get membership record for user in kitchen
 */
export async function getMembership(userId: string, kitchenId: string) {
  const { data, error } = await supabase
    .from("kitchen_members")
    .select("*")
    .eq("kitchen_id", kitchenId)
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching membership:", error);
    return null;
  }

  return data;
}

/**
 * Check if user can generate invite links for a kitchen
 */
export async function canGenerateInvite(
  userId: string,
  kitchenId: string
): Promise<boolean> {
  const membership = await getMembership(userId, kitchenId);
  if (!membership) return false;

  // Owner or members with can_invite permission can generate invites
  return membership.can_invite || membership.role === "owner";
}

/**
 * Note: User profiles are now auto-created via trigger on auth.users insert
 * This function is kept for reference but should not be called directly
 *
 * The trigger `on_auth_user_created` automatically creates a user_profiles
 * entry with plan='free' whenever a new user signs up.
 */
