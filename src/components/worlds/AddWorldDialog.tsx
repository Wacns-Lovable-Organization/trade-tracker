import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';

const WORLD_CATEGORIES = ['Farm', 'Shop', 'Storage', 'Trade', 'Casino', 'Parkour', 'Art', 'Social', 'Other'];

interface AddWorldDialogProps {
  onAddWorld: (world: { world_name: string; owner_grow_id?: string; category: string; notes?: string }) => Promise<void>;
}

export function AddWorldDialog({ onAddWorld }: AddWorldDialogProps) {
  const [open, setOpen] = useState(false);
  const [worldName, setWorldName] = useState('');
  const [ownerGrowId, setOwnerGrowId] = useState('');
  const [category, setCategory] = useState('Other');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worldName.trim()) return;

    await onAddWorld({
      world_name: worldName.trim().toUpperCase(),
      owner_grow_id: ownerGrowId.trim() || undefined,
      category,
      notes: notes.trim() || undefined,
    });

    setWorldName('');
    setOwnerGrowId('');
    setCategory('Other');
    setNotes('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add World
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add World</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>World Name *</Label>
            <Input value={worldName} onChange={(e) => setWorldName(e.target.value)} placeholder="e.g., BUYDIRT" required className="uppercase" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Owner GrowID</Label>
              <Input value={ownerGrowId} onChange={(e) => setOwnerGrowId(e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WORLD_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Personal notes about this world..." rows={3} />
          </div>
          <Button type="submit" className="w-full">Save World</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
