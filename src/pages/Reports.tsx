import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useExpenses } from '@/hooks/useExpenses';
import { useSalesForecast } from '@/hooks/useSalesForecast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { generateInventoryReport, generateSalesReport, generateProfitReport } from '@/lib/pdfGenerator';
import { toast } from 'sonner';
import { FileDown, TrendingUp, Package, DollarSign, Loader2, Brain, Sparkles, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { subDays, startOfMonth } from 'date-fns';
import type { CurrencyUnit } from '@/types/inventory';

export default function Reports() {
  const { data } = useApp();
  const { expenses } = useExpenses();
  const { forecast, isLoading: forecastLoading, error: forecastError, generateForecast } = useSalesForecast();
  
  const [daysToForecast, setDaysToForecast] = useState(30);

  const handleGenerateInventoryReport = () => {
    const items = data.items.map(item => {
      const entries = data.inventoryEntries.filter(e => e.itemId === item.id && e.status === 'OPEN');
      const remainingQty = entries.reduce((sum, e) => sum + e.remainingQty, 0);
      const totalCost = entries.reduce((sum, e) => sum + (e.remainingQty * e.unitCost), 0);
      const category = data.categories.find(c => c.id === item.defaultCategoryId);
      const currency = entries[0]?.currencyUnit || 'WL';
      
      return {
        name: item.name,
        category: category?.name || 'Uncategorized',
        remainingQty,
        totalCost,
        currency: currency as CurrencyUnit,
      };
    }).filter(item => item.remainingQty > 0);

    const totalValue = items.reduce((acc, item) => {
      acc[item.currency] = (acc[item.currency] || 0) + item.totalCost;
      return acc;
    }, {} as Record<CurrencyUnit, number>);

    generateInventoryReport({
      items,
      totalValue,
      generatedAt: new Date(),
    });
    
    toast.success('Inventory report downloaded');
  };

  const handleGenerateSalesReport = () => {
    const sales = data.sales.map(sale => {
      const item = data.items.find(i => i.id === sale.itemId);
      return {
        date: sale.soldAt,
        item: item?.name || 'Unknown',
        quantity: sale.quantitySold,
        revenue: sale.amountGained,
        profit: sale.amountGained - (data.inventoryEntries.find(e => e.id === sale.inventoryEntryId)?.unitCost || 0) * sale.quantitySold,
        currency: sale.currencyUnit as CurrencyUnit,
      };
    });

    const totals = {
      revenue: sales.reduce((acc, s) => {
        acc[s.currency] = (acc[s.currency] || 0) + s.revenue;
        return acc;
      }, {} as Record<CurrencyUnit, number>),
      profit: sales.reduce((acc, s) => {
        acc[s.currency] = (acc[s.currency] || 0) + s.profit;
        return acc;
      }, {} as Record<CurrencyUnit, number>),
    };

    generateSalesReport({
      sales,
      totals,
      period: { start: subDays(new Date(), 30), end: new Date() },
      generatedAt: new Date(),
    });
    
    toast.success('Sales report downloaded');
  };

  const handleGenerateProfitReport = () => {
    const summary = {
      totalRevenue: {} as Record<CurrencyUnit, number>,
      totalCost: {} as Record<CurrencyUnit, number>,
      totalProfit: {} as Record<CurrencyUnit, number>,
      profitMargin: 0,
    };

    data.sales.forEach(sale => {
      const entry = data.inventoryEntries.find(e => e.id === sale.inventoryEntryId);
      const cost = (entry?.unitCost || 0) * sale.quantitySold;
      const currency = sale.currencyUnit as CurrencyUnit;
      
      summary.totalRevenue[currency] = (summary.totalRevenue[currency] || 0) + sale.amountGained;
      summary.totalCost[currency] = (summary.totalCost[currency] || 0) + cost;
      summary.totalProfit[currency] = (summary.totalProfit[currency] || 0) + (sale.amountGained - cost);
    });

    const totalRev = Object.values(summary.totalRevenue).reduce((a, b) => a + b, 0);
    const totalProf = Object.values(summary.totalProfit).reduce((a, b) => a + b, 0);
    summary.profitMargin = totalRev > 0 ? (totalProf / totalRev) * 100 : 0;

    // Top items by profit
    const itemProfits = new Map<string, { name: string; profit: number; currency: CurrencyUnit }>();
    data.sales.forEach(sale => {
      const item = data.items.find(i => i.id === sale.itemId);
      const entry = data.inventoryEntries.find(e => e.id === sale.inventoryEntryId);
      const profit = sale.amountGained - (entry?.unitCost || 0) * sale.quantitySold;
      const currency = sale.currencyUnit as CurrencyUnit;
      
      if (item) {
        const existing = itemProfits.get(item.id);
        if (existing) {
          existing.profit += profit;
        } else {
          itemProfits.set(item.id, { name: item.name, profit, currency });
        }
      }
    });

    const topItems = Array.from(itemProfits.values())
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10);

    // Expenses by category
    const expensesByCategory = expenses.reduce((acc, exp) => {
      const existing = acc.find(e => e.category === exp.category && e.currency === exp.currency_unit);
      if (existing) {
        existing.amount += exp.amount;
      } else {
        acc.push({ category: exp.category, amount: exp.amount, currency: exp.currency_unit });
      }
      return acc;
    }, [] as { category: string; amount: number; currency: string }[]);

    generateProfitReport({
      summary,
      topItems,
      expenses: expensesByCategory,
      period: { start: startOfMonth(new Date()), end: new Date() },
      generatedAt: new Date(),
    });
    
    toast.success('Profit report downloaded');
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <ArrowUp className="h-4 w-4 text-profit" />;
      case 'decreasing':
        return <ArrowDown className="h-4 w-4 text-loss" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Forecasting"
        description="Generate PDF reports and get AI-powered sales predictions"
      />

      {/* PDF Reports */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="hover-lift transition-default cursor-pointer" onClick={handleGenerateInventoryReport}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Inventory Report</CardTitle>
            </div>
            <CardDescription>
              Current stock levels and values
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <FileDown className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </CardContent>
        </Card>

        <Card className="hover-lift transition-default cursor-pointer" onClick={handleGenerateSalesReport}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <CardTitle className="text-base">Sales Report</CardTitle>
            </div>
            <CardDescription>
              Sales summary and transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <FileDown className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </CardContent>
        </Card>

        <Card className="hover-lift transition-default cursor-pointer" onClick={handleGenerateProfitReport}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-warning" />
              <CardTitle className="text-base">Profit Analysis</CardTitle>
            </div>
            <CardDescription>
              Revenue, costs, and profit breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <FileDown className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* AI Sales Forecasting */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>AI Sales Forecasting</CardTitle>
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              Powered by AI
            </Badge>
          </div>
          <CardDescription>
            Get AI-powered predictions for future demand based on your sales history
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label>Forecast Period (days)</Label>
              <Input
                type="number"
                min="7"
                max="90"
                value={daysToForecast}
                onChange={(e) => setDaysToForecast(parseInt(e.target.value) || 30)}
                className="w-24"
              />
            </div>
            <Button onClick={() => generateForecast(daysToForecast)} disabled={forecastLoading}>
              {forecastLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Generate Forecast
                </>
              )}
            </Button>
          </div>

          {forecastError && (
            <div className="p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
              {forecastError}
            </div>
          )}

          {forecast && (
            <div className="space-y-6">
              {/* Overall Insight */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-medium mb-2">Market Insight</h4>
                <p className="text-sm text-muted-foreground">{forecast.overallInsight}</p>
              </div>

              {/* Recommendations */}
              {forecast.recommendations?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Recommendations</h4>
                  <ul className="space-y-2">
                    {forecast.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-primary">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Item Forecasts */}
              {forecast.forecasts?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Item Predictions</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {forecast.forecasts.map((item, idx) => (
                      <Card key={idx} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h5 className="font-medium">{item.itemName}</h5>
                            <div className="flex items-center gap-2 mt-1">
                              {getTrendIcon(item.trend)}
                              <span className="text-sm text-muted-foreground capitalize">
                                {item.trend}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{item.predictedQuantity}</div>
                            <div className="text-xs text-muted-foreground">predicted units</div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>Confidence</span>
                            <span>{Math.round(item.confidence * 100)}%</span>
                          </div>
                          <Progress value={item.confidence * 100} className="h-1.5" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{item.reasoning}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
