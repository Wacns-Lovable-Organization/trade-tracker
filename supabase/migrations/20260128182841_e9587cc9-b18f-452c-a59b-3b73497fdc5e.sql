-- Add default currency display preference to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS default_currency_display text NOT NULL DEFAULT 'original';

-- Add is_cost_only flag to items table for non-resellable items
ALTER TABLE public.items 
ADD COLUMN IF NOT EXISTS is_cost_only boolean NOT NULL DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.user_settings.default_currency_display IS 'Default currency display format: original, dl, or bgl';
COMMENT ON COLUMN public.items.is_cost_only IS 'Flag for items that are costs without revenue (not resellable)';