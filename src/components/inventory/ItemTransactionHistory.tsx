import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CurrencyDisplay, ProfitDisplay } from '@/components/ui/CurrencyDisplay';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, TrendingUp, Calendar, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InventoryEntry, Sale, Item } from '@/contexts/AppContext';

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
            <ScrollArea className="h-[400px] pr-4">
              {itemEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No purchase records found.
                </div>
              ) : (
                <div className="space-y-3">
                  {itemEntries.map((entry) => (
                    <Card key={entry.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-xs',
                                  entry.status === 'OPEN' ? 'status-open' : 'status-closed'
                                )}
                              >
                                {entry.status}
                              </Badge>
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
                              <span className="font-mono font-medium">
                                {entry.remainingQty}/{entry.quantityBought}
                              </span>
                              <span className="text-muted-foreground"> remaining</span>
                            </div>
                            <CurrencyDisplay
                              amount={entry.unitCost}
                              currency={entry.currencyUnit}
                              size="sm"
                              className="font-medium"
                            />
                            <div className="text-xs text-muted-foreground">per unit</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="sales">
            <ScrollArea className="h-[400px] pr-4">
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
