import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, StarOff, Trash2, MapPin, Clock } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { SavedWorld } from '@/hooks/useSavedWorlds';

interface WorldCardProps {
  world: SavedWorld;
  onToggleFavorite: (id: string, currentFav: boolean) => Promise<void>;
  onMarkVisited: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const categoryColors: Record<string, string> = {
  Farm: 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/30',
  Shop: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  Storage: 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30',
  Trade: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
  Casino: 'bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))] border-[hsl(var(--destructive))]/30',
};

export function WorldCard({ world, onToggleFavorite, onMarkVisited, onDelete }: WorldCardProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card className={world.is_favorite ? 'border-[hsl(var(--warning))]/30' : ''}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <h3 className="font-bold font-mono truncate">{world.world_name}</h3>
            </div>
            {world.owner_grow_id && (
              <p className="text-xs text-muted-foreground">Owner: {world.owner_grow_id}</p>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => onToggleFavorite(world.id, world.is_favorite)}
            >
              {world.is_favorite ? (
                <Star className="w-3.5 h-3.5 fill-[hsl(var(--warning))] text-[hsl(var(--warning))]" />
              ) : (
                <StarOff className="w-3.5 h-3.5" />
              )}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove World</AlertDialogTitle>
                  <AlertDialogDescription>Remove {world.world_name} from your directory?</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(world.id)}>Remove</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className={categoryColors[world.category] || ''}>
            {world.category}
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Visited: {formatDate(world.last_visited_at)}
          </span>
        </div>

        {world.notes && (
          <p className="text-sm text-muted-foreground line-clamp-2">{world.notes}</p>
        )}

        <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => onMarkVisited(world.id)}>
          Mark as Visited
        </Button>
      </CardContent>
    </Card>
  );
}
