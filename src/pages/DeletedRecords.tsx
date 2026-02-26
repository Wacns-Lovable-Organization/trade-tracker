import { useState, useMemo } from 'react';
import { useDeletedRecords, type DeletedRecord } from '@/hooks/useDeletedRecords';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { 
  Trash2, 
  RotateCcw, 
  Package, 
  TrendingUp, 
  Receipt, 
  ShoppingCart,
  Archive,
  Loader2,
  CheckSquare,
  Search
} from 'lucide-react';
import { format } from 'date-fns';

const typeConfig = {
  inventory: { label: 'Inventory', icon: ShoppingCart, color: 'bg-primary/10 text-primary' },
  sale: { label: 'Sale', icon: TrendingUp, color: 'bg-green-500/10 text-green-600' },
  item: { label: 'Item', icon: Package, color: 'bg-blue-500/10 text-blue-600' },
  expense: { label: 'Expense', icon: Receipt, color: 'bg-orange-500/10 text-orange-600' },
};

export default function DeletedRecords() {
  const { 
    records, 
    allRecords, 
    isLoading, 
    filter, 
    setFilter, 
    restoreRecord, 
    permanentlyDelete 
  } = useDeletedRecords();
  
  const [confirmAction, setConfirmAction] = useState<{ record?: DeletedRecord; records?: DeletedRecord[]; action: 'restore' | 'delete' } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase();
    return records.filter(r => r.name.toLowerCase().includes(q) || r.details.toLowerCase().includes(q));
  }, [records, searchQuery]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRecords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecords.map(r => `${r.type}-${r.id}`)));
    }
  };

  const selectedRecords = useMemo(() => 
    records.filter(r => selectedIds.has(`${r.type}-${r.id}`)),
    [records, selectedIds]
  );

  const handleAction = async () => {
    if (!confirmAction) return;
    
    setActionLoading(true);
    try {
      const targets = confirmAction.records || (confirmAction.record ? [confirmAction.record] : []);
      for (const rec of targets) {
        if (confirmAction.action === 'restore') {
          await restoreRecord(rec);
        } else {
          await permanentlyDelete(rec);
        }
      }
      const count = targets.length;
      const label = count === 1 ? targets[0].name : `${count} records`;
      toast.success(`${label} ${confirmAction.action === 'restore' ? 'restored' : 'permanently deleted'}`);
      setSelectedIds(new Set());
    } catch (error) {
      toast.error(`Failed to ${confirmAction.action} records`);
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const counts = {
    all: allRecords.length,
    inventory: allRecords.filter(r => r.type === 'inventory').length,
    sale: allRecords.filter(r => r.type === 'sale').length,
    item: allRecords.filter(r => r.type === 'item').length,
    expense: allRecords.filter(r => r.type === 'expense').length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deleted Records"
        description={`${allRecords.length} soft-deleted records available for review or restoration`}
      />

      {/* Filter & Bulk Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={filter} onValueChange={(v) => { setFilter(v as typeof filter); setSelectedIds(new Set()); }}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types ({counts.all})</SelectItem>
            <SelectItem value="inventory">Inventory ({counts.inventory})</SelectItem>
            <SelectItem value="sale">Sales ({counts.sale})</SelectItem>
            <SelectItem value="item">Items ({counts.item})</SelectItem>
            <SelectItem value="expense">Expenses ({counts.expense})</SelectItem>
          </SelectContent>
        </Select>

        {records.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={toggleSelectAll}>
              <CheckSquare className="w-4 h-4" />
              {selectedIds.size === records.length ? 'Deselect All' : 'Select All'}
            </Button>
            {selectedIds.size > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setConfirmAction({ records: selectedRecords, action: 'restore' })}
                >
                  <RotateCcw className="w-4 h-4" />
                  Restore ({selectedIds.size})
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmAction({ records: selectedRecords, action: 'delete' })}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete ({selectedIds.size})
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Records List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 animate-fade-in">
          <Archive className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium mb-1">No deleted records</h3>
          <p className="text-muted-foreground">
            {filter === 'all' 
              ? 'Records you delete will appear here for review.' 
              : `No deleted ${filter} records found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record, index) => {
            const config = typeConfig[record.type];
            const Icon = config.icon;
            
            return (
              <Card 
                key={`${record.type}-${record.id}`} 
                className="animate-fade-in border-dashed"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedIds.has(`${record.type}-${record.id}`)}
                      onCheckedChange={() => toggleSelect(`${record.type}-${record.id}`)}
                    />
                    <div className={`p-2 rounded-lg ${config.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{record.name}</h3>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {record.details}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created: {format(new Date(record.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setConfirmAction({ record, action: 'restore' })}
                      >
                        <RotateCcw className="w-4 h-4" />
                        Restore
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setConfirmAction({ record, action: 'delete' })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === 'restore' ? 'Restore Record(s)' : 'Permanently Delete'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const count = confirmAction?.records?.length || 1;
                const label = count > 1 ? `${count} records` : `"${confirmAction?.record?.name || confirmAction?.records?.[0]?.name}"`;
                return confirmAction?.action === 'restore'
                  ? `Are you sure you want to restore ${label}? ${count > 1 ? 'They' : 'It'} will become active again.`
                  : `Are you sure you want to permanently delete ${label}? This action cannot be undone.`;
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={actionLoading}
              className={confirmAction?.action === 'delete' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {confirmAction?.action === 'restore' ? 'Restore' : 'Delete Forever'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
