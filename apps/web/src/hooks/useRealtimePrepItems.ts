import { useEffect } from "react";
import { supabase } from "@/lib";
import { usePrepStore, type PrepItemWithDescription } from "@/stores";
import type { DbPrepItem } from "@kniferoll/types";

export function useRealtimePrepItems(
  stationId: string | undefined,
  shiftDate: string | undefined
) {
  useEffect(() => {
    if (!stationId || !shiftDate) return;

    // Helper to fetch item description from kitchen_items
    const fetchWithDescription = async (item: DbPrepItem) => {
      // Fetch kitchen item name for description
      let description = "Unknown item";
      if (item.kitchen_item_id) {
        const { data: kitchenItem } = await supabase
          .from("kitchen_items")
          .select("name")
          .eq("id", item.kitchen_item_id)
          .single();
        if (kitchenItem) {
          description = kitchenItem.name;
        }
      }

      // Fetch unit name if present
      let unit_name = null;
      if (item.unit_id) {
        const { data: unitData } = await supabase
          .from("kitchen_units")
          .select("name")
          .eq("id", item.unit_id)
          .single();
        unit_name = unitData?.name || null;
      }

      return { ...item, description, unit_name };
    };

    // Subscribe to prep_items changes for this station
    // Note: Supabase Realtime only supports single filter, so we filter by station_id
    // and check shift_date in the callback
    const channel = supabase
      .channel(`prep_items:${stationId}:${shiftDate}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "prep_items",
          filter: `station_id=eq.${stationId}`,
        },
        async (payload) => {
          const newItem = payload.new as DbPrepItem;
          // Filter by shift_date in callback since Realtime only supports single filter
          if (newItem.shift_date !== shiftDate) return;

          const currentItems = usePrepStore.getState().prepItems;
          const alreadyExists = currentItems.some(
            (item) => item.id === newItem.id
          );
          if (!alreadyExists) {
            const itemWithDetails = await fetchWithDescription(newItem);
            usePrepStore.setState({
              prepItems: [...currentItems, itemWithDetails as PrepItemWithDescription],
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
        async (payload) => {
          const updatedItem = payload.new as DbPrepItem;
          // Filter by shift_date in callback
          if (updatedItem.shift_date !== shiftDate) return;

          const currentItems = usePrepStore.getState().prepItems;
          // Preserve existing description/unit_name if we have them
          const existingItem = currentItems.find((i) => i.id === updatedItem.id);

          let itemWithDetails;
          if (existingItem) {
            // Merge update with existing data to preserve description
            itemWithDetails = {
              ...existingItem,
              ...updatedItem,
              description: existingItem.description,
              unit_name: existingItem.unit_name,
            };
          } else {
            // Fetch full details if we don't have the item
            itemWithDetails = await fetchWithDescription(updatedItem);
          }

          usePrepStore.setState({
            prepItems: currentItems.map((item) =>
              item.id === updatedItem.id ? (itemWithDetails as PrepItemWithDescription) : item
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
          // Filter by shift_date in callback
          if (deletedItem.shift_date !== shiftDate) return;

          const currentItems = usePrepStore.getState().prepItems;
          usePrepStore.setState({
            prepItems: currentItems.filter(
              (item) => item.id !== deletedItem.id
            ),
          });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`Realtime subscribed: prep_items for station ${stationId}`);
        } else if (status === "CHANNEL_ERROR") {
          console.error("Realtime subscription error for prep_items");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [stationId, shiftDate]);
}
