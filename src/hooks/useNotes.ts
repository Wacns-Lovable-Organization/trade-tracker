import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  color: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export function useNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
    } else {
      setNotes((data as Note[]) || []);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const addNote = async (note: { title: string; content: string; tags?: string[]; color?: string }) => {
    if (!user) return;
    const { error } = await supabase.from('notes').insert({
      user_id: user.id,
      title: note.title,
      content: note.content,
      tags: note.tags || [],
      color: note.color || 'default',
    } as any);
    if (error) {
      toast.error('Failed to create note');
    } else {
      toast.success('Note created');
      fetchNotes();
    }
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    const { error } = await supabase.from('notes').update(updates as any).eq('id', id);
    if (error) {
      toast.error('Failed to update note');
    } else {
      fetchNotes();
    }
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete note');
    } else {
      toast.success('Note deleted');
      fetchNotes();
    }
  };

  const togglePin = async (id: string, currentPinned: boolean) => {
    await updateNote(id, { is_pinned: !currentPinned } as any);
  };

  return { notes, isLoading, addNote, updateNote, deleteNote, togglePin, refetch: fetchNotes };
}
