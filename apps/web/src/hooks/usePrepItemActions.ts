import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../stores/authStore";
import { getDeviceToken } from "../lib/supabase";
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
      // Get current user info
      let createdByUser: string | null = null;
      let createdByAnon: string | null = null;

      if (user) {
        createdByUser = user.id;
      } else {
        const deviceToken = getDeviceToken();
        const { data: anonUser } = await supabase
          .from("anonymous_users")
          .select("id")
          .eq("device_token", deviceToken)
          .single();

        if (anonUser) {
          createdByAnon = anonUser.id;
        }
      }

      const item: PrepItemInsert = {
        station_id: stationId,
        shift_date: shiftDate,
        shift_name: shiftName,
        description,
        quantity: quantity ? Number(quantity) : null,
        unit_id: unitId || null,
        status: "pending",
        created_by_user: createdByUser,
        created_by_anon: createdByAnon,
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
      const now = new Date().toISOString();
      const updates: Record<string, any> = {
        status: newStatus,
        status_changed_at: now,
      };

      if (user) {
        updates.status_changed_by_user = user.id;
        updates.status_changed_by_anon = null;
      } else {
        const deviceToken = getDeviceToken();
        const { data: anonUser } = await supabase
          .from("anonymous_users")
          .select("id")
          .eq("device_token", deviceToken)
          .single();

        if (anonUser) {
          updates.status_changed_by_anon = anonUser.id;
          updates.status_changed_by_user = null;
        }
      }

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
