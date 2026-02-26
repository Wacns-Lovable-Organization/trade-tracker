import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface DiscordEmbed {
  title: string;
  description?: string;
  color: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  timestamp?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const userId = claimsData.claims.sub;

    const { webhook_url, event_type, data } = await req.json();

    // If webhook_url not provided, fetch from user settings
    let url = webhook_url;
    if (!url) {
      const { data: settings } = await supabase
        .from("user_settings")
        .select("discord_webhook_url")
        .eq("user_id", userId)
        .maybeSingle();
      url = settings?.discord_webhook_url;
    }

    if (!url) {
      return new Response(
        JSON.stringify({ error: "No Discord webhook URL configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate URL format
    try {
      const parsed = new URL(url);
      if (!parsed.hostname.endsWith("discord.com")) {
        throw new Error("Invalid Discord webhook URL");
      }
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid Discord webhook URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build embed based on event type
    let embed: DiscordEmbed;
    const brandColor = 0x8b5cf6; // Purple

    switch (event_type) {
      case "test":
        embed = {
          title: "🎉 GrowStock Connected!",
          description:
            "Your Discord webhook is working. You'll receive notifications for sales, low stock alerts, and more.",
          color: brandColor,
          timestamp: new Date().toISOString(),
          footer: { text: "GrowStock Notifications" },
        };
        break;

      case "sale_recorded":
        embed = {
          title: "💰 New Sale Recorded",
          color: 0x22c55e,
          fields: [
            { name: "Item", value: data.item_name || "Unknown", inline: true },
            { name: "Qty Sold", value: String(data.quantity_sold || 0), inline: true },
            {
              name: "Revenue",
              value: `${data.amount_gained || 0} ${data.currency_unit || "WL"}`,
              inline: true,
            },
            {
              name: "Profit",
              value: `${data.profit?.toFixed(2) || "N/A"} ${data.currency_unit || "WL"}`,
              inline: true,
            },
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "GrowStock Sales" },
        };
        break;

      case "low_stock":
        embed = {
          title: "⚠️ Low Stock Alert",
          color: 0xf59e0b,
          fields: (data.items || []).map(
            (item: { name: string; remaining: number; threshold: number }) => ({
              name: item.name,
              value: `${item.remaining} remaining (threshold: ${item.threshold})`,
              inline: false,
            })
          ),
          timestamp: new Date().toISOString(),
          footer: { text: "GrowStock Inventory Alerts" },
        };
        break;

      default:
        embed = {
          title: "📊 GrowStock Update",
          description: data?.message || "You have a new notification from GrowStock.",
          color: brandColor,
          timestamp: new Date().toISOString(),
          footer: { text: "GrowStock" },
        };
    }

    // Send to Discord
    const discordRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      return new Response(
        JSON.stringify({ error: "Discord API error", details: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await discordRes.text(); // consume body

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
