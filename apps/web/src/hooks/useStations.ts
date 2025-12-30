import { useEffect, useState } from "react";
import { supabase } from "@/lib";
import type { Station } from "@kniferoll/types";

/**
 * Hook to fetch all stations for a kitchen
 * Uses isInitialLoading to distinguish between first load (show skeleton)
 * and refetches (keep showing data)
 */
export function useStations(kitchenId: string | undefined) {
  const [stations, setStations] = useState<Station[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentKitchenId, setCurrentKitchenId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!kitchenId) {
      setStations([]);
      setIsInitialLoading(false);
      return;
    }

    const isKitchenChange = currentKitchenId !== kitchenId;

    const fetchStations = async () => {
      try {
        // Only show loading on initial load or kitchen change
        if (isKitchenChange || stations.length === 0) {
          setIsInitialLoading(true);
          setCurrentKitchenId(kitchenId);
        }
        setError(null);

        const { data, error: err } = await supabase
          .from("stations")
          .select("*")
          .eq("kitchen_id", kitchenId)
          .order("display_order", { ascending: true });

        if (err) throw err;
        setStations(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchStations();
  }, [kitchenId]);

  // For backwards compatibility, also expose `loading` as alias
  return { stations, loading: isInitialLoading, isInitialLoading, error };
}

/**
 * Hook to create a new station
 */
export function useCreateStation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createStation = async (
    kitchenId: string,
    name: string
  ): Promise<Station | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from("stations")
        .insert({
          kitchen_id: kitchenId,
          name,
          display_order: 0,
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

  return { createStation, loading, error };
}

/**
 * Hook to update a station
 */
export function useUpdateStation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateStation = async (
    stationId: string,
    updates: Partial<Station>
  ): Promise<Station | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from("stations")
        .update(updates)
        .eq("id", stationId)
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

  return { updateStation, loading, error };
}

/**
 * Hook to delete a station
 */
export function useDeleteStation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteStation = async (stationId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error: err } = await supabase
        .from("stations")
        .delete()
        .eq("id", stationId);

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

  return { deleteStation, loading, error };
}
