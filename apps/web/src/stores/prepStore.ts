import { create } from "zustand";
import { supabase } from "@/lib";
import type { DbPrepItem, Database, PrepStatus } from "@kniferoll/types";

type PrepItemInsert = Database["public"]["Tables"]["prep_items"]["Insert"];
type PrepItemUpdate = Database["public"]["Tables"]["prep_items"]["Update"];

// Type for prep items with joined kitchen_items and kitchen_units
interface PrepItemWithJoins extends DbPrepItem {
  kitchen_items: { name: string } | null;
  kitchen_units: { name: string } | null;
}

// Type for prep items with description and unit_name fields
export type PrepItemWithDescription = DbPrepItem & {
  description: string;
  unit_name?: string | null;
};

// Helper function to cycle through status states
function cycleStatus(current: PrepStatus | null): PrepStatus {
  const cycle: Record<PrepStatus, PrepStatus> = {
    pending: "in_progress",
    in_progress: "complete",
    complete: "pending",
  };
  return cycle[current || "pending"];
}

interface PrepState {
  prepItems: PrepItemWithDescription[];
  // Distinguish between initial load (show skeleton) and background refetch (keep showing data)
  isInitialLoading: boolean;
  isRefetching: boolean;
  error: string | null;
  // Track current context to avoid redundant fetches
  currentContext: { stationId: string; shiftDate: string; shiftId: string } | null;

  // Actions
  loadPrepItems: (
    stationId: string,
    shiftDate: string,
    shiftId: string
  ) => Promise<void>;
  addPrepItem: (
    item: PrepItemInsert,
    optimisticData?: { description: string; unit_name?: string | null }
  ) => Promise<{ error?: string; id?: string }>;
  cycleStatus: (itemId: string) => Promise<{ error?: string }>;
  deletePrepItem: (itemId: string) => Promise<{ error?: string }>;
  updatePrepItem: (
    itemId: string,
    updates: PrepItemUpdate,
    optimisticData?: { unit_name?: string | null }
  ) => Promise<{ error?: string }>;
  // Clear items when switching context
  clearItems: () => void;
}

