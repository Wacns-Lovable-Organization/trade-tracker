import { useApp } from '@/contexts/AppContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useLowStockAlerts } from '@/hooks/useLowStockAlerts';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Info, Cloud, Bell, AlertTriangle, Loader2 } from 'lucide-react';
import { CsvImportExport } from '@/components/settings/CsvImportExport';
import { toast } from 'sonner';
import { useState } from 'react';

export default function Settings() {
  const { data } = useApp();
  const { settings, isLoading: settingsLoading, updateSettings } = useUserSettings();
  const { requestNotificationPermission, alertCount } = useLowStockAlerts();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggleAlerts = async (enabled: boolean) => {
    setIsUpdating(true);
    const { error } = await updateSettings({ low_stock_alerts_enabled: enabled });
    if (error) {
      toast.error('Failed to update settings');
    } else {
      toast.success(enabled ? 'Low stock alerts enabled' : 'Low stock alerts disabled');
    }
    setIsUpdating(false);
  };

  const handleThresholdChange = async (value: number) => {
    if (value < 0) return;
    const { error } = await updateSettings({ low_stock_threshold_global: value });
    if (error) {
      toast.error('Failed to update threshold');
    }
  };

  const handleEnablePushNotifications = async () => {
    const { granted, error } = await requestNotificationPermission();
    if (granted) {
      await updateSettings({ push_notifications_enabled: true });
      toast.success('Push notifications enabled!');
    } else {
      toast.error(error || 'Push notifications denied');
    }
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure your inventory app preferences"
      />

      <div className="space-y-6">
        {/* Cloud Sync Info */}
        <Card className="animate-fade-in border-primary/30">
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
        <Card className="animate-fade-in" style={{ animationDelay: '50ms' }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <CardTitle>Low Stock Alerts</CardTitle>
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
                    <Label htmlFor="alerts-enabled">Enable Alerts</Label>
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
                  <Label htmlFor="threshold">Global Threshold</Label>
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

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive browser notifications for low stock alerts
                      </p>
                    </div>
                    {settings?.push_notifications_enabled ? (
                      <span className="text-sm text-success font-medium">Enabled</span>
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
              </>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
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
        <Card className="animate-fade-in" style={{ animationDelay: '150ms' }}>
          <CardHeader>
            <CardTitle>Data Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-muted">
                <div className="text-muted-foreground">Categories</div>
                <div className="text-xl font-bold number-display">{data.categories.length}</div>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <div className="text-muted-foreground">Items</div>
                <div className="text-xl font-bold number-display">{data.items.length}</div>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <div className="text-muted-foreground">Inventory Entries</div>
                <div className="text-xl font-bold number-display">{data.inventoryEntries.length}</div>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <div className="text-muted-foreground">Sales</div>
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
