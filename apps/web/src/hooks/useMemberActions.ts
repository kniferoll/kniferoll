import { supabase } from "@/lib/supabase";
import type { Database } from "@kniferoll/types";

type KitchenMember = Database["public"]["Tables"]["kitchen_members"]["Row"];
type MemberRole = Database["public"]["Enums"]["member_role"];

/**
 * Hook for managing kitchen members
 */
export function useMemberActions() {
  /**
   * Update a member's role
   */
  const updateMemberRole = async (
    memberId: string,
    newRole: MemberRole
  ): Promise<KitchenMember | null> => {
    try {
      const { data, error } = await supabase
        .from("kitchen_members")
        .update({ role: newRole })
        .eq("id", memberId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update member";
      throw new Error(message);
    }
  };

  /**
   * Update member's can_invite permission
   */
  const updateMemberInvitePermission = async (
    memberId: string,
    canInvite: boolean
  ): Promise<KitchenMember | null> => {
    try {
      const { data, error } = await supabase
        .from("kitchen_members")
        .update({ can_invite: canInvite })
        .eq("id", memberId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update member";
      throw new Error(message);
    }
  };

  /**
   * Remove a member from the kitchen
   */
  const removeMember = async (memberId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from("kitchen_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to remove member";
      throw new Error(message);
    }
  };

  return {
    updateMemberRole,
    updateMemberInvitePermission,
    removeMember,
  };
}
