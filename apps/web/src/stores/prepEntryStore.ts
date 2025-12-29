import { create } from "zustand";
import { supabase } from "@/lib";
import type {
  DbKitchenUnit,
  DbPrepItem,
  RecencyScoredSuggestion,
} from "@kniferoll/types";
import { rankSuggestions } from "@/lib";

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
        !currentItems.some((item) => item.kitchen_item_id === s.kitchen_item_id)
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
    shiftId?: string
  ) => Promise<void>;
  dismissSuggestionPersistent: (
    suggestionId: string,
    stationId: string,
    shiftDate: string,
    shiftId: string,
    userId: string
  ) => Promise<void>;
  addItemWithUpdates: (
    kitchenId: string,
    stationId: string,
    shiftDate: string,
    shiftId: string,
    itemName: string,
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
    shiftId?
  ) => {
    set({ suggestionsLoading: true, unitsLoading: true, error: null });

    try {
      // Fetch suggestions for this station/shift context with kitchen_items data
      const suggestionsPromise =
        stationId && shiftId
          ? supabase
              .from("prep_item_suggestions")
              .select("*, kitchen_items(name)")
              .eq("station_id", stationId)
              .eq("shift_id", shiftId)
              .order("use_count", { ascending: false })
          : supabase.from("prep_item_suggestions").select("*").limit(0); // No suggestions if no context

      const unitsPromise = supabase
        .from("kitchen_units")
        .select("*")
        .eq("kitchen_id", kitchenId)
        .order("created_at", { ascending: true });

      // If context is provided, also fetch current items with kitchen_items data
      const currentItemsPromise =
        stationId && shiftDate && shiftId
          ? supabase
              .from("prep_items")
              .select("*, kitchen_items(name)")
              .eq("station_id", stationId)
              .eq("shift_date", shiftDate)
              .eq("shift_id", shiftId)
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
        // Transform suggestions to include description field from kitchen_items
        const allSuggestions = (suggestionsResponse.data || []).map(
          (s: any) => ({
            ...s,
            description: s.kitchen_items?.name || "Unknown item",
          })
        );
        // Transform current items to include description field from kitchen_items
        const currentItems = (currentItemsResponse?.data || []).map(
          (item: any) => ({
            ...item,
            description: item.kitchen_items?.name || "Unknown item",
          })
        );

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
    shiftId,
    itemName,
    unitId,
    quantity,
    userId
  ) => {
    set({ addingItem: true, error: null });

    try {
      if (!userId) {
        set({ addingItem: false, error: "User ID required" });
        return { error: "User ID required" };
      }

      const normalizedName = itemName.trim();

      // Step 1: Create or find kitchen_item
      const { data: existingItems } = await supabase
        .from("kitchen_items")
        .select("id")
        .eq("kitchen_id", kitchenId)
        .ilike("name", normalizedName)
        .limit(1);

      let kitchenItemId: string;

      if (existingItems && existingItems.length > 0) {
        kitchenItemId = existingItems[0].id;
      } else {
        const { data: newItem, error: itemError } = await supabase
          .from("kitchen_items")
          .insert({
            kitchen_id: kitchenId,
            name: normalizedName,
            default_unit_id: unitId || null,
          })
          .select("id")
          .single();

        if (itemError || !newItem) {
          set({
            addingItem: false,
            error: itemError?.message || "Failed to create item",
          });
          return { error: itemError?.message || "Failed to create item" };
        }

        kitchenItemId = newItem.id;
      }

      // Step 2: Insert prep item
      const { data: newPrepItem, error: prepError } = await supabase
        .from("prep_items")
        .insert({
          station_id: stationId,
          shift_id: shiftId,
          shift_date: shiftDate,
          kitchen_item_id: kitchenItemId,
          unit_id: unitId || null,
          quantity: quantity || null,
          quantity_raw: formatQuantityRaw(
            quantity,
            unitId ? get().allUnits.find((u) => u.id === unitId)?.name : null
          ),
          status: "pending",
          created_by_user: userId as any,
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
              item.shift_id === shiftId
          );
        if (isCurrentView) {
          // Add description from normalizedName to match PrepItemWithDescription type
          const newItemWithDescription = {
            ...newPrepItem,
            description: normalizedName,
          } as any;
          usePrepStore.setState({
            prepItems: [...currentItems, newItemWithDescription],
          });
        }
      }

      // Step 3: Upsert prep_item_suggestion (increment count, update last_used)
      const { data: existingSuggestion } = await supabase
        .from("prep_item_suggestions")
        .select("id, use_count")
        .eq("kitchen_item_id", kitchenItemId)
        .eq("station_id", stationId)
        .eq("shift_id", shiftId)
        .maybeSingle();

      if (existingSuggestion) {
        await supabase
          .from("prep_item_suggestions")
          .update({
            use_count: (existingSuggestion.use_count || 1) + 1,
            last_used: new Date().toISOString(),
            last_quantity: quantity || null,
            last_unit_id: unitId || null,
          })
          .eq("id", existingSuggestion.id);
      } else {
        await supabase.from("prep_item_suggestions").insert({
          kitchen_item_id: kitchenItemId,
          station_id: stationId,
          shift_id: shiftId,
          use_count: 1,
          last_used: new Date().toISOString(),
          last_quantity: quantity || null,
          last_unit_id: unitId || null,
        });
      }

      // Refresh suggestions and units from database
      await get().loadSuggestionsAndUnits(
        kitchenId,
        stationId,
        shiftDate,
        shiftId
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
    _shiftId,
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
