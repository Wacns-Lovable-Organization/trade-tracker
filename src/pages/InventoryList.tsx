import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { Link } from 'react-router-dom';
import { Plus, Package, Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function InventoryList() {
  const { data } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'OPEN' | 'CLOSED'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredEntries = useMemo(() => {
    return data.inventoryEntries
      .filter(entry => {
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          if (!entry.snapshotName.toLowerCase().includes(query)) {
            return false;
          }
        }
        // Status filter
        if (statusFilter !== 'all' && entry.status !== statusFilter) {
          return false;
        }
        // Category filter
        if (categoryFilter !== 'all' && entry.snapshotCategoryId !== categoryFilter) {
          return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.boughtAt).getTime() - new Date(a.boughtAt).getTime());
  }, [data.inventoryEntries, searchQuery, statusFilter, categoryFilter]);

  const getCategoryName = (categoryId: string) => {
    return data.categories.find(c => c.id === categoryId)?.name || 'Unknown';
  };

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

  return (
    <div>
      <PageHeader
        title="Inventory"
        description={`${data.inventoryEntries.length} total entries`}
      >
        <Button asChild className="gap-2">
          <Link to="/inventory/add">
            <Plus className="w-4 h-4" />
            Add Entry
          </Link>
        </Button>
      </PageHeader>

      {/* Filters */}
      <Card className="mb-6 animate-fade-in">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-32">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {data.categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {filteredEntries.length === 0 ? (
        <div className="text-center py-12 animate-fade-in">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium mb-1">No inventory entries</h3>
          <p className="text-muted-foreground mb-4">
            {data.inventoryEntries.length === 0
              ? 'Start by adding your first purchase.'
              : 'No entries match your filters.'}
          </p>
          {data.inventoryEntries.length === 0 && (
            <Button asChild>
              <Link to="/inventory/add">Add First Entry</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEntries.map((entry, index) => (
            <Card
              key={entry.id}
              className="animate-fade-in hover-lift"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Item Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">{entry.snapshotName}</h3>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          entry.status === 'OPEN' ? 'status-open' : 'status-closed'
                        )}
                      >
                        {entry.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <span>{getCategoryName(entry.snapshotCategoryId)}</span>
                      <span>•</span>
                      <span>{formatDate(entry.boughtAt)}</span>
                    </div>
                    {entry.notes && (
                      <p className="text-sm text-muted-foreground mt-2 truncate">
                        {entry.notes}
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 sm:gap-6 text-center sm:text-right">
                    <div>
                      <div className="text-xs text-muted-foreground">Qty</div>
                      <div className="font-mono font-medium">
                        {entry.remainingQty}/{entry.quantityBought}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Unit Cost</div>
                      <CurrencyDisplay
                        amount={entry.unitCost}
                        currency={entry.currencyUnit}
                        size="sm"
                        className="font-medium"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Total</div>
                      <CurrencyDisplay
                        amount={entry.totalCost}
                        currency={entry.currencyUnit}
                        size="sm"
                        className="font-medium"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
