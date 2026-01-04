/**
 * Create Support Ticket Edge Function
 *
 * Creates support tickets in Zoho Desk via OAuth API.
 *
 * DEPLOYMENT:
 * This function must be deployed with --no-verify-jwt flag since we handle
 * JWT verification manually to extract user info:
 *
 *   supabase functions deploy create-support-ticket --no-verify-jwt
 *
 * Required environment variables (set in Supabase Dashboard > Edge Functions > Secrets):
 * - ZOHO_CLIENT_ID
 * - ZOHO_CLIENT_SECRET
 * - ZOHO_REFRESH_TOKEN
 * - ZOHO_ORG_ID
 * - ZOHO_DEPARTMENT_ID
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseSecretKey = Deno.env.get("SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type RequestBody = {
  subject: string;
  category: "Bug" | "Feature Request" | "Billing" | "General";
  message: string;
  metadata?: {
    userName?: string;
    userEmail?: string;
    kitchenName?: string;
    appVersion?: string;
  };
};

type ZohoTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

type ZohoTicketResponse = {
  id: string;
  ticketNumber: string;
};

async function getZohoAccessToken(): Promise<string> {
  const clientId = Deno.env.get("ZOHO_CLIENT_ID");
  const clientSecret = Deno.env.get("ZOHO_CLIENT_SECRET");
  const refreshToken = Deno.env.get("ZOHO_REFRESH_TOKEN");

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing Zoho OAuth credentials");
  }

  const response = await fetch("https://accounts.zoho.com/oauth/v2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Zoho access token: ${error}`);
  }

  const data: ZohoTokenResponse = await response.json();
  return data.access_token;
}

async function createZohoTicket(
  accessToken: string,
  email: string,
  subject: string,
  description: string,
  category: string
): Promise<ZohoTicketResponse> {
  const orgId = Deno.env.get("ZOHO_ORG_ID");
  const departmentId = Deno.env.get("ZOHO_DEPARTMENT_ID");

  if (!orgId || !departmentId) {
    throw new Error("Missing Zoho organization configuration");
  }

  const response = await fetch("https://desk.zoho.com/api/v1/tickets", {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      orgId: orgId,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contact: { email },
      subject,
      description,
      departmentId,
      category,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create Zoho ticket: ${error}`);
  }

  return await response.json();
}

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

    // Validate required fields
    if (!body.subject || !body.category || !body.message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: subject, category, message" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate category
    const validCategories = ["Bug", "Feature Request", "Billing", "General"];
    if (!validCategories.includes(body.category)) {
      return new Response(
        JSON.stringify({ error: "Invalid category" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Build description with user's message prominently displayed
    // The user will see replies to this ticket, so keep it clean and professional
    // Check both .name (signup) and .display_name (join flow) for user's name
    const userName =
      body.metadata?.userName ||
      user.user_metadata?.name ||
      user.user_metadata?.display_name ||
      "User";
    const userEmail = user.email || body.metadata?.userEmail || "Unknown";

    // Format: User message first (what they'll see in replies), then internal metadata
    let description = `<p>${body.message.replace(/\n/g, "<br>")}</p>`;

    // Add internal metadata section (visible to support staff)
    description += `
<br><hr><br>
<p><strong>Support Request Details</strong></p>
<table style="border-collapse: collapse; font-size: 14px;">
  <tr><td style="padding: 4px 12px 4px 0; color: #666;">Name:</td><td>${userName}</td></tr>
  <tr><td style="padding: 4px 12px 4px 0; color: #666;">Email:</td><td>${userEmail}</td></tr>
  <tr><td style="padding: 4px 12px 4px 0; color: #666;">User ID:</td><td style="font-family: monospace; font-size: 12px;">${user.id}</td></tr>
  ${body.metadata?.kitchenName ? `<tr><td style="padding: 4px 12px 4px 0; color: #666;">Kitchen:</td><td>${body.metadata.kitchenName}</td></tr>` : ""}
  ${body.metadata?.appVersion ? `<tr><td style="padding: 4px 12px 4px 0; color: #666;">App Version:</td><td>${body.metadata.appVersion}</td></tr>` : ""}
</table>`;

    // Get Zoho access token
    const accessToken = await getZohoAccessToken();

    // Create ticket in Zoho Desk
    const ticket = await createZohoTicket(
      accessToken,
      user.email || "",
      body.subject,
      description,
      body.category
    );

    return new Response(
      JSON.stringify({
        success: true,
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        email: user.email,
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating support ticket:", error);
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
