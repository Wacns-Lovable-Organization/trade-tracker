import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Buyer {
  id: string;
  user_id: string;
  grow_id: string;
  world: string;
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
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BuyerItem {
  id: string;
  buyer_id: string;
  item_id: string;
  unit_price: number;
  currency_unit: string;
  quantity_per_unit: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BuyerWithItems extends Buyer {
  items: BuyerItem[];
}

export function useBuyers() {
  const { user } = useAuth();
  const [buyers, setBuyers] = useState<BuyerWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBuyers = useCallback(async () => {
    if (!user) {
      setBuyers([]);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch buyers
      const { data: buyersData, error: buyersError } = await supabase
        .from('buyers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (buyersError) throw buyersError;

      // Fetch all buyer items
      const buyerIds = (buyersData || []).map((b: Buyer) => b.id);
      
      let itemsData: BuyerItem[] = [];
      if (buyerIds.length > 0) {
        const { data, error: itemsError } = await supabase
          .from('buyer_items')
          .select('*')
          .in('buyer_id', buyerIds);

        if (itemsError) throw itemsError;
        itemsData = data || [];
      }

      // Combine buyers with their items
      const buyersWithItems: BuyerWithItems[] = (buyersData || []).map((buyer: Buyer) => ({
        ...buyer,
        items: itemsData.filter((item: BuyerItem) => item.buyer_id === buyer.id),
      }));

      setBuyers(buyersWithItems);
    } catch (error) {
      console.error('Error fetching buyers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBuyers();
  }, [fetchBuyers]);

  const addBuyer = useCallback(async (data: {
    grow_id: string;
    world: string;
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
    notes?: string;
  }) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { data: newBuyer, error } = await supabase
        .from('buyers')
        .insert({
          user_id: user.id,
          grow_id: data.grow_id,
          world: data.world.toUpperCase(),
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
          notes: data.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      await fetchBuyers();
      return { data: newBuyer, error: null };
    } catch (error) {
      console.error('Error adding buyer:', error);
      return { data: null, error };
    }
  }, [user, fetchBuyers]);

  const updateBuyer = useCallback(async (id: string, data: Partial<Buyer>) => {
    try {
      const { error } = await supabase
        .from('buyers')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      await fetchBuyers();
      return { error: null };
    } catch (error) {
      console.error('Error updating buyer:', error);
      return { error };
    }
  }, [fetchBuyers]);

  const deleteBuyer = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('buyers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchBuyers();
      return { error: null };
    } catch (error) {
      console.error('Error deleting buyer:', error);
      return { error };
    }
  }, [fetchBuyers]);

  const addBuyerItem = useCallback(async (data: {
    buyer_id: string;
    item_id: string;
    unit_price: number;
    currency_unit: string;
    quantity_per_unit: number;
    notes?: string;
  }) => {
    try {
      const { data: newItem, error } = await supabase
        .from('buyer_items')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      await fetchBuyers();
      return { data: newItem, error: null };
    } catch (error) {
      console.error('Error adding buyer item:', error);
      return { data: null, error };
    }
  }, [fetchBuyers]);

  const updateBuyerItem = useCallback(async (id: string, data: Partial<BuyerItem>) => {
    try {
      const { error } = await supabase
        .from('buyer_items')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      await fetchBuyers();
      return { error: null };
    } catch (error) {
      console.error('Error updating buyer item:', error);
      return { error };
    }
  }, [fetchBuyers]);

  const deleteBuyerItem = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('buyer_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchBuyers();
      return { error: null };
    } catch (error) {
      console.error('Error deleting buyer item:', error);
      return { error };
    }
  }, [fetchBuyers]);

  return {
    buyers,
    isLoading,
    refetch: fetchBuyers,
    addBuyer,
    updateBuyer,
    deleteBuyer,
    addBuyerItem,
    updateBuyerItem,
    deleteBuyerItem,
  };
}
