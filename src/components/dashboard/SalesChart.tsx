import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { Sale, InventoryEntry } from '@/contexts/AppContext';
import type { CurrencyUnit } from '@/types/inventory';

interface SalesChartProps {
  sales: Sale[];
  entries: InventoryEntry[];
  calculateSaleProfit: (sale: Sale) => number;
}

export function SalesChart({ sales, entries, calculateSaleProfit }: SalesChartProps) {
  const chartData = useMemo(() => {
    // Group sales by date (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentSales = sales.filter(s => new Date(s.soldAt) >= thirtyDaysAgo);
    
    // Group by date
    const byDate = new Map<string, { revenue: number; profit: number; count: number }>();
    
    recentSales.forEach(sale => {
      const dateKey = new Date(sale.soldAt).toISOString().split('T')[0];
      const profit = calculateSaleProfit(sale);
      const existing = byDate.get(dateKey) || { revenue: 0, profit: 0, count: 0 };
      byDate.set(dateKey, {
        revenue: existing.revenue + sale.amountGained,
        profit: existing.profit + profit,
        count: existing.count + 1,
      });
    });
    
    // Create data points for last 30 days
    const data: { date: string; revenue: number; profit: number; label: string }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      const values = byDate.get(dateKey) || { revenue: 0, profit: 0, count: 0 };
      data.push({
        date: dateKey,
        revenue: values.revenue,
        profit: values.profit,
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
    }
    
    return data;
  }, [sales, calculateSaleProfit]);

  const chartConfig = {
    revenue: {
      label: 'Revenue',
      color: 'hsl(var(--primary))',
    },
    profit: {
      label: 'Profit',
      color: 'hsl(var(--chart-2))',
    },
  };

  const hasData = chartData.some(d => d.revenue > 0 || d.profit > 0);

  return (
    <Card className="animate-fade-in" style={{ animationDelay: '300ms' }}>
      <CardHeader>
        <CardTitle className="text-lg">Sales Trend</CardTitle>
        <CardDescription>Revenue and profit over the last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No sales data in the last 30 days
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 10 }} 
                interval="preserveStartEnd"
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="var(--color-revenue)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="profit" 
                stroke="var(--color-profit)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
