import { useCallback, useState } from "react";
import { useAuthStore } from "@/stores";
import { redirectToCheckout } from "@/lib";

/**
 * Hook for handling Stripe checkout redirects
 */
export function useStripeCheckout() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleCheckout = useCallback(async () => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    setLoading(true);
    const currentUrl = window.location.href;

    try {
      await redirectToCheckout({
        userId: user.id,
        planTier: "pro",
        successUrl: `${window.location.origin}/dashboard?upgrade=success`,
        cancelUrl: currentUrl,
      });
      // Don't set loading false on success - we're redirecting
    } catch (error) {
      setLoading(false);
      console.error("Checkout error:", error);
      throw error;
    }
  }, [user]);

  return { handleCheckout, loading };
}
