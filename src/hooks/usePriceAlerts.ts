import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PriceAlert {
  id: string;
  user_id: string;
  item_name: string;
  target_price: number;
  currency_unit: string;
  alert_type: 'below' | 'above';
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string;
}

export function usePriceAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAlerts(data as unknown as PriceAlert[]);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const createAlert = useCallback(async (input: {
    item_name: string;
    target_price: number;
    currency_unit: string;
    alert_type: 'below' | 'above';
  }) => {
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('price_alerts').insert({
      user_id: user.id,
      ...input,
    });

    if (error) throw error;
    await fetchAlerts();
  }, [user, fetchAlerts]);

  const deleteAlert = useCallback(async (alertId: string) => {
    const { error } = await supabase
      .from('price_alerts')
      .delete()
      .eq('id', alertId);

    if (error) throw error;
    await fetchAlerts();
  }, [fetchAlerts]);

  const toggleAlert = useCallback(async (alertId: string, isActive: boolean) => {
    const { error } = await supabase
      .from('price_alerts')
      .update({ is_active: isActive })
      .eq('id', alertId);

    if (error) throw error;
    await fetchAlerts();
  }, [fetchAlerts]);

  // Check if any active alerts match a new trade post
  const checkAlerts = useCallback((itemName: string, price: number, currency: string): PriceAlert[] => {
    return alerts.filter(a => {
      if (!a.is_active) return false;
      if (a.item_name.toLowerCase() !== itemName.toLowerCase()) return false;
      if (a.currency_unit !== currency) return false;
      if (a.alert_type === 'below' && price <= a.target_price) return true;
      if (a.alert_type === 'above' && price >= a.target_price) return true;
      return false;
    });
  }, [alerts]);

  return { alerts, isLoading, createAlert, deleteAlert, toggleAlert, checkAlerts, refreshAlerts: fetchAlerts };
}
