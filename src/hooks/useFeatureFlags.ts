import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FeatureFlag {
  id: string;
  feature_key: string;
  feature_name: string;
  description: string | null;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export function useFeatureFlags() {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFeatureFlags = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('feature_name');

      if (error) {
        console.error('Error fetching feature flags:', error);
        return;
      }

      setFeatureFlags(data || []);
    } catch (error) {
      console.error('Error in fetchFeatureFlags:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatureFlags();
  }, [fetchFeatureFlags]);

  const isFeatureEnabled = useCallback((featureKey: string): boolean => {
    const flag = featureFlags.find(f => f.feature_key === featureKey);
    return flag?.is_enabled ?? true; // Default to enabled if not found
  }, [featureFlags]);

  const updateFeatureFlag = useCallback(async (featureKey: string, isEnabled: boolean) => {
    try {
      const { error } = await supabase
        .from('feature_flags')
        .update({ is_enabled: isEnabled })
        .eq('feature_key', featureKey);

      if (error) throw error;

      setFeatureFlags(prev => 
        prev.map(f => 
          f.feature_key === featureKey ? { ...f, is_enabled: isEnabled } : f
        )
      );

      return { error: null };
    } catch (error) {
      console.error('Error updating feature flag:', error);
      return { error };
    }
  }, []);

  const addFeatureFlag = useCallback(async (featureKey: string, featureName: string, description?: string) => {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .insert({
          feature_key: featureKey,
          feature_name: featureName,
          description: description || null,
          is_enabled: true,
        })
        .select()
        .single();

      if (error) throw error;

      setFeatureFlags(prev => [...prev, data]);
      return { data, error: null };
    } catch (error) {
      console.error('Error adding feature flag:', error);
      return { data: null, error };
    }
  }, []);

  const deleteFeatureFlag = useCallback(async (featureKey: string) => {
    try {
      const { error } = await supabase
        .from('feature_flags')
        .delete()
        .eq('feature_key', featureKey);

      if (error) throw error;

      setFeatureFlags(prev => prev.filter(f => f.feature_key !== featureKey));
      return { error: null };
    } catch (error) {
      console.error('Error deleting feature flag:', error);
      return { error };
    }
  }, []);

  return {
    featureFlags,
    isLoading,
    isFeatureEnabled,
    updateFeatureFlag,
    addFeatureFlag,
    deleteFeatureFlag,
    refetch: fetchFeatureFlags,
  };
}
