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

interface NotifyRequest {
  action_type: string;
  admin_email: string;
  admin_name: string;
  target_email?: string;
  target_name?: string;
  details?: Record<string, unknown>;
}

const ACTION_LABELS: Record<string, string> = {
  impersonation_start: "Started Impersonating User",
  impersonation_end: "Ended User Impersonation",
  impersonation_action: "Made Changes While Impersonating",
  role_assigned: "Assigned Role to User",
  role_removed: "Removed Role from User",
  user_blacklisted: "Blacklisted User",
  user_unblacklisted: "Removed User from Blacklist",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action_type, admin_email, admin_name, target_email, target_name, details }: NotifyRequest = await req.json();

    if (!action_type || !admin_email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client to get admin users who should be notified
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get all admin users (owners and admins) to notify
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .in('role', ['owner', 'admin']);

    if (!adminRoles || adminRoles.length === 0) {
      console.log("No admins to notify");
      return new Response(JSON.stringify({ success: true, notified: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get email addresses for admin users
    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('email')
      .in('user_id', adminRoles.map(r => r.user_id))
      .not('email', 'is', null);

    const adminEmails = adminProfiles?.map(p => p.email).filter(Boolean) || [];
    
    // Don't notify the admin who performed the action
    const notifyEmails = adminEmails.filter(email => email !== admin_email);

    if (notifyEmails.length === 0) {
      console.log("No other admins to notify");
      return new Response(JSON.stringify({ success: true, notified: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const actionLabel = ACTION_LABELS[action_type] || action_type;
    const isSensitive = action_type.includes('impersonation') || action_type.includes('role');
    
    const detailsHtml = details && Object.keys(details).length > 0
      ? `<div style="background-color: #f4f4f5; border-radius: 4px; padding: 12px; margin-top: 16px;">
          <p style="color: #71717a; font-size: 12px; margin: 0 0 8px 0;">Details:</p>
          ${Object.entries(details).map(([key, value]) => 
            `<p style="color: #52525b; font-size: 14px; margin: 4px 0;"><strong>${key}:</strong> ${value}</p>`
          ).join('')}
        </div>`
      : '';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 60px; height: 60px; background: ${isSensitive ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)'}; border-radius: 12px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 28px;">${isSensitive ? '⚠️' : '🔔'}</span>
                </div>
                <h1 style="color: #18181b; margin: 0; font-size: 24px; font-weight: 600;">
                  Admin Action Alert
                </h1>
              </div>
              
              <div style="background-color: ${isSensitive ? '#fef3c7' : '#eff6ff'}; border-left: 4px solid ${isSensitive ? '#f59e0b' : '#3b82f6'}; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
                <p style="color: ${isSensitive ? '#92400e' : '#1e40af'}; font-size: 16px; font-weight: 600; margin: 0;">
                  ${actionLabel}
                </p>
              </div>
              
              <div style="color: #52525b; font-size: 16px; line-height: 1.6;">
                <p><strong>Admin:</strong> ${admin_name} (${admin_email})</p>
                ${target_email ? `<p><strong>Target User:</strong> ${target_name || 'Unknown'} (${target_email})</p>` : ''}
                <p><strong>Time:</strong> ${new Date().toISOString()}</p>
              </div>
              
              ${detailsHtml}
              
              <p style="color: #a1a1aa; font-size: 14px; text-align: center; margin-top: 30px;">
                This is an automated notification from GT Inventory admin monitoring.
              </p>
            </div>
            
            <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin-top: 20px;">
              © ${new Date().getFullYear()} GT Inventory. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `;

    // Send to all admin emails
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "GT Inventory <onboarding@resend.dev>",
        to: notifyEmails,
        subject: `[Admin Alert] ${actionLabel}${target_name ? ` - ${target_name}` : ''}`,
        html: htmlContent,
      }),
    });

    const result = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.error("Failed to send notification:", result);
      // Don't throw - we don't want to block the action if notification fails
    } else {
      console.log(`Admin notification sent to ${notifyEmails.length} admins:`, result);
    }

    return new Response(JSON.stringify({ success: true, notified: notifyEmails.length }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending admin notification:", error);
    // Return success anyway - we don't want to block admin actions if notification fails
    return new Response(
      JSON.stringify({ success: true, error: error.message }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
