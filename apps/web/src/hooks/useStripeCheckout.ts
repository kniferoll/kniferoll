import { useCallback } from "react";
import { useAuthStore } from "@/stores";
import { redirectToCheckout } from "@/lib";

/**
 * Hook for handling Stripe checkout redirects
 */
export function useStripeCheckout() {
  const { user } = useAuthStore();

  const handleCheckout = useCallback(async () => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    const currentUrl = window.location.href;

    try {
      await redirectToCheckout({
        userId: user.id,
        planTier: "pro",
        successUrl: `${window.location.origin}/dashboard?upgrade=success`,
        cancelUrl: currentUrl,
      });
    } catch (error) {
      console.error("Checkout error:", error);
      throw error;
    }
  }, [user]);

  return { handleCheckout };
}
