/**
 * Stripe Webhooks Edge Function
 *
 * Handles Stripe webhook events for subscription management.
 *
 * DEPLOYMENT:
 * This function must be deployed with --no-verify-jwt flag since Stripe
 * uses its own signature verification (not JWTs):
 *
 *   supabase functions deploy stripe-webhooks --no-verify-jwt
 */

import Stripe from "stripe";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string);

const cryptoProvider = Stripe.createSubtleCryptoProvider();
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceRoleKey = Deno.env.get("SERVICE_ROLE_KEY") || "";

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type, stripe-signature",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.text();

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
        undefined,
        cryptoProvider
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle specific event types
    switch (event.type) {
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          await handleSubscriptionUpdate(subscription);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          await handleSubscriptionUpdate(subscription);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    const customer = await stripe.customers.retrieve(customerId);
    const userId = (customer.metadata?.supabase_user_id as string) || "";

    if (!userId) {
      console.warn(`No user ID found for customer ${customerId}`);
      return;
    }

    // Determine subscription status
    let subscriptionStatus: "active" | "canceled" | "past_due";
    switch (subscription.status) {
      case "active":
        subscriptionStatus = "active";
        break;
      case "past_due":
        subscriptionStatus = "past_due";
        break;
      case "canceled":
      case "unpaid":
        subscriptionStatus = "canceled";
        break;
      default:
        subscriptionStatus = "canceled";
    }

    // Get subscription period end
    const subscriptionPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();

    // Update user profile
    await fetch(`${supabaseUrl}/rest/v1/user_profiles?id=eq.${userId}`, {
      method: "PATCH",
      headers: {
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan: subscriptionStatus === "active" ? "pro" : "free",
        subscription_status: subscriptionStatus,
        subscription_period_end: subscriptionPeriodEnd,
      }),
    });
  } catch (error) {
    console.error("Error handling subscription update:", error);
  }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    const customer = await stripe.customers.retrieve(customerId);
    const userId = (customer.metadata?.supabase_user_id as string) || "";

    if (!userId) {
      console.warn(`No user ID found for customer ${customerId}`);
      return;
    }

    // Update user profile to downgrade to free
    await fetch(`${supabaseUrl}/rest/v1/user_profiles?id=eq.${userId}`, {
      method: "PATCH",
      headers: {
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan: "free",
        subscription_status: "canceled",
        subscription_period_end: null,
      }),
    });
  } catch (error) {
    console.error("Error handling subscription cancellation:", error);
  }
}