export const usePrepStore = create<PrepState>((set, get) => ({
  prepItems: [],
  isInitialLoading: true, // Start true to show skeleton until first load completes
  isRefetching: false,
  error: null,
  currentContext: null,

  clearItems: () => {
    set({ prepItems: [], currentContext: null, isInitialLoading: false, isRefetching: false });
  },

  loadPrepItems: async (stationId, shiftDate, shiftId) => {
    const { currentContext } = get();
    const newContext = { stationId, shiftDate, shiftId };

    // Check if context changed - if so, this is a fresh load
    const isContextChange = !currentContext ||
      currentContext.stationId !== stationId ||
      currentContext.shiftDate !== shiftDate ||
      currentContext.shiftId !== shiftId;

    // If context changed, clear old items and show initial loading
    // If same context, this is a refetch - keep showing current items
    if (isContextChange) {
      set({
        isInitialLoading: true,
        isRefetching: false,
        error: null,
        currentContext: newContext,
        prepItems: [] // Clear old items immediately for context change
      });
    } else {
      // Same context - background refetch, don't show loading
      set({ isRefetching: true, error: null });
    }

    try {
      const { data, error } = await supabase
        .from("prep_items")
        .select("*, kitchen_items(name), kitchen_units(name)")
        .eq("station_id", stationId)
        .eq("shift_date", shiftDate)
        .eq("shift_id", shiftId)
        .order("created_at", { ascending: true });

      if (error) {
        set({ isInitialLoading: false, isRefetching: false, error: error.message });
        return;
      }

      // Transform the data to include description and unit_name from joined tables
      const transformedData = ((data || []) as PrepItemWithJoins[]).map((item) => ({
        ...item,
        description: item.kitchen_items?.name || "Unknown item",
        unit_name: item.kitchen_units?.name || null,
      }));

      set({ prepItems: transformedData, isInitialLoading: false, isRefetching: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      set({ isInitialLoading: false, isRefetching: false, error: message });
    }
  },

  addPrepItem: async (item, optimisticData) => {
    // Generate a temporary ID for optimistic update
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Optimistic update FIRST - add item immediately with temp ID
    const optimisticItem: PrepItemWithDescription = {
      id: tempId,
      station_id: item.station_id!,
      shift_id: item.shift_id!,
      shift_date: item.shift_date ?? new Date().toISOString().split("T")[0],
      kitchen_item_id: item.kitchen_item_id!,
      unit_id: item.unit_id || null,
      quantity: item.quantity || null,
      quantity_raw: item.quantity_raw || null,
      status: "pending",
      status_changed_at: null,
      status_changed_by_user: null,
      created_by_user: item.created_by_user || null,
      created_at: new Date().toISOString(),
      updated_at: null,
      description: optimisticData?.description || "Adding...",
      unit_name: optimisticData?.unit_name || null,
    };

    set((state) => ({
      prepItems: [...state.prepItems, optimisticItem],
    }));

    try {
      const { data, error } = await supabase
        .from("prep_items")
        .insert(item)
        .select("*, kitchen_items(name), kitchen_units(name)")
        .single();

      if (error) {
        // Revert optimistic update on error
        set((state) => ({
          prepItems: state.prepItems.filter((i) => i.id !== tempId),
          error: error.message,
        }));
        return { error: error.message };
      }

      const dataWithJoins = data as unknown as PrepItemWithJoins;
      const transformedItem = {
        ...data,
        description: dataWithJoins.kitchen_items?.name || optimisticData?.description || "Unknown item",
        unit_name: dataWithJoins.kitchen_units?.name || optimisticData?.unit_name || null,
      };

      // Replace temp item with real item
      set((state) => ({
        prepItems: state.prepItems.map((i) =>
          i.id === tempId ? (transformedItem as PrepItemWithDescription) : i
        ),
      }));

      return { id: data.id };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      // Revert optimistic update on error
      set((state) => ({
        prepItems: state.prepItems.filter((i) => i.id !== tempId),
        error: message,
      }));
      return { error: message };
    }
  },

  cycleStatus: async (itemId) => {
    const { prepItems } = get();
    const item = prepItems.find((i) => i.id === itemId);
    if (!item) return { error: "Item not found" };

    const newStatus = cycleStatus(item.status as PrepStatus | null);
    const now = new Date().toISOString();

    // Optimistic update FIRST (before any async calls)
    const optimisticUpdates = {
      status: newStatus,
      status_changed_at: now,
    };

    set((state) => ({
      prepItems: state.prepItems.map((i) =>
        i.id === itemId ? { ...i, ...optimisticUpdates } : i
      ),
    }));

    // Now do the async work in the background
    try {
      // Get the current user to check if they're authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const updates: PrepItemUpdate = {
        status: newStatus,
        status_changed_at: now,
        // Only set status_changed_by_user if user is authenticated (has a real user ID)
        ...(user ? { status_changed_by_user: user.id } : {}),
      };

      const { error } = await supabase
        .from("prep_items")
        .update(updates)
        .eq("id", itemId);

      if (error) {
        // Revert on error
        set((state) => ({
          prepItems: state.prepItems.map((i) => (i.id === itemId ? item : i)),
          error: error.message,
        }));
        return { error: error.message };
      }

      return {};
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      // Revert on error
      set((state) => ({
        prepItems: state.prepItems.map((i) => (i.id === itemId ? item : i)),
        error: message,
      }));
      return { error: message };
    }
  },

  deletePrepItem: async (itemId) => {
    const { prepItems } = get();
    const itemToDelete = prepItems.find((i) => i.id === itemId);

    if (!itemToDelete) {
      return { error: "Item not found" };
    }

    // Optimistic delete FIRST - remove item immediately
    set((state) => ({
      prepItems: state.prepItems.filter((i) => i.id !== itemId),
    }));

    try {
      const { error } = await supabase
        .from("prep_items")
        .delete()
        .eq("id", itemId);

      if (error) {
        // Revert optimistic delete on error - restore the item
        set((state) => ({
          prepItems: [...state.prepItems, itemToDelete],
          error: error.message,
        }));
        return { error: error.message };
      }

      return {};
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      // Revert optimistic delete on error
      set((state) => ({
        prepItems: [...state.prepItems, itemToDelete],
        error: message,
      }));
      return { error: message };
    }
  },

  updatePrepItem: async (itemId, updates, optimisticData) => {
    const { prepItems } = get();
    const originalItem = prepItems.find((i) => i.id === itemId);

    if (!originalItem) {
      return { error: "Item not found" };
    }

    // Optimistic update FIRST - apply changes immediately
    // Include optimisticData (like unit_name) for derived fields
    set((state) => ({
      prepItems: state.prepItems.map((i) =>
        i.id === itemId ? { ...i, ...updates, ...optimisticData } : i
      ),
    }));

    try {
      const { error } = await supabase
        .from("prep_items")
        .update(updates)
        .eq("id", itemId);

      if (error) {
        // Revert optimistic update on error
        set((state) => ({
          prepItems: state.prepItems.map((i) =>
            i.id === itemId ? originalItem : i
          ),
          error: error.message,
        }));
        return { error: error.message };
      }

      return {};
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      // Revert optimistic update on error
      set((state) => ({
        prepItems: state.prepItems.map((i) =>
          i.id === itemId ? originalItem : i
        ),
        error: message,
      }));
      return { error: message };
    }
  },
}));
