/**
 * Stripe Integration
 * Handles checkout session creation and subscription management
 */

import { supabase } from "./supabase";

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!STRIPE_PUBLISHABLE_KEY) {
  console.warn("VITE_STRIPE_PUBLISHABLE_KEY is not set");
}

/**
 * Create a Stripe Checkout session and redirect user to Stripe
 */
export async function redirectToCheckout(options: {
  userId: string;
  planTier: "pro"; // Only pro plan for now
  successUrl: string;
  cancelUrl: string;
}): Promise<void> {
  try {
    // Call edge function using supabase.functions.invoke (handles auth automatically)
    const { data, error } = await supabase.functions.invoke(
      "create-checkout-session",
      {
        body: {
          userId: options.userId,
          planTier: options.planTier,
          successUrl: options.successUrl,
          cancelUrl: options.cancelUrl,
        },
      }
    );

    if (error) {
      throw new Error(error.message || "Failed to create checkout session");
    }

    const { sessionUrl } = data;

    // Redirect to Stripe Checkout
    if (sessionUrl) {
      window.location.href = sessionUrl;
    } else {
      throw new Error("No checkout URL returned");
    }
  } catch (error) {
    console.error("Stripe checkout error:", error);
    throw error;
  }
}

/**
 * Get the Stripe Customer Portal URL
 */
export async function getCustomerPortalUrl(options: {
  userId: string;
  returnUrl: string;
}): Promise<string> {
  try {
    // Call edge function using supabase.functions.invoke (handles auth automatically)
    const { data, error } = await supabase.functions.invoke(
      "create-portal-session",
      {
        body: {
          userId: options.userId,
          returnUrl: options.returnUrl,
        },
      }
    );

    if (error) {
      throw new Error(error.message || "Failed to create portal session");
    }

    const { portalUrl } = data;
    return portalUrl;
  } catch (error) {
    console.error("Stripe portal error:", error);
    throw error;
  }
}

/**
 * Redirect to Stripe Customer Portal
 */
export async function redirectToCustomerPortal(options: {
  userId: string;
  returnUrl: string;
}): Promise<void> {
  try {
    const portalUrl = await getCustomerPortalUrl(options);
    window.location.href = portalUrl;
  } catch (error) {
    console.error("Failed to redirect to portal:", error);
    throw error;
  }
}
