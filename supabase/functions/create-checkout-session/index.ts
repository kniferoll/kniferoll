import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string);

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseSecretKey = Deno.env.get("SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type RequestBody = {
  userId: string;
  planTier: "pro";
  successUrl: string;
  cancelUrl: string;
};

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Extract headers from the incoming request
    const authHeader = req.headers.get("Authorization");
    const apiKey = req.headers.get("apikey");

    if (!authHeader || !apiKey) {
      return new Response(JSON.stringify({ error: "Missing auth headers" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create a client using the request's credentials to verify the user
    const supabaseAuth = createClient(supabaseUrl, apiKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify the user's JWT
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      console.error("Auth verification failed:", authError);
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          details: authError?.message,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const body: RequestBody = await req.json();

    // Validate that the userId matches the authenticated user
    if (!body.userId || body.userId !== user.id) {
      return new Response(JSON.stringify({ error: "User ID mismatch" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (body.planTier !== "pro") {
      return new Response(JSON.stringify({ error: "Invalid plan tier" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create admin client with secret key for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey);

    // Get existing Stripe customer or create new one
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      // PGRST116 = no rows found, which is fine
      console.error("Error fetching user profile:", profileError);
      return new Response(JSON.stringify({ error: "Failed to fetch user profile" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let customerId = userProfile?.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });

      customerId = customer.id;

      // Save Stripe customer ID to user profile
      const { error: updateError } = await supabaseAdmin
        .from("user_profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error updating user profile:", updateError);
        // Continue anyway - checkout can still work
      }
    }

    // Get the price ID from environment
    const priceId = Deno.env.get("STRIPE_PRO_PRICE_ID");
    if (!priceId) {
      return new Response(JSON.stringify({ error: "Stripe price ID not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create Stripe Checkout session
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
      allow_promotion_codes: true,
      success_url: body.successUrl,
      cancel_url: body.cancelUrl,
      metadata: {
        supabase_user_id: user.id,
      },
    });

    return new Response(JSON.stringify({ sessionUrl: session.url }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
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
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
