import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@14.0.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "");
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";

type RequestBody = {
  userId: string;
  planTier: "pro";
  successUrl: string;
  cancelUrl: string;
};

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    // Verify JWT token from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify token with Supabase
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((r) => r.json());

    const user = authResponse;

    if (!user || !user.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body: RequestBody = await req.json();

    // Validate input
    if (!body.userId || body.userId !== user.id) {
      return new Response(JSON.stringify({ error: "User ID mismatch" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (body.planTier !== "pro") {
      return new Response(JSON.stringify({ error: "Invalid plan tier" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get or create Stripe customer
    const supabaseAdminUrl = supabaseUrl;
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");

    const { data: userProfile } = await fetch(
      `${supabaseAdminUrl}/rest/v1/user_profiles?id=eq.${user.id}`,
      {
        headers: {
          apikey: serviceRoleKey || "",
          Authorization: `Bearer ${serviceRoleKey || ""}`,
        },
      }
    ).then((r) => r.json());

    let customerId = userProfile?.[0]?.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });

      customerId = customer.id;

      // Update user profile with Stripe customer ID
      await fetch(
        `${supabaseAdminUrl}/rest/v1/user_profiles?id=eq.${user.id}`,
        {
          method: "PATCH",
          headers: {
            apikey: serviceRoleKey || "",
            Authorization: `Bearer ${serviceRoleKey || ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ stripe_customer_id: customerId }),
        }
      );
    }

    // Create Stripe Checkout session
    const priceId = Deno.env.get("STRIPE_PRO_PRICE_ID");
    if (!priceId) {
      return new Response(
        JSON.stringify({
          error: "Stripe price ID not configured",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: body.successUrl,
      cancel_url: body.cancelUrl,
      metadata: {
        supabase_user_id: user.id,
      },
    });

    return new Response(JSON.stringify({ sessionUrl: session.url }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
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
