import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Plus, Package, Search, Filter } from 'lucide-react';
import { GroupedItemCard, type GroupedItem } from '@/components/inventory/GroupedItemCard';
import { ItemTransactionHistory } from '@/components/inventory/ItemTransactionHistory';
import type { CurrencyUnit } from '@/types/inventory';

export default function InventoryList() {
  const { data } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'OPEN' | 'CLOSED'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<typeof data.items[0] | null>(null);

  // Group inventory entries by item
  const groupedItems = useMemo(() => {
    const itemMap = new Map<string, GroupedItem>();

    data.inventoryEntries
      .filter(entry => {
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
      .forEach(entry => {
        const item = data.items.find(i => i.id === entry.itemId);
        if (!item) return;

        const existing = itemMap.get(item.id);
        const category = data.categories.find(c => c.id === entry.snapshotCategoryId);

        if (existing) {
          existing.totalQuantity += entry.remainingQty;
          if (entry.status === 'OPEN' && entry.remainingQty > 0) {
            existing.openEntries += 1;
          }
        } else {
          itemMap.set(item.id, {
            id: item.id,
            name: item.name,
            categoryId: entry.snapshotCategoryId,
            categoryName: category?.name || 'Other',
            totalQuantity: entry.remainingQty,
            openEntries: entry.status === 'OPEN' && entry.remainingQty > 0 ? 1 : 0,
            valueByCurrency: [],
          });
        }
      });

    return Array.from(itemMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [data.inventoryEntries, data.items, data.categories, statusFilter, categoryFilter]);

  // Filter by search
  const filteredItems = useMemo(() => {
    if (!searchQuery) return groupedItems;
    const q = searchQuery.toLowerCase();
    return groupedItems.filter(
      item => item.name.toLowerCase().includes(q) || item.categoryName.toLowerCase().includes(q)
    );
  }, [groupedItems, searchQuery]);

  const handleItemClick = (groupedItem: GroupedItem) => {
    const item = data.items.find(i => i.id === groupedItem.id);
    if (item) {
      setSelectedItem(item);
      setHistoryOpen(true);
    }
  };

  const totalEntries = data.inventoryEntries.length;
  const totalItems = new Set(data.inventoryEntries.map(e => e.itemId)).size;

  return (
    <div>
      <PageHeader
        title="Inventory"
        description={`${totalItems} items • ${totalEntries} entries`}
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

      {/* Grouped Items List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 animate-fade-in">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium mb-1">No items found</h3>
          <p className="text-muted-foreground mb-4">
            {data.inventoryEntries.length === 0
              ? 'Start by adding your first purchase.'
              : 'No items match your filters.'}
          </p>
          {data.inventoryEntries.length === 0 && (
            <Button asChild>
              <Link to="/inventory/add">Add First Entry</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <GroupedItemCard
                item={item}
                onClick={() => handleItemClick(item)}
                showArrow
              />
            </div>
          ))}
        </div>
      )}

      <ItemTransactionHistory
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        item={selectedItem}
        inventoryEntries={data.inventoryEntries}
        sales={data.sales}
      />
    </div>
  );
}
