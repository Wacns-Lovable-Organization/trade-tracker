import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input } from '@/components/ui/input';
import { useNotes } from '@/hooks/useNotes';
import { CreateNoteDialog } from '@/components/notes/CreateNoteDialog';
import { NoteCard } from '@/components/notes/NoteCard';
import { StickyNote, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Notes() {
  const { notes, isLoading, addNote, togglePin, deleteNote } = useNotes();
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach(n => n.tags.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchSearch = !search || note.title.toLowerCase().includes(search.toLowerCase()) || note.content.toLowerCase().includes(search.toLowerCase());
      const matchTag = !selectedTag || note.tags.includes(selectedTag);
      return matchSearch && matchTag;
    });
  }, [notes, search, selectedTag]);

  return (
    <div>
      <PageHeader title="Notes & Journal" description="Log observations, market tips, and strategies">
        <CreateNoteDialog onCreateNote={addNote} />
      </PageHeader>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading notes...</div>
      ) : notes.length === 0 ? (
        <div className="text-center py-16">
          <StickyNote className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No notes yet</h3>
          <p className="text-muted-foreground mb-4">Create your first note to start journaling.</p>
          <CreateNoteDialog onCreateNote={addNote} />
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mt-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes..." className="pl-9" />
            </div>
          </div>

          {allTags.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-4">
              <Badge
                variant={selectedTag === null ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedTag(null)}
              >
                All
              </Badge>
              {allTags.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTag === tag ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredNotes.map(note => (
              <NoteCard key={note.id} note={note} onTogglePin={togglePin} onDelete={deleteNote} />
            ))}
          </div>
          {filteredNotes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No notes match your search.</div>
          )}
        </>
      )}
    </div>
  );
}
