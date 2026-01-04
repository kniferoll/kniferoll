/**
 * Email Forwarder Edge Function
 *
 * Receives email.received webhooks from Resend and forwards emails
 * based on the recipient address.
 *
 * Routing:
 * - support@kniferoll.io → support@kniferoll.zohodesk.com
 * - simon@kniferoll.io → SIMON_PERSONAL_EMAIL env var
 *
 * DEPLOYMENT:
 * This function must be deployed with --no-verify-jwt flag since it
 * receives webhooks from Resend (not authenticated users):
 *
 *   supabase functions deploy email-forwarder --no-verify-jwt
 *
 * Required environment variables (set in Supabase Dashboard > Edge Functions > Secrets):
 * - RESEND_API_KEY
 * - RESEND_WEBHOOK_SECRET
 * - SIMON_PERSONAL_EMAIL
 */

import { Webhook } from "npm:svix@1.15.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const RESEND_WEBHOOK_SECRET = Deno.env.get("RESEND_WEBHOOK_SECRET") || "";
const SIMON_PERSONAL_EMAIL = Deno.env.get("SIMON_PERSONAL_EMAIL") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, svix-id, svix-timestamp, svix-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type EmailReceivedEvent = {
  type: "email.received";
  created_at: string;
  data: {
    email_id: string;
    created_at: string;
    from: string;
    to: string[];
    cc: string[];
    bcc: string[];
    message_id: string;
    subject: string;
    attachments: Array<{
      id: string;
      filename: string;
      content_type: string;
      content_disposition: string;
      content_id?: string;
    }>;
  };
};

type EmailContent = {
  html?: string;
  text?: string;
};

type Attachment = {
  id: string;
  filename: string;
  content_type: string;
  download_url: string;
  content?: string;
};

// Routing map: recipient address → forwarding address
const FORWARDING_ROUTES: Record<string, string | (() => string)> = {
  "support@kniferoll.io": "support@kniferoll.zohodesk.com",
  "simon@kniferoll.io": () => SIMON_PERSONAL_EMAIL,
};

function getForwardingAddress(recipient: string): string | null {
  const route = FORWARDING_ROUTES[recipient.toLowerCase()];
  if (!route) return null;
  return typeof route === "function" ? route() : route;
}

async function fetchEmailContent(emailId: string): Promise<EmailContent> {
  const response = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch email content: ${error}`);
  }

  const data = await response.json();
  return {
    html: data.html,
    text: data.text,
  };
}

async function fetchAttachments(emailId: string): Promise<Attachment[]> {
  const response = await fetch(`https://api.resend.com/attachments/receiving?email_id=${emailId}`, {
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Failed to fetch attachments: ${error}`);
    return [];
  }

  const data = await response.json();
  return data.data || [];
}

async function downloadAndEncodeAttachment(attachment: Attachment): Promise<{
  filename: string;
  content: string;
  content_type?: string;
}> {
  const response = await fetch(attachment.download_url);
  if (!response.ok) {
    throw new Error(`Failed to download attachment: ${attachment.filename}`);
  }

  const buffer = await response.arrayBuffer();
  const base64Content = btoa(
    String.fromCharCode(...new Uint8Array(buffer))
  );

  return {
    filename: attachment.filename,
    content: base64Content,
    content_type: attachment.content_type,
  };
}

async function sendEmail(params: {
  from: string;
  to: string;
  subject: string;
  html?: string;
  text?: string;
  reply_to?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    content_type?: string;
  }>;
}): Promise<{ id: string }> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return await response.json();
}

function verifyWebhook(payload: string, headers: Record<string, string>): EmailReceivedEvent {
  if (!RESEND_WEBHOOK_SECRET) {
    throw new Error("Missing RESEND_WEBHOOK_SECRET");
  }

  const wh = new Webhook(RESEND_WEBHOOK_SECRET);
  return wh.verify(payload, {
    "svix-id": headers["svix-id"],
    "svix-timestamp": headers["svix-timestamp"],
    "svix-signature": headers["svix-signature"],
  }) as EmailReceivedEvent;
}

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    // Get raw payload for signature verification
    const payload = await req.text();

    // Extract Svix headers for verification
    const svixHeaders = {
      "svix-id": req.headers.get("svix-id") || "",
      "svix-timestamp": req.headers.get("svix-timestamp") || "",
      "svix-signature": req.headers.get("svix-signature") || "",
    };

    // Verify webhook signature
    let event: EmailReceivedEvent;
    try {
      event = verifyWebhook(payload, svixHeaders);
    } catch (err) {
      console.error("Webhook verification failed:", err);
      return new Response(JSON.stringify({ error: "Invalid webhook signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Only process email.received events
    if (event.type !== "email.received") {
      return new Response(JSON.stringify({ message: "Event type not handled" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { email_id, from, to, subject } = event.data;

    // Find recipients that need forwarding
    const forwardingTasks: Array<{ recipient: string; forwardTo: string }> = [];
    for (const recipient of to) {
      const forwardTo = getForwardingAddress(recipient);
      if (forwardTo) {
        forwardingTasks.push({ recipient, forwardTo });
      }
    }

    if (forwardingTasks.length === 0) {
      console.log(`No forwarding rules match recipients: ${to.join(", ")}`);
      return new Response(JSON.stringify({ message: "No forwarding rules matched" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fetch email content and attachments
    const [emailContent, attachments] = await Promise.all([
      fetchEmailContent(email_id),
      fetchAttachments(email_id),
    ]);

    // Download and encode attachments
    const encodedAttachments = await Promise.all(
      attachments.map(downloadAndEncodeAttachment)
    );

    // Forward to each destination
    const results: Array<{ to: string; emailId?: string; error?: string }> = [];

    for (const { recipient, forwardTo } of forwardingTasks) {
      try {
        // Extract original sender for reply-to
        const originalSender = from;

        const result = await sendEmail({
          from: `Kniferoll Forwarding <${recipient}>`,
          to: forwardTo,
          subject: `[Fwd] ${subject}`,
          html: emailContent.html,
          text: emailContent.text,
          reply_to: originalSender,
          attachments: encodedAttachments.length > 0 ? encodedAttachments : undefined,
        });

        console.log(`Forwarded email from ${from} to ${forwardTo} (via ${recipient})`);
        results.push({ to: forwardTo, emailId: result.id });
      } catch (err) {
        console.error(`Failed to forward to ${forwardTo}:`, err);
        results.push({
          to: forwardTo,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        originalEmailId: email_id,
        forwards: results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error processing email webhook:", error);
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
