-- Drop and recreate the admin dashboard stats function
DROP FUNCTION IF EXISTS public.get_admin_dashboard_stats();

CREATE FUNCTION public.get_admin_dashboard_stats()
RETURNS TABLE(
  total_users BIGINT,
  active_users BIGINT,
  total_inventory BIGINT,
  total_sales BIGINT,
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
    (SELECT COUNT(DISTINCT user_id) FROM public.user_devices WHERE is_online = true) as online_users
$$;

-- Create function to get profit summary by currency
CREATE OR REPLACE FUNCTION public.get_admin_profit_by_currency()
RETURNS TABLE(
  currency_unit TEXT,
  total_revenue NUMERIC,
  total_profit NUMERIC,
  sale_count BIGINT
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    currency_unit,
    SUM(sale_price * quantity_sold) as total_revenue,
    SUM(profit) as total_profit,
    COUNT(*) as sale_count
  FROM public.sales
  GROUP BY currency_unit
  ORDER BY 
    CASE currency_unit 
      WHEN 'BGL' THEN 1 
      WHEN 'DL' THEN 2 
      WHEN 'WL' THEN 3 
      ELSE 4 
    END
$$;