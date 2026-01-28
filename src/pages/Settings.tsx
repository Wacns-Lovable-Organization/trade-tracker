import { useTranslation } from 'react-i18next';
import { useApp } from '@/contexts/AppContext';
import { useUserSettings, type CurrencyDisplayMode } from '@/hooks/useUserSettings';
import { useLowStockAlerts } from '@/hooks/useLowStockAlerts';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Info, Cloud, Bell, AlertTriangle, Loader2, Globe, Coins } from 'lucide-react';
import { CsvImportExport } from '@/components/settings/CsvImportExport';
import { LanguageSelector } from '@/components/LanguageSelector';
import { FeatureGate } from '@/components/FeatureGate';
import { toast } from 'sonner';
import { useState } from 'react';

export default function Settings() {
  const { t } = useTranslation();
  const { data } = useApp();
  const { settings, isLoading: settingsLoading, updateSettings } = useUserSettings();
  const { requestNotificationPermission, alertCount } = useLowStockAlerts();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggleAlerts = async (enabled: boolean) => {
    setIsUpdating(true);
    const { error } = await updateSettings({ low_stock_alerts_enabled: enabled });
    if (error) {
      toast.error(t('common.error'));
    } else {
      toast.success(enabled ? t('settings.lowStockAlerts') + ' ' + t('common.enabled').toLowerCase() : t('settings.lowStockAlerts') + ' ' + t('common.disabled').toLowerCase());
    }
    setIsUpdating(false);
  };

  const handleThresholdChange = async (value: number) => {
    if (value < 0) return;
    const { error } = await updateSettings({ low_stock_threshold_global: value });
    if (error) {
      toast.error(t('common.error'));
    }
  };

  const handleEnablePushNotifications = async () => {
    const { granted, error } = await requestNotificationPermission();
    if (granted) {
      await updateSettings({ push_notifications_enabled: true });
      toast.success(t('settings.pushNotifications') + ' ' + t('common.enabled').toLowerCase() + '!');
    } else {
      toast.error(error || t('common.error'));
    }
  };

  const handleCurrencyDisplayChange = async (mode: CurrencyDisplayMode) => {
    setIsUpdating(true);
    const { error } = await updateSettings({ default_currency_display: mode });
    if (error) {
      toast.error(t('common.error'));
    } else {
      toast.success('Currency display preference updated');
    }
    setIsUpdating(false);
  };

  return (
    <div>
      <PageHeader
        title={t('settings.title')}
        description={t('settings.description')}
      />

      <div className="space-y-6">
        {/* Language Selection */}
        <Card className="animate-fade-in">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              <CardTitle>{t('settings.language')}</CardTitle>
            </div>
            <CardDescription>
              Choose your preferred language for the application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LanguageSelector />
          </CardContent>
        </Card>

        {/* Currency Display Preference */}
        <Card className="animate-fade-in" style={{ animationDelay: '50ms' }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-primary" />
              <CardTitle>Currency Display</CardTitle>
            </div>
            <CardDescription>
              Choose your default currency display format. You can always click on any price to cycle through formats.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {settingsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <RadioGroup
                value={settings?.default_currency_display || 'original'}
                onValueChange={(v) => handleCurrencyDisplayChange(v as CurrencyDisplayMode)}
                className="grid gap-3"
                disabled={isUpdating}
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="original" id="original" />
                  <Label htmlFor="original" className="flex-1 cursor-pointer">
                    <div className="font-medium">Original Format</div>
                    <div className="text-sm text-muted-foreground">
                      Display as entered (e.g., 86492 <span className="px-1 py-0.5 text-xs font-mono rounded currency-wl">WL</span>)
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="dl" id="dl" />
                  <Label htmlFor="dl" className="flex-1 cursor-pointer">
                    <div className="font-medium">DL + WL Breakdown</div>
                    <div className="text-sm text-muted-foreground">
                      Convert to DL and WL (e.g., 864 <span className="px-1 py-0.5 text-xs font-mono rounded currency-dl">DL</span>, 92 <span className="px-1 py-0.5 text-xs font-mono rounded currency-wl">WL</span>)
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="bgl" id="bgl" />
                  <Label htmlFor="bgl" className="flex-1 cursor-pointer">
                    <div className="font-medium">Full Breakdown</div>
                    <div className="text-sm text-muted-foreground">
                      Convert to BGL, DL, and WL (e.g., 8 <span className="px-1 py-0.5 text-xs font-mono rounded currency-bgl">BGL</span>, 64 <span className="px-1 py-0.5 text-xs font-mono rounded currency-dl">DL</span>, 92 <span className="px-1 py-0.5 text-xs font-mono rounded currency-wl">WL</span>)
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            )}
          </CardContent>
        </Card>

        {/* Cloud Sync Info */}
        <Card className="animate-fade-in border-primary/30" style={{ animationDelay: '100ms' }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-primary" />
              <CardTitle>Cloud Sync Enabled</CardTitle>
            </div>
            <CardDescription>
              Your data is automatically synced across all your devices. Sign in with the same account on any device to access your inventory.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Low Stock Alerts Settings */}
        <FeatureGate featureKey="low_stock_alerts">
          <Card className="animate-fade-in" style={{ animationDelay: '150ms' }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                <CardTitle>{t('settings.lowStockAlerts')}</CardTitle>
              </div>
              <CardDescription>
                Get notified when inventory items fall below your configured threshold
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settingsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="alerts-enabled">{t('common.enabled')}</Label>
                      <p className="text-sm text-muted-foreground">
                        Show low stock warnings in the app
                      </p>
                    </div>
                    <Switch
                      id="alerts-enabled"
                      checked={settings?.low_stock_alerts_enabled ?? true}
                      onCheckedChange={handleToggleAlerts}
                      disabled={isUpdating}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="threshold">{t('settings.threshold')}</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="threshold"
                        type="number"
                        min="0"
                        max="1000"
                        value={settings?.low_stock_threshold_global ?? 5}
                        onChange={(e) => handleThresholdChange(parseInt(e.target.value) || 0)}
                        className="w-24"
                        disabled={!settings?.low_stock_alerts_enabled}
                      />
                      <span className="text-sm text-muted-foreground">
                        Alert when stock falls to or below this quantity
                      </span>
                    </div>
                  </div>

                  {alertCount > 0 && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 text-warning border border-warning/20">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">
                        You have {alertCount} item{alertCount !== 1 ? 's' : ''} with low stock
                      </span>
                    </div>
                  )}

                  <FeatureGate featureKey="push_notifications" showDisabledMessage={false}>
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>{t('settings.pushNotifications')}</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive browser notifications for low stock alerts
                          </p>
                        </div>
                        {settings?.push_notifications_enabled ? (
                          <span className="text-sm text-success font-medium">{t('common.enabled')}</span>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleEnablePushNotifications}
                            disabled={!settings?.low_stock_alerts_enabled}
                          >
                            Enable
                          </Button>
                        )}
                      </div>
                    </div>
                  </FeatureGate>
                </>
              )}
            </CardContent>
          </Card>
        </FeatureGate>

        {/* Info Card */}
        <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              <CardTitle>Currency Info</CardTitle>
            </div>
            <CardDescription>
              Each inventory entry and sale can use its own currency (WL, DL, or BGL).
              Select the currency when adding entries or recording sales.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="p-4 rounded-lg border border-border">
                <span className="px-2 py-1 text-sm font-mono rounded currency-wl">WL</span>
                <div className="mt-2 font-medium">World Lock</div>
                <div className="text-sm text-muted-foreground">Base currency unit</div>
              </div>
              <div className="p-4 rounded-lg border border-border">
                <span className="px-2 py-1 text-sm font-mono rounded currency-dl">DL</span>
                <div className="mt-2 font-medium">Diamond Lock</div>
                <div className="text-sm text-muted-foreground">= 100 WL</div>
              </div>
              <div className="p-4 rounded-lg border border-border">
                <span className="px-2 py-1 text-sm font-mono rounded currency-bgl">BGL</span>
                <div className="mt-2 font-medium">Blue Gem Lock</div>
                <div className="text-sm text-muted-foreground">= 100 DL = 10,000 WL</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Info */}
        <Card className="animate-fade-in" style={{ animationDelay: '250ms' }}>
          <CardHeader>
            <CardTitle>{t('settings.dataManagement')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-muted">
                <div className="text-muted-foreground">{t('nav.categories')}</div>
                <div className="text-xl font-bold number-display">{data.categories.length}</div>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <div className="text-muted-foreground">Items</div>
                <div className="text-xl font-bold number-display">{data.items.length}</div>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <div className="text-muted-foreground">{t('nav.inventory')}</div>
                <div className="text-xl font-bold number-display">{data.inventoryEntries.length}</div>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <div className="text-muted-foreground">{t('nav.sales')}</div>
                <div className="text-xl font-bold number-display">{data.sales.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CSV Import/Export */}
        <CsvImportExport />
      </div>
    </div>
  );
}
