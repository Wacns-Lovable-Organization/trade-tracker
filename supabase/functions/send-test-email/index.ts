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

interface TestEmailRequest {
  email: string;
  type: "signup" | "password_reset";
  template: {
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
  };
}

function replaceTemplateVariables(text: string, appName: string): string {
  return text.replace(/\{\{app_name\}\}/g, appName);
}

function generateTestEmailHtml(type: "signup" | "password_reset", template: TestEmailRequest["template"]): string {
  const isPasswordReset = type === "password_reset";
  const heading = isPasswordReset ? template.reset_heading : template.signup_heading;
  const message = replaceTemplateVariables(
    isPasswordReset ? template.reset_message : template.signup_message,
    template.app_name
  );
  const testOtp = "123456"; // Sample OTP for preview

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
                ${testOtp}
              </div>
            </div>
            
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
              <p style="color: #92400e; font-size: 14px; margin: 0; text-align: center;">
                ⚠️ This is a TEST email. The code above is for preview purposes only.
              </p>
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
    // Verify authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Verify the user is an admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user has admin access
    const { data: hasAccess } = await supabase.rpc("has_admin_access", { _user_id: user.id });

    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, type, template }: TestEmailRequest = await req.json();

    if (!email || !type || !template) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const isPasswordReset = type === "password_reset";
    const subject = replaceTemplateVariables(
      isPasswordReset ? template.reset_subject : template.signup_subject,
      template.app_name
    ) + " [TEST]";
    
    const htmlContent = generateTestEmailHtml(type, template);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${template.app_name} <onboarding@resend.dev>`,
        to: [email],
        subject: subject,
        html: htmlContent,
      }),
    });

    const result = await emailResponse.json();

    if (!emailResponse.ok) {
      throw new Error(result.message || "Failed to send test email");
    }

    console.log("Test email sent successfully:", result);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error sending test email:", error);
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
