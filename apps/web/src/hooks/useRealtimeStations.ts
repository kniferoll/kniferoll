import { useEffect } from "react";
import { supabase, captureError } from "@/lib";
import { useKitchenStore } from "@/stores";
import type { DbStation } from "@kniferoll/types";

export function useRealtimeStations(kitchenId: string | undefined) {
  useEffect(() => {
    if (!kitchenId) return;

    const channel = supabase
      .channel(`stations:${kitchenId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "stations",
          filter: `kitchen_id=eq.${kitchenId}`,
        },
        (payload) => {
          const newStation = payload.new as DbStation;
          const currentStations = useKitchenStore.getState().stations;
          const alreadyExists = currentStations.some((s) => s.id === newStation.id);
          if (!alreadyExists) {
            useKitchenStore.setState({
              stations: [...currentStations, newStation].sort(
                (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
              ),
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "stations",
          filter: `kitchen_id=eq.${kitchenId}`,
        },
        (payload) => {
          const updatedStation = payload.new as DbStation;
          const currentStations = useKitchenStore.getState().stations;
          useKitchenStore.setState({
            stations: currentStations
              .map((s) => (s.id === updatedStation.id ? updatedStation : s))
              .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)),
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "stations",
          filter: `kitchen_id=eq.${kitchenId}`,
        },
        (payload) => {
          const deletedStation = payload.old as DbStation;
          const currentStations = useKitchenStore.getState().stations;
          useKitchenStore.setState({
            stations: currentStations.filter((s) => s.id !== deletedStation.id),
          });
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          captureError(new Error("Realtime subscription error for stations"), {
            context: "useRealtimeStations",
            kitchenId,
            level: "warning",
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [kitchenId]);
}
