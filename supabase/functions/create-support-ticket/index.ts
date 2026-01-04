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

    // Build description with metadata
    let description = body.message;
    if (body.metadata) {
      description += "\n\n---\nUser Context:";
      if (body.metadata.kitchenName) {
        description += `\nKitchen: ${body.metadata.kitchenName}`;
      }
      if (body.metadata.appVersion) {
        description += `\nApp Version: ${body.metadata.appVersion}`;
      }
      description += `\nUser ID: ${user.id}`;
    }

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
