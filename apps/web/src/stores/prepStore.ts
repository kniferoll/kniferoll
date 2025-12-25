import { create } from "zustand";
import { supabase } from "../lib/supabase";
import type { DbPrepItem, Database } from "@kniferoll/types";

type PrepItemInsert = Database["public"]["Tables"]["prep_items"]["Insert"];
type PrepItemUpdate = Database["public"]["Tables"]["prep_items"]["Update"];

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
  toggleComplete: (itemId: string) => Promise<{ error?: string }>;
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
        .select("*")
        .eq("station_id", stationId)
        .eq("shift_date", shiftDate)
        .eq("shift_name", shiftName)
        .order("created_at", { ascending: true });

      if (error) {
        set({ loading: false, error: error.message });
        return;
      }

      set({ prepItems: data || [], loading: false });
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
        .select()
        .single();

      if (error) {
        set({ loading: false, error: error.message });
        return { error: error.message };
      }

      set((state) => ({
        prepItems: [...state.prepItems, data],
        loading: false,
      }));

      return {};
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      set({ loading: false, error: message });
      return { error: message };
    }
  },

  toggleComplete: async (itemId) => {
    const { prepItems } = get();
    const item = prepItems.find((i) => i.id === itemId);
    if (!item) return { error: "Item not found" };

    const newCompleted = !item.completed;
    const updates: PrepItemUpdate = {
      completed: newCompleted,
      completed_at: newCompleted ? new Date().toISOString() : null,
    };

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
