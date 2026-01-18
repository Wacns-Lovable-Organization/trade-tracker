import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyDisplay, ProfitDisplay } from '@/components/ui/CurrencyDisplay';
import { toast } from 'sonner';
import { TrendingUp, Package, ArrowRight, Coins } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { CurrencyUnit } from '@/types/inventory';

const currencyOptions: { value: CurrencyUnit; label: string }[] = [
  { value: 'WL', label: 'World Lock (WL)' },
  { value: 'DL', label: 'Diamond Lock (DL)' },
  { value: 'BGL', label: 'Blue Gem Lock (BGL)' },
];

export default function Sales() {
  const { data, getDistinctAvailableItems, getAvailableEntriesForItem, addSale } = useApp();

  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedEntryId, setSelectedEntryId] = useState<string>('');
  const [quantitySold, setQuantitySold] = useState('');
  const [amountGained, setAmountGained] = useState('');
  const [currencyUnit, setCurrencyUnit] = useState<CurrencyUnit>('WL');
  const [notes, setNotes] = useState('');
  const [soldAt, setSoldAt] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  const availableItems = useMemo(() => getDistinctAvailableItems(), [getDistinctAvailableItems]);
  const availableEntries = useMemo(
    () => (selectedItemId ? getAvailableEntriesForItem(selectedItemId) : []),
    [selectedItemId, getAvailableEntriesForItem]
  );
  const selectedEntry = useMemo(
    () => data.inventoryEntries.find(e => e.id === selectedEntryId),
    [data.inventoryEntries, selectedEntryId]
  );

  // Reset entry when item changes
  const handleItemChange = (itemId: string) => {
    setSelectedItemId(itemId);
    setSelectedEntryId('');
    setQuantitySold('');
    setAmountGained('');
  };

  // Calculate profit preview (note: different currencies may be used)
  const qty = parseInt(quantitySold, 10) || 0;
  const amount = parseFloat(amountGained) || 0;
  const costOfSold = selectedEntry ? qty * selectedEntry.unitCost : 0;
  const sameCurrency = selectedEntry?.currencyUnit === currencyUnit;
  const profit = sameCurrency ? amount - costOfSold : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEntryId) {
      toast.error('Please select an inventory entry');
      return;
    }

    const qtyNum = parseInt(quantitySold, 10);
    const amountNum = parseFloat(amountGained);

    if (!qtyNum || qtyNum <= 0) {
      toast.error('Quantity must be a positive integer');
      return;
    }
    if (!amountNum || amountNum <= 0) {
      toast.error('Amount gained must be positive');
      return;
    }

    try {
      addSale(selectedEntryId, qtyNum, amountNum, currencyUnit, notes, new Date(soldAt).toISOString());
      toast.success('Sale recorded successfully');

      // Reset form
      setSelectedItemId('');
      setSelectedEntryId('');
      setQuantitySold('');
      setAmountGained('');
      setNotes('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to record sale');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (availableItems.length === 0) {
    return (
      <div>
        <PageHeader title="Record Sale" description="Log a sale from your inventory" />
        <div className="text-center py-12 animate-fade-in">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium mb-1">No inventory available</h3>
          <p className="text-muted-foreground mb-4">
            Add some inventory first before recording sales.
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
        title="Record Sale"
        description="Log a sale from your inventory"
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <Card className="lg:col-span-2 animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Sale Details
              </CardTitle>
              <CardDescription>
                Select an inventory entry and record your sale.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Select Item */}
              <div className="space-y-2">
                <Label>Step 1: Select Item</Label>
                <Select value={selectedItemId} onValueChange={handleItemChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an item..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableItems.map(item => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Step 2: Select Entry */}
              {selectedItemId && (
                <div className="space-y-2 animate-fade-in">
                  <Label>Step 2: Select Inventory Entry</Label>
                  <div className="grid gap-2">
                    {availableEntries.map(entry => (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => setSelectedEntryId(entry.id)}
                        className={cn(
                          'w-full p-4 rounded-lg border text-left transition-default',
                          selectedEntryId === entry.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(entry.boughtAt)}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="font-mono">
                                {entry.remainingQty} remaining
                              </span>
                              <span className="text-muted-foreground">@</span>
                              <CurrencyDisplay
                                amount={entry.unitCost}
                                currency={entry.currencyUnit}
                                size="sm"
                              />
                            </div>
                          </div>
                          <div
                            className={cn(
                              'w-4 h-4 rounded-full border-2',
                              selectedEntryId === entry.id
                                ? 'border-primary bg-primary'
                                : 'border-muted-foreground'
                            )}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Sale Details */}
              {selectedEntryId && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity Sold *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        max={selectedEntry?.remainingQty}
                        step="1"
                        value={quantitySold}
                        onChange={(e) => setQuantitySold(e.target.value)}
                        placeholder={`Max: ${selectedEntry?.remainingQty}`}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Sale Currency *</Label>
                      <Select value={currencyUnit} onValueChange={(v) => setCurrencyUnit(v as CurrencyUnit)}>
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
                      <Label htmlFor="amount">Amount Gained ({currencyUnit}) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={amountGained}
                        onChange={(e) => setAmountGained(e.target.value)}
                        placeholder="Total amount received"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="soldAt">Sale Date</Label>
                    <Input
                      id="soldAt"
                      type="datetime-local"
                      value={soldAt}
                      onChange={(e) => setSoldAt(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any notes about this sale..."
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Sidebar */}
          <div className="space-y-4">
            <Card className="animate-fade-in sticky top-4" style={{ animationDelay: '100ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-primary" />
                  Profit Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Quantity</span>
                    <span className="font-mono">{qty || '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Revenue</span>
                    <CurrencyDisplay
                      amount={amount}
                      currency={currencyUnit}
                      size="sm"
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cost of Goods</span>
                    <CurrencyDisplay
                      amount={costOfSold}
                      currency={selectedEntry?.currencyUnit || 'WL'}
                      size="sm"
                    />
                  </div>
                  <hr className="border-border" />
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Profit</span>
                    {sameCurrency && profit !== null ? (
                      <ProfitDisplay
                        profit={qty > 0 && amount > 0 ? profit : 0}
                        currency={currencyUnit}
                        size="lg"
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Mixed currencies
                      </span>
                    )}
                  </div>
                </div>

                {!sameCurrency && selectedEntry && (
                  <p className="text-xs text-warning bg-warning/10 p-2 rounded">
                    Note: Selling in {currencyUnit} but bought in {selectedEntry.currencyUnit}. Profit shown separately.
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full gap-2"
                  size="lg"
                  disabled={!selectedEntryId || !qty || !amount}
                >
                  Record Sale
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
