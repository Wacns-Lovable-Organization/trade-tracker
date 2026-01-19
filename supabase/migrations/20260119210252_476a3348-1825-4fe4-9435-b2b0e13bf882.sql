-- Create notifications table for storing all notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_display_name TEXT, -- For displaying "Owner", "Admin", or "Anonymous"
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'popup', -- 'popup', 'email', 'both'
  target_type TEXT NOT NULL DEFAULT 'individual', -- 'individual', 'broadcast'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_notifications table for tracking read status per user
CREATE TABLE public.user_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  is_popup_shown BOOLEAN NOT NULL DEFAULT false,
  popup_shown_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(notification_id, user_id)
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Admins can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (public.has_admin_access(auth.uid()));

CREATE POLICY "Admins can view all notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (public.has_admin_access(auth.uid()));

CREATE POLICY "Users can view notifications targeted to them"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_notifications un
    WHERE un.notification_id = id AND un.user_id = auth.uid()
  )
);

-- RLS policies for user_notifications
CREATE POLICY "Admins can manage user notifications"
ON public.user_notifications
FOR ALL
TO authenticated
USING (public.has_admin_access(auth.uid()))
WITH CHECK (public.has_admin_access(auth.uid()));

CREATE POLICY "Users can view their own notifications"
ON public.user_notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notification read status"
ON public.user_notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create index for faster lookups
CREATE INDEX idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX idx_user_notifications_unread ON public.user_notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Function to get unread notification count for a user
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.user_notifications
  WHERE user_id = _user_id AND is_read = false
$$;

-- Function to get the latest unshown popup for a user
CREATE OR REPLACE FUNCTION public.get_latest_unshown_popup(_user_id UUID)
RETURNS TABLE(
  id UUID,
  notification_id UUID,
  title TEXT,
  content TEXT,
  sender_display_name TEXT,
  is_anonymous BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    un.id,
    n.id as notification_id,
    n.title,
    n.content,
    n.sender_display_name,
    n.is_anonymous,
    n.created_at
  FROM public.user_notifications un
  JOIN public.notifications n ON n.id = un.notification_id
  WHERE un.user_id = _user_id 
    AND un.is_popup_shown = false
    AND n.notification_type IN ('popup', 'both')
  ORDER BY n.created_at DESC
  LIMIT 1
$$;

-- Function to mark popup as shown
CREATE OR REPLACE FUNCTION public.mark_popup_shown(_user_notification_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_notifications
  SET is_popup_shown = true, popup_shown_at = now()
  WHERE id = _user_notification_id AND user_id = auth.uid();
END;
$$;