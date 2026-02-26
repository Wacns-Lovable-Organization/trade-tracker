import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';
import type { InventoryEntry, Sale } from '@/contexts/AppContext';

interface PriceHistoryChartProps {
  itemId: string;
  inventoryEntries: InventoryEntry[];
  sales: Sale[];
}

export function PriceHistoryChart({ itemId, inventoryEntries, sales }: PriceHistoryChartProps) {
  const chartData = useMemo(() => {
    const dataMap = new Map<string, { date: string; buyCost?: number; salePrice?: number }>();

    const itemEntries = inventoryEntries.filter(e => e.itemId === itemId);
    const itemSales = sales.filter(s => s.itemId === itemId);

    itemEntries.forEach(e => {
      const date = new Date(e.boughtAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const existing = dataMap.get(date) || { date };
      existing.buyCost = e.unitCost;
      dataMap.set(date, existing);
    });

    itemSales.forEach(s => {
      const date = new Date(s.soldAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const existing = dataMap.get(date) || { date };
      existing.salePrice = s.amountGained / s.quantitySold;
      dataMap.set(date, existing);
    });

    return Array.from(dataMap.values()).sort((a, b) => {
      // Rough sort by date string
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [itemId, inventoryEntries, sales]);

  const avgCost = useMemo(() => {
    const entries = inventoryEntries.filter(e => e.itemId === itemId);
    if (entries.length === 0) return 0;
    return entries.reduce((sum, e) => sum + e.unitCost, 0) / entries.length;
  }, [itemId, inventoryEntries]);

  const avgSale = useMemo(() => {
    const itemSales = sales.filter(s => s.itemId === itemId);
    if (itemSales.length === 0) return 0;
    return itemSales.reduce((sum, s) => sum + (s.amountGained / s.quantitySold), 0) / itemSales.length;
  }, [itemId, sales]);

  if (chartData.length < 2) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Need at least 2 data points to show price trends.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Avg Buy Cost</p>
          <p className="font-mono font-semibold">{avgCost.toFixed(2)}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Avg Sale Price</p>
          <p className="font-mono font-semibold">{avgSale.toFixed(2)}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="buyCost" name="Buy Cost" stroke="hsl(220, 70%, 55%)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
          <Line type="monotone" dataKey="salePrice" name="Sale Price" stroke="hsl(142, 72%, 45%)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
