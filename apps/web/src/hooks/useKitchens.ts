import { useEffect, useState } from "react";
import { supabase } from "@/lib";
import type { Kitchen, KitchenMember } from "@kniferoll/types";

/**
 * Hook to fetch all kitchens for current user
 */
export function useKitchens(userId: string | undefined) {
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = () => setRefetchTrigger((prev) => prev + 1);

  useEffect(() => {
    if (!userId) {
      setKitchens([]);
      setLoading(false);
      return;
    }

    const fetchKitchens = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get all kitchens where user is a member
        const { data: memberships, error: memberError } = await supabase
          .from("kitchen_members")
          .select("kitchen_id")
          .eq("user_id", userId);

        if (memberError) throw memberError;

        if (!memberships || memberships.length === 0) {
          setKitchens([]);
          return;
        }

        const kitchenIds = memberships.map((m) => m.kitchen_id);

        // Fetch kitchen details
        const { data: kitchenData, error: kitchenError } = await supabase
          .from("kitchens")
          .select("*")
          .in("id", kitchenIds);

        if (kitchenError) throw kitchenError;

        setKitchens(kitchenData || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchKitchens();
  }, [userId, refetchTrigger]);

  return { kitchens, loading, error, refetch };
}

/**
 * Hook to fetch a single kitchen with members
 */
export function useKitchen(kitchenId: string | undefined) {
  const [kitchen, setKitchen] = useState<Kitchen | null>(null);
  const [members, setMembers] = useState<KitchenMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!kitchenId) {
      setKitchen(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    const fetchKitchen = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch kitchen
        const { data: kitchenData, error: kitchenError } = await supabase
          .from("kitchens")
          .select("*")
          .eq("id", kitchenId)
          .single();

        if (kitchenError) throw kitchenError;
        setKitchen(kitchenData);

        // Fetch members
        const { data: memberData, error: memberError } = await supabase
          .from("kitchen_members")
          .select("*")
          .eq("kitchen_id", kitchenId);

        if (memberError) throw memberError;
        setMembers(memberData || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchKitchen();
  }, [kitchenId]);

  return { kitchen, members, loading, error };
}

/**
 * Hook to create a new kitchen
 */
export function useCreateKitchen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createKitchen = async (
    userId: string,
    name: string
  ): Promise<Kitchen | null> => {
    try {
      setLoading(true);
      setError(null);

      // Create kitchen
      const { data: kitchen, error: kitchenError } = await supabase
        .from("kitchens")
        .insert({
          name,
          owner_id: userId,
        })
        .select()
        .single();

      if (kitchenError) throw kitchenError;

      // Add owner as member
      const { error: memberError } = await supabase
        .from("kitchen_members")
        .insert({
          kitchen_id: kitchen.id,
          user_id: userId,
          role: "owner",
          can_invite: true,
        });

      if (memberError) throw memberError;

      return kitchen;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createKitchen, loading, error };
}
