import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export function useRealtimePrepItems(stationId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!stationId) return;

    const channel = supabase
      .channel(`prep_items:${stationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "prep_items",
          filter: `station_id=eq.${stationId}`,
        },
        () => {
          // Invalidate queries to refetch data
          queryClient.invalidateQueries({
            queryKey: ["prep_items", stationId],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [stationId, queryClient]);
}
