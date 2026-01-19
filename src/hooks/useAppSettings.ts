import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AuthMethodSettings {
  method: 'supabase' | 'resend';
  resend_enabled: boolean;
}

export interface AppSettings {
  auth_method: AuthMethodSettings;
}

const DEFAULT_AUTH_METHOD: AuthMethodSettings = {
  method: 'supabase',
  resend_enabled: false,
};

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    auth_method: DEFAULT_AUTH_METHOD,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['auth_method']);

      if (error) {
        console.error('Error fetching app settings:', error);
        return;
      }

      const newSettings: AppSettings = {
        auth_method: DEFAULT_AUTH_METHOD,
      };

      data?.forEach((row: { setting_key: string; setting_value: unknown }) => {
        if (row.setting_key === 'auth_method') {
          newSettings.auth_method = row.setting_value as AuthMethodSettings;
        }
      });

      setSettings(newSettings);
    } catch (error) {
      console.error('Error fetching app settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateAuthMethod = useCallback(async (authMethod: AuthMethodSettings) => {
    try {
      // Cast to satisfy Supabase's Json type
      const settingValue = { method: authMethod.method, resend_enabled: authMethod.resend_enabled };
      
      const { error } = await supabase
        .from('app_settings')
        .update({ 
          setting_value: settingValue,
          updated_by: (await supabase.auth.getUser()).data.user?.id 
        })
        .eq('setting_key', 'auth_method');

      if (error) {
        throw error;
      }

      setSettings(prev => ({ ...prev, auth_method: authMethod }));
      return { error: null };
    } catch (error: unknown) {
      console.error('Error updating auth method:', error);
      return { error };
    }
  }, []);

  return {
    settings,
    isLoading,
    updateAuthMethod,
    refetch: fetchSettings,
  };
}
