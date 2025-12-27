import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { usePrepStore } from "../stores/prepStore";
import type { DbPrepItem } from "@kniferoll/types";

export function useRealtimePrepItems(
  stationId: string | undefined,
  shiftDate: string | undefined
) {
  useEffect(() => {
    if (!stationId || !shiftDate) return;

    // Helper to fetch unit name for an item
    const fetchWithUnitName = async (item: DbPrepItem) => {
      if (!item.unit_id) {
        return { ...item, unit_name: null };
      }

      const { data: unitData } = await supabase
        .from("kitchen_units")
        .select("name")
        .eq("id", item.unit_id)
        .single();

      return { ...item, unit_name: unitData?.name || null };
    };

    const channel = supabase
      .channel(`prep_items:${stationId}:${shiftDate}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "prep_items",
          filter: `station_id=eq.${stationId}&shift_date=eq.${shiftDate}`,
        },
        async (payload) => {
          const newItem = payload.new as DbPrepItem;
          const currentItems = usePrepStore.getState().prepItems;
          const alreadyExists = currentItems.some(
            (item) => item.id === newItem.id
          );
          if (!alreadyExists) {
            const itemWithUnit = await fetchWithUnitName(newItem);
            usePrepStore.setState({
              prepItems: [...currentItems, itemWithUnit as any],
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "prep_items",
          filter: `station_id=eq.${stationId}&shift_date=eq.${shiftDate}`,
        },
        async (payload) => {
          const updatedItem = payload.new as DbPrepItem;
          const itemWithUnit = await fetchWithUnitName(updatedItem);
          const currentItems = usePrepStore.getState().prepItems;
          usePrepStore.setState({
            prepItems: currentItems.map((item) =>
              item.id === itemWithUnit.id ? (itemWithUnit as any) : item
            ),
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "prep_items",
          filter: `station_id=eq.${stationId}&shift_date=eq.${shiftDate}`,
        },
        (payload) => {
          const deletedItem = payload.old as DbPrepItem;
          const currentItems = usePrepStore.getState().prepItems;
          usePrepStore.setState({
            prepItems: currentItems.filter(
              (item) => item.id !== deletedItem.id
            ),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [stationId, shiftDate]);
}
