import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../stores/authStore";
import type { Database, PrepStatus } from "@kniferoll/types";

type PrepItemInsert = Database["public"]["Tables"]["prep_items"]["Insert"];

/**
 * Hook for managing prep item CRUD operations
 * Handles adding, updating status, and deleting prep items
 */
export function usePrepItemActions() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addPrepItem = async (
    stationId: string,
    shiftDate: string,
    shiftName: string,
    description: string,
    quantity?: number | string,
    unitId?: string,
    kitchenId?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      const item: PrepItemInsert = {
        station_id: stationId,
        shift_date: shiftDate,
        shift_name: shiftName,
        description,
        quantity: quantity ? Number(quantity) : null,
        unit_id: unitId || null,
        status: "pending",
        created_by_user: user.id,
      };

      const { data: newItem, error: insertError } = await supabase
        .from("prep_items")
        .insert(item)
        .select()
        .single();

      if (insertError || !newItem) {
        throw insertError || new Error("Failed to create item");
      }

      // Update kitchen item suggestions for autocomplete
      if (kitchenId) {
        await supabase.from("kitchen_item_suggestions").upsert(
          {
            kitchen_id: kitchenId,
            description,
            use_count: 1,
            last_used: shiftDate,
            last_quantity_used: quantity ? Number(quantity) : null,
            default_unit_id: unitId || null,
          },
          { onConflict: "kitchen_id,description" }
        );
      }

      return { item: newItem, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add item";
      setError(message);
      return { item: null, error: message };
    } finally {
      setLoading(false);
    }
  };

  const updateItemStatus = async (itemId: string, newStatus: PrepStatus) => {
    setLoading(true);
    setError(null);

    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      const now = new Date().toISOString();
      const updates = {
        status: newStatus,
        status_changed_at: now,
        status_changed_by_user: user.id,
      };

      const { error: updateError } = await supabase
        .from("prep_items")
        .update(updates)
        .eq("id", itemId);

      if (updateError) {
        throw updateError;
      }

      return { error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update";
      setError(message);
      return { error: message };
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (itemId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from("prep_items")
        .delete()
        .eq("id", itemId);

      if (deleteError) {
        throw deleteError;
      }

      return { error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete";
      setError(message);
      return { error: message };
    } finally {
      setLoading(false);
    }
  };

  return {
    addPrepItem,
    updateItemStatus,
    deleteItem,
    loading,
    error,
    setError,
  };
}
