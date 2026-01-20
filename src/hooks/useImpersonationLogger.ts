import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useViewAs } from '@/contexts/ViewAsContext';
import type { Json } from '@/integrations/supabase/types';

type EntityType = 'category' | 'item' | 'inventory' | 'sale';
type ActionType = 'created' | 'updated' | 'deleted';

interface LogDetails {
  [key: string]: Json;
}

export function useImpersonationLogger() {
  const { user } = useAuth();
  const { viewAsUser, isViewingAs } = useViewAs();

  const logImpersonationAction = useCallback(async (
    entityType: EntityType,
    actionType: ActionType,
    entityId?: string,
    details?: LogDetails
  ) => {
    // Only log if we're actually impersonating someone
    if (!isViewingAs || !viewAsUser || !user) return;

    try {
      await supabase
        .from('admin_activity_logs')
        .insert([{
          admin_user_id: user.id,
          action_type: 'impersonation_action',
          target_user_id: viewAsUser.id,
          target_email: viewAsUser.email,
          details: {
            action: `${entityType}_${actionType}`,
            entity_type: entityType,
            entity_id: entityId || null,
            target_grow_id: viewAsUser.growId,
            ...details,
          } as Json,
          user_agent: navigator.userAgent,
        }]);
    } catch (err) {
      console.error('Error logging impersonation action:', err);
    }
  }, [user, viewAsUser, isViewingAs]);

  return {
    logImpersonationAction,
    isViewingAs,
  };
}
