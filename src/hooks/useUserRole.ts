import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'owner' | 'admin' | 'manager' | 'supervisor';

interface UserRoleData {
  role: AppRole | null;
  hasAdminAccess: boolean;
  isLoading: boolean;
  canManageRole: (targetRole: AppRole) => boolean;
  refetch: () => Promise<void>;
}

export function useUserRole(): UserRoleData {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRole = useCallback(async () => {
    if (!user) {
      setRole(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Call the database function to get user's highest role
      const { data, error } = await supabase.rpc('get_user_role', {
        _user_id: user.id
      });

      if (error) {
        console.error('Error fetching user role:', error);
        setRole(null);
      } else {
        setRole(data as AppRole | null);
      }
    } catch (err) {
      console.error('Error fetching user role:', err);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  const hasAdminAccess = role !== null && ['owner', 'admin', 'manager', 'supervisor'].includes(role);

  const canManageRole = useCallback((targetRole: AppRole): boolean => {
    if (!role) return false;
    
    switch (role) {
      case 'owner':
        return true; // Owner can manage all roles
      case 'admin':
        return ['manager', 'supervisor'].includes(targetRole);
      case 'manager':
        return targetRole === 'supervisor';
      default:
        return false;
    }
  }, [role]);

  return {
    role,
    hasAdminAccess,
    isLoading,
    canManageRole,
    refetch: fetchRole,
  };
}
