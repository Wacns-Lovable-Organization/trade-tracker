import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type CurrencyDisplayMode = 'original' | 'dl' | 'bgl';

export interface UserSettings {
  id: string;
  user_id: string;
  low_stock_alerts_enabled: boolean;
  low_stock_threshold_global: number;
  push_notifications_enabled: boolean;
  email_notifications_enabled: boolean;
  theme: string;
  language: string;
  default_currency_display: CurrencyDisplayMode;
  created_at: string;
  updated_at: string;
}

export function useUserSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setSettings(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user settings:', error);
      }

      if (data) {
        setSettings({
          ...data,
          default_currency_display: (data.default_currency_display || 'original') as CurrencyDisplayMode,
        });
      } else {
        // Create default settings if none exist
        const { data: newSettings, error: insertError } = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            low_stock_alerts_enabled: true,
            low_stock_threshold_global: 5,
            push_notifications_enabled: false,
            email_notifications_enabled: false,
            theme: 'dark',
            language: localStorage.getItem('i18nextLng') || 'en',
            default_currency_display: 'original',
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating user settings:', insertError);
        } else if (newSettings) {
          setSettings({
            ...newSettings,
            default_currency_display: (newSettings.default_currency_display || 'original') as CurrencyDisplayMode,
          });
        }
      }
    } catch (error) {
      console.error('Error in fetchSettings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    if (!user || !settings) return { error: new Error('No user or settings') };

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setSettings({
          ...data,
          default_currency_display: (data.default_currency_display || 'original') as CurrencyDisplayMode,
        });
      }
      return { data, error: null };
    } catch (error) {
      console.error('Error updating settings:', error);
      return { data: null, error };
    }
  }, [user, settings]);

  return {
    settings,
    isLoading,
    updateSettings,
    refetch: fetchSettings,
  };
}
