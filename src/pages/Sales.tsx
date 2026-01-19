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
import { TrendingUp, Package, ArrowRight, Coins, Search, ArrowLeft, History } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { GroupedItemCard, type GroupedItem } from '@/components/inventory/GroupedItemCard';
import { ItemTransactionHistory } from '@/components/inventory/ItemTransactionHistory';
import type { CurrencyUnit } from '@/types/inventory';

const currencyOptions: { value: CurrencyUnit; label: string }[] = [
  { value: 'WL', label: 'World Lock (WL)' },
  { value: 'DL', label: 'Diamond Lock (DL)' },
  { value: 'BGL', label: 'Blue Gem Lock (BGL)' },
];

export default function Sales() {
  const { data, addSaleByItem, getTotalAvailableForItem } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantitySold, setQuantitySold] = useState('');
  const [amountGained, setAmountGained] = useState('');
  const [currencyUnit, setCurrencyUnit] = useState<CurrencyUnit>('WL');
  const [notes, setNotes] = useState('');
  const [soldAt, setSoldAt] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState<typeof data.items[0] | null>(null);

  // Group items by ID and calculate lifetime totals
  const groupedItems = useMemo(() => {
    const itemMap = new Map<string, GroupedItem>();

    // First pass: calculate lifetime totals from inventory
    data.inventoryEntries.forEach(entry => {
      const item = data.items.find(i => i.id === entry.itemId);
      if (!item) return;

      const existing = itemMap.get(item.id);
      const category = data.categories.find(c => c.id === entry.snapshotCategoryId);

      if (existing) {
        existing.totalPurchasedQty += entry.quantityBought;
        existing.lifetimeTotalCost += entry.quantityBought * entry.unitCost;
      } else {
        itemMap.set(item.id, {
          id: item.id,
          name: item.name,
          categoryId: entry.snapshotCategoryId,
          categoryName: category?.name || 'Other',
          remainingQty: 0,
          totalPurchasedQty: entry.quantityBought,
          lifetimeTotalCost: entry.quantityBought * entry.unitCost,
          currency: entry.currencyUnit,
        });
      }
    });

    // Second pass: calculate remaining qty (totalPurchased - totalSold)
    itemMap.forEach((groupedItem, itemId) => {
      const totalSold = data.sales
        .filter(s => s.itemId === itemId)
        .reduce((sum, s) => sum + s.quantitySold, 0);
      groupedItem.remainingQty = groupedItem.totalPurchasedQty - totalSold;
    });

    // Only show items with remaining qty > 0
    return Array.from(itemMap.values())
      .filter(item => item.remainingQty > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data.inventoryEntries, data.items, data.categories, data.sales]);

  // Filter by search
  const filteredItems = useMemo(() => {
    if (!searchQuery) return groupedItems;
    const q = searchQuery.toLowerCase();
    return groupedItems.filter(
      item => item.name.toLowerCase().includes(q) || item.categoryName.toLowerCase().includes(q)
    );
  }, [groupedItems, searchQuery]);

  const selectedItem = useMemo(
    () => data.items.find(i => i.id === selectedItemId),
    [data.items, selectedItemId]
  );

  const selectedItemInfo = useMemo(() => {
    if (!selectedItemId) return null;
    return getTotalAvailableForItem(selectedItemId);
  }, [selectedItemId, getTotalAvailableForItem]);

  // Handle item selection
  const handleItemSelect = (itemId: string) => {
    setSelectedItemId(itemId);
    setQuantitySold('');
    setAmountGained('');
  };

  // Go back to item list
  const handleBack = () => {
    setSelectedItemId('');
    setQuantitySold('');
    setAmountGained('');
  };

  // Open history for an item
  const openHistory = (item: typeof data.items[0]) => {
    setHistoryItem(item);
    setHistoryOpen(true);
  };

  // Calculate profit preview using lifetime average cost
  const qty = parseInt(quantitySold, 10) || 0;
  const amount = parseFloat(amountGained) || 0;
  
  // Cost = (lifetimeTotalCost / totalPurchasedQty) * qty
  const avgCost = selectedItemInfo && selectedItemInfo.totalPurchasedQty > 0 
    ? selectedItemInfo.lifetimeTotalCost / selectedItemInfo.totalPurchasedQty 
    : 0;
  const estimatedCost = avgCost * qty;
  const sameCurrency = selectedItemInfo?.currency === currencyUnit;
  const profit = sameCurrency ? amount - estimatedCost : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedItemId) {
      toast.error('Please select an item');
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
      await addSaleByItem(selectedItemId, qtyNum, amountNum, currencyUnit, notes, new Date(soldAt).toISOString());
      toast.success('Sale recorded successfully');

      // Reset form
      setSelectedItemId('');
      setQuantitySold('');
      setAmountGained('');
      setNotes('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to record sale');
    }
  };

  if (groupedItems.length === 0) {
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
                {selectedItemId ? 'Enter sale details' : 'Select an item to sell'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Item Selection (grouped view) */}
              {!selectedItemId && (
                <div className="space-y-4 animate-fade-in">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {filteredItems.map((item) => (
                      <GroupedItemCard
                        key={item.id}
                        item={item}
                        onClick={() => handleItemSelect(item.id)}
                        showArrow
                      />
                    ))}
                    {filteredItems.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No items match your search.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Sale Details */}
              {selectedItemId && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={handleBack}>
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Back
                    </Button>
                    <span className="font-medium">{selectedItem?.name}</span>
                    <span className="text-muted-foreground">
                      • {selectedItemInfo?.remainingQty} of {selectedItemInfo?.totalPurchasedQty} remaining
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="ml-auto"
                      onClick={() => selectedItem && openHistory(selectedItem)}
                    >
                      <History className="w-4 h-4 mr-1" />
                      History
                    </Button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity Sold *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        max={selectedItemInfo?.remainingQty}
                        step="1"
                        value={quantitySold}
                        onChange={(e) => setQuantitySold(e.target.value)}
                        placeholder={`Max: ${selectedItemInfo?.remainingQty}`}
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
                      amount={estimatedCost}
                      currency={selectedItemInfo?.currency || 'WL'}
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

                {!sameCurrency && selectedItemInfo?.currency && (
                  <p className="text-xs text-warning bg-warning/10 p-2 rounded">
                    Note: Selling in {currencyUnit} but inventory is in {selectedItemInfo.currency}. Profit shown separately.
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full gap-2"
                  size="lg"
                  disabled={!selectedItemId || !qty || !amount}
                >
                  Record Sale
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      <ItemTransactionHistory
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        item={historyItem}
        inventoryEntries={data.inventoryEntries}
        sales={data.sales}
      />
    </div>
  );
}
