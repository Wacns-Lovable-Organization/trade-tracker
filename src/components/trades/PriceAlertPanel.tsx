import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { usePriceAlerts, PriceAlert } from '@/hooks/usePriceAlerts';
import { useDiscordWebhook } from '@/hooks/useDiscordWebhook';
import { Bell, Plus, Trash2, Loader2, Eye, EyeOff, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export function PriceAlertPanel() {
  const { alerts, isLoading, createAlert, deleteAlert, toggleAlert } = usePriceAlerts();
  const { isConfigured: discordEnabled } = useDiscordWebhook();
  const [showCreate, setShowCreate] = useState(false);
  const [itemName, setItemName] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [currency, setCurrency] = useState('WL');
  const [alertType, setAlertType] = useState<'below' | 'above'>('below');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!itemName.trim() || !targetPrice) return;
    setIsSubmitting(true);
    try {
      await createAlert({
        item_name: itemName.trim(),
        target_price: parseFloat(targetPrice),
        currency_unit: currency,
        alert_type: alertType,
      });
      toast.success('Price alert created! 🔔');
      setItemName('');
      setTargetPrice('');
      setShowCreate(false);
    } catch {
      toast.error('Failed to create alert');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAlert(id);
      toast.success('Alert removed');
    } catch {
      toast.error('Failed to remove alert');
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    try {
      await toggleAlert(id, active);
    } catch {
      toast.error('Failed to update alert');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            Price Alerts
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowCreate(true)}>
            <Plus className="w-3 h-3 mr-1" />
            Add Alert
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No price alerts set. Get notified when items hit your target price!
          </p>
        ) : (
          <div className="space-y-2">
            {alerts.map(alert => (
              <div key={alert.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{alert.item_name}</span>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {alert.alert_type === 'below' ? '≤' : '≥'} {alert.target_price}
                      <span className={`ml-1 px-1 py-0 text-[10px] font-mono rounded currency-${alert.currency_unit.toLowerCase()}`}>
                        {alert.currency_unit}
                      </span>
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Switch
                    checked={alert.is_active}
                    onCheckedChange={(v) => handleToggle(alert.id, v)}
                    className="scale-75"
                  />
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(alert.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Create Alert Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Price Alert</DialogTitle>
            <DialogDescription>Get notified when an item hits your target price on the Trade Board.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Item Name</Label>
              <Input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g. Pepper Seed" />
            </div>
            <div className="space-y-2">
              <Label>Alert When Price Is</Label>
              <Select value={alertType} onValueChange={(v) => setAlertType(v as 'below' | 'above')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="below">At or below</SelectItem>
                  <SelectItem value="above">At or above</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target Price</Label>
              <div className="flex gap-2">
                <Input type="number" value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} placeholder="12" className="flex-1" />
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WL">WL</SelectItem>
                    <SelectItem value="DL">DL</SelectItem>
                    <SelectItem value="BGL">BGL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isSubmitting || !itemName.trim() || !targetPrice}>
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Create Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
