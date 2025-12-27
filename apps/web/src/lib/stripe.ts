/**
 * Stripe Integration
 * Handles checkout session creation and subscription management
 */

import { supabase } from "./supabase";

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

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
    // Get the current session token
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("No active session");
    }

    // Call edge function to create checkout session
    const response = await fetch(
      `${API_BASE_URL}/functions/v1/create-checkout-session`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId: options.userId,
          planTier: options.planTier,
          successUrl: options.successUrl,
          cancelUrl: options.cancelUrl,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create checkout session");
    }

    const { sessionUrl } = await response.json();

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
    // Get the current session token
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("No active session");
    }

    const response = await fetch(
      `${API_BASE_URL}/functions/v1/create-portal-session`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId: options.userId,
          returnUrl: options.returnUrl,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create portal session");
    }

    const { portalUrl } = await response.json();
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
