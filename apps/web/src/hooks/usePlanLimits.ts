import { useEffect, useState } from "react";
import { useAuthStore } from "../stores/authStore";
import {
  getUserProfile,
  getOwnedKitchenCount,
  getStationCount,
  getUserLimits,
} from "../lib/entitlements";
import type { Database } from "@kniferoll/types";

type UserPlan = Database["public"]["Enums"]["user_plan"];

interface PlanLimits {
  plan: UserPlan;
  maxKitchens: number;
  ownedKitchens: number;
  canCreateKitchen: boolean;
  maxStationsPerKitchen: number;
  canInviteAsOwner: boolean;
}

/**
 * Hook to check user's plan and limits
 */
export function usePlanLimits() {
  const { user } = useAuthStore();
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLimits(null);
      setLoading(false);
      return;
    }

    const loadLimits = async () => {
      try {
        setLoading(true);
        setError(null);

        const profile = await getUserProfile(user.id);
        if (!profile) {
          throw new Error("User profile not found");
        }

        const ownedKitchens = await getOwnedKitchenCount(user.id);
        const planLimits = getUserLimits(profile.plan);

        setLimits({
          plan: profile.plan,
          maxKitchens: planLimits.maxKitchens,
          ownedKitchens,
          canCreateKitchen: ownedKitchens < planLimits.maxKitchens,
          maxStationsPerKitchen: planLimits.maxStationsPerKitchen,
          canInviteAsOwner: planLimits.canInviteAsOwner,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load limits";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadLimits();
  }, [user]);

  /**
   * Check if user can create a station in a specific kitchen
   */
  const canCreateStation = async (kitchenId: string): Promise<boolean> => {
    if (!user || !limits) return false;

    const stationCount = await getStationCount(kitchenId);
    return stationCount < limits.maxStationsPerKitchen;
  };

  return { limits, loading, error, canCreateStation };
}

/**
 * Hook for managing paywall state
 */
export function usePaywall() {
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallReason, setPaywallReason] = useState<
    "kitchen_limit" | "station_limit" | "invite_limit" | null
  >(null);

  const showKitchenPaywall = () => {
    setPaywallReason("kitchen_limit");
    setShowPaywall(true);
  };

  const showStationPaywall = () => {
    setPaywallReason("station_limit");
    setShowPaywall(true);
  };

  const showInvitePaywall = () => {
    setPaywallReason("invite_limit");
    setShowPaywall(true);
  };

  const closePaywall = () => {
    setShowPaywall(false);
    setPaywallReason(null);
  };

  return {
    showPaywall,
    paywallReason,
    showKitchenPaywall,
    showStationPaywall,
    showInvitePaywall,
    closePaywall,
  };
}
