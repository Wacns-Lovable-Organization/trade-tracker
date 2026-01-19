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

  return (
    <ViewAsContext.Provider
      value={{
        viewAsUser,
        isViewingAs,
        setViewAsUser,
        clearViewAs,
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
