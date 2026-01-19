-- Create storage bucket for item images
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-images', 'item-images', true);

-- RLS policies for item-images bucket
CREATE POLICY "Users can view all item images"
ON storage.objects FOR SELECT
USING (bucket_id = 'item-images');

CREATE POLICY "Users can upload their own item images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'item-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own item images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'item-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own item images"
ON storage.objects FOR DELETE
USING (bucket_id = 'item-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add image_url column to items table
ALTER TABLE public.items
ADD COLUMN image_url TEXT DEFAULT NULL;