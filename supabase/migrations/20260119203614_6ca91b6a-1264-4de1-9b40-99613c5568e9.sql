-- Create app settings table for system-wide configuration
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can read app settings"
  ON public.app_settings FOR SELECT
  USING (true);

-- Only owners/admins can update settings
CREATE POLICY "Only admins can update app settings"
  ON public.app_settings FOR UPDATE
  USING (public.has_admin_access(auth.uid()));

CREATE POLICY "Only admins can insert app settings"
  ON public.app_settings FOR INSERT
  WITH CHECK (public.has_admin_access(auth.uid()));

-- Insert default auth method setting
INSERT INTO public.app_settings (setting_key, setting_value, description)
VALUES (
  'auth_method',
  '{"method": "supabase", "resend_enabled": false}'::jsonb,
  'Authentication method: "supabase" for built-in auth or "resend" for custom OTP via Resend'
)
ON CONFLICT (setting_key) DO NOTHING;

-- Create trigger for updated_at
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();