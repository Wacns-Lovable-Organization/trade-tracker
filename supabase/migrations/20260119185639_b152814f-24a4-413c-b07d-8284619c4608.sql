-- Add language preference to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en';

-- Create user_feature_overrides table for per-user feature control
CREATE TABLE IF NOT EXISTS public.user_feature_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  feature_key TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, feature_key)
);

-- Enable RLS on user_feature_overrides
ALTER TABLE public.user_feature_overrides ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_feature_overrides
CREATE POLICY "Admins can manage all feature overrides" 
ON public.user_feature_overrides 
FOR ALL 
USING (has_admin_access(auth.uid()));

CREATE POLICY "Users can view their own feature overrides" 
ON public.user_feature_overrides 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create page_analytics table for tracking page views
CREATE TABLE IF NOT EXISTS public.page_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT NOT NULL,
  page_path TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  country TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on page_analytics
ALTER TABLE public.page_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for page_analytics
CREATE POLICY "Anyone can insert page analytics" 
ON public.page_analytics 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all page analytics" 
ON public.page_analytics 
FOR SELECT 
USING (has_admin_access(auth.uid()));

CREATE POLICY "Users can view their own page analytics" 
ON public.page_analytics 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create function to get page analytics summary
CREATE OR REPLACE FUNCTION public.get_page_analytics_summary(
  _days INTEGER DEFAULT 30
)
RETURNS TABLE (
  page_path TEXT,
  page_title TEXT,
  view_count BIGINT,
  unique_users BIGINT,
  avg_duration_ms NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    page_path,
    MAX(page_title) as page_title,
    COUNT(*) as view_count,
    COUNT(DISTINCT user_id) as unique_users,
    AVG(duration_ms)::NUMERIC as avg_duration_ms
  FROM public.page_analytics
  WHERE created_at >= NOW() - (_days || ' days')::INTERVAL
  GROUP BY page_path
  ORDER BY view_count DESC
$$;

-- Add trigger for updated_at on user_feature_overrides
CREATE TRIGGER update_user_feature_overrides_updated_at
BEFORE UPDATE ON public.user_feature_overrides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();