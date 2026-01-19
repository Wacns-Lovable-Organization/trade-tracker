import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Expense {
  id: string;
  user_id: string;
  category: string;
  description: string;
  amount: number;
  currency_unit: string;
  expense_date: string;
  is_recurring: boolean;
  recurring_interval: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const EXPENSE_CATEGORIES = [
  'Rent',
  'Utilities',
  'Marketing',
  'Shipping',
  'Equipment',
  'Supplies',
  'Fees',
  'Labor',
  'Insurance',
  'Taxes',
  'Maintenance',
  'Other',
] as const;

export function useExpenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchExpenses = useCallback(async () => {
    if (!user) {
      setExpenses([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await (supabase
        .from('expenses') as any)
        .select('*')
        .eq('user_id', user.id)
        .order('expense_date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const addExpense = useCallback(async (data: {
    category: string;
    description: string;
    amount: number;
    currency_unit: string;
    expense_date: string;
    is_recurring?: boolean;
    recurring_interval?: string;
    notes?: string;
  }) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { data: newExpense, error } = await (supabase
        .from('expenses') as any)
        .insert({
          user_id: user.id,
          ...data,
        })
        .select()
        .single();

      if (error) throw error;
      await fetchExpenses();
      return { data: newExpense, error: null };
    } catch (error) {
      console.error('Error adding expense:', error);
      return { data: null, error };
    }
  }, [user, fetchExpenses]);

  const updateExpense = useCallback(async (id: string, data: Partial<Expense>) => {
    try {
      const { error } = await (supabase
        .from('expenses') as any)
        .update(data)
        .eq('id', id);

      if (error) throw error;
      await fetchExpenses();
      return { error: null };
    } catch (error) {
      console.error('Error updating expense:', error);
      return { error };
    }
  }, [fetchExpenses]);

  const deleteExpense = useCallback(async (id: string) => {
    try {
      const { error } = await (supabase
        .from('expenses') as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchExpenses();
      return { error: null };
    } catch (error) {
      console.error('Error deleting expense:', error);
      return { error };
    }
  }, [fetchExpenses]);

  // Calculate totals
  const totals = expenses.reduce((acc, expense) => {
    const key = expense.currency_unit;
    acc[key] = (acc[key] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const monthlyTotal = expenses
    .filter(e => {
      const expenseDate = new Date(e.expense_date);
      const now = new Date();
      return expenseDate.getMonth() === now.getMonth() && 
             expenseDate.getFullYear() === now.getFullYear();
    })
    .reduce((acc, e) => {
      acc[e.currency_unit] = (acc[e.currency_unit] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

  return {
    expenses,
    isLoading,
    refetch: fetchExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    totals,
    monthlyTotal,
  };
}
