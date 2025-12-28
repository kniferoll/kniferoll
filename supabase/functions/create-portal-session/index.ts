import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2024-11-20",
});

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

type RequestBody = {
  userId: string;
  returnUrl: string;
};

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
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
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth verification failed:", authError);
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

    // Get user's Stripe customer ID
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const { data: userProfile } = await fetch(
      `${supabaseUrl}/rest/v1/user_profiles?id=eq.${user.id}`,
      {
        headers: {
          apikey: serviceRoleKey || "",
          Authorization: `Bearer ${serviceRoleKey || ""}`,
        },
      }
    ).then((r) => r.json());

    const customerId = userProfile?.[0]?.stripe_customer_id;

    if (!customerId) {
      return new Response(
        JSON.stringify({ error: "No Stripe customer found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create Stripe Billing Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: body.returnUrl,
    });

    return new Response(JSON.stringify({ portalUrl: session.url }), {
      headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
