import { useEffect, useState } from "react";
import { supabase } from "@/lib";
import type { Database } from "@kniferoll/types";

type KitchenMember = Database["public"]["Tables"]["kitchen_members"]["Row"];

// Extended member type with user info from RPC
export interface MemberWithUserInfo extends KitchenMember {
  display_name: string | null;
  email: string | null;
  is_anonymous: boolean;
}

/**
 * Hook to subscribe to realtime updates for kitchen members
 * Uses RPC to fetch member info with user names
 */
export function useRealtimeMembers(kitchenId: string | undefined) {
  const [members, setMembers] = useState<MemberWithUserInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = async (id: string) => {
    const { data, error } = await supabase.rpc("get_kitchen_members_with_names", {
      p_kitchen_id: id,
    });
    if (!error && data) {
      // Map RPC response to MemberWithUserInfo, adding updated_at
      const membersWithInfo: MemberWithUserInfo[] = data.map((m) => ({
        id: m.id,
        kitchen_id: m.kitchen_id,
        user_id: m.user_id,
        role: m.role,
        can_invite: m.can_invite,
        joined_at: m.joined_at,
        updated_at: null, // RPC doesn't return this, but it's nullable
        display_name: m.display_name,
        email: m.email,
        is_anonymous: m.is_anonymous,
      }));
      setMembers(membersWithInfo);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!kitchenId) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    // Initial load using RPC
    fetchMembers(kitchenId);

    // Subscribe to changes - refetch on any change to get user info
    const channel = supabase
      .channel(`kitchen_members:${kitchenId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "kitchen_members",
          filter: `kitchen_id=eq.${kitchenId}`,
        },
        () => {
          // Refetch to get updated data with user info
          fetchMembers(kitchenId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [kitchenId]);

  return { members, loading };
}
