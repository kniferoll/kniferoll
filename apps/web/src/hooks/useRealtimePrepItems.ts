import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { usePrepStore } from "../stores/prepStore";
import type { DbPrepItem } from "@kniferoll/types";

export function useRealtimePrepItems(stationId: string | undefined) {
  useEffect(() => {
    if (!stationId) return;

    const channel = supabase
      .channel(`prep_items:${stationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "prep_items",
          filter: `station_id=eq.${stationId}`,
        },
        (payload) => {
          const newItem = payload.new as DbPrepItem;
          // Add to store if it matches the current view and isn't already there
          const currentItems = usePrepStore.getState().prepItems;
          const alreadyExists = currentItems.some(
            (item) => item.id === newItem.id
          );
          if (!alreadyExists) {
            usePrepStore.setState({
              prepItems: [...currentItems, newItem],
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
          filter: `station_id=eq.${stationId}`,
        },
        (payload) => {
          const updatedItem = payload.new as DbPrepItem;
          const currentItems = usePrepStore.getState().prepItems;
          usePrepStore.setState({
            prepItems: currentItems.map((item) =>
              item.id === updatedItem.id ? updatedItem : item
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
          filter: `station_id=eq.${stationId}`,
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
  }, [stationId]);
}
