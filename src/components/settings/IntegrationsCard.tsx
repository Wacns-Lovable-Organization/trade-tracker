import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserSettings } from '@/hooks/useUserSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Send, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Discord icon as inline SVG
function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
    </svg>
  );
}

export function IntegrationsCard() {
  const { t } = useTranslation();
  const { settings, isLoading: settingsLoading, updateSettings } = useUserSettings();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Sync local state with settings once loaded
  if (settings && !initialized) {
    setWebhookUrl(settings.discord_webhook_url || '');
    setInitialized(true);
  }

  const isValidUrl = (url: string) => {
    if (!url) return true; // empty is valid (removing)
    try {
      const parsed = new URL(url);
      return parsed.hostname.endsWith('discord.com') && url.includes('/api/webhooks/');
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    if (!isValidUrl(webhookUrl)) {
      toast.error('Please enter a valid Discord webhook URL');
      return;
    }
    setIsSaving(true);
    const { error } = await updateSettings({ discord_webhook_url: webhookUrl || null });
    if (error) {
      toast.error('Failed to save webhook URL');
    } else {
      toast.success(webhookUrl ? 'Discord webhook saved!' : 'Discord webhook removed');
    }
    setIsSaving(false);
  };

  const handleTest = async () => {
    if (!webhookUrl || !isValidUrl(webhookUrl)) {
      toast.error('Please save a valid webhook URL first');
      return;
    }
    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-discord-webhook', {
        body: {
          webhook_url: webhookUrl,
          event_type: 'test',
          data: {},
        },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success('Test message sent! Check your Discord channel.');
      } else {
        toast.error(data?.error || 'Failed to send test message');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to send test message');
    }
    setIsTesting(false);
  };

  const currentUrl = settings?.discord_webhook_url || '';
  const hasChanges = webhookUrl !== currentUrl;

  return (
    <Card className="animate-fade-in" style={{ animationDelay: '75ms' }}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <DiscordIcon className="w-5 h-5 text-[#5865F2]" />
          <CardTitle>Integrations</CardTitle>
        </div>
        <CardDescription>
          Connect GrowStock to external platforms for automated notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {settingsLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="discord-webhook">Discord Webhook URL</Label>
              <p className="text-sm text-muted-foreground">
                Paste your Discord channel webhook URL to receive sale notifications and low stock alerts.
              </p>
              <Input
                id="discord-webhook"
                type="url"
                placeholder="https://discord.com/api/webhooks/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
              {webhookUrl && !isValidUrl(webhookUrl) && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Must be a valid Discord webhook URL
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleSave}
                disabled={isSaving || !isValidUrl(webhookUrl) || !hasChanges}
                size="sm"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Check className="w-4 h-4 mr-1" />
                )}
                Save
              </Button>
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={isTesting || !currentUrl}
                size="sm"
              >
                {isTesting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Send className="w-4 h-4 mr-1" />
                )}
                Test Webhook
              </Button>
            </div>

            {currentUrl && (
              <div className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                <Check className="w-3 h-3 text-green-500" />
                Webhook configured — you'll receive notifications for sales and low stock alerts
              </div>
            )}

            <div className="border-t border-border pt-4 mt-4">
              <p className="text-sm font-medium mb-2">How to get a webhook URL:</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Open Discord → go to your server</li>
                <li>Right-click a channel → Edit Channel → Integrations</li>
                <li>Click "Create Webhook" and copy the URL</li>
                <li>Paste it above and save</li>
              </ol>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
