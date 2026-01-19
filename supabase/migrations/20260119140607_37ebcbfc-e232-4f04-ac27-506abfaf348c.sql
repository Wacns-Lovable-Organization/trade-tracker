-- Create app role enum with hierarchy: owner > admin > manager > supervisor
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'manager', 'supervisor');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create admin_email_allowlist table for automatic admin assignment
CREATE TABLE public.admin_email_allowlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    role app_role NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_email_allowlist ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user's highest role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role 
      WHEN 'owner' THEN 1 
      WHEN 'admin' THEN 2 
      WHEN 'manager' THEN 3 
      WHEN 'supervisor' THEN 4 
    END
  LIMIT 1
$$;

-- Create function to check if user has admin-level access (owner, admin, manager, supervisor)
CREATE OR REPLACE FUNCTION public.has_admin_access(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('owner', 'admin', 'manager', 'supervisor')
  )
$$;

-- Create function to check role hierarchy (can user A manage user B's role)
CREATE OR REPLACE FUNCTION public.can_manage_role(_manager_id UUID, _target_role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _manager_id
      AND (
        (role = 'owner') OR
        (role = 'admin' AND _target_role IN ('manager', 'supervisor')) OR
        (role = 'manager' AND _target_role = 'supervisor')
      )
  )
$$;

-- RLS Policies for user_roles
-- Users can view all roles if they have admin access
CREATE POLICY "Admin users can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_admin_access(auth.uid()));

-- Users can see their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Only users with sufficient permissions can insert roles
CREATE POLICY "Authorized users can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.can_manage_role(auth.uid(), role) OR public.has_role(auth.uid(), 'owner'));

-- Only users with sufficient permissions can update roles
CREATE POLICY "Authorized users can update roles"
ON public.user_roles FOR UPDATE
USING (public.can_manage_role(auth.uid(), role) OR public.has_role(auth.uid(), 'owner'));

-- Only users with sufficient permissions can delete roles
CREATE POLICY "Authorized users can delete roles"
ON public.user_roles FOR DELETE
USING (public.can_manage_role(auth.uid(), role) OR public.has_role(auth.uid(), 'owner'));

-- RLS Policies for admin_email_allowlist
CREATE POLICY "Only owners can view allowlist"
ON public.admin_email_allowlist FOR SELECT
USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Only owners can manage allowlist"
ON public.admin_email_allowlist FOR ALL
USING (public.has_role(auth.uid(), 'owner'));

-- Function to auto-assign role on signup based on allowlist
CREATE OR REPLACE FUNCTION public.auto_assign_role_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed_role app_role;
BEGIN
  -- Check if email is in allowlist
  SELECT role INTO allowed_role
  FROM public.admin_email_allowlist
  WHERE email = NEW.email;
  
  -- If found, assign the role
  IF allowed_role IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, allowed_role);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-assign role on user creation
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_role_on_signup();

-- Update profiles table policies to allow admins to view all profiles
CREATE POLICY "Admin users can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_admin_access(auth.uid()));

-- Allow admins to update any profile
CREATE POLICY "Admin users can update all profiles"
ON public.profiles FOR UPDATE
USING (public.has_admin_access(auth.uid()));

-- Update other tables to allow admin access
-- Categories
CREATE POLICY "Admin users can view all categories"
ON public.categories FOR SELECT
USING (public.has_admin_access(auth.uid()));

CREATE POLICY "Admin users can manage all categories"
ON public.categories FOR ALL
USING (public.has_admin_access(auth.uid()));

-- Items
CREATE POLICY "Admin users can view all items"
ON public.items FOR SELECT
USING (public.has_admin_access(auth.uid()));

CREATE POLICY "Admin users can manage all items"
ON public.items FOR ALL
USING (public.has_admin_access(auth.uid()));

-- Inventory entries
CREATE POLICY "Admin users can view all inventory"
ON public.inventory_entries FOR SELECT
USING (public.has_admin_access(auth.uid()));

CREATE POLICY "Admin users can manage all inventory"
ON public.inventory_entries FOR ALL
USING (public.has_admin_access(auth.uid()));

-- Sales
CREATE POLICY "Admin users can view all sales"
ON public.sales FOR SELECT
USING (public.has_admin_access(auth.uid()));

CREATE POLICY "Admin users can manage all sales"
ON public.sales FOR ALL
USING (public.has_admin_access(auth.uid()));