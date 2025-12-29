import { create } from "zustand";
import { supabase } from "@/lib";
import type { DbPrepItem, Database, PrepStatus } from "@kniferoll/types";

type PrepItemInsert = Database["public"]["Tables"]["prep_items"]["Insert"];
type PrepItemUpdate = Database["public"]["Tables"]["prep_items"]["Update"];

// Type for prep items with description field added from kitchen_items
export type PrepItemWithDescription = DbPrepItem & { description: string };

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
  loading: boolean;
  error: string | null;

  // Actions
  loadPrepItems: (
    stationId: string,
    shiftDate: string,
    shiftId: string
  ) => Promise<void>;
  addPrepItem: (item: PrepItemInsert) => Promise<{ error?: string }>;
  cycleStatus: (itemId: string) => Promise<{ error?: string }>;
  deletePrepItem: (itemId: string) => Promise<{ error?: string }>;
  updatePrepItem: (
    itemId: string,
    updates: PrepItemUpdate
  ) => Promise<{ error?: string }>;
}

export const usePrepStore = create<PrepState>((set, get) => ({
  prepItems: [],
  loading: false,
  error: null,

  loadPrepItems: async (stationId, shiftDate, shiftId) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from("prep_items")
        .select("*, kitchen_items(name)")
        .eq("station_id", stationId)
        .eq("shift_date", shiftDate)
        .eq("shift_id", shiftId)
        .order("created_at", { ascending: true });

      if (error) {
        set({ loading: false, error: error.message });
        return;
      }

      // Transform the data to include description from kitchen_items
      const transformedData = (data || []).map((item: any) => ({
        ...item,
        description: item.kitchen_items?.name || "Unknown item",
      }));

      set({ prepItems: transformedData, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      set({ loading: false, error: message });
    }
  },

  addPrepItem: async (item) => {
    set({ loading: true, error: null });

    try {
      // Ensure created_by_user and created_by_anon are properly set
      const { data, error } = await supabase
        .from("prep_items")
        .insert(item)
        .select("*, kitchen_items(name)")
        .single();

      if (error) {
        set({ loading: false, error: error.message });
        return { error: error.message };
      }

      const transformedItem = {
        ...data,
        description: (data as any).kitchen_items?.name || "Unknown item",
      };

      set((state) => ({
        prepItems: [
          ...state.prepItems,
          transformedItem as PrepItemWithDescription,
        ],
        loading: false,
      }));

      return {};
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      set({ loading: false, error: message });
      return { error: message };
    }
  },

  cycleStatus: async (itemId) => {
    const { prepItems } = get();
    const item = prepItems.find((i) => i.id === itemId);
    if (!item) return { error: "Item not found" };

    const newStatus = cycleStatus(item.status as PrepStatus | null);
    const now = new Date().toISOString();

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

    // Optimistic update
    set((state) => ({
      prepItems: state.prepItems.map((i) =>
        i.id === itemId ? { ...i, ...updates } : i
      ),
    }));

    try {
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
    set({ loading: true, error: null });

    try {
      const { error } = await supabase
        .from("prep_items")
        .delete()
        .eq("id", itemId);

      if (error) {
        set({ loading: false, error: error.message });
        return { error: error.message };
      }

      set((state) => ({
        prepItems: state.prepItems.filter((i) => i.id !== itemId),
        loading: false,
      }));

      return {};
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      set({ loading: false, error: message });
      return { error: message };
    }
  },

  updatePrepItem: async (itemId, updates) => {
    set({ loading: true, error: null });

    try {
      const { error } = await supabase
        .from("prep_items")
        .update(updates)
        .eq("id", itemId);

      if (error) {
        set({ loading: false, error: error.message });
        return { error: error.message };
      }

      set((state) => ({
        prepItems: state.prepItems.map((i) =>
          i.id === itemId ? { ...i, ...updates } : i
        ),
        loading: false,
      }));

      return {};
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      set({ loading: false, error: message });
      return { error: message };
    }
  },
}));
