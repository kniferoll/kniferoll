export * from "./database";
import type { Database } from "./database";

// ============================================================================
// DATABASE ROW TYPES
// ============================================================================

export type DbUserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];
export type DbKitchen = Database["public"]["Tables"]["kitchens"]["Row"];
export type DbKitchenMember = Database["public"]["Tables"]["kitchen_members"]["Row"];
export type DbStation = Database["public"]["Tables"]["stations"]["Row"];
export type DbPrepItem = Database["public"]["Tables"]["prep_items"]["Row"];
export type DbInviteLink = Database["public"]["Tables"]["invite_links"]["Row"];
export type DbKitchenUnit = Database["public"]["Tables"]["kitchen_units"]["Row"];
export type DbKitchenItem = Database["public"]["Tables"]["kitchen_items"]["Row"];
export type DbPrepItemSuggestion = Database["public"]["Tables"]["prep_item_suggestions"]["Row"];
export type DbKitchenShift = Database["public"]["Tables"]["kitchen_shifts"]["Row"];
export type DbKitchenShiftDay = Database["public"]["Tables"]["kitchen_shift_days"]["Row"];

// ============================================================================
// ENUMS
// ============================================================================

export type UserPlan = Database["public"]["Enums"]["user_plan"];
export type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"];
export type MemberRole = Database["public"]["Enums"]["member_role"];
export type PrepStatus = Database["public"]["Enums"]["prep_status"];

// ============================================================================
// CONVENIENCE ALIASES
// ============================================================================

export type UserProfile = DbUserProfile;
export type Kitchen = DbKitchen;
export type KitchenMember = DbKitchenMember;
export type Station = DbStation;
export type PrepItem = DbPrepItem;
export type InviteLink = DbInviteLink;
export type KitchenUnit = DbKitchenUnit;
export type KitchenItem = DbKitchenItem;
export type PrepItemSuggestion = DbPrepItemSuggestion;
export type KitchenShift = DbKitchenShift;
export type KitchenShiftDay = DbKitchenShiftDay;

// ============================================================================
// APP-SPECIFIC TYPES
// ============================================================================

export interface PrepItemFormData {
  description: string;
  unitId: string | null;
  quantity: number | null;
}

export interface Suggestion extends DbPrepItemSuggestion {
  dismissed?: boolean; // Client-side flag for current session
  description?: string; // From kitchen_items.name join
}

export interface RecencyScoredSuggestion extends Suggestion {
  recencyScore: number;
  weightedScore: number;
}

// ============================================================================
// ENTITLEMENT TYPES
// ============================================================================

export interface UserLimits {
  maxKitchens: number;
  maxStationsPerKitchen: number;
  canInviteAsOwner: boolean;
}
