import { useCallback } from 'react';
import type { AppRole } from '@/hooks/useUserRole';

// Role hierarchy: owner > admin > manager > supervisor > (no role/user)
const ROLE_HIERARCHY: Record<AppRole | 'user', number> = {
  owner: 4,
  admin: 3,
  manager: 2,
  supervisor: 1,
  user: 0,
};

export function useRoleHierarchy() {
  /**
   * Check if the current user's role can impersonate a target user's role.
   * Users can only impersonate users with a lower or equal role (but not owners).
   * Owners can impersonate anyone except other owners.
   */
  const canImpersonate = useCallback((
    currentUserRole: AppRole | null,
    targetUserRole: AppRole | null | undefined
  ): boolean => {
    // If current user has no admin role, they can't impersonate anyone
    if (!currentUserRole) return false;
    
    // No one can impersonate owners
    if (targetUserRole === 'owner') return false;
    
    // Owners can impersonate anyone except other owners
    if (currentUserRole === 'owner') return true;
    
    const currentLevel = ROLE_HIERARCHY[currentUserRole];
    const targetLevel = ROLE_HIERARCHY[targetUserRole || 'user'];
    
    // Can only impersonate users with strictly lower roles
    return currentLevel > targetLevel;
  }, []);

  /**
   * Get the reason why impersonation is not allowed
   */
  const getImpersonationBlockReason = useCallback((
    currentUserRole: AppRole | null,
    targetUserRole: AppRole | null | undefined
  ): string | null => {
    if (!currentUserRole) {
      return 'You do not have admin access';
    }
    
    if (targetUserRole === 'owner') {
      return 'Cannot impersonate owners';
    }
    
    if (currentUserRole !== 'owner') {
      const currentLevel = ROLE_HIERARCHY[currentUserRole];
      const targetLevel = ROLE_HIERARCHY[targetUserRole || 'user'];
      
      if (currentLevel <= targetLevel) {
        return `Cannot impersonate users with equal or higher role (${targetUserRole || 'your level'})`;
      }
    }
    
    return null;
  }, []);

  /**
   * Get a human-readable role label
   */
  const getRoleLabel = useCallback((role: AppRole | null | undefined): string => {
    if (!role) return 'User';
    
    const labels: Record<AppRole, string> = {
      owner: 'Owner',
      admin: 'Admin',
      manager: 'Manager',
      supervisor: 'Supervisor',
    };
    
    return labels[role];
  }, []);

  return {
    canImpersonate,
    getImpersonationBlockReason,
    getRoleLabel,
    ROLE_HIERARCHY,
  };
}
