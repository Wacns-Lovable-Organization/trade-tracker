import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Supplier {
  id: string;
  user_id: string;
  grow_id: string;
  world: string;
  notes: string | null;
  phone: string | null;
  email: string | null;
  discord: string | null;
  instagram: string | null;
  facebook: string | null;
  twitter: string | null;
  youtube: string | null;
  tiktok: string | null;
  telegram: string | null;
  whatsapp: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupplierItem {
  id: string;
  supplier_id: string;
  item_id: string;
  unit_price: number;
  currency_unit: string;
  quantity_per_unit: number;
  lead_time_days: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupplierWithItems extends Supplier {
  items: SupplierItem[];
}

export function useSuppliers() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<SupplierWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSuppliers = useCallback(async () => {
    if (!user) {
      setSuppliers([]);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch suppliers
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (suppliersError) throw suppliersError;

      // Fetch all supplier items
      const supplierIds = (suppliersData || []).map((s: Supplier) => s.id);
      
      let itemsData: SupplierItem[] = [];
      if (supplierIds.length > 0) {
        const { data, error: itemsError } = await supabase
          .from('supplier_items')
          .select('*')
          .in('supplier_id', supplierIds);

        if (itemsError) throw itemsError;
        itemsData = data || [];
      }

      // Combine suppliers with their items
      const suppliersWithItems: SupplierWithItems[] = (suppliersData || []).map((supplier: Supplier) => ({
        ...supplier,
        items: itemsData.filter((item: SupplierItem) => item.supplier_id === supplier.id),
      }));

      setSuppliers(suppliersWithItems);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const addSupplier = useCallback(async (data: { 
    grow_id: string; 
    world: string; 
    notes?: string;
    phone?: string;
    email?: string;
    discord?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
    telegram?: string;
    whatsapp?: string;
  }) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { data: newSupplier, error } = await supabase
        .from('suppliers')
        .insert({
          user_id: user.id,
          grow_id: data.grow_id,
          world: data.world.toUpperCase(),
          notes: data.notes || null,
          phone: data.phone || null,
          email: data.email || null,
          discord: data.discord || null,
          instagram: data.instagram || null,
          facebook: data.facebook || null,
          twitter: data.twitter || null,
          youtube: data.youtube || null,
          tiktok: data.tiktok || null,
          telegram: data.telegram || null,
          whatsapp: data.whatsapp || null,
        })
        .select()
        .single();

      if (error) throw error;
      await fetchSuppliers();
      return { data: newSupplier, error: null };
    } catch (error) {
      console.error('Error adding supplier:', error);
      return { data: null, error };
    }
  }, [user, fetchSuppliers]);

  const updateSupplier = useCallback(async (id: string, data: Partial<Supplier>) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      await fetchSuppliers();
      return { error: null };
    } catch (error) {
      console.error('Error updating supplier:', error);
      return { error };
    }
  }, [fetchSuppliers]);

  const deleteSupplier = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchSuppliers();
      return { error: null };
    } catch (error) {
      console.error('Error deleting supplier:', error);
      return { error };
    }
  }, [fetchSuppliers]);

  const addSupplierItem = useCallback(async (data: {
    supplier_id: string;
    item_id: string;
    unit_price: number;
    currency_unit: string;
    quantity_per_unit: number;
    lead_time_days?: number;
    notes?: string;
  }) => {
    try {
      const { data: newItem, error } = await supabase
        .from('supplier_items')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      await fetchSuppliers();
      return { data: newItem, error: null };
    } catch (error) {
      console.error('Error adding supplier item:', error);
      return { data: null, error };
    }
  }, [fetchSuppliers]);

  const updateSupplierItem = useCallback(async (id: string, data: Partial<SupplierItem>) => {
    try {
      const { error } = await supabase
        .from('supplier_items')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      await fetchSuppliers();
      return { error: null };
    } catch (error) {
      console.error('Error updating supplier item:', error);
      return { error };
    }
  }, [fetchSuppliers]);

  const deleteSupplierItem = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('supplier_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchSuppliers();
      return { error: null };
    } catch (error) {
      console.error('Error deleting supplier item:', error);
      return { error };
    }
  }, [fetchSuppliers]);

  return {
    suppliers,
    isLoading,
    refetch: fetchSuppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addSupplierItem,
    updateSupplierItem,
    deleteSupplierItem,
  };
}
