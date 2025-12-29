import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores";
import { supabase } from "@/lib";
import type { Database } from "@kniferoll/types";

type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];

export function useUserSubscription() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: err } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (err) throw err;
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  return { profile, loading, error };
}
