
-- Create trade_ratings table
CREATE TABLE public.trade_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rater_user_id UUID NOT NULL,
  rated_grow_id TEXT NOT NULL,
  rated_type TEXT NOT NULL DEFAULT 'supplier',
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT rating_range CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT valid_rated_type CHECK (rated_type IN ('supplier', 'buyer'))
);

-- Add updated_at trigger
CREATE TRIGGER update_trade_ratings_updated_at
  BEFORE UPDATE ON public.trade_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.trade_ratings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read all ratings
CREATE POLICY "Anyone can read trade ratings"
  ON public.trade_ratings FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Users can insert their own ratings
CREATE POLICY "Users can insert their own ratings"
  ON public.trade_ratings FOR INSERT
  WITH CHECK (auth.uid() = rater_user_id);

-- Users can update their own ratings
CREATE POLICY "Users can update their own ratings"
  ON public.trade_ratings FOR UPDATE
  USING (auth.uid() = rater_user_id);

-- Users can delete their own ratings
CREATE POLICY "Users can delete their own ratings"
  ON public.trade_ratings FOR DELETE
  USING (auth.uid() = rater_user_id);

-- Create unique constraint: one rating per user per grow_id per type
CREATE UNIQUE INDEX idx_unique_rating ON public.trade_ratings (rater_user_id, rated_grow_id, rated_type);

-- Create price_alerts table
CREATE TABLE public.price_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_name TEXT NOT NULL,
  target_price NUMERIC NOT NULL,
  currency_unit TEXT NOT NULL DEFAULT 'WL',
  alert_type TEXT NOT NULL DEFAULT 'below',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_alert_type CHECK (alert_type IN ('below', 'above'))
);

-- Enable RLS
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

-- Users can manage their own price alerts
CREATE POLICY "Users can read their own price alerts"
  ON public.price_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own price alerts"
  ON public.price_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own price alerts"
  ON public.price_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own price alerts"
  ON public.price_alerts FOR DELETE
  USING (auth.uid() = user_id);
