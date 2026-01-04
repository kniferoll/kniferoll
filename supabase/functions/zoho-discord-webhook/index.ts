/**
 * Zoho Desk to Discord Webhook Relay
 *
 * Receives webhook events from Zoho Desk and forwards them to Discord
 * with a nicely formatted embed.
 *
 * DEPLOYMENT:
 *   supabase functions deploy zoho-discord-webhook --no-verify-jwt
 *
 * Required environment variables (set in Supabase Dashboard > Edge Functions > Secrets):
 * - DISCORD_ZOHO_WEBHOOK_URL
 */

Deno.serve(async (req: Request) => {
  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const discordWebhookUrl = Deno.env.get("DISCORD_ZOHO_WEBHOOK_URL");
    if (!discordWebhookUrl) {
      console.error("DISCORD_ZOHO_WEBHOOK_URL not configured");
      return new Response("Webhook URL not configured", { status: 500 });
    }

    const payload = await req.json();
    console.log("Received Zoho webhook:", JSON.stringify(payload, null, 2));

    // Zoho sends different payload structures for different events
    // Handle ticket creation and comments
    const eventType = payload.eventType || "Ticket Update";
    const ticket = payload.payload || payload;

    // Extract ticket info with fallbacks
    const ticketNumber = ticket.ticketNumber || ticket.id || "Unknown";
    const subject = ticket.subject || "No subject";
    const status = ticket.status || ticket.statusType || "New";
    const priority = ticket.priority || "Medium";
    const contactEmail = ticket.contact?.email || ticket.email || "Unknown";
    const contactName = ticket.contact?.name || ticket.contactName || contactEmail.split("@")[0];
    const category = ticket.category || ticket.classification || "General";
    const webUrl = ticket.webUrl || `https://desk.zoho.com/support/kniferoll/ShowHomePage.do#Cases/dv/${ticket.id}`;

    // Determine color based on priority
    const priorityColors: Record<string, number> = {
      High: 0xe74c3c, // Red
      Medium: 0xf39c12, // Orange
      Low: 0x3498db, // Blue
    };
    const color = priorityColors[priority] || 0x95a5a6; // Gray default

    // Build Discord embed
    const embed = {
      title: `#${ticketNumber}: ${subject}`,
      url: webUrl,
      color,
      fields: [
        { name: "Status", value: status, inline: true },
        { name: "Priority", value: priority, inline: true },
        { name: "Category", value: category, inline: true },
        { name: "From", value: `${contactName} (${contactEmail})`, inline: false },
      ],
      footer: { text: `Event: ${eventType}` },
      timestamp: new Date().toISOString(),
    };

    // Send to Discord
    const discordResponse = await fetch(discordWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Zoho Desk",
        avatar_url: "https://www.zohowebstatic.com/sites/zweb/images/desk/favicon.ico",
        embeds: [embed],
      }),
    });

    if (!discordResponse.ok) {
      const error = await discordResponse.text();
      console.error("Discord webhook failed:", error);
      return new Response(`Discord error: ${error}`, { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
