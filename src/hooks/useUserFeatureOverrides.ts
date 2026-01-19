import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserFeatureOverride {
  id: string;
  user_id: string;
  feature_key: string;
  is_enabled: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useUserFeatureOverrides() {
  const { user } = useAuth();
  const [overrides, setOverrides] = useState<UserFeatureOverride[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOverrides = useCallback(async () => {
    if (!user) {
      setOverrides([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await (supabase
        .from('user_feature_overrides') as any)
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setOverrides(data || []);
    } catch (error) {
      console.error('Error fetching user feature overrides:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOverrides();
  }, [fetchOverrides]);

  const getFeatureOverride = useCallback((featureKey: string): boolean | null => {
    const override = overrides.find(o => o.feature_key === featureKey);
    return override ? override.is_enabled : null;
  }, [overrides]);

  return {
    overrides,
    isLoading,
    getFeatureOverride,
    refetch: fetchOverrides,
  };
}

export function useAdminFeatureOverrides() {
  const { user } = useAuth();
  const [allOverrides, setAllOverrides] = useState<UserFeatureOverride[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllOverrides = useCallback(async () => {
    try {
      const { data, error } = await (supabase
        .from('user_feature_overrides') as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllOverrides(data || []);
    } catch (error) {
      console.error('Error fetching all feature overrides:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllOverrides();
  }, [fetchAllOverrides]);

  const setUserFeatureOverride = useCallback(async (
    userId: string,
    featureKey: string,
    isEnabled: boolean
  ) => {
    if (!user) return { error: new Error('No admin user') };

    try {
      const { data, error } = await (supabase
        .from('user_feature_overrides') as any)
        .upsert({
          user_id: userId,
          feature_key: featureKey,
          is_enabled: isEnabled,
          created_by: user.id,
        }, {
          onConflict: 'user_id,feature_key'
        })
        .select()
        .single();

      if (error) throw error;
      
      setAllOverrides(prev => {
        const existing = prev.findIndex(o => o.user_id === userId && o.feature_key === featureKey);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = data;
          return updated;
        }
        return [data, ...prev];
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error setting feature override:', error);
      return { data: null, error };
    }
  }, [user]);

  const removeUserFeatureOverride = useCallback(async (userId: string, featureKey: string) => {
    try {
      const { error } = await (supabase
        .from('user_feature_overrides') as any)
        .delete()
        .eq('user_id', userId)
        .eq('feature_key', featureKey);

      if (error) throw error;
      
      setAllOverrides(prev => prev.filter(
        o => !(o.user_id === userId && o.feature_key === featureKey)
      ));

      return { error: null };
    } catch (error) {
      console.error('Error removing feature override:', error);
      return { error };
    }
  }, []);

  const getUserOverrides = useCallback((userId: string) => {
    return allOverrides.filter(o => o.user_id === userId);
  }, [allOverrides]);

  return {
    allOverrides,
    isLoading,
    setUserFeatureOverride,
    removeUserFeatureOverride,
    getUserOverrides,
    refetch: fetchAllOverrides,
  };
}
