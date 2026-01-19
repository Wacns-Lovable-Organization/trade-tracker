import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';

type ActionType = 
  | 'impersonation_start'
  | 'impersonation_end'
  | 'impersonation_action'
  | 'role_change'
  | 'user_blacklist'
  | 'user_unblacklist'
  | 'data_modification';

type LogDetails = Record<string, Json>;

export function useAdminActivityLog() {
  const { user } = useAuth();

  const logActivity = useCallback(async (
    actionType: ActionType,
    targetUserId?: string | null,
    targetEmail?: string | null,
    details?: LogDetails
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('admin_activity_logs')
        .insert([{
          admin_user_id: user.id,
          action_type: actionType,
          target_user_id: targetUserId || null,
          target_email: targetEmail || null,
          details: details || {},
          user_agent: navigator.userAgent,
        }]);

      if (error) {
        console.error('Failed to log admin activity:', error);
      }
    } catch (err) {
      console.error('Error logging admin activity:', err);
    }
  }, [user]);

  const logImpersonationStart = useCallback((targetUserId: string, targetEmail: string, targetDisplayName?: string) => {
    return logActivity('impersonation_start', targetUserId, targetEmail, {
      target_display_name: targetDisplayName,
    });
  }, [logActivity]);

  const logImpersonationEnd = useCallback((targetUserId: string, targetEmail: string) => {
    return logActivity('impersonation_end', targetUserId, targetEmail);
  }, [logActivity]);

  const logImpersonationAction = useCallback((
    targetUserId: string,
    targetEmail: string,
    action: string,
    entityType: string,
    entityId?: string,
    details?: LogDetails
  ) => {
    return logActivity('impersonation_action', targetUserId, targetEmail, {
      action,
      entity_type: entityType,
      entity_id: entityId,
      ...details,
    });
  }, [logActivity]);

  const logDataModification = useCallback((
    action: string,
    entityType: string,
    entityId?: string,
    details?: LogDetails
  ) => {
    return logActivity('data_modification', null, null, {
      action,
      entity_type: entityType,
      entity_id: entityId,
      ...details,
    });
  }, [logActivity]);

  return {
    logActivity,
    logImpersonationStart,
    logImpersonationEnd,
    logImpersonationAction,
    logDataModification,
  };
}
