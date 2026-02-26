import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input } from '@/components/ui/input';
import { useSavedWorlds } from '@/hooks/useSavedWorlds';
import { AddWorldDialog } from '@/components/worlds/AddWorldDialog';
import { WorldCard } from '@/components/worlds/WorldCard';
import { Globe, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const CATEGORIES = ['All', 'Farm', 'Shop', 'Storage', 'Trade', 'Casino', 'Parkour', 'Art', 'Social', 'Other'];

export default function Worlds() {
  const { worlds, isLoading, addWorld, toggleFavorite, markVisited, deleteWorld } = useSavedWorlds();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredWorlds = useMemo(() => {
    return worlds.filter(w => {
      const matchSearch = !search || w.world_name.toLowerCase().includes(search.toLowerCase()) || w.owner_grow_id?.toLowerCase().includes(search.toLowerCase());
      const matchCategory = selectedCategory === 'All' || w.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [worlds, search, selectedCategory]);

  return (
    <div>
      <PageHeader title="World Directory" description="Save and organize your favorite game worlds">
        <AddWorldDialog onAddWorld={addWorld} />
      </PageHeader>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading worlds...</div>
      ) : worlds.length === 0 ? (
        <div className="text-center py-16">
          <Globe className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No worlds saved</h3>
          <p className="text-muted-foreground mb-4">Save worlds you frequently visit for quick access.</p>
          <AddWorldDialog onAddWorld={addWorld} />
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mt-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search worlds..." className="pl-9" />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap mb-4">
            {CATEGORIES.map(cat => (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredWorlds.map(world => (
              <WorldCard
                key={world.id}
                world={world}
                onToggleFavorite={toggleFavorite}
                onMarkVisited={markVisited}
                onDelete={deleteWorld}
              />
            ))}
          </div>
          {filteredWorlds.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No worlds match your search.</div>
          )}
        </>
      )}
    </div>
  );
}
