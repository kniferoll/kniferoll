import { supabase } from "./supabase";
import type { Database } from "@kniferoll/types";

export type InviteCode = Database["public"]["Tables"]["invite_codes"]["Row"];
export type InviteCodeInsert =
  Database["public"]["Tables"]["invite_codes"]["Insert"];

/**
 * Generate a new invite code for a kitchen (chef only)
 * Defaults: 60 min expiry, 5 uses
 */
export async function generateChefInviteCode(
  kitchenId: string,
  options?: {
    expiryMinutes?: number;
    maxUses?: number;
  }
): Promise<{ code: string; expiresAt: string } | null> {
  const expiryMinutes = options?.expiryMinutes ?? 60;
  const maxUses = options?.maxUses ?? 5;

  const expiresAt = new Date(
    Date.now() + expiryMinutes * 60 * 1000
  ).toISOString();

  try {
    const { data, error } = await supabase.rpc("generate_invite_code");

    if (error) throw error;
    if (!data) throw new Error("Failed to generate code");

    const code = (data as string).toUpperCase();

    const { error: insertError } = await supabase.from("invite_codes").insert({
      kitchen_id: kitchenId,
      code,
      expires_at: expiresAt,
      max_uses: maxUses,
      created_by: null, // null indicates chef created it
    });

    if (insertError) throw insertError;

    return { code, expiresAt };
  } catch (error) {
    console.error("Error generating chef invite code:", error);
    return null;
  }
}

/**
 * Generate a limited invite code for a cook
 * Defaults: 30 min expiry, 2 uses
 */
export async function generateCookInviteCode(
  kitchenId: string,
  cookSessionUserId: string,
  options?: {
    expiryMinutes?: number;
    maxUses?: number;
  }
): Promise<{ code: string; expiresAt: string } | null> {
  const expiryMinutes = options?.expiryMinutes ?? 30;
  const maxUses = options?.maxUses ?? 2;

  const expiresAt = new Date(
    Date.now() + expiryMinutes * 60 * 1000
  ).toISOString();

  try {
    const { data, error } = await supabase.rpc("generate_invite_code");

    if (error) throw error;
    if (!data) throw new Error("Failed to generate code");

    const code = (data as string).toUpperCase();

    const { error: insertError } = await supabase.from("invite_codes").insert({
      kitchen_id: kitchenId,
      code,
      expires_at: expiresAt,
      max_uses: maxUses,
      created_by: cookSessionUserId,
    });

    if (insertError) throw insertError;

    return { code, expiresAt };
  } catch (error) {
    console.error("Error generating cook invite code:", error);
    return null;
  }
}

/**
 * Find kitchen by invite code (for joining)
 */
export async function findKitchenByInviteCode(
  code: string
): Promise<{ kitchenId: string; kitchenName: string } | null> {
  try {
    // First, get the invite code details
    const { data: codeData, error: codeError } = await supabase
      .from("invite_codes")
      .select("kitchen_id, is_active, expires_at")
      .eq("code", code.toUpperCase())
      .single();

    if (codeError) {
      console.error("Error finding invite code:", codeError);
      return null;
    }

    if (!codeData) {
      console.error("Invite code not found");
      return null;
    }

    // Check if code is active and not expired
    if (!codeData.is_active) {
      console.error("Invite code is not active");
      return null;
    }

    if (new Date(codeData.expires_at) <= new Date()) {
      console.error("Invite code is expired");
      return null;
    }

    // Now get the kitchen details
    const { data: kitchenData, error: kitchenError } = await supabase
      .from("kitchens")
      .select("id, name")
      .eq("id", codeData.kitchen_id)
      .single();

    if (kitchenError || !kitchenData) {
      console.error("Error finding kitchen:", kitchenError);
      return null;
    }

    return {
      kitchenId: kitchenData.id,
      kitchenName: kitchenData.name,
    };
  } catch (error) {
    console.error("Error finding kitchen by invite code:", error);
    return null;
  }
}

/**
 * Validate and use an invite code
 * Returns true if valid and use count incremented, false otherwise
 */
export async function validateAndUseInviteCode(
  code: string,
  kitchenId: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc("validate_and_use_invite_code", {
      p_code: code,
      p_kitchen_id: kitchenId,
    });

    if (error) {
      console.error("RPC error:", error);
      throw error;
    }
    if (!data || data.length === 0)
      throw new Error("No response from validation");

    const result = data[0] as any;
    return {
      valid: result.valid,
      error: result.error_message || undefined,
    };
  } catch (error) {
    console.error("Error validating invite code:", error);
    return {
      valid: false,
      error: "Failed to validate code",
    };
  }
}

/**
 * Get active invite codes for a kitchen (chef view)
 */
export async function getActiveInviteCodesForKitchen(
  kitchenId: string
): Promise<InviteCode[]> {
  try {
    const { data, error } = await supabase
      .from("invite_codes")
      .select("*")
      .eq("kitchen_id", kitchenId)
      .eq("is_active", true)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching active invite codes:", error);
    return [];
  }
}

/**
 * Get all invite codes created by a specific cook
 */
export async function getCookInviteCodes(
  kitchenId: string,
  cookSessionUserId: string
): Promise<InviteCode[]> {
  try {
    const { data, error } = await supabase
      .from("invite_codes")
      .select("*")
      .eq("kitchen_id", kitchenId)
      .eq("created_by", cookSessionUserId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching cook invite codes:", error);
    return [];
  }
}

/**
 * Deactivate an invite code
 */
export async function deactivateInviteCode(codeId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("invite_codes")
      .update({ is_active: false })
      .eq("id", codeId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deactivating invite code:", error);
    return false;
  }
}

/**
 * Delete an invite code
 */
export async function deleteInviteCode(codeId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("invite_codes")
      .delete()
      .eq("id", codeId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting invite code:", error);
    return false;
  }
}

/**
 * Format remaining time for display
 */
export function formatTimeRemaining(expiresAt: string): string {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry.getTime() - now.getTime();

  if (diffMs <= 0) return "Expired";

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
  if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`;
  return `${diffMins}m`;
}

/**
 * Check if an invite code is expired
 */
export function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) <= new Date();
}

/**
 * Check if an invite code has reached its use limit
 */
export function isAtLimit(code: InviteCode): boolean {
  return code.current_uses >= code.max_uses;
}

/**
 * Get remaining uses for an invite code
 */
export function getRemainingUses(code: InviteCode): number {
  return Math.max(0, code.max_uses - code.current_uses);
}
