import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface InventoryTemplate {
  id: string;
  user_id: string;
  template_name: string;
  item_id: string | null;
  item_name: string;
  category_id: string | null;
  default_quantity: number;
  default_unit_cost: number;
  default_currency_unit: string;
  created_at: string;
}

export function useInventoryTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<InventoryTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('inventory_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
    } else {
      setTemplates((data as InventoryTemplate[]) || []);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const addTemplate = async (template: {
    template_name: string;
    item_id?: string | null;
    item_name: string;
    category_id?: string | null;
    default_quantity: number;
    default_unit_cost: number;
    default_currency_unit: string;
  }) => {
    if (!user) return;
    const { error } = await supabase.from('inventory_templates').insert({
      user_id: user.id,
      ...template,
    } as any);
    if (error) {
      toast.error('Failed to save template');
    } else {
      toast.success('Template saved!');
      fetchTemplates();
    }
  };

  const deleteTemplate = async (id: string) => {
    const { error } = await supabase.from('inventory_templates').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete template');
    } else {
      toast.success('Template deleted');
      fetchTemplates();
    }
  };

  return { templates, isLoading, addTemplate, deleteTemplate, refetch: fetchTemplates };
}
