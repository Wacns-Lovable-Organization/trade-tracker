
-- Phase 1: Add discord_webhook_url to user_settings
ALTER TABLE public.user_settings ADD COLUMN discord_webhook_url text;

-- Phase 2: Create shared_snapshots table
CREATE TABLE public.shared_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  snapshot_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  title text,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own snapshots" ON public.shared_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own snapshots" ON public.shared_snapshots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own snapshots" ON public.shared_snapshots
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active snapshots" ON public.shared_snapshots
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));
