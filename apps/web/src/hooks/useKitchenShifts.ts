import { useEffect, useState } from "react";
import { supabase } from "@/lib";
import type { Database } from "@kniferoll/types";

type KitchenShift = Database["public"]["Tables"]["kitchen_shifts"]["Row"];
type KitchenShiftDay =
  Database["public"]["Tables"]["kitchen_shift_days"]["Row"];

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function useKitchenShifts(kitchenId: string | undefined) {
  const [shifts, setShifts] = useState<KitchenShift[]>([]);
  const [shiftDays, setShiftDays] = useState<KitchenShiftDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = () => setRefetchTrigger((prev) => prev + 1);

  useEffect(() => {
    if (!kitchenId) {
      setShifts([]);
      setShiftDays([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch shifts
        const { data: shiftsData, error: shiftsError } = await supabase
          .from("kitchen_shifts")
          .select("*")
          .eq("kitchen_id", kitchenId)
          .order("display_order");

        if (shiftsError) throw shiftsError;
        setShifts(shiftsData || []);

        // Fetch shift days
        const { data: daysData, error: daysError } = await supabase
          .from("kitchen_shift_days")
          .select("*")
          .eq("kitchen_id", kitchenId)
          .order("day_of_week");

        if (daysError) throw daysError;
        setShiftDays(daysData || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [kitchenId, refetchTrigger]);

  return { shifts, shiftDays, loading, error, refetch };
}

export function useKitchenShiftActions(kitchenId: string | undefined) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addShift = async (name: string): Promise<string> => {
    if (!kitchenId) throw new Error("Kitchen ID required");

    try {
      setLoading(true);
      setError(null);

      // Get max display_order
      const { data: existing } = await supabase
        .from("kitchen_shifts")
        .select("display_order")
        .eq("kitchen_id", kitchenId)
        .order("display_order", { ascending: false })
        .limit(1);

      const nextOrder = (existing?.[0]?.display_order ?? -1) + 1;

      const { data, error: err } = await supabase
        .from("kitchen_shifts")
        .insert({
          kitchen_id: kitchenId,
          name,
          display_order: nextOrder,
        })
        .select("id")
        .single();

      if (err) throw new Error(err.message);
      return data.id;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const updateShift = async (
    shiftId: string,
    updates: Partial<KitchenShift>
  ) => {
    try {
      setLoading(true);
      setError(null);

      const { error: err } = await supabase
        .from("kitchen_shifts")
        .update(updates)
        .eq("id", shiftId);

      if (err) throw err;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const deleteShift = async (shiftId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: err } = await supabase
        .from("kitchen_shifts")
        .delete()
        .eq("id", shiftId);

      if (err) throw err;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const hideShift = async (shiftId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: err } = await supabase
        .from("kitchen_shifts")
        .update({ is_hidden: true })
        .eq("id", shiftId);

      if (err) throw new Error(err.message);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const unhideShift = async (shiftId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: err } = await supabase
        .from("kitchen_shifts")
        .update({ is_hidden: false })
        .eq("id", shiftId);

      if (err) throw new Error(err.message);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const updateShiftDay = async (
    dayOfWeek: number,
    isOpen: boolean,
    shiftIds: string[] = []
  ) => {
    if (!kitchenId) throw new Error("Kitchen ID required");

    try {
      setLoading(true);
      setError(null);

      // Check if exists
      const { data: existing } = await supabase
        .from("kitchen_shift_days")
        .select("id")
        .eq("kitchen_id", kitchenId)
        .eq("day_of_week", dayOfWeek);

      if (existing && existing.length > 0) {
        // Update
        const { error: err } = await supabase
          .from("kitchen_shift_days")
          .update({
            is_open: isOpen,
            shift_ids: shiftIds,
          })
          .eq("id", existing[0].id);

        if (err) throw err;
      } else {
        // Insert
        const { error: err } = await supabase
          .from("kitchen_shift_days")
          .insert({
            kitchen_id: kitchenId,
            day_of_week: dayOfWeek,
            is_open: isOpen,
            shift_ids: shiftIds,
          });

        if (err) throw err;
      }
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return {
    addShift,
    updateShift,
    deleteShift,
    hideShift,
    unhideShift,
    updateShiftDay,
    loading,
    error,
  };
}

export { DAYS_OF_WEEK };
