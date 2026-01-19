import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
  id: string;
  notification_id: string;
  title: string;
  content: string;
  sender_display_name: string | null;
  is_anonymous: boolean;
  is_read: boolean;
  read_at: string | null;
  is_popup_shown: boolean;
  popup_shown_at: string | null;
  created_at: string;
}

export interface UnshownPopup {
  id: string;
  notification_id: string;
  title: string;
  content: string;
  sender_display_name: string | null;
  is_anonymous: boolean;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestPopup, setLatestPopup] = useState<UnshownPopup | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select(`
          id,
          notification_id,
          is_read,
          read_at,
          is_popup_shown,
          popup_shown_at,
          created_at,
          notifications!inner (
            title,
            content,
            sender_display_name,
            is_anonymous,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted: Notification[] = (data || []).map((item: {
        id: string;
        notification_id: string;
        is_read: boolean;
        read_at: string | null;
        is_popup_shown: boolean;
        popup_shown_at: string | null;
        created_at: string;
        notifications: {
          title: string;
          content: string;
          sender_display_name: string | null;
          is_anonymous: boolean;
          created_at: string;
        };
      }) => ({
        id: item.id,
        notification_id: item.notification_id,
        title: item.notifications.title,
        content: item.notifications.content,
        sender_display_name: item.notifications.sender_display_name,
        is_anonymous: item.notifications.is_anonymous,
        is_read: item.is_read,
        read_at: item.read_at,
        is_popup_shown: item.is_popup_shown,
        popup_shown_at: item.popup_shown_at,
        created_at: item.notifications.created_at,
      }));

      setNotifications(formatted);
      setUnreadCount(formatted.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchLatestPopup = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_latest_unshown_popup', {
        _user_id: user.id,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setLatestPopup(data[0] as UnshownPopup);
      } else {
        setLatestPopup(null);
      }
    } catch (error) {
      console.error('Error fetching latest popup:', error);
    }
  }, [user]);

  const markAsRead = useCallback(async (userNotificationId: string) => {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', userNotificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n =>
          n.id === userNotificationId
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user]);

  const markPopupAsShown = useCallback(async (userNotificationId: string) => {
    try {
      const { error } = await supabase.rpc('mark_popup_shown', {
        _user_notification_id: userNotificationId,
      });

      if (error) throw error;

      setLatestPopup(null);
      // Refresh to check for more unshown popups
      await fetchLatestPopup();
    } catch (error) {
      console.error('Error marking popup as shown:', error);
    }
  }, [fetchLatestPopup]);

  useEffect(() => {
    fetchNotifications();
    fetchLatestPopup();
  }, [fetchNotifications, fetchLatestPopup]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user_notifications_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
          fetchLatestPopup();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications, fetchLatestPopup]);

  return {
    notifications,
    unreadCount,
    latestPopup,
    isLoading,
    markAsRead,
    markAllAsRead,
    markPopupAsShown,
    refetch: fetchNotifications,
  };
}
