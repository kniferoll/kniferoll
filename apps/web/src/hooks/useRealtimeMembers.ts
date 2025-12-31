import { useEffect, useState } from "react";
import { supabase } from "@/lib";
import type { Database } from "@kniferoll/types";

type KitchenMember = Database["public"]["Tables"]["kitchen_members"]["Row"];

/**
 * Hook to subscribe to realtime updates for kitchen members
 */
export function useRealtimeMembers(kitchenId: string | undefined) {
  const [members, setMembers] = useState<KitchenMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!kitchenId) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    // Initial load
    supabase
      .from("kitchen_members")
      .select("*")
      .eq("kitchen_id", kitchenId)
      .then(({ data, error }) => {
        if (!error && data) {
          setMembers(data);
        }
        setLoading(false);
      });

    // Subscribe to changes
    const channel = supabase
      .channel(`kitchen_members:${kitchenId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "kitchen_members",
          filter: `kitchen_id=eq.${kitchenId}`,
        },
        (payload) => {
          const newMember = payload.new as KitchenMember;
          setMembers((current) => {
            const alreadyExists = current.some((m) => m.id === newMember.id);
            if (alreadyExists) return current;
            return [...current, newMember];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "kitchen_members",
          filter: `kitchen_id=eq.${kitchenId}`,
        },
        (payload) => {
          const updatedMember = payload.new as KitchenMember;
          setMembers((current) =>
            current.map((m) => (m.id === updatedMember.id ? updatedMember : m))
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "kitchen_members",
          filter: `kitchen_id=eq.${kitchenId}`,
        },
        (payload) => {
          const deletedMember = payload.old as KitchenMember;
          setMembers((current) =>
            current.filter((m) => m.id !== deletedMember.id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [kitchenId]);

  return { members, loading };
}
