import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pin, PinOff, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { Note } from '@/hooks/useNotes';
import { cn } from '@/lib/utils';

interface NoteCardProps {
  note: Note;
  onTogglePin: (id: string, currentPinned: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const colorMap: Record<string, string> = {
  default: 'border-border',
  blue: 'border-blue-500/40 bg-blue-500/5',
  green: 'border-[hsl(var(--success))]/40 bg-[hsl(var(--success))]/5',
  yellow: 'border-[hsl(var(--warning))]/40 bg-[hsl(var(--warning))]/5',
  red: 'border-[hsl(var(--destructive))]/40 bg-[hsl(var(--destructive))]/5',
  purple: 'border-purple-500/40 bg-purple-500/5',
};

export function NoteCard({ note, onTogglePin, onDelete }: NoteCardProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  return (
    <Card className={cn('transition-default', colorMap[note.color] || colorMap.default)}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold flex-1 truncate">{note.title}</h3>
          <div className="flex gap-1 shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => onTogglePin(note.id, note.is_pinned)}
              title={note.is_pinned ? 'Unpin' : 'Pin'}
            >
              {note.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Note</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete this note.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(note.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {note.content && (
          <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">{note.content}</p>
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex gap-1 flex-wrap">
            {note.is_pinned && <Badge variant="secondary" className="text-xs">📌 Pinned</Badge>}
            {note.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
          <span className="text-xs text-muted-foreground shrink-0">{formatDate(note.updated_at)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
