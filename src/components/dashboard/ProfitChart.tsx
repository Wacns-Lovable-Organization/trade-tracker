import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import type { Sale, InventoryEntry } from '@/contexts/AppContext';

interface ProfitChartProps {
  sales: Sale[];
  entries: InventoryEntry[];
  calculateSaleProfit: (sale: Sale) => number;
}

export function ProfitChart({ sales, entries, calculateSaleProfit }: ProfitChartProps) {
  const chartData = useMemo(() => {
    // Group profit by month (last 6 months)
    const now = new Date();
    const months: { month: string; profit: number; label: string }[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { month: 'short' });
      
      const monthSales = sales.filter(s => {
        const saleDate = new Date(s.soldAt);
        return saleDate.getFullYear() === date.getFullYear() && 
               saleDate.getMonth() === date.getMonth();
      });
      
      const profit = monthSales.reduce((sum, sale) => sum + calculateSaleProfit(sale), 0);
      
      months.push({ month: monthKey, profit, label });
    }
    
    return months;
  }, [sales, calculateSaleProfit]);

  const chartConfig = {
    profit: {
      label: 'Profit',
      color: 'hsl(var(--chart-2))',
    },
  };

  const hasData = chartData.some(d => d.profit !== 0);

  return (
    <Card className="animate-fade-in" style={{ animationDelay: '350ms' }}>
      <CardHeader>
        <CardTitle className="text-lg">Profit Over Time</CardTitle>
        <CardDescription>Monthly profit for the last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No profit data available
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                cursor={{ fill: 'hsl(var(--muted))' }}
              />
              <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={entry.profit >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
