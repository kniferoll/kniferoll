/**
 * Create Portal Session Edge Function
 *
 * Creates Stripe Billing Portal sessions for subscription management.
 *
 * DEPLOYMENT:
 * This function must be deployed with --no-verify-jwt flag since we handle
 * JWT verification manually to extract user info:
 *
 *   supabase functions deploy create-portal-session --no-verify-jwt
 */

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
  returnUrl: string;
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

    // Validate input
    if (!body.userId || body.userId !== user.id) {
      return new Response(JSON.stringify({ error: "User ID mismatch" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create admin client with secret key for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey);

    // Get user's Stripe customer ID
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return new Response(JSON.stringify({ error: "Failed to fetch user profile" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const customerId = userProfile?.stripe_customer_id;

    if (!customerId) {
      return new Response(JSON.stringify({ error: "No Stripe customer found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create Stripe Billing Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: body.returnUrl,
    });

    return new Response(JSON.stringify({ portalUrl: session.url }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating portal session:", error);
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
