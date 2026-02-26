
-- Goals table
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_type TEXT NOT NULL DEFAULT 'profit',
  target_value NUMERIC NOT NULL,
  current_value NUMERIC NOT NULL DEFAULT 0,
  currency_unit TEXT NOT NULL DEFAULT 'WL',
  title TEXT NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own goals" ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals" ON public.goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own goals" ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- Notes table
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  color TEXT NOT NULL DEFAULT 'default',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notes" ON public.notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notes" ON public.notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notes" ON public.notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notes" ON public.notes FOR DELETE USING (auth.uid() = user_id);

-- Inventory templates table
CREATE TABLE public.inventory_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_name TEXT NOT NULL,
  item_id UUID,
  item_name TEXT NOT NULL,
  category_id UUID,
  default_quantity INTEGER NOT NULL DEFAULT 1,
  default_unit_cost NUMERIC NOT NULL DEFAULT 0,
  default_currency_unit TEXT NOT NULL DEFAULT 'WL',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own templates" ON public.inventory_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own templates" ON public.inventory_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own templates" ON public.inventory_templates FOR DELETE USING (auth.uid() = user_id);

-- Saved worlds table
CREATE TABLE public.saved_worlds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  world_name TEXT NOT NULL,
  owner_grow_id TEXT,
  category TEXT NOT NULL DEFAULT 'Other',
  notes TEXT,
  last_visited_at TIMESTAMP WITH TIME ZONE,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_worlds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own worlds" ON public.saved_worlds FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own worlds" ON public.saved_worlds FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own worlds" ON public.saved_worlds FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own worlds" ON public.saved_worlds FOR DELETE USING (auth.uid() = user_id);

-- Feature flags for new features
INSERT INTO public.feature_flags (feature_key, feature_name, description, is_enabled)
VALUES 
  ('goals_tracker', 'Goals & Milestones', 'Personal goal-setting and progress tracking', true),
  ('notes_journal', 'Notes & Journal', 'Personal notes and market observations', true),
  ('world_directory', 'World Directory', 'Save and organize favorite game worlds', true);

-- Updated at triggers
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saved_worlds_updated_at BEFORE UPDATE ON public.saved_worlds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
