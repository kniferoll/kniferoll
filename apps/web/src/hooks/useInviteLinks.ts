import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { InviteLink } from "@kniferoll/types";

/**
 * Hook to fetch invite links for a kitchen
 */
export function useInviteLinks(kitchenId: string | undefined) {
  const [inviteLinks, setInviteLinks] = useState<InviteLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!kitchenId) {
      setInviteLinks([]);
      setLoading(false);
      return;
    }

    const fetchInviteLinks = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: err } = await supabase
          .from("invite_links")
          .select("*")
          .eq("kitchen_id", kitchenId)
          .eq("revoked", false)
          .order("created_at", { ascending: false });

        if (err) throw err;
        setInviteLinks(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchInviteLinks();
  }, [kitchenId]);

  return { inviteLinks, loading, error };
}

/**
 * Hook to create a new invite link
 */
export function useCreateInviteLink() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createInviteLink = async (
    kitchenId: string,
    expiresAt: string,
    maxUses: number = 1,
    userId: string
  ): Promise<InviteLink | null> => {
    try {
      setLoading(true);
      setError(null);

      if (!userId) {
        throw new Error("User ID required to create invite link");
      }

      const { data, error: err } = await supabase
        .from("invite_links")
        .insert({
          kitchen_id: kitchenId,
          expires_at: expiresAt,
          max_uses: maxUses,
          created_by_user: userId,
        })
        .select()
        .single();

      if (err) throw err;
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createInviteLink, loading, error };
}

/**
 * Hook to revoke an invite link
 */
export function useRevokeInviteLink() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const revokeInviteLink = async (inviteLinkId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error: err } = await supabase
        .from("invite_links")
        .update({ revoked: true })
        .eq("id", inviteLinkId);

      if (err) throw err;
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { revokeInviteLink, loading, error };
}

/**
 * Hook to join a kitchen via invite link
 */
export function useJoinViaInviteLink() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const joinViaInviteLink = async (
    token: string,
    userId: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Find the invite link
      const { data: inviteLink, error: linkError } = await supabase
        .from("invite_links")
        .select("*")
        .eq("token", token)
        .single();

      if (linkError) throw new Error("Invalid invite link");
      if (!inviteLink) throw new Error("Invite link not found");
      if (inviteLink.revoked) throw new Error("Invite link has been revoked");
      if (inviteLink.use_count >= inviteLink.max_uses)
        throw new Error("Invite link has reached max uses");

      const now = new Date();
      if (new Date(inviteLink.expires_at) < now)
        throw new Error("Invite link has expired");

      // Add user to kitchen
      const { error: memberError } = await supabase
        .from("kitchen_members")
        .insert({
          kitchen_id: inviteLink.kitchen_id,
          user_id: userId,
          role: "member",
          can_invite: false,
        });

      if (memberError) throw memberError;

      // Increment use count
      const { error: updateError } = await supabase
        .from("invite_links")
        .update({ use_count: inviteLink.use_count + 1 })
        .eq("id", inviteLink.id);

      if (updateError) throw updateError;

      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { joinViaInviteLink, loading, error };
}
