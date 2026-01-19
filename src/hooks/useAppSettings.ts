import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AuthMethodSettings {
  method: 'supabase' | 'resend';
  resend_enabled: boolean;
}

export interface EmailTemplateSettings {
  app_name: string;
  logo_emoji: string;
  primary_color: string;
  secondary_color: string;
  footer_text: string;
  signup_subject: string;
  signup_heading: string;
  signup_message: string;
  reset_subject: string;
  reset_heading: string;
  reset_message: string;
}

export interface RateLimitSettings {
  max_attempts: number;
  window_minutes: number;
  block_minutes: number;
}

export interface AppSettings {
  auth_method: AuthMethodSettings;
  email_template: EmailTemplateSettings;
  rate_limit: RateLimitSettings;
}

const DEFAULT_AUTH_METHOD: AuthMethodSettings = {
  method: 'supabase',
  resend_enabled: false,
};

const DEFAULT_EMAIL_TEMPLATE: EmailTemplateSettings = {
  app_name: 'GT Inventory',
  logo_emoji: '📦',
  primary_color: '#6366f1',
  secondary_color: '#8b5cf6',
  footer_text: 'GT Inventory. All rights reserved.',
  signup_subject: 'Verify Your Email - {{app_name}}',
  signup_heading: 'Verify Your Email',
  signup_message: 'Welcome to {{app_name}}! Use the code below to verify your email address.',
  reset_subject: 'Reset Your Password - {{app_name}}',
  reset_heading: 'Reset Your Password',
  reset_message: 'You requested to reset your password. Use the code below to complete the process.',
};

const DEFAULT_RATE_LIMIT: RateLimitSettings = {
  max_attempts: 5,
  window_minutes: 15,
  block_minutes: 30,
};

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    auth_method: DEFAULT_AUTH_METHOD,
    email_template: DEFAULT_EMAIL_TEMPLATE,
    rate_limit: DEFAULT_RATE_LIMIT,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['auth_method', 'email_template', 'rate_limit']);

      if (error) {
        console.error('Error fetching app settings:', error);
        return;
      }

      const newSettings: AppSettings = {
        auth_method: DEFAULT_AUTH_METHOD,
        email_template: DEFAULT_EMAIL_TEMPLATE,
        rate_limit: DEFAULT_RATE_LIMIT,
      };

      data?.forEach((row: { setting_key: string; setting_value: unknown }) => {
        if (row.setting_key === 'auth_method') {
          newSettings.auth_method = row.setting_value as AuthMethodSettings;
        } else if (row.setting_key === 'email_template') {
          newSettings.email_template = row.setting_value as EmailTemplateSettings;
        } else if (row.setting_key === 'rate_limit') {
          newSettings.rate_limit = row.setting_value as RateLimitSettings;
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
      const settingValue = { method: authMethod.method, resend_enabled: authMethod.resend_enabled };
      
      const { error } = await supabase
        .from('app_settings')
        .update({ 
          setting_value: settingValue,
          updated_by: (await supabase.auth.getUser()).data.user?.id 
        })
        .eq('setting_key', 'auth_method');

      if (error) throw error;

      setSettings(prev => ({ ...prev, auth_method: authMethod }));
      return { error: null };
    } catch (error: unknown) {
      console.error('Error updating auth method:', error);
      return { error };
    }
  }, []);

  const updateEmailTemplate = useCallback(async (template: EmailTemplateSettings) => {
    try {
      // Create a plain object for JSON serialization
      const settingValue = { ...template };
      
      const { error } = await supabase
        .from('app_settings')
        .update({ 
          setting_value: settingValue,
          updated_by: (await supabase.auth.getUser()).data.user?.id 
        })
        .eq('setting_key', 'email_template');

      if (error) throw error;

      setSettings(prev => ({ ...prev, email_template: template }));
      return { error: null };
    } catch (error: unknown) {
      console.error('Error updating email template:', error);
      return { error };
    }
  }, []);

  const updateRateLimit = useCallback(async (rateLimit: RateLimitSettings) => {
    try {
      // Create a plain object for JSON serialization
      const settingValue = { ...rateLimit };
      
      const { error } = await supabase
        .from('app_settings')
        .update({ 
          setting_value: settingValue,
          updated_by: (await supabase.auth.getUser()).data.user?.id 
        })
        .eq('setting_key', 'rate_limit');

      if (error) throw error;

      setSettings(prev => ({ ...prev, rate_limit: rateLimit }));
      return { error: null };
    } catch (error: unknown) {
      console.error('Error updating rate limit:', error);
      return { error };
    }
  }, []);

  return {
    settings,
    isLoading,
    updateAuthMethod,
    updateEmailTemplate,
    updateRateLimit,
    refetch: fetchSettings,
  };
}
