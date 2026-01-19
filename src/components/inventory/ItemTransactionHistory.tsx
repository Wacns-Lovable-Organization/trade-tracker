import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CurrencyDisplay, ProfitDisplay } from '@/components/ui/CurrencyDisplay';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Package, TrendingUp, Calendar, ArrowDownCircle, ArrowUpCircle, Pencil, Trash2, X, Check, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp, type InventoryEntry, type Sale, type Item } from '@/contexts/AppContext';
import { toast } from 'sonner';

interface ItemTransactionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item | null;
  inventoryEntries: InventoryEntry[];
  sales: Sale[];
}

export function ItemTransactionHistory({
  open,
  onOpenChange,
  item,
  inventoryEntries,
  sales,
}: ItemTransactionHistoryProps) {
  const { updateInventoryEntry, deleteInventoryEntry, getItemProfitSummary } = useApp();
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ quantityBought: 0, unitCost: 0, notes: '' });

  const itemEntries = useMemo(() => {
    if (!item) return [];
    return inventoryEntries
      .filter(e => e.itemId === item.id)
      .sort((a, b) => new Date(b.boughtAt).getTime() - new Date(a.boughtAt).getTime());
  }, [item, inventoryEntries]);

  const itemSales = useMemo(() => {
    if (!item) return [];
    return sales
      .filter(s => s.itemId === item.id)
      .sort((a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime());
  }, [item, sales]);

  const profitSummary = useMemo(() => {
    if (!item) return null;
    return getItemProfitSummary(item.id);
  }, [item, getItemProfitSummary]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStartEdit = (entry: InventoryEntry) => {
    setEditingEntryId(entry.id);
    setEditForm({
      quantityBought: entry.quantityBought,
      unitCost: entry.unitCost,
      notes: entry.notes || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingEntryId(null);
    setEditForm({ quantityBought: 0, unitCost: 0, notes: '' });
  };

  const handleSaveEdit = async (entryId: string) => {
    try {
      await updateInventoryEntry(entryId, {
        quantityBought: editForm.quantityBought,
        unitCost: editForm.unitCost,
        notes: editForm.notes,
      });
      toast.success('Entry updated');
      setEditingEntryId(null);
    } catch (error) {
      toast.error('Failed to update entry');
    }
  };

  const handleDelete = async (entryId: string) => {
    try {
      await deleteInventoryEntry(entryId);
      toast.success('Entry deleted');
    } catch (error) {
      toast.error('Failed to delete entry');
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            {item.name} - Transaction History
          </DialogTitle>
        </DialogHeader>

        {/* Profit Summary Card */}
        {profitSummary && profitSummary.currency && (
          <Card className="bg-muted/30 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">Profit Summary</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
                  <CurrencyDisplay
                    amount={profitSummary.totalRevenue}
                    currency={profitSummary.currency}
                    size="sm"
                    className="font-semibold text-success"
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Cost</p>
                  <CurrencyDisplay
                    amount={profitSummary.totalCost}
                    currency={profitSummary.currency}
                    size="sm"
                    className="font-semibold"
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Cumulative Profit</p>
                  <ProfitDisplay
                    profit={profitSummary.cumulativeProfit}
                    currency={profitSummary.currency}
                    size="sm"
                    className="font-semibold"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="purchases" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="purchases" className="gap-2">
              <ArrowDownCircle className="w-4 h-4" />
              Purchases ({itemEntries.length})
            </TabsTrigger>
            <TabsTrigger value="sales" className="gap-2">
              <ArrowUpCircle className="w-4 h-4" />
              Sales ({itemSales.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="purchases">
            <ScrollArea className="h-[350px] pr-4">
              {itemEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No purchase records found.
                </div>
              ) : (
                <div className="space-y-3">
                  {itemEntries.map((entry) => (
                    <Card key={entry.id}>
                      <CardContent className="p-4">
                        {editingEntryId === entry.id ? (
                          // Edit mode
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs">Quantity</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={editForm.quantityBought}
                                  onChange={(e) => setEditForm(f => ({ ...f, quantityBought: parseInt(e.target.value) || 0 }))}
                                  className="h-8"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Unit Cost</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={editForm.unitCost}
                                  onChange={(e) => setEditForm(f => ({ ...f, unitCost: parseFloat(e.target.value) || 0 }))}
                                  className="h-8"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs">Notes</Label>
                              <Input
                                value={editForm.notes}
                                onChange={(e) => setEditForm(f => ({ ...f, notes: e.target.value }))}
                                className="h-8"
                                placeholder="Optional notes..."
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                                <X className="w-4 h-4 mr-1" /> Cancel
                              </Button>
                              <Button size="sm" onClick={() => handleSaveEdit(entry.id)}>
                                <Check className="w-4 h-4 mr-1" /> Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // View mode
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(entry.boughtAt)}
                                </span>
                              </div>
                              {entry.notes && (
                                <p className="text-sm text-muted-foreground mt-1 truncate">
                                  {entry.notes}
                                </p>
                              )}
                            </div>
                            <div className="text-right space-y-1">
                              <div className="text-sm">
                                <span className="font-mono font-medium">{entry.quantityBought}</span>
                                <span className="text-muted-foreground"> qty</span>
                              </div>
                              <CurrencyDisplay
                                amount={entry.unitCost}
                                currency={entry.currencyUnit}
                                size="sm"
                                className="font-medium"
                              />
                              <div className="text-xs text-muted-foreground">per unit</div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => handleStartEdit(entry)}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete this purchase entry. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(entry.id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="sales">
            <ScrollArea className="h-[350px] pr-4">
              {itemSales.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No sales records found.
                </div>
              ) : (
                <div className="space-y-3">
                  {itemSales.map((sale) => (
                    <Card key={sale.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                                SOLD
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(sale.soldAt)}
                              </span>
                            </div>
                            {sale.notes && (
                              <p className="text-sm text-muted-foreground mt-1 truncate">
                                {sale.notes}
                              </p>
                            )}
                          </div>
                          <div className="text-right space-y-1">
                            <div className="text-sm">
                              <span className="font-mono font-medium">{sale.quantitySold}</span>
                              <span className="text-muted-foreground"> sold</span>
                            </div>
                            <CurrencyDisplay
                              amount={sale.amountGained}
                              currency={sale.currencyUnit}
                              size="sm"
                              className="font-medium"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
