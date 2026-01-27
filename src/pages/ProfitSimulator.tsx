import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClickableCurrencyDisplay, ClickableProfitDisplay } from '@/components/ui/ClickableCurrencyDisplay';
import { toast } from 'sonner';
import { Calculator, Package, TrendingUp, TrendingDown, Zap, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { CurrencyUnit } from '@/types/inventory';

const currencyOptions: { value: CurrencyUnit; label: string }[] = [
  { value: 'WL', label: 'World Lock (WL)' },
  { value: 'DL', label: 'Diamond Lock (DL)' },
  { value: 'BGL', label: 'Blue Gem Lock (BGL)' },
];

export default function ProfitSimulator() {
  const { data, getDistinctAvailableItems, getAvailableEntriesForItem, simulateProfit } = useApp();

  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [simulateQty, setSimulateQty] = useState('');
  const [sellRate, setSellRate] = useState('');
  const [sellCurrency, setSellCurrency] = useState<CurrencyUnit>('WL');
  const [result, setResult] = useState<ReturnType<typeof simulateProfit> | null>(null);

  const availableItems = useMemo(() => getDistinctAvailableItems(), [getDistinctAvailableItems]);

  const selectedItemEntries = useMemo(
    () => (selectedItemId ? getAvailableEntriesForItem(selectedItemId) : []),
    [selectedItemId, getAvailableEntriesForItem]
  );

  const totalRemaining = useMemo(
    () => selectedItemEntries.reduce((sum, e) => sum + e.remainingQty, 0),
    [selectedItemEntries]
  );

  const selectedItem = useMemo(
    () => data.items.find(i => i.id === selectedItemId),
    [data.items, selectedItemId]
  );

  // Check if all entries have the same currency
  const entryCurrencies = useMemo(() => {
    const currencies = new Set(selectedItemEntries.map(e => e.currencyUnit));
    return Array.from(currencies);
  }, [selectedItemEntries]);

  const hasMixedCurrencies = entryCurrencies.length > 1;
  const entryCurrency = entryCurrencies[0] || 'WL';

  const handleItemChange = (itemId: string) => {
    setSelectedItemId(itemId);
    setSimulateQty('');
    setSellRate('');
    setResult(null);
  };

  const handleSimulate = () => {
    const qty = parseInt(simulateQty, 10);
    const rate = parseFloat(sellRate);

    if (!selectedItemId) {
      toast.error('Please select an item');
      return;
    }
    if (!qty || qty <= 0) {
      toast.error('Quantity must be a positive integer');
      return;
    }
    if (qty > totalRemaining) {
      toast.error(`Cannot simulate more than ${totalRemaining} remaining`);
      return;
    }
    if (!rate || rate <= 0) {
      toast.error('Sell rate must be positive');
      return;
    }

    try {
      const simResult = simulateProfit(selectedItemId, qty, rate);
      setResult(simResult);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Simulation failed');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (availableItems.length === 0) {
    return (
      <div>
        <PageHeader title="Profit Simulator" description="Simulate selling your inventory" />
        <div className="text-center py-12 animate-fade-in">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium mb-1">No inventory available</h3>
          <p className="text-muted-foreground mb-4">
            Add some inventory first to run simulations.
          </p>
          <Button asChild>
            <Link to="/inventory/add">Add Inventory</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Check if currencies match for profit calculation
  const sameCurrency = !hasMixedCurrencies && sellCurrency === entryCurrency;

  return (
    <div>
      <PageHeader
        title="Profit Simulator"
        description="Calculate potential profit before selling"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Simulation Input
            </CardTitle>
            <CardDescription>
              Enter your selling parameters to calculate projected profit using FIFO costing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Select Item</Label>
              <Select value={selectedItemId} onValueChange={handleItemChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an item..." />
                </SelectTrigger>
                <SelectContent>
                  {availableItems.map(item => {
                    const entries = getAvailableEntriesForItem(item.id);
                    const qty = entries.reduce((sum, e) => sum + e.remainingQty, 0);
                    return (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} ({qty} available)
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedItemId && (
              <>
                <div className="p-4 rounded-lg bg-muted/50 animate-fade-in">
                  <div className="text-sm text-muted-foreground mb-2">Available Stock</div>
                  <div className="text-2xl font-bold number-display">{totalRemaining}</div>
                  <div className="text-sm text-muted-foreground">
                    across {selectedItemEntries.length} inventory entries
                  </div>
                  {hasMixedCurrencies && (
                    <div className="mt-2 text-xs text-warning flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Mixed currencies: {entryCurrencies.join(', ')}
                    </div>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="qty">Quantity to Simulate</Label>
                    <Input
                      id="qty"
                      type="number"
                      min="1"
                      max={totalRemaining}
                      step="1"
                      value={simulateQty}
                      onChange={(e) => setSimulateQty(e.target.value)}
                      placeholder={`Max: ${totalRemaining}`}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Sell Currency</Label>
                    <Select value={sellCurrency} onValueChange={(v) => setSellCurrency(v as CurrencyUnit)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencyOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <span className={cn(
                              'px-1.5 py-0.5 text-xs font-mono rounded mr-2',
                              opt.value === 'WL' && 'currency-wl',
                              opt.value === 'DL' && 'currency-dl',
                              opt.value === 'BGL' && 'currency-bgl'
                            )}>
                              {opt.value}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rate">Price per Unit ({sellCurrency})</Label>
                    <Input
                      id="rate"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={sellRate}
                      onChange={(e) => setSellRate(e.target.value)}
                      placeholder="Price per item"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSimulate}
                  className="w-full gap-2"
                  size="lg"
                  disabled={!simulateQty || !sellRate}
                >
                  <Zap className="w-4 h-4" />
                  Calculate Profit
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {result && (
            <Card className="animate-scale-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {sameCurrency && result.projectedProfit >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-profit" />
                  ) : sameCurrency ? (
                    <TrendingDown className="w-5 h-5 text-loss" />
                  ) : (
                    <Calculator className="w-5 h-5 text-primary" />
                  )}
                  Simulation Results
                </CardTitle>
                <CardDescription>
                  Selling {result.simulateQty} × {selectedItem?.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="text-sm text-muted-foreground">Projected Revenue</div>
                    <ClickableCurrencyDisplay
                      amount={result.projectedRevenue}
                      currency={sellCurrency}
                      size="lg"
                      className="text-foreground"
                    />
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="text-sm text-muted-foreground">Cost of Goods (FIFO)</div>
                    <ClickableCurrencyDisplay
                      amount={result.simulatedCogs}
                      currency={entryCurrency}
                      size="lg"
                      className="text-foreground"
                    />
                  </div>
                </div>

                {/* Profit */}
                {sameCurrency ? (
                  <div
                    className={cn(
                      'p-6 rounded-xl text-center',
                      result.projectedProfit >= 0
                        ? 'bg-[hsl(var(--profit)/0.1)] border border-[hsl(var(--profit)/0.3)]'
                        : 'bg-[hsl(var(--loss)/0.1)] border border-[hsl(var(--loss)/0.3)]'
                    )}
                  >
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      Projected Profit
                    </div>
                    <ClickableProfitDisplay
                      profit={result.projectedProfit}
                      currency={sellCurrency}
                      size="lg"
                      className="text-3xl"
                    />
                    <div className="text-sm text-muted-foreground mt-2">
                      {result.projectedProfit >= 0
                        ? `${((result.projectedProfit / result.simulatedCogs) * 100).toFixed(1)}% margin`
                        : 'Loss on this sale'}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-xl text-center bg-muted border border-border">
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      Projected Profit
                    </div>
                    <div className="text-lg text-muted-foreground">
                      Cannot calculate directly
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                      Revenue in {sellCurrency}, cost in {entryCurrency}
                    </div>
                  </div>
                )}

                {/* FIFO Breakdown */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Cost Breakdown (FIFO)</h4>
                  <div className="space-y-2">
                    {result.breakdown.map((item, index) => {
                      const entry = data.inventoryEntries.find(e => e.id === item.entryId);
                      return (
                        <div
                          key={item.entryId}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 text-sm animate-slide-in"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div>
                            <span className="text-muted-foreground">{formatDate(item.boughtAt)}</span>
                            <span className="mx-2">•</span>
                            <span className="font-mono">{item.qtyUsed}</span>
                            <span className="text-muted-foreground"> @ </span>
                            <ClickableCurrencyDisplay
                              amount={item.unitCost}
                              currency={entry?.currencyUnit || 'WL'}
                              size="sm"
                            />
                          </div>
                          <ClickableCurrencyDisplay
                            amount={item.costContribution}
                            currency={entry?.currencyUnit || 'WL'}
                            size="sm"
                            className="font-medium"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!result && selectedItemId && (
            <Card className="animate-fade-in border-dashed">
              <CardContent className="py-12 text-center">
                <Calculator className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  Enter quantity and sell price, then click Calculate.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
