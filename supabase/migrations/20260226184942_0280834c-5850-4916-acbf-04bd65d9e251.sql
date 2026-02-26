
-- Add record_status column to main tables for soft delete
-- Values: 'active', 'deleted' (extensible for future statuses)

ALTER TABLE public.inventory_entries 
  ADD COLUMN IF NOT EXISTS record_status text NOT NULL DEFAULT 'active';

ALTER TABLE public.sales 
  ADD COLUMN IF NOT EXISTS record_status text NOT NULL DEFAULT 'active';

ALTER TABLE public.items 
  ADD COLUMN IF NOT EXISTS record_status text NOT NULL DEFAULT 'active';

ALTER TABLE public.expenses 
  ADD COLUMN IF NOT EXISTS record_status text NOT NULL DEFAULT 'active';

-- Add indexes for filtering by status
CREATE INDEX IF NOT EXISTS idx_inventory_entries_record_status ON public.inventory_entries(record_status);
CREATE INDEX IF NOT EXISTS idx_sales_record_status ON public.sales(record_status);
CREATE INDEX IF NOT EXISTS idx_items_record_status ON public.items(record_status);
CREATE INDEX IF NOT EXISTS idx_expenses_record_status ON public.expenses(record_status);
