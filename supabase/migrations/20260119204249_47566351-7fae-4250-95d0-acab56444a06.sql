-- Insert email template settings
INSERT INTO public.app_settings (setting_key, setting_value, description)
VALUES (
  'email_template',
  '{
    "app_name": "GT Inventory",
    "logo_emoji": "📦",
    "primary_color": "#6366f1",
    "secondary_color": "#8b5cf6",
    "footer_text": "GT Inventory. All rights reserved.",
    "signup_subject": "Verify Your Email - {{app_name}}",
    "signup_heading": "Verify Your Email",
    "signup_message": "Welcome to {{app_name}}! Use the code below to verify your email address.",
    "reset_subject": "Reset Your Password - {{app_name}}",
    "reset_heading": "Reset Your Password",
    "reset_message": "You requested to reset your password. Use the code below to complete the process."
  }'::jsonb,
  'Email template customization for OTP emails'
)
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

-- Insert rate limit settings
INSERT INTO public.app_settings (setting_key, setting_value, description)
VALUES (
  'rate_limit',
  '{
    "max_attempts": 5,
    "window_minutes": 15,
    "block_minutes": 30
  }'::jsonb,
  'Rate limiting configuration for OTP requests'
)
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;