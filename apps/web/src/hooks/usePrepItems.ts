import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { PrepItem, PrepStatus } from "@kniferoll/types";

/**
 * Hook to fetch prep items for a station on a specific date
 */
export function usePrepItems(
  stationId: string | undefined,
  shiftDate: string | undefined
) {
  const [prepItems, setPrepItems] = useState<PrepItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!stationId || !shiftDate) {
      setPrepItems([]);
      setLoading(false);
      return;
    }

    const fetchPrepItems = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: err } = await supabase
          .from("prep_items")
          .select("*")
          .eq("station_id", stationId)
          .eq("shift_date", shiftDate)
          .order("created_at", { ascending: true });

        if (err) throw err;
        setPrepItems(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchPrepItems();
  }, [stationId, shiftDate]);

  return { prepItems, loading, error };
}

/**
 * Hook to create a new prep item
 */
export function useCreatePrepItem() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createPrepItem = async (
    stationId: string,
    shiftDate: string,
    shiftName: string,
    description: string,
    quantity?: number,
    unitId?: string,
    quantityRaw?: string,
    userId?: string
  ): Promise<PrepItem | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from("prep_items")
        .insert({
          station_id: stationId,
          shift_date: shiftDate,
          shift_name: shiftName,
          description,
          quantity: quantity || null,
          unit_id: unitId || null,
          quantity_raw: quantityRaw || null,
          status: "pending",
          created_by_user: userId || null,
        })
        .select()
        .single();

      if (err) throw err;
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createPrepItem, loading, error };
}

/**
 * Hook to update a prep item's status
 */
export function useUpdatePrepItemStatus() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateStatus = async (
    prepItemId: string,
    status: PrepStatus,
    userId?: string
  ): Promise<PrepItem | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from("prep_items")
        .update({
          status,
          status_changed_at: new Date().toISOString(),
          status_changed_by_user: userId || null,
        })
        .eq("id", prepItemId)
        .select()
        .single();

      if (err) throw err;
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { updateStatus, loading, error };
}

/**
 * Hook to update a prep item
 */
export function useUpdatePrepItem() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updatePrepItem = async (
    prepItemId: string,
    updates: Partial<PrepItem>
  ): Promise<PrepItem | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from("prep_items")
        .update(updates)
        .eq("id", prepItemId)
        .select()
        .single();

      if (err) throw err;
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { updatePrepItem, loading, error };
}

/**
 * Hook to delete a prep item
 */
export function useDeletePrepItem() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deletePrepItem = async (prepItemId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error: err } = await supabase
        .from("prep_items")
        .delete()
        .eq("id", prepItemId);

      if (err) throw err;
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { deletePrepItem, loading, error };
}
