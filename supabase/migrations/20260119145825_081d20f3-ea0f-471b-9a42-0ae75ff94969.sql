-- Create user_devices table to track user devices and sessions
CREATE TABLE public.user_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_id TEXT NOT NULL,
  device_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  browser TEXT,
  os TEXT,
  device_type TEXT,
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_user_devices_user_id ON public.user_devices(user_id);
CREATE INDEX idx_user_devices_device_id ON public.user_devices(device_id);
CREATE INDEX idx_user_devices_is_online ON public.user_devices(is_online);

-- Enable RLS
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own devices
CREATE POLICY "Users can view their own devices"
ON public.user_devices
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own devices"
ON public.user_devices
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices"
ON public.user_devices
FOR UPDATE
USING (auth.uid() = user_id);

-- Admin users can view all devices
CREATE POLICY "Admin users can view all devices"
ON public.user_devices
FOR SELECT
USING (has_admin_access(auth.uid()));

-- Admin users can manage all devices
CREATE POLICY "Admin users can manage all devices"
ON public.user_devices
FOR ALL
USING (has_admin_access(auth.uid()));

-- Function to upsert device info
CREATE OR REPLACE FUNCTION public.upsert_user_device(
  _device_id TEXT,
  _device_info JSONB,
  _ip_address TEXT DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL,
  _browser TEXT DEFAULT NULL,
  _os TEXT DEFAULT NULL,
  _device_type TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result_id UUID;
BEGIN
  INSERT INTO public.user_devices (
    user_id, device_id, device_info, ip_address, user_agent, browser, os, device_type, is_online, last_seen_at
  ) VALUES (
    auth.uid(), _device_id, _device_info, _ip_address, _user_agent, _browser, _os, _device_type, true, now()
  )
  ON CONFLICT (user_id, device_id) 
  DO UPDATE SET
    device_info = EXCLUDED.device_info,
    ip_address = EXCLUDED.ip_address,
    user_agent = EXCLUDED.user_agent,
    browser = EXCLUDED.browser,
    os = EXCLUDED.os,
    device_type = EXCLUDED.device_type,
    is_online = true,
    last_seen_at = now()
  RETURNING id INTO _result_id;
  
  RETURN _result_id;
END;
$$;

-- Add unique constraint for user_id + device_id
ALTER TABLE public.user_devices ADD CONSTRAINT unique_user_device UNIQUE (user_id, device_id);

-- Function to set device offline
CREATE OR REPLACE FUNCTION public.set_device_offline(_device_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_devices
  SET is_online = false, last_seen_at = now()
  WHERE user_id = auth.uid() AND device_id = _device_id;
END;
$$;

-- Function to get admin dashboard stats
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS TABLE(
  total_users BIGINT,
  active_users BIGINT,
  total_inventory BIGINT,
  total_sales BIGINT,
  total_revenue NUMERIC,
  online_users BIGINT
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(DISTINCT user_id) FROM public.profiles) as total_users,
    (SELECT COUNT(DISTINCT user_id) FROM public.user_devices WHERE last_seen_at > now() - interval '7 days') as active_users,
    (SELECT COUNT(*) FROM public.inventory_entries) as total_inventory,
    (SELECT COUNT(*) FROM public.sales) as total_sales,
    (SELECT COALESCE(SUM(sale_price * quantity_sold), 0) FROM public.sales) as total_revenue,
    (SELECT COUNT(DISTINCT user_id) FROM public.user_devices WHERE is_online = true) as online_users
$$;

-- Function to get sales trends for admin (last 30 days grouped by day)
CREATE OR REPLACE FUNCTION public.get_admin_sales_trends()
RETURNS TABLE(
  sale_date DATE,
  sale_count BIGINT,
  total_revenue NUMERIC,
  total_profit NUMERIC
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    DATE(sold_at) as sale_date,
    COUNT(*) as sale_count,
    SUM(sale_price * quantity_sold) as total_revenue,
    SUM(profit) as total_profit
  FROM public.sales
  WHERE sold_at >= now() - interval '30 days'
  GROUP BY DATE(sold_at)
  ORDER BY sale_date ASC
$$;

-- Function to get user activity stats (signups per day last 30 days)
CREATE OR REPLACE FUNCTION public.get_admin_user_activity()
RETURNS TABLE(
  activity_date DATE,
  new_users BIGINT,
  active_devices BIGINT
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    d.activity_date,
    COALESCE(p.new_users, 0) as new_users,
    COALESCE(ud.active_devices, 0) as active_devices
  FROM (
    SELECT generate_series(
      (now() - interval '30 days')::date,
      now()::date,
      '1 day'::interval
    )::date as activity_date
  ) d
  LEFT JOIN (
    SELECT DATE(created_at) as signup_date, COUNT(*) as new_users
    FROM public.profiles
    WHERE created_at >= now() - interval '30 days'
    GROUP BY DATE(created_at)
  ) p ON d.activity_date = p.signup_date
  LEFT JOIN (
    SELECT DATE(first_seen_at) as device_date, COUNT(*) as active_devices
    FROM public.user_devices
    WHERE first_seen_at >= now() - interval '30 days'
    GROUP BY DATE(first_seen_at)
  ) ud ON d.activity_date = ud.device_date
  ORDER BY d.activity_date ASC
$$;