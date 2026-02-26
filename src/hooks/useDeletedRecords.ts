import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DeletedRecord {
  id: string;
  type: 'inventory' | 'sale' | 'item' | 'expense';
  name: string;
  details: string;
  deletedFields: Record<string, unknown>;
  createdAt: string;
}

export function useDeletedRecords() {
  const { user } = useAuth();
  const [records, setRecords] = useState<DeletedRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'inventory' | 'sale' | 'item' | 'expense'>('all');

  const fetchDeleted = useCallback(async () => {
    if (!user) {
      setRecords([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [invRes, salesRes, itemsRes, expRes] = await Promise.all([
        supabase.from('inventory_entries').select('*').eq('user_id', user.id).eq('record_status', 'deleted'),
        supabase.from('sales').select('*').eq('user_id', user.id).eq('record_status', 'deleted'),
        supabase.from('items').select('*').eq('user_id', user.id).eq('record_status', 'deleted'),
        supabase.from('expenses').select('*').eq('user_id', user.id).eq('record_status', 'deleted'),
      ]);

      const mapped: DeletedRecord[] = [];

      (invRes.data || []).forEach(e => {
        mapped.push({
          id: e.id,
          type: 'inventory',
          name: e.snapshot_name,
          details: `Qty: ${e.quantity_bought} • Cost: ${e.unit_cost} ${e.currency_unit}`,
          deletedFields: e,
          createdAt: e.created_at,
        });
      });

      (salesRes.data || []).forEach(s => {
        mapped.push({
          id: s.id,
          type: 'sale',
          name: `Sale #${s.id.slice(0, 8)}`,
          details: `Qty: ${s.quantity_sold} • Price: ${s.sale_price} ${s.currency_unit}`,
          deletedFields: s,
          createdAt: s.created_at,
        });
      });

      (itemsRes.data || []).forEach(i => {
        mapped.push({
          id: i.id,
          type: 'item',
          name: i.name,
          details: i.is_cost_only ? 'Cost Only' : 'Resellable',
          deletedFields: i,
          createdAt: i.created_at,
        });
      });

      (expRes.data || []).forEach(e => {
        mapped.push({
          id: e.id,
          type: 'expense',
          name: e.description,
          details: `${e.amount} ${e.currency_unit} • ${e.category}`,
          deletedFields: e,
          createdAt: e.created_at,
        });
      });

      // Sort newest first
      mapped.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecords(mapped);
    } catch (error) {
      console.error('Error fetching deleted records:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDeleted();
  }, [fetchDeleted]);

  const restoreRecord = useCallback(async (record: DeletedRecord) => {
    const tableMap: Record<string, string> = {
      inventory: 'inventory_entries',
      sale: 'sales',
      item: 'items',
      expense: 'expenses',
    };

    const table = tableMap[record.type];
    if (!table) throw new Error('Unknown record type');

    const { error } = await supabase
      .from(table)
      .update({ record_status: 'active' } as any)
      .eq('id', record.id);

    if (error) throw error;
    await fetchDeleted();
  }, [fetchDeleted]);

  const permanentlyDelete = useCallback(async (record: DeletedRecord) => {
    const tableMap: Record<string, string> = {
      inventory: 'inventory_entries',
      sale: 'sales',
      item: 'items',
      expense: 'expenses',
    };

    const table = tableMap[record.type];
    if (!table) throw new Error('Unknown record type');

    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', record.id);

    if (error) throw error;
    await fetchDeleted();
  }, [fetchDeleted]);

  const filteredRecords = filter === 'all' 
    ? records 
    : records.filter(r => r.type === filter);

  return {
    records: filteredRecords,
    allRecords: records,
    isLoading,
    filter,
    setFilter,
    restoreRecord,
    permanentlyDelete,
    refetch: fetchDeleted,
  };
}
