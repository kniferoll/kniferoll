import { create } from "zustand";
import { supabase, getDeviceToken } from "../lib/supabase";
import type {
  DbKitchenUnit,
  DbPrepItem,
  RecencyScoredSuggestion,
} from "@kniferoll/types";
import { rankSuggestions } from "../lib/suggestionUtils";

/**
 * Compute which suggestions should be displayed (top N that aren't dismissed or duplicates)
 */
function getDisplayedSuggestions(
  allRanked: RecencyScoredSuggestion[],
  dismissedIds: Set<string>,
  currentItems: DbPrepItem[] = [],
  topN: number = 3
): RecencyScoredSuggestion[] {
  return allRanked
    .filter((s) => !dismissedIds.has(s.id))
    .filter(
      (s) =>
        !currentItems.some(
          (item) =>
            item.description.toLowerCase().trim() ===
            s.description.toLowerCase().trim()
        )
    )
    .slice(0, topN);
}

interface PrepEntryState {
  // Suggestions and units
  suggestions: RecencyScoredSuggestion[];
  allRankedSuggestions: RecencyScoredSuggestion[]; // Keep all ranked suggestions to fill gaps when dismissing
  currentItems: DbPrepItem[]; // Current items in the view for filtering suggestions
  quickUnits: DbKitchenUnit[];
  allUnits: DbKitchenUnit[];
  dismissedSuggestionIds: Set<string>;

  // Loading states
  suggestionsLoading: boolean;
  unitsLoading: boolean;
  addingItem: boolean;
  error: string | null;

  // Actions
  loadSuggestionsAndUnits: (
    kitchenId: string,
    stationId?: string,
    shiftDate?: string,
    shiftName?: string
  ) => Promise<void>;
  dismissSuggestionPersistent: (
    suggestionId: string,
    stationId: string,
    shiftDate: string,
    shiftName: string,
    userId: string
  ) => Promise<void>;
  addItemWithUpdates: (
    kitchenId: string,
    stationId: string,
    shiftDate: string,
    shiftName: string,
    description: string,
    unitId: string | null,
    quantity: number | null,
    userId: string
  ) => Promise<{ error?: string }>;
  dismissSuggestion: (suggestionId: string) => void;
  clearDismissals: () => void;
}

