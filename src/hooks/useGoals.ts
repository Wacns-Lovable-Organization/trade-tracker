import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Goal {
  id: string;
  user_id: string;
  goal_type: string;
  target_value: number;
  current_value: number;
  currency_unit: string;
  title: string;
  deadline: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('is_completed', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching goals:', error);
    } else {
      setGoals((data as Goal[]) || []);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const addGoal = async (goal: {
    goal_type: string;
    target_value: number;
    currency_unit: string;
    title: string;
    deadline?: string | null;
  }) => {
    if (!user) return;
    const { error } = await supabase.from('goals').insert({
      user_id: user.id,
      ...goal,
    } as any);
    if (error) {
      toast.error('Failed to create goal');
    } else {
      toast.success('Goal created!');
      fetchGoals();
    }
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    const { error } = await supabase.from('goals').update(updates as any).eq('id', id);
    if (error) {
      toast.error('Failed to update goal');
    } else {
      fetchGoals();
    }
  };

  const deleteGoal = async (id: string) => {
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete goal');
    } else {
      toast.success('Goal deleted');
      fetchGoals();
    }
  };

  const completeGoal = async (id: string) => {
    await updateGoal(id, { is_completed: true, completed_at: new Date().toISOString() } as any);
    toast.success('🎉 Goal completed!');
  };

  return { goals, isLoading, addGoal, updateGoal, deleteGoal, completeGoal, refetch: fetchGoals };
}
