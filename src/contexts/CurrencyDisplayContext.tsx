import React, { createContext, useContext, useMemo } from 'react';
import { useUserSettings, type CurrencyDisplayMode } from '@/hooks/useUserSettings';

interface CurrencyDisplayContextType {
  defaultMode: CurrencyDisplayMode;
  isLoading: boolean;
  setDefaultMode: (mode: CurrencyDisplayMode) => Promise<void>;
}

const CurrencyDisplayContext = createContext<CurrencyDisplayContextType | null>(null);

export function CurrencyDisplayProvider({ children }: { children: React.ReactNode }) {
  const { settings, isLoading, updateSettings } = useUserSettings();

  const value = useMemo(() => ({
    defaultMode: (settings?.default_currency_display as CurrencyDisplayMode) || 'original',
    isLoading,
    setDefaultMode: async (mode: CurrencyDisplayMode) => {
      await updateSettings({ default_currency_display: mode });
    },
  }), [settings, isLoading, updateSettings]);

  return (
    <CurrencyDisplayContext.Provider value={value}>
      {children}
    </CurrencyDisplayContext.Provider>
  );
}

export function useCurrencyDisplay() {
  const context = useContext(CurrencyDisplayContext);
  if (!context) {
    // Return defaults if used outside provider
    return { defaultMode: 'original' as CurrencyDisplayMode, isLoading: false, setDefaultMode: async () => {} };
  }
  return context;
}
