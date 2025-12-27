import { create } from "zustand";
import { supabase } from "../lib/supabase";
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
  masterSuggestions: RecencyScoredSuggestion[]; // All suggestions without currentItems filter for autocomplete
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
    userId: string,
    isAnonymous?: boolean
  ) => Promise<{ error?: string }>;
  dismissSuggestion: (suggestionId: string) => void;
  clearDismissals: () => void;
}

export const usePrepEntryStore = create<PrepEntryState>((set, get) => ({
  suggestions: [],
  allRankedSuggestions: [],
  masterSuggestions: [],
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

      const [suggestionsResponse, unitsResponse, currentItemsResponse] =
        await Promise.all([
          suggestionsPromise,
          unitsPromise,
          currentItemsPromise,
        ]);

      if (suggestionsResponse.error) {
        set({
          suggestionsLoading: false,
          error: suggestionsResponse.error.message,
        });
      } else {
        const allSuggestions = suggestionsResponse.data || [];
        const currentItems = currentItemsResponse?.data || [];

        // Create master list (no currentItems filter) for autocomplete
        const masterRanked = rankSuggestions(
          allSuggestions,
          new Set(),
          [],
          null
        );

        // Rank all suggestions
        const allRanked = rankSuggestions(
          allSuggestions,
          new Set(),
          currentItems,
          null
        );

        // Use local dismissed set (not database)
        const displayed = getDisplayedSuggestions(
          allRanked,
          get().dismissedSuggestionIds,
          currentItems
        );

        set({
          masterSuggestions: masterRanked,
          allRankedSuggestions: allRanked,
          currentItems,
          suggestions: displayed,
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
    userId,
    isAnonymous = false
  ) => {
    set({ addingItem: true, error: null });

    try {
      // Step 1: Insert prep item
      const { data: newPrepItem, error: prepError } = await supabase
        .from("prep_items")
        .insert({
          station_id: stationId,
          shift_date: shiftDate,
          shift_name: shiftName,
          description,
          unit_id: unitId || null,
          quantity: quantity || null,
          quantity_raw: formatQuantityRaw(
            quantity,
            unitId ? get().allUnits.find((u) => u.id === unitId)?.name : null
          ),
          created_by_user: !isAnonymous ? (userId as any) : null,
          created_by_anon: isAnonymous ? (userId as any) : null,
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

      const { data: existingSuggestion } = await supabase
        .from("kitchen_item_suggestions")
        .select("id, use_count")
        .eq("kitchen_id", kitchenId)
        .ilike("description", normalizedDesc)
        .maybeSingle();

      if (existingSuggestion) {
        await supabase
          .from("kitchen_item_suggestions")
          .update({
            use_count: (existingSuggestion.use_count || 1) + 1,
            default_unit_id: unitId || null,
            last_used: new Date().toISOString(),
            last_quantity_used: quantity || null,
          })
          .eq("id", existingSuggestion.id);
      } else {
        await supabase.from("kitchen_item_suggestions").insert({
          kitchen_id: kitchenId,
          description: normalizedDesc,
          default_unit_id: unitId || null,
          use_count: 1,
          last_used: new Date().toISOString(),
          last_quantity_used: quantity || null,
        });
      }

      // Refresh suggestions and units from database
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
    _stationId,
    _shiftDate,
    _shiftName,
    _userId
  ) => {
    // Update local state immediately for responsive UI
    // Note: In the new schema, dismissals are session-based (not persisted to DB)
    get().dismissSuggestion(suggestionId);
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
