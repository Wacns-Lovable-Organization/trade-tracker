import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';

interface ViewAsUser {
  id: string;
  email: string;
  displayName: string | null;
}

interface ViewAsContextType {
  viewAsUser: ViewAsUser | null;
  isViewingAs: boolean;
  setViewAsUser: (user: ViewAsUser | null) => void;
  clearViewAs: () => void;
  /** Returns the effective user ID to use for data operations - either the impersonated user or undefined */
  getEffectiveUserId: (currentUserId: string) => string;
}

const ViewAsContext = createContext<ViewAsContextType | null>(null);

export function ViewAsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [viewAsUser, setViewAsUserState] = useState<ViewAsUser | null>(null);

  const logAdminActivity = useCallback(async (
    actionType: string,
    targetUserId: string,
    targetEmail: string,
    details: Record<string, Json> = {}
  ) => {
    if (!user) return;

    try {
      await supabase
        .from('admin_activity_logs')
        .insert([{
          admin_user_id: user.id,
          action_type: actionType,
          target_user_id: targetUserId,
          target_email: targetEmail,
          details: details,
          user_agent: navigator.userAgent,
        }]);
    } catch (err) {
      console.error('Error logging admin activity:', err);
    }
  }, [user]);

  const setViewAsUser = useCallback((newUser: ViewAsUser | null) => {
    // Log impersonation start
    if (newUser && user) {
      logAdminActivity('impersonation_start', newUser.id, newUser.email, {
        target_display_name: newUser.displayName || null,
      });
    }
    setViewAsUserState(newUser);
  }, [user, logAdminActivity]);

  const clearViewAs = useCallback(() => {
    // Log impersonation end
    if (viewAsUser && user) {
      logAdminActivity('impersonation_end', viewAsUser.id, viewAsUser.email);
    }
    setViewAsUserState(null);
  }, [viewAsUser, user, logAdminActivity]);

  const isViewingAs = viewAsUser !== null;

  /** Returns the effective user ID - impersonated user if viewing as, otherwise the current user */
  const getEffectiveUserId = useCallback((currentUserId: string): string => {
    return viewAsUser?.id || currentUserId;
  }, [viewAsUser]);

  return (
    <ViewAsContext.Provider
      value={{
        viewAsUser,
        isViewingAs,
        setViewAsUser,
        clearViewAs,
        getEffectiveUserId,
      }}
    >
      {children}
    </ViewAsContext.Provider>
  );
}

export function useViewAs() {
  const context = useContext(ViewAsContext);
  if (!context) {
    throw new Error('useViewAs must be used within ViewAsProvider');
  }
  return context;
}
