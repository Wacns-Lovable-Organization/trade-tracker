-- Part 1: Remove display_name from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS display_name;

-- Update the handle_new_user function to not use display_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, grow_id)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'grow_id'
  );
  
  -- Create default "Other" category for new user
  INSERT INTO public.categories (user_id, name)
  VALUES (NEW.id, 'Other');
  
  -- Create default user settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- Part 2: Add contact info columns to suppliers
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS discord text,
ADD COLUMN IF NOT EXISTS instagram text,
ADD COLUMN IF NOT EXISTS facebook text,
ADD COLUMN IF NOT EXISTS twitter text,
ADD COLUMN IF NOT EXISTS youtube text,
ADD COLUMN IF NOT EXISTS tiktok text,
ADD COLUMN IF NOT EXISTS telegram text,
ADD COLUMN IF NOT EXISTS whatsapp text;

-- Part 3: Create buyers table
CREATE TABLE IF NOT EXISTS public.buyers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  grow_id text NOT NULL,
  world text NOT NULL,
  phone text,
  email text,
  discord text,
  instagram text,
  facebook text,
  twitter text,
  youtube text,
  tiktok text,
  telegram text,
  whatsapp text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on buyers
ALTER TABLE public.buyers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for buyers
CREATE POLICY "Users can view their own buyers" 
ON public.buyers FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own buyers" 
ON public.buyers FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own buyers" 
ON public.buyers FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own buyers" 
ON public.buyers FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at on buyers
CREATE TRIGGER update_buyers_updated_at
BEFORE UPDATE ON public.buyers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create buyer_items table
CREATE TABLE IF NOT EXISTS public.buyer_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id uuid NOT NULL REFERENCES public.buyers(id) ON DELETE CASCADE,
  item_id uuid NOT NULL,
  unit_price numeric NOT NULL,
  currency_unit text NOT NULL DEFAULT 'WL'::text,
  quantity_per_unit integer NOT NULL DEFAULT 1,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on buyer_items
ALTER TABLE public.buyer_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for buyer_items
CREATE POLICY "Users can view their buyer items" 
ON public.buyer_items FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.buyers 
  WHERE buyers.id = buyer_items.buyer_id 
  AND buyers.user_id = auth.uid()
));

CREATE POLICY "Users can insert their buyer items" 
ON public.buyer_items FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.buyers 
  WHERE buyers.id = buyer_items.buyer_id 
  AND buyers.user_id = auth.uid()
));

CREATE POLICY "Users can update their buyer items" 
ON public.buyer_items FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.buyers 
  WHERE buyers.id = buyer_items.buyer_id 
  AND buyers.user_id = auth.uid()
));

CREATE POLICY "Users can delete their buyer items" 
ON public.buyer_items FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.buyers 
  WHERE buyers.id = buyer_items.buyer_id 
  AND buyers.user_id = auth.uid()
));

-- Create trigger for updated_at on buyer_items
CREATE TRIGGER update_buyer_items_updated_at
BEFORE UPDATE ON public.buyer_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();