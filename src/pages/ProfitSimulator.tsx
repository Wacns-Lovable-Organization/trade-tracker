import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyDisplay, ProfitDisplay } from '@/components/ui/CurrencyDisplay';
import { toast } from 'sonner';
import { Calculator, AlertCircle, Package, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { SimulationResult } from '@/types/inventory';

export default function ProfitSimulator() {
  const { data, getDistinctAvailableItems, getAvailableEntriesForItem, simulateProfit } = useApp();

  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [simulateQty, setSimulateQty] = useState('');
  const [sellRate, setSellRate] = useState('');
  const [result, setResult] = useState<SimulationResult | null>(null);

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

  if (!data.meta.currencyUnit) {
    return (
      <div>
        <PageHeader title="Profit Simulator" description="Simulate selling your inventory" />
        <Alert className="animate-fade-in">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>You need to set a currency in Settings first.</span>
            <Button asChild size="sm" className="ml-4">
              <Link to="/settings">Go to Settings</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
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
                    <Label htmlFor="rate">Sell Price per Unit ({data.meta.currencyUnit})</Label>
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
                  {result.projectedProfit >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-profit" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-loss" />
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
                    <CurrencyDisplay
                      amount={result.projectedRevenue}
                      currency={data.meta.currencyUnit}
                      size="lg"
                      className="text-foreground"
                    />
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="text-sm text-muted-foreground">Cost of Goods (FIFO)</div>
                    <CurrencyDisplay
                      amount={result.simulatedCogs}
                      currency={data.meta.currencyUnit}
                      size="lg"
                      className="text-foreground"
                    />
                  </div>
                </div>

                {/* Profit */}
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
                  <ProfitDisplay
                    profit={result.projectedProfit}
                    currency={data.meta.currencyUnit}
                    size="lg"
                    className="text-3xl"
                  />
                  <div className="text-sm text-muted-foreground mt-2">
                    {result.projectedProfit >= 0
                      ? `${((result.projectedProfit / result.simulatedCogs) * 100).toFixed(1)}% margin`
                      : 'Loss on this sale'}
                  </div>
                </div>

                {/* FIFO Breakdown */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Cost Breakdown (FIFO)</h4>
                  <div className="space-y-2">
                    {result.breakdown.map((item, index) => (
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
                          <CurrencyDisplay
                            amount={item.unitCost}
                            currency={data.meta.currencyUnit}
                            size="sm"
                          />
                        </div>
                        <CurrencyDisplay
                          amount={item.costContribution}
                          currency={data.meta.currencyUnit}
                          size="sm"
                          className="font-medium"
                        />
                      </div>
                    ))}
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