export const usePrepEntryStore = create<PrepEntryState>((set, get) => ({
  suggestions: [],
  allRankedSuggestions: [],
  currentItems: [],
  quickUnits: [],
  allUnits: [],
  dismissedSuggestionIds: new Set(),
  suggestionsLoading: false,
  unitsLoading: false,
  addingItem: false,
  error: null,

  loadSuggestionsAndUnits: async (
    kitchenId,
    stationId?,
    shiftDate?,
    shiftName?
  ) => {
    set({ suggestionsLoading: true, unitsLoading: true, error: null });

    try {
      // Fetch suggestions and units
      const suggestionsPromise = supabase
        .from("kitchen_item_suggestions")
        .select("*")
        .eq("kitchen_id", kitchenId)
        .order("use_count", { ascending: false })
        .limit(20);

      const unitsPromise = supabase
        .from("kitchen_units")
        .select("*")
        .eq("kitchen_id", kitchenId)
        .order("use_count", { ascending: false });

      // If context is provided, also fetch current items and dismissed suggestions
      const currentItemsPromise =
        stationId && shiftDate && shiftName
          ? supabase
              .from("prep_items")
              .select("*")
              .eq("station_id", stationId)
              .eq("shift_date", shiftDate)
              .eq("shift_name", shiftName)
          : null;

      const dismissedSuggestionsPromise =
        stationId && shiftDate && shiftName
          ? supabase
              .from("station_shift_dismissed_suggestions")
              .select("suggestion_id")
              .eq("station_id", stationId)
              .eq("shift_date", shiftDate)
              .eq("shift_name", shiftName)
          : null;

      const [
        suggestionsResponse,
        unitsResponse,
        currentItemsResponse,
        dismissedResponse,
      ] = await Promise.all([
        suggestionsPromise,
        unitsPromise,
        currentItemsPromise,
        dismissedSuggestionsPromise,
      ]);

      if (suggestionsResponse.error) {
        set({
          suggestionsLoading: false,
          error: suggestionsResponse.error.message,
        });
      } else {
        const allSuggestions = suggestionsResponse.data || [];
        const currentItems = currentItemsResponse?.data || [];

        // Load dismissed suggestions from database
        const dismissedIds = new Set<string>(
          dismissedResponse?.data?.map((d) => d.suggestion_id) || []
        );

        // Rank all suggestions (don't filter out dismissed yet, and get all of them)
        const allRanked = rankSuggestions(
          allSuggestions,
          new Set(), // Don't filter dismissed here
          currentItems,
          null // Get all ranked suggestions, not just top N
        );

        // Compute which ones to display based on dismissed suggestions from database
        const displayed = getDisplayedSuggestions(
          allRanked,
          dismissedIds,
          currentItems
        );

        set({
          allRankedSuggestions: allRanked,
          currentItems,
          suggestions: displayed,
          dismissedSuggestionIds: dismissedIds,
          suggestionsLoading: false,
        });
      }

      if (unitsResponse.error) {
        set({ unitsLoading: false, error: unitsResponse.error.message });
      } else {
        const units = unitsResponse.data || [];
        set({
          allUnits: units,
          quickUnits: units.slice(0, 5),
          unitsLoading: false,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      set({
        suggestionsLoading: false,
        unitsLoading: false,
        error: message,
      });
    }
  },

  addItemWithUpdates: async (
    kitchenId,
    stationId,
    shiftDate,
    shiftName,
    description,
    unitId,
    quantity,
    userId
  ) => {
    set({ addingItem: true, error: null });

    try {
      const deviceToken = getDeviceToken();

      // Step 1: Insert prep item
      const unit = unitId ? get().allUnits.find((u) => u.id === unitId) : null;

      const { data: newPrepItem, error: prepError } = await supabase
        .from("prep_items")
        .insert({
          station_id: stationId,
          shift_date: shiftDate,
          shift_name: shiftName,
          description,
          unit_id: unitId || null,
          quantity: quantity || null,
          quantity_raw: formatQuantityRaw(quantity, unit?.name),
          created_by: userId || deviceToken,
        })
        .select()
        .single();

      if (prepError) {
        set({ addingItem: false, error: prepError.message });
        return { error: prepError.message };
      }

      // Add the new item to prepStore immediately
      if (newPrepItem) {
        const { usePrepStore } = await import("./prepStore");
        const currentItems = usePrepStore.getState().prepItems;
        // Only add if viewing the same station/date/shift
        const isCurrentView =
          currentItems.length === 0 ||
          currentItems.some(
            (item) =>
              item.station_id === stationId &&
              item.shift_date === shiftDate &&
              item.shift_name === shiftName
          );
        if (isCurrentView) {
          usePrepStore.setState({
            prepItems: [...currentItems, newPrepItem],
          });
        }
      }

      // Step 2: Upsert suggestion (increment count, update last_used)
      const normalizedDesc = description.trim();

      // First, try to find existing suggestion
      const { data: existingSuggestion } = await supabase
        .from("kitchen_item_suggestions")
        .select("id, use_count")
        .eq("kitchen_id", kitchenId)
        .ilike("description", normalizedDesc)
        .single();

      if (existingSuggestion) {
        // Update existing
        const { error: updateError } = await supabase
          .from("kitchen_item_suggestions")
          .update({
            use_count: (existingSuggestion.use_count || 1) + 1,
            default_unit_id: unitId || null,
            last_used: new Date().toISOString(),
            last_quantity_used: quantity || null,
          })
          .eq("id", existingSuggestion.id);

        if (updateError) {
          console.warn("Error updating suggestion:", updateError);
        }
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from("kitchen_item_suggestions")
          .insert({
            kitchen_id: kitchenId,
            description: normalizedDesc,
            default_unit_id: unitId || null,
            use_count: 1,
            last_used: new Date().toISOString(),
            last_quantity_used: quantity || null,
          });

        if (insertError) {
          console.warn("Error inserting suggestion:", insertError);
        }
      }

      // Step 3: Increment unit usage if unit selected
      if (unitId) {
        const currentUnit = get().allUnits.find((u) => u.id === unitId);
        if (currentUnit) {
          const { error: unitError } = await supabase
            .from("kitchen_units")
            .update({
              use_count: (currentUnit.use_count || 0) + 1,
              last_used: new Date().toISOString(),
            })
            .eq("id", unitId);

          if (unitError) {
            console.warn("Error updating unit usage:", unitError);
            // Don't fail the entire operation if unit update fails
          }
        }
      }

      // Refresh suggestions and units from database with context so filtering works
      await get().loadSuggestionsAndUnits(
        kitchenId,
        stationId,
        shiftDate,
        shiftName
      );

      set({ addingItem: false });
      return {};
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      set({ addingItem: false, error: message });
      return { error: message };
    }
  },

  dismissSuggestion: (suggestionId) => {
    set((state) => {
      const newDismissed = new Set(state.dismissedSuggestionIds);
      newDismissed.add(suggestionId);

      // Re-compute displayed suggestions with the new dismissed set
      const displayed = getDisplayedSuggestions(
        state.allRankedSuggestions,
        newDismissed,
        state.currentItems
      );

      return {
        dismissedSuggestionIds: newDismissed,
        suggestions: displayed,
      };
    });
  },

  dismissSuggestionPersistent: async (
    suggestionId,
    stationId,
    shiftDate,
    shiftName,
    userId
  ) => {
    // First update local state immediately for responsive UI
    get().dismissSuggestion(suggestionId);

    // Then persist to database
    try {
      const deviceToken = getDeviceToken();
      await supabase.from("station_shift_dismissed_suggestions").insert({
        station_id: stationId,
        shift_date: shiftDate,
        shift_name: shiftName,
        suggestion_id: suggestionId,
        dismissed_by: userId || deviceToken,
      });
    } catch (err) {
      console.warn("Error persisting dismissal:", err);
      // Don't revert the UI - dismissal still applies locally
    }
  },

  clearDismissals: () => {
    set({ dismissedSuggestionIds: new Set() });
  },
}));

/**
 * Format quantity_raw string from quantity and unit name
 * Examples:
 * - quantity: 2, unitName: "shallow 9" -> "2 shallow 9"
 * - quantity: null, unitName: "cambro" -> "cambro"
 * - quantity: 2, unitName: null -> "2"
 */
function formatQuantityRaw(
  quantity: number | null,
  unitName: string | null | undefined
): string {
  if (quantity && unitName) {
    return `${quantity} ${unitName}`;
  }
  if (unitName) {
    return unitName;
  }
  if (quantity) {
    return quantity.toString();
  }
  return "";
}
