-- Create admin activity logs table
CREATE TABLE public.admin_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  action_type text NOT NULL,
  target_user_id uuid,
  target_email text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admin users can view logs
CREATE POLICY "Admin users can view activity logs"
ON public.admin_activity_logs
FOR SELECT
USING (has_admin_access(auth.uid()));

-- Only admin users can insert logs
CREATE POLICY "Admin users can insert activity logs"
ON public.admin_activity_logs
FOR INSERT
WITH CHECK (has_admin_access(auth.uid()));

-- Create blacklist table
CREATE TABLE public.blacklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('email', 'ip', 'device_id')),
  value text NOT NULL,
  reason text,
  blocked_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE(type, value)
);

-- Enable RLS
ALTER TABLE public.blacklist ENABLE ROW LEVEL SECURITY;

-- Only admin users can view blacklist
CREATE POLICY "Admin users can view blacklist"
ON public.blacklist
FOR SELECT
USING (has_admin_access(auth.uid()));

-- Only admin/owner can manage blacklist
CREATE POLICY "Admin users can manage blacklist"
ON public.blacklist
FOR ALL
USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_blacklist_type_value ON public.blacklist(type, value) WHERE is_active = true;
CREATE INDEX idx_blacklist_email ON public.blacklist(value) WHERE type = 'email' AND is_active = true;

-- Create function to check if user is blacklisted
CREATE OR REPLACE FUNCTION public.is_blacklisted(_email text, _ip text DEFAULT NULL, _device_id text DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.blacklist
    WHERE is_active = true
      AND (expires_at IS NULL OR expires_at > now())
      AND (
        (type = 'email' AND value = lower(_email))
        OR (type = 'ip' AND value = _ip AND _ip IS NOT NULL)
        OR (type = 'device_id' AND value = _device_id AND _device_id IS NOT NULL)
      )
  )
$$;

-- Add email column to profiles for easier admin access
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Create function to get user counts for admin panel
CREATE OR REPLACE FUNCTION public.get_admin_user_stats(_user_id uuid)
RETURNS TABLE(inventory_count bigint, sales_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (SELECT COUNT(*) FROM public.inventory_entries WHERE user_id = _user_id) as inventory_count,
    (SELECT COUNT(*) FROM public.sales WHERE user_id = _user_id) as sales_count
$$;