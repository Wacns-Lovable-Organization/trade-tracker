import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp, type }: OTPRequest = await req.json();

    const isPasswordReset = type === "password_reset";
    const subject = isPasswordReset
      ? "Reset Your Password - GT Inventory"
      : "Verify Your Email - GT Inventory";

    const htmlContent = `
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
                <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 12px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 28px;">📦</span>
                </div>
                <h1 style="color: #18181b; margin: 0; font-size: 24px; font-weight: 600;">
                  ${isPasswordReset ? "Reset Your Password" : "Verify Your Email"}
                </h1>
              </div>
              
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 30px; text-align: center;">
                ${isPasswordReset
                  ? "You requested to reset your password. Use the code below to complete the process."
                  : "Welcome to GT Inventory! Use the code below to verify your email address."}
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
              © ${new Date().getFullYear()} GT Inventory. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "GT Inventory <onboarding@resend.dev>",
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
  } catch (error: any) {
    console.error("Error sending OTP email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
