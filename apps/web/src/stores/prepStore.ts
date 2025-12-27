import { create } from "zustand";
import { supabase } from "../lib/supabase";
import type { DbPrepItem, Database, PrepStatus } from "@kniferoll/types";

type PrepItemInsert = Database["public"]["Tables"]["prep_items"]["Insert"];
type PrepItemUpdate = Database["public"]["Tables"]["prep_items"]["Update"];

// Helper function to cycle through status states
function cycleStatus(current: PrepStatus | null): PrepStatus {
  const cycle: Record<PrepStatus, PrepStatus> = {
    pending: "partial",
    partial: "complete",
    complete: "pending",
  };
  return cycle[current || "pending"];
}

interface PrepState {
  prepItems: DbPrepItem[];
  loading: boolean;
  error: string | null;

  // Actions
  loadPrepItems: (
    stationId: string,
    shiftDate: string,
    shiftName: string
  ) => Promise<void>;
  addPrepItem: (item: PrepItemInsert) => Promise<{ error?: string }>;
  cycleStatus: (
    itemId: string,
    userName?: string
  ) => Promise<{ error?: string }>;
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

  loadPrepItems: async (stationId, shiftDate, shiftName) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from("prep_items")
        .select("*, kitchen_units(name)")
        .eq("station_id", stationId)
        .eq("shift_date", shiftDate)
        .eq("shift_name", shiftName)
        .order("created_at", { ascending: true });

      if (error) {
        set({ loading: false, error: error.message });
        return;
      }

      // Map the joined data to include unit_name
      const itemsWithUnitName = (data || []).map((item: any) => ({
        ...item,
        unit_name: item.kitchen_units?.name || null,
        kitchen_units: undefined, // Remove nested object
      }));

      set({ prepItems: itemsWithUnitName, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      set({ loading: false, error: message });
    }
  },

  addPrepItem: async (item) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from("prep_items")
        .insert(item)
        .select("*, kitchen_units(name)")
        .single();

      if (error) {
        set({ loading: false, error: error.message });
        return { error: error.message };
      }

      // Map the joined data to include unit_name
      const itemWithUnitName = {
        ...data,
        unit_name: (data as any).kitchen_units?.name || null,
        kitchen_units: undefined, // Remove nested object
      };

      set((state) => ({
        prepItems: [...state.prepItems, itemWithUnitName],
        loading: false,
      }));

      return {};
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      set({ loading: false, error: message });
      return { error: message };
    }
  },

  cycleStatus: async (itemId, userName) => {
    const { prepItems } = get();
    const item = prepItems.find((i) => i.id === itemId);
    if (!item) return { error: "Item not found" };

    const newStatus = cycleStatus(item.status as PrepStatus | null);
    const now = new Date().toISOString();

    const updates: PrepItemUpdate = {
      status: newStatus,
      status_changed_at: now,
      status_changed_by: userName || null,
      // Set completed_at when status becomes complete, clear it otherwise
      completed_at: newStatus === "complete" ? now : null,
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
