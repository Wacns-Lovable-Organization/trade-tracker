import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TradePost {
  id: string;
  user_id: string;
  post_type: 'WTB' | 'WTS' | 'WTT';
  item_name: string;
  quantity: number | null;
  price_per_unit: number | null;
  currency_unit: string;
  description: string | null;
  world: string;
  grow_id: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTradePostInput {
  post_type: 'WTB' | 'WTS' | 'WTT';
  item_name: string;
  quantity?: number;
  price_per_unit?: number;
  currency_unit: string;
  description?: string;
  world: string;
  grow_id: string;
}

export function useTradePosts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<TradePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('trade_posts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPosts(data as unknown as TradePost[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('trade_posts_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trade_posts' }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts]);

  const createPost = useCallback(async (input: CreateTradePostInput) => {
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('trade_posts').insert({
      user_id: user.id,
      ...input,
    });

    if (error) throw error;
    await fetchPosts();
  }, [user, fetchPosts]);

  const markFulfilled = useCallback(async (postId: string) => {
    const { error } = await supabase
      .from('trade_posts')
      .update({ is_active: false })
      .eq('id', postId);

    if (error) throw error;
    await fetchPosts();
  }, [fetchPosts]);

  const deletePost = useCallback(async (postId: string) => {
    const { error } = await supabase
      .from('trade_posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;
    await fetchPosts();
  }, [fetchPosts]);

  return { posts, isLoading, createPost, markFulfilled, deletePost, refreshPosts: fetchPosts };
}
