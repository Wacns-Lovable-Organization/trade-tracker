import React, { createContext, useContext, useState, useCallback } from 'react';

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
  const [viewAsUser, setViewAsUserState] = useState<ViewAsUser | null>(null);

  const setViewAsUser = useCallback((user: ViewAsUser | null) => {
    setViewAsUserState(user);
  }, []);

  const clearViewAs = useCallback(() => {
    setViewAsUserState(null);
  }, []);

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
