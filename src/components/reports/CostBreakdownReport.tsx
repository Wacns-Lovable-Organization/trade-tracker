import { useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyDisplayWithPreference } from '@/components/ui/CurrencyDisplayWithPreference';
import { Ban, Package, PieChart } from 'lucide-react';
import type { CurrencyUnit } from '@/types/inventory';

interface CostGroup {
  totalCost: number;
  itemCount: number;
  entryCount: number;
}

export function CostBreakdownReport() {
  const { data } = useApp();

  const breakdown = useMemo(() => {
    const byCurrency = new Map<CurrencyUnit, { costOnly: CostGroup; resellable: CostGroup }>();

    data.inventoryEntries.forEach(entry => {
      const item = data.items.find(i => i.id === entry.itemId);
      if (!item) return;

      const currency = entry.currencyUnit as CurrencyUnit;
      if (!byCurrency.has(currency)) {
        byCurrency.set(currency, {
          costOnly: { totalCost: 0, itemCount: 0, entryCount: 0 },
          resellable: { totalCost: 0, itemCount: 0, entryCount: 0 },
        });
      }

      const group = byCurrency.get(currency)!;
      const target = item.isCostOnly ? group.costOnly : group.resellable;
      target.totalCost += entry.quantityBought * entry.unitCost;
      target.entryCount += 1;
    });

    // Count unique items per group
    const costOnlyItemIds = new Set(
      data.items.filter(i => i.isCostOnly).map(i => i.id)
    );
    const resellableItemIds = new Set(
      data.items.filter(i => !i.isCostOnly).map(i => i.id)
    );

    byCurrency.forEach(group => {
      group.costOnly.itemCount = costOnlyItemIds.size;
      group.resellable.itemCount = resellableItemIds.size;
    });

    return byCurrency;
  }, [data.inventoryEntries, data.items]);

  if (breakdown.size === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            <CardTitle>Cost Breakdown</CardTitle>
          </div>
          <CardDescription>No inventory data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-primary" />
          <CardTitle>Cost Breakdown: Resellable vs Cost-Only</CardTitle>
        </div>
        <CardDescription>
          Compare spending on resellable inventory vs non-resellable costs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from(breakdown.entries()).map(([currency, { costOnly, resellable }]) => {
          const total = costOnly.totalCost + resellable.totalCost;
          const resellablePct = total > 0 ? (resellable.totalCost / total) * 100 : 0;
          const costOnlyPct = total > 0 ? (costOnly.totalCost / total) * 100 : 0;

          return (
            <div key={currency} className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">{currency} Breakdown</h4>

              {/* Visual bar */}
              <div className="h-4 rounded-full overflow-hidden bg-muted flex">
                {resellablePct > 0 && (
                  <div
                    className="bg-primary h-full transition-all"
                    style={{ width: `${resellablePct}%` }}
                  />
                )}
                {costOnlyPct > 0 && (
                  <div
                    className="bg-warning h-full transition-all"
                    style={{ width: `${costOnlyPct}%` }}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Resellable */}
                <div className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Resellable</span>
                  </div>
                  <div className="text-xl font-bold">
                    <CurrencyDisplayWithPreference amount={resellable.totalCost} currency={currency} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {resellable.entryCount} entries • {Math.round(resellablePct)}%
                  </div>
                </div>

                {/* Cost Only */}
                <div className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 mb-2">
                    <Ban className="h-4 w-4 text-warning" />
                    <span className="text-sm font-medium">Cost Only</span>
                  </div>
                  <div className="text-xl font-bold">
                    <CurrencyDisplayWithPreference amount={costOnly.totalCost} currency={currency} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {costOnly.entryCount} entries • {Math.round(costOnlyPct)}%
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="text-sm text-muted-foreground text-right">
                Total: <CurrencyDisplayWithPreference amount={total} currency={currency} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
