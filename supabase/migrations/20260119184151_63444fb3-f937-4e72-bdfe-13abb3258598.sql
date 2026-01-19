-- Create feature flags table for admin configuration
CREATE TABLE public.feature_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_key TEXT NOT NULL UNIQUE,
  feature_name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Everyone can read feature flags (needed to check if features are enabled)
CREATE POLICY "Anyone can read feature flags"
ON public.feature_flags
FOR SELECT
USING (true);

-- Only admins can modify feature flags
CREATE POLICY "Admins can insert feature flags"
ON public.feature_flags
FOR INSERT
WITH CHECK (public.has_admin_access(auth.uid()));

CREATE POLICY "Admins can update feature flags"
ON public.feature_flags
FOR UPDATE
USING (public.has_admin_access(auth.uid()));

CREATE POLICY "Admins can delete feature flags"
ON public.feature_flags
FOR DELETE
USING (public.has_admin_access(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_feature_flags_updated_at
BEFORE UPDATE ON public.feature_flags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default feature flags
INSERT INTO public.feature_flags (feature_key, feature_name, description, is_enabled) VALUES
('ai_forecasting', 'AI Sales Forecasting', 'Enable AI-powered sales predictions and demand forecasting', true),
('expense_tracking', 'Expense Tracking', 'Allow users to track business expenses and overhead costs', true),
('pdf_reports', 'PDF Reports', 'Enable generation of PDF reports for inventory and sales', true),
('suppliers_management', 'Suppliers Management', 'Enable supplier tracking and management features', true),
('profit_simulator', 'Profit Simulator', 'Enable profit simulation and analysis tools', true),
('low_stock_alerts', 'Low Stock Alerts', 'Enable low stock notification system', true),
('push_notifications', 'Push Notifications', 'Allow push notification features', true);