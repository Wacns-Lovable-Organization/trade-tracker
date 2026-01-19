import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import type { Sale, InventoryEntry } from '@/contexts/AppContext';
import type { CurrencyUnit } from '@/types/inventory';

interface TopItemsChartProps {
  sales: Sale[];
  entries: InventoryEntry[];
  calculateSaleProfit: (sale: Sale) => number;
}

export function TopItemsChart({ sales, entries, calculateSaleProfit }: TopItemsChartProps) {
  const chartData = useMemo(() => {
    // Group sales by item
    const byItem = new Map<string, { name: string; sold: number; profit: number }>();
    
    sales.forEach(sale => {
      const entry = entries.find(e => e.id === sale.inventoryEntryId);
      const name = entry?.snapshotName || 'Unknown';
      const profit = calculateSaleProfit(sale);
      
      const existing = byItem.get(sale.itemId) || { name, sold: 0, profit: 0 };
      byItem.set(sale.itemId, {
        name,
        sold: existing.sold + sale.quantitySold,
        profit: existing.profit + profit,
      });
    });
    
    // Sort by quantity sold and take top 5
    return Array.from(byItem.values())
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);
  }, [sales, entries, calculateSaleProfit]);

  const chartConfig = {
    sold: {
      label: 'Quantity Sold',
      color: 'hsl(var(--primary))',
    },
  };

  const hasData = chartData.length > 0;

  const colors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  return (
    <Card className="animate-fade-in" style={{ animationDelay: '400ms' }}>
      <CardHeader>
        <CardTitle className="text-lg">Top Selling Items</CardTitle>
        <CardDescription>Items by quantity sold</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No sales data available
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <BarChart 
              data={chartData} 
              layout="vertical"
              margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis 
                type="number"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                type="category"
                dataKey="name"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={80}
                tickFormatter={(value) => value.length > 12 ? `${value.slice(0, 12)}...` : value}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                cursor={{ fill: 'hsl(var(--muted))' }}
              />
              <Bar dataKey="sold" radius={[0, 4, 4, 0]}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
