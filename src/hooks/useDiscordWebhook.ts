import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserSettings } from '@/hooks/useUserSettings';

export function useDiscordWebhook() {
  const { settings } = useUserSettings();

  const sendDiscordNotification = useCallback(async (
    eventType: string,
    data: Record<string, any>
  ) => {
    const webhookUrl = settings?.discord_webhook_url;
    if (!webhookUrl) return;

    try {
      await supabase.functions.invoke('send-discord-webhook', {
        body: { event_type: eventType, data },
      });
    } catch (err) {
      console.error('Discord webhook error:', err);
    }
  }, [settings]);

  const isConfigured = Boolean(settings?.discord_webhook_url);

  return { sendDiscordNotification, isConfigured };
}
