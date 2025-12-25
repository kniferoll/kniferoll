import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export function useRealtimeStations(kitchenId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!kitchenId) return;

    const channel = supabase
      .channel(`stations:${kitchenId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stations",
          filter: `kitchen_id=eq.${kitchenId}`,
        },
        () => {
          // Invalidate queries to refetch data
          queryClient.invalidateQueries({ queryKey: ["stations", kitchenId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [kitchenId, queryClient]);
}
