-- Add grow_id to profiles table (unique, required for game identity)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS grow_id TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_grow_id ON public.profiles(grow_id);

-- Add low_stock_threshold to items table
ALTER TABLE public.items 
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 0;

-- Create user_settings table for notification preferences
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  low_stock_alerts_enabled BOOLEAN NOT NULL DEFAULT true,
  low_stock_threshold_global INTEGER DEFAULT 5,
  push_notifications_enabled BOOLEAN NOT NULL DEFAULT false,
  email_notifications_enabled BOOLEAN NOT NULL DEFAULT false,
  theme TEXT NOT NULL DEFAULT 'dark',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_settings
CREATE POLICY "Users can view their own settings"
ON public.user_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
ON public.user_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
ON public.user_settings FOR UPDATE
USING (auth.uid() = user_id);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grow_id TEXT NOT NULL,
  world TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, grow_id, world)
);

-- Enable RLS on suppliers
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- RLS policies for suppliers
CREATE POLICY "Users can view their own suppliers"
ON public.suppliers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own suppliers"
ON public.suppliers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own suppliers"
ON public.suppliers FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own suppliers"
ON public.suppliers FOR DELETE
USING (auth.uid() = user_id);

-- Create supplier_items table to track what items each supplier provides
CREATE TABLE IF NOT EXISTS public.supplier_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  unit_price NUMERIC NOT NULL,
  currency_unit TEXT NOT NULL DEFAULT 'WL',
  quantity_per_unit INTEGER NOT NULL DEFAULT 1,
  lead_time_days INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, item_id)
);

-- Enable RLS on supplier_items
ALTER TABLE public.supplier_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for supplier_items (through supplier ownership)
CREATE POLICY "Users can view their supplier items"
ON public.supplier_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.suppliers 
    WHERE suppliers.id = supplier_items.supplier_id 
    AND suppliers.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their supplier items"
ON public.supplier_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.suppliers 
    WHERE suppliers.id = supplier_items.supplier_id 
    AND suppliers.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their supplier items"
ON public.supplier_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.suppliers 
    WHERE suppliers.id = supplier_items.supplier_id 
    AND suppliers.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their supplier items"
ON public.supplier_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.suppliers 
    WHERE suppliers.id = supplier_items.supplier_id 
    AND suppliers.user_id = auth.uid()
  )
);

-- Create triggers for updated_at
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_items_updated_at
BEFORE UPDATE ON public.supplier_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON public.suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_items_supplier_id ON public.supplier_items(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_items_item_id ON public.supplier_items(item_id);