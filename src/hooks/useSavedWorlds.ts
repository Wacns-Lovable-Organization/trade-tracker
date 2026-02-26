import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SavedWorld {
  id: string;
  user_id: string;
  world_name: string;
  owner_grow_id: string | null;
  category: string;
  notes: string | null;
  last_visited_at: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export function useSavedWorlds() {
  const { user } = useAuth();
  const [worlds, setWorlds] = useState<SavedWorld[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWorlds = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('saved_worlds')
      .select('*')
      .eq('user_id', user.id)
      .order('is_favorite', { ascending: false })
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching worlds:', error);
    } else {
      setWorlds((data as SavedWorld[]) || []);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchWorlds(); }, [fetchWorlds]);

  const addWorld = async (world: {
    world_name: string;
    owner_grow_id?: string;
    category: string;
    notes?: string;
  }) => {
    if (!user) return;
    const { error } = await supabase.from('saved_worlds').insert({
      user_id: user.id,
      ...world,
    } as any);
    if (error) {
      toast.error('Failed to save world');
    } else {
      toast.success('World saved!');
      fetchWorlds();
    }
  };

  const updateWorld = async (id: string, updates: Partial<SavedWorld>) => {
    const { error } = await supabase.from('saved_worlds').update(updates as any).eq('id', id);
    if (error) {
      toast.error('Failed to update world');
    } else {
      fetchWorlds();
    }
  };

  const deleteWorld = async (id: string) => {
    const { error } = await supabase.from('saved_worlds').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete world');
    } else {
      toast.success('World removed');
      fetchWorlds();
    }
  };

  const toggleFavorite = async (id: string, currentFav: boolean) => {
    await updateWorld(id, { is_favorite: !currentFav } as any);
  };

  const markVisited = async (id: string) => {
    await updateWorld(id, { last_visited_at: new Date().toISOString() } as any);
  };

  return { worlds, isLoading, addWorld, updateWorld, deleteWorld, toggleFavorite, markVisited, refetch: fetchWorlds };
}
