-- Create a security definer function to reset user progress
-- This deletes all inventory entries, sales, items, and categories for specified users
CREATE OR REPLACE FUNCTION public.reset_user_progress(_user_ids uuid[])
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_counts json;
  sales_count int := 0;
  inventory_count int := 0;
  items_count int := 0;
  categories_count int := 0;
  expenses_count int := 0;
BEGIN
  -- Delete sales first (depends on items)
  DELETE FROM public.sales WHERE user_id = ANY(_user_ids);
  GET DIAGNOSTICS sales_count = ROW_COUNT;
  
  -- Delete inventory entries (depends on items)
  DELETE FROM public.inventory_entries WHERE user_id = ANY(_user_ids);
  GET DIAGNOSTICS inventory_count = ROW_COUNT;
  
  -- Delete items (depends on categories)
  DELETE FROM public.items WHERE user_id = ANY(_user_ids);
  GET DIAGNOSTICS items_count = ROW_COUNT;
  
  -- Delete categories
  DELETE FROM public.categories WHERE user_id = ANY(_user_ids);
  GET DIAGNOSTICS categories_count = ROW_COUNT;
  
  -- Delete expenses
  DELETE FROM public.expenses WHERE user_id = ANY(_user_ids);
  GET DIAGNOSTICS expenses_count = ROW_COUNT;
  
  deleted_counts := json_build_object(
    'sales', sales_count,
    'inventory_entries', inventory_count,
    'items', items_count,
    'categories', categories_count,
    'expenses', expenses_count,
    'users_affected', array_length(_user_ids, 1)
  );
  
  RETURN deleted_counts;
END;
$$;

-- Grant execute permission to authenticated users (will be checked via RLS context)
GRANT EXECUTE ON FUNCTION public.reset_user_progress(uuid[]) TO authenticated;