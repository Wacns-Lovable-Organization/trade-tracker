import { useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { CurrencyDisplay, ProfitDisplay } from '@/components/ui/CurrencyDisplay';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  Package,
  TrendingUp,
  Coins,
  BarChart3,
  AlertCircle,
  ArrowRight,
  ShoppingCart,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { data, calculateSaleProfit } = useApp();

  const stats = useMemo(() => {
    const totalInventoryValue = data.inventoryEntries.reduce(
      (sum, e) => sum + e.remainingQty * e.unitCost,
      0
    );

    const totalRevenue = data.sales.reduce((sum, s) => sum + s.amountGained, 0);
    const totalCogs = data.sales.reduce((sum, s) => {
      const entry = data.inventoryEntries.find(e => e.id === s.inventoryEntryId);
      return sum + (entry ? s.quantitySold * entry.unitCost : 0);
    }, 0);
    const totalProfit = totalRevenue - totalCogs;

    const openEntries = data.inventoryEntries.filter(e => e.status === 'OPEN').length;
    const closedEntries = data.inventoryEntries.filter(e => e.status === 'CLOSED').length;

    // Top items by profit
    const profitByItem = new Map<string, { name: string; profit: number; sales: number }>();
    data.sales.forEach(sale => {
      const profit = calculateSaleProfit(sale);
      const entry = data.inventoryEntries.find(e => e.id === sale.inventoryEntryId);
      const name = entry?.snapshotName || 'Unknown';
      const existing = profitByItem.get(sale.itemId) || { name, profit: 0, sales: 0 };
      profitByItem.set(sale.itemId, {
        name,
        profit: existing.profit + profit,
        sales: existing.sales + sale.quantitySold,
      });
    });
    const topItems = Array.from(profitByItem.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);

    // Recent sales
    const recentSales = [...data.sales]
      .sort((a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime())
      .slice(0, 5);

    return {
      totalInventoryValue,
      totalRevenue,
      totalCogs,
      totalProfit,
      openEntries,
      closedEntries,
      topItems,
      recentSales,
    };
  }, [data, calculateSaleProfit]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (!data.meta.currencyUnit) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Overview of your inventory and profits" />
        <Alert className="animate-fade-in">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Welcome! Start by selecting your currency in Settings.</span>
            <Button asChild size="sm" className="ml-4">
              <Link to="/settings">Go to Settings</Link>
            </Button>
          </AlertDescription>
        </Alert>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card className="animate-fade-in hover-lift" style={{ animationDelay: '100ms' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Coins className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">1. Set Currency</h3>
                  <p className="text-sm text-muted-foreground">Choose WL, DL, or BGL</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="animate-fade-in hover-lift" style={{ animationDelay: '200ms' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">2. Add Inventory</h3>
                  <p className="text-sm text-muted-foreground">Log your purchases</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="animate-fade-in hover-lift" style={{ animationDelay: '300ms' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">3. Track Profits</h3>
                  <p className="text-sm text-muted-foreground">Record sales & analyze</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your inventory and profits"
      >
        <Button asChild className="gap-2">
          <Link to="/inventory/add">
            <Package className="w-4 h-4" />
            Add Inventory
          </Link>
        </Button>
      </PageHeader>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Inventory Value"
          value={
            <CurrencyDisplay
              amount={stats.totalInventoryValue}
              currency={data.meta.currencyUnit}
            />
          }
          icon={Package}
          subtitle={`${stats.openEntries} open entries`}
          className="animate-fade-in"
        />
        <StatCard
          title="Total Revenue"
          value={
            <CurrencyDisplay
              amount={stats.totalRevenue}
              currency={data.meta.currencyUnit}
            />
          }
          icon={Coins}
          subtitle={`${data.sales.length} sales`}
          className="animate-fade-in"
          style={{ animationDelay: '50ms' }}
        />
        <StatCard
          title="Total Profit"
          value={
            <ProfitDisplay profit={stats.totalProfit} currency={data.meta.currencyUnit} />
          }
          icon={TrendingUp}
          trend={stats.totalProfit >= 0 ? 'up' : 'down'}
          subtitle={
            stats.totalRevenue > 0
              ? `${((stats.totalProfit / stats.totalCogs) * 100).toFixed(1)}% margin`
              : 'No sales yet'
          }
          className="animate-fade-in"
          style={{ animationDelay: '100ms' }}
        />
        <StatCard
          title="Items Tracked"
          value={data.items.length}
          icon={BarChart3}
          subtitle={`${data.categories.length} categories`}
          className="animate-fade-in"
          style={{ animationDelay: '150ms' }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Items */}
        <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <CardTitle className="text-lg">Top Items by Profit</CardTitle>
            <CardDescription>Your most profitable items</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No sales recorded yet.</p>
                <Button asChild variant="link" size="sm">
                  <Link to="/sales">Record a Sale</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.topItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 animate-slide-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                          index === 0
                            ? 'bg-amber-500/20 text-amber-600'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {index + 1}
                      </span>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.sales} sold
                        </div>
                      </div>
                    </div>
                    <ProfitDisplay
                      profit={item.profit}
                      currency={data.meta.currencyUnit}
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Sales */}
        <Card className="animate-fade-in" style={{ animationDelay: '250ms' }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Sales</CardTitle>
              <CardDescription>Your latest transactions</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link to="/sales">
                View all
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats.recentSales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No sales recorded yet.</p>
                <Button asChild variant="link" size="sm">
                  <Link to="/sales">Record your first sale</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentSales.map((sale, index) => {
                  const entry = data.inventoryEntries.find(
                    e => e.id === sale.inventoryEntryId
                  );
                  const profit = calculateSaleProfit(sale);
                  return (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 animate-slide-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div>
                        <div className="font-medium">{entry?.snapshotName || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(sale.soldAt)} • {sale.quantitySold} sold
                        </div>
                      </div>
                      <div className="text-right">
                        <CurrencyDisplay
                          amount={sale.amountGained}
                          currency={sale.currencyUnit}
                          size="sm"
                          className="font-medium"
                        />
                        <ProfitDisplay
                          profit={profit}
                          currency={sale.currencyUnit}
                          size="sm"
                          className="block text-xs"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
