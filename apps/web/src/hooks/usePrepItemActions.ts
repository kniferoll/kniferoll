import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
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
    shiftId: string,
    itemName: string,
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

      if (!kitchenId) {
        throw new Error("Kitchen ID required");
      }

      const normalizedName = itemName.trim();

      // Find or create kitchen_item
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
          throw itemError || new Error("Failed to create item");
        }

        kitchenItemId = newItem.id;
      }

      const item: PrepItemInsert = {
        station_id: stationId,
        shift_id: shiftId,
        shift_date: shiftDate,
        kitchen_item_id: kitchenItemId,
        quantity: quantity ? Number(quantity) : null,
        unit_id: unitId || null,
        status: "pending",
        created_by_user: user.id,
      };

      const { data: newPrepItem, error: insertError } = await supabase
        .from("prep_items")
        .insert(item)
        .select()
        .single();

      if (insertError || !newPrepItem) {
        throw insertError || new Error("Failed to create item");
      }

      return { item: newPrepItem, error: null };
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
