
-- Create trade_posts table
CREATE TABLE public.trade_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_type TEXT NOT NULL DEFAULT 'WTS',
  item_name TEXT NOT NULL,
  quantity INTEGER,
  price_per_unit NUMERIC,
  currency_unit TEXT NOT NULL DEFAULT 'WL',
  description TEXT,
  world TEXT NOT NULL,
  grow_id TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add updated_at trigger
CREATE TRIGGER update_trade_posts_updated_at
  BEFORE UPDATE ON public.trade_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.trade_posts ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read active posts
CREATE POLICY "Anyone can read active trade posts"
  ON public.trade_posts FOR SELECT
  USING (is_active = true OR user_id = auth.uid());

-- Users can insert their own posts
CREATE POLICY "Users can insert their own trade posts"
  ON public.trade_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update their own trade posts"
  ON public.trade_posts FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete their own trade posts"
  ON public.trade_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_posts;

-- Add trade_board feature flag
INSERT INTO public.feature_flags (feature_key, feature_name, description, is_enabled)
VALUES ('trade_board', 'Trade Board', 'Community trade listing board for WTB/WTS/WTT posts', true)
ON CONFLICT DO NOTHING;
