import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyDisplayWithPreference } from '@/components/ui/CurrencyDisplayWithPreference';
import { Package, TrendingUp, Receipt } from 'lucide-react';
import type { InventoryEntry, Sale } from '@/contexts/AppContext';
import type { CurrencyUnit } from '@/types/inventory';

interface ActivityItem {
  id: string;
  type: 'sale' | 'inventory';
  title: string;
  description: string;
  amount?: number;
  currency?: CurrencyUnit;
  timestamp: string;
}

interface ActivityFeedProps {
  sales: Sale[];
  entries: InventoryEntry[];
  items: { id: string; name: string }[];
}

export function ActivityFeed({ sales, entries, items }: ActivityFeedProps) {
  const activities = useMemo(() => {
    const result: ActivityItem[] = [];
    const now = new Date();
    const cutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 48 hours

    // Recent sales
    sales.forEach((sale) => {
      const saleDate = new Date(sale.soldAt);
      if (saleDate >= cutoff) {
        const item = items.find((i) => i.id === sale.itemId);
        result.push({
          id: `sale-${sale.id}`,
          type: 'sale',
          title: `Sold ${sale.quantitySold}x ${item?.name || 'Unknown'}`,
          description: `Revenue recorded`,
          amount: sale.amountGained,
          currency: sale.currencyUnit,
          timestamp: sale.soldAt,
        });
      }
    });

    // Recent inventory additions
    entries.forEach((entry) => {
      const entryDate = new Date(entry.boughtAt);
      if (entryDate >= cutoff) {
        result.push({
          id: `inv-${entry.id}`,
          type: 'inventory',
          title: `Added ${entry.quantityBought}x ${entry.snapshotName}`,
          description: `New stock purchased`,
          amount: entry.totalCost,
          currency: entry.currencyUnit,
          timestamp: entry.boughtAt,
        });
      }
    });

    return result.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 10);
  }, [sales, entries, items]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (activities.length === 0) {
    return (
      <Card className="animate-fade-in" style={{ animationDelay: '300ms' }}>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>Your latest actions (last 48 hours)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in" style={{ animationDelay: '300ms' }}>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <CardDescription>Your latest actions (last 48 hours)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors animate-slide-in"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className={`p-1.5 rounded-md mt-0.5 ${
                activity.type === 'sale' 
                  ? 'bg-green-500/10 text-green-500' 
                  : 'bg-primary/10 text-primary'
              }`}>
                {activity.type === 'sale' ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <Package className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{activity.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatTime(activity.timestamp)}</span>
                  {activity.amount !== undefined && activity.currency && (
                    <>
                      <span>•</span>
                      <CurrencyDisplayWithPreference
                        amount={activity.amount}
                        currency={activity.currency}
                        size="sm"
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
