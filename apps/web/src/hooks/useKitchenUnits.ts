import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { KitchenUnit } from "@kniferoll/types";

/**
 * Hook to fetch all units for a kitchen
 */
export function useKitchenUnits(kitchenId: string | undefined) {
  const [units, setUnits] = useState<KitchenUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!kitchenId) {
      setUnits([]);
      setLoading(false);
      return;
    }

    const fetchUnits = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: err } = await supabase
          .from("kitchen_units")
          .select("*")
          .eq("kitchen_id", kitchenId)
          .order("category", { ascending: true })
          .order("name", { ascending: true });

        if (err) throw err;
        setUnits(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchUnits();
  }, [kitchenId]);

  return { units, loading, error };
}

/**
 * Hook to create a new kitchen unit
 */
export function useCreateKitchenUnit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createUnit = async (
    kitchenId: string,
    name: string,
    displayName?: string,
    category?: string
  ): Promise<KitchenUnit | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from("kitchen_units")
        .insert({
          kitchen_id: kitchenId,
          name,
          display_name: displayName || name,
          category: category || "other",
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

  return { createUnit, loading, error };
}

/**
 * Hook to update a kitchen unit
 */
export function useUpdateKitchenUnit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateUnit = async (
    unitId: string,
    updates: Partial<KitchenUnit>
  ): Promise<KitchenUnit | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from("kitchen_units")
        .update(updates)
        .eq("id", unitId)
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

  return { updateUnit, loading, error };
}

/**
 * Hook to delete a kitchen unit
 */
export function useDeleteKitchenUnit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteUnit = async (unitId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error: err } = await supabase
        .from("kitchen_units")
        .delete()
        .eq("id", unitId);

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

  return { deleteUnit, loading, error };
}
