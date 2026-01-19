import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  emails: string[];
  title: string;
  content: string;
  sender: string;
}

interface EmailTemplateSettings {
  app_name: string;
  logo_emoji: string;
  primary_color: string;
  secondary_color: string;
  footer_text: string;
}

const DEFAULT_EMAIL_TEMPLATE: EmailTemplateSettings = {
  app_name: "GT Inventory",
  logo_emoji: "📦",
  primary_color: "#6366f1",
  secondary_color: "#8b5cf6",
  footer_text: "GT Inventory. All rights reserved.",
};

function generateNotificationEmailHtml(
  title: string, 
  content: string, 
  sender: string, 
  template: EmailTemplateSettings
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, ${template.primary_color}, ${template.secondary_color}); border-radius: 12px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 28px;">🔔</span>
              </div>
              <h1 style="color: #18181b; margin: 0; font-size: 24px; font-weight: 600;">
                ${title}
              </h1>
              <p style="color: #71717a; font-size: 12px; margin-top: 8px;">
                From: ${sender}
              </p>
            </div>
            
            <div style="background-color: #f4f4f5; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0; white-space: pre-wrap;">
                ${content}
              </p>
            </div>
            
            <p style="color: #a1a1aa; font-size: 14px; text-align: center; margin: 0;">
              You received this notification from ${template.app_name}.
            </p>
          </div>
          
          <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin-top: 20px;">
            © ${new Date().getFullYear()} ${template.footer_text}
          </p>
        </div>
      </body>
    </html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { emails, title, content, sender }: NotificationEmailRequest = await req.json();

    if (!emails || emails.length === 0 || !title || !content) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch email template settings
    let emailTemplate = DEFAULT_EMAIL_TEMPLATE;

    try {
      const { data: settingsData } = await supabase
        .from("app_settings")
        .select("setting_value")
        .eq("setting_key", "email_template")
        .single();

      if (settingsData?.setting_value) {
        emailTemplate = { ...DEFAULT_EMAIL_TEMPLATE, ...(settingsData.setting_value as Partial<EmailTemplateSettings>) };
      }
    } catch (settingsError) {
      console.warn("Could not fetch email template settings, using defaults:", settingsError);
    }

    const htmlContent = generateNotificationEmailHtml(title, content, sender, emailTemplate);

    // Send emails in batches of 50 (Resend limit)
    const batchSize = 50;
    const batches = [];
    
    for (let i = 0; i < emails.length; i += batchSize) {
      batches.push(emails.slice(i, i + batchSize));
    }

    let successCount = 0;
    let errorCount = 0;

    for (const batch of batches) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: `${emailTemplate.app_name} <onboarding@resend.dev>`,
            to: batch,
            subject: title,
            html: htmlContent,
          }),
        });

        if (emailResponse.ok) {
          successCount += batch.length;
        } else {
          const errorResult = await emailResponse.json();
          console.error("Email batch error:", errorResult);
          errorCount += batch.length;
        }
      } catch (batchError) {
        console.error("Batch error:", batchError);
        errorCount += batch.length;
      }
    }

    console.log(`Notification emails sent: ${successCount} success, ${errorCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        failed: errorCount 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error sending notification emails:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
