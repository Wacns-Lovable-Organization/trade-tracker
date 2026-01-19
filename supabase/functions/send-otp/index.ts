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

interface OTPRequest {
  email: string;
  otp: string;
  type: "signup" | "password_reset";
}

interface EmailTemplateSettings {
  app_name: string;
  logo_emoji: string;
  primary_color: string;
  secondary_color: string;
  footer_text: string;
  signup_subject: string;
  signup_heading: string;
  signup_message: string;
  reset_subject: string;
  reset_heading: string;
  reset_message: string;
}

interface RateLimitSettings {
  max_attempts: number;
  window_minutes: number;
  block_minutes: number;
}

const DEFAULT_EMAIL_TEMPLATE: EmailTemplateSettings = {
  app_name: "GT Inventory",
  logo_emoji: "📦",
  primary_color: "#6366f1",
  secondary_color: "#8b5cf6",
  footer_text: "GT Inventory. All rights reserved.",
  signup_subject: "Verify Your Email - {{app_name}}",
  signup_heading: "Verify Your Email",
  signup_message: "Welcome to {{app_name}}! Use the code below to verify your email address.",
  reset_subject: "Reset Your Password - {{app_name}}",
  reset_heading: "Reset Your Password",
  reset_message: "You requested to reset your password. Use the code below to complete the process.",
};

const DEFAULT_RATE_LIMIT: RateLimitSettings = {
  max_attempts: 5,
  window_minutes: 15,
  block_minutes: 30,
};

function replaceTemplateVariables(text: string, template: EmailTemplateSettings): string {
  return text.replace(/\{\{app_name\}\}/g, template.app_name);
}

function generateEmailHtml(otp: string, type: "signup" | "password_reset", template: EmailTemplateSettings): string {
  const isPasswordReset = type === "password_reset";
  const heading = isPasswordReset ? template.reset_heading : template.signup_heading;
  const message = replaceTemplateVariables(
    isPasswordReset ? template.reset_message : template.signup_message,
    template
  );

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
                <span style="color: white; font-size: 28px;">${template.logo_emoji}</span>
              </div>
              <h1 style="color: #18181b; margin: 0; font-size: 24px; font-weight: 600;">
                ${heading}
              </h1>
            </div>
            
            <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 30px; text-align: center;">
              ${message}
            </p>
            
            <div style="background-color: #f4f4f5; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 30px;">
              <p style="color: #71717a; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">
                Your verification code
              </p>
              <div style="font-size: 36px; font-weight: 700; color: #18181b; letter-spacing: 8px; font-family: monospace;">
                ${otp}
              </div>
            </div>
            
            <p style="color: #a1a1aa; font-size: 14px; text-align: center; margin: 0;">
              This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.
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
    const { email, otp, type }: OTPRequest = await req.json();

    if (!email || !otp || !type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch email template and rate limit settings from app_settings
    let emailTemplate = DEFAULT_EMAIL_TEMPLATE;
    let rateLimitConfig = DEFAULT_RATE_LIMIT;

    try {
      const { data: settingsData } = await supabase
        .from("app_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["email_template", "rate_limit"]);

      if (settingsData) {
        settingsData.forEach((row: { setting_key: string; setting_value: unknown }) => {
          if (row.setting_key === "email_template") {
            emailTemplate = { ...DEFAULT_EMAIL_TEMPLATE, ...(row.setting_value as Partial<EmailTemplateSettings>) };
          } else if (row.setting_key === "rate_limit") {
            rateLimitConfig = { ...DEFAULT_RATE_LIMIT, ...(row.setting_value as Partial<RateLimitSettings>) };
          }
        });
      }
    } catch (settingsError) {
      console.warn("Could not fetch app settings, using defaults:", settingsError);
    }

    // Get IP address from request headers
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                      req.headers.get("cf-connecting-ip") || 
                      null;

    // Check rate limit with configured values
    const { data: rateLimitResult, error: rateLimitError } = await supabase.rpc(
      "check_otp_rate_limit",
      {
        _email: email,
        _ip_address: ipAddress,
        _max_attempts: rateLimitConfig.max_attempts,
        _window_minutes: rateLimitConfig.window_minutes,
        _block_minutes: rateLimitConfig.block_minutes,
      }
    );

    if (rateLimitError) {
      console.error("Rate limit check error:", rateLimitError);
      // Continue anyway if rate limit check fails
    } else if (rateLimitResult && rateLimitResult.length > 0) {
      const { allowed, remaining_attempts, blocked_until, message } = rateLimitResult[0];
      
      if (!allowed) {
        console.log(`Rate limit blocked for ${email}, blocked until: ${blocked_until}`);
        return new Response(
          JSON.stringify({ 
            error: message || "Too many attempts. Please try again later.",
            blocked_until,
            remaining_attempts: 0
          }),
          { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      console.log(`OTP request for ${email}, remaining attempts: ${remaining_attempts}`);
    }

    const isPasswordReset = type === "password_reset";
    const subject = replaceTemplateVariables(
      isPasswordReset ? emailTemplate.reset_subject : emailTemplate.signup_subject,
      emailTemplate
    );
    const htmlContent = generateEmailHtml(otp, type, emailTemplate);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${emailTemplate.app_name} <onboarding@resend.dev>`,
        to: [email],
        subject: subject,
        html: htmlContent,
      }),
    });

    const result = await emailResponse.json();
    
    if (!emailResponse.ok) {
      throw new Error(result.message || "Failed to send email");
    }

    console.log("OTP email sent successfully:", result);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error sending OTP email:", error);
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
