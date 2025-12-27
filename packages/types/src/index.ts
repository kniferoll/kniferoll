export * from "./database";
import type { Database } from "./database";

// Database row types (use these when working with Supabase data)
export type DbKitchen = Database["public"]["Tables"]["kitchens"]["Row"];
export type DbStation = Database["public"]["Tables"]["stations"]["Row"];
export type DbPrepItem = Database["public"]["Tables"]["prep_items"]["Row"];
export type DbSessionUser =
  Database["public"]["Tables"]["session_users"]["Row"];
export type DbKitchenUnit =
  Database["public"]["Tables"]["kitchen_units"]["Row"];
export type DbKitchenItemSuggestion =
  Database["public"]["Tables"]["kitchen_item_suggestions"]["Row"];
export type DbUserSuggestionDismissal =
  Database["public"]["Tables"]["user_suggestion_dismissals"]["Row"];

// Prep item status enum
export type PrepStatus = "pending" | "partial" | "complete";

// App-specific types
export interface ShiftConfig {
  name: string;
  start_time?: string;
  end_time?: string;
}

export interface QuantityParsed {
  amount: number;
  container?: string;
  unit?: string;
  item: string;
  prep_style?: string;
}

// Re-export types that match database structure for convenience
export type Kitchen = DbKitchen;
export type Station = DbStation;
export type PrepItem = DbPrepItem;

export interface SessionUser {
  id: string;
  kitchen_id: string;
  name: string;
  station_id?: string;
  device_token: string;
  last_active: string;
}

// Prep entry system types
export type KitchenUnit = DbKitchenUnit;

export interface Suggestion extends DbKitchenItemSuggestion {
  dismissed?: boolean; // Client-side flag for current session
}

export interface RecencyScoredSuggestion extends Suggestion {
  recencyScore: number;
  weightedScore: number;
}

export interface PrepItemFormData {
  description: string;
  unitId: string | null;
  quantity: number | null;
}
