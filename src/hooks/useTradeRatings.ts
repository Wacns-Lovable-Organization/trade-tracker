import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TradeRating {
  id: string;
  rater_user_id: string;
  rated_grow_id: string;
  rated_type: 'supplier' | 'buyer';
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface RatingSummary {
  average: number;
  count: number;
}

export function useTradeRatings(growId?: string, ratedType?: 'supplier' | 'buyer') {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<TradeRating[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRatings = useCallback(async () => {
    if (!growId) return;
    setIsLoading(true);
    let query = supabase
      .from('trade_ratings')
      .select('*')
      .eq('rated_grow_id', growId);
    
    if (ratedType) {
      query = query.eq('rated_type', ratedType);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data) {
      setRatings(data as unknown as TradeRating[]);
    }
    setIsLoading(false);
  }, [growId, ratedType]);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  const getSummary = useCallback((): RatingSummary => {
    if (ratings.length === 0) return { average: 0, count: 0 };
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    return { average: sum / ratings.length, count: ratings.length };
  }, [ratings]);

  const getUserRating = useCallback((): TradeRating | undefined => {
    if (!user) return undefined;
    return ratings.find(r => r.rater_user_id === user.id);
  }, [ratings, user]);

  const submitRating = useCallback(async (rating: number, comment?: string) => {
    if (!user || !growId) throw new Error('Missing data');

    const existing = getUserRating();
    
    if (existing) {
      const { error } = await supabase
        .from('trade_ratings')
        .update({ rating, comment: comment || null })
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('trade_ratings')
        .insert({
          rater_user_id: user.id,
          rated_grow_id: growId,
          rated_type: ratedType || 'supplier',
          rating,
          comment: comment || null,
        });
      if (error) throw error;
    }

    await fetchRatings();
  }, [user, growId, ratedType, getUserRating, fetchRatings]);

  const deleteRating = useCallback(async () => {
    const existing = getUserRating();
    if (!existing) return;

    const { error } = await supabase
      .from('trade_ratings')
      .delete()
      .eq('id', existing.id);
    if (error) throw error;
    await fetchRatings();
  }, [getUserRating, fetchRatings]);

  return {
    ratings,
    isLoading,
    summary: getSummary(),
    userRating: getUserRating(),
    submitRating,
    deleteRating,
    refreshRatings: fetchRatings,
  };
}
