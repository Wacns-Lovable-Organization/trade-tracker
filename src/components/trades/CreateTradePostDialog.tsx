import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateTradePostInput } from '@/hooks/useTradePosts';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateTradePostInput) => Promise<void>;
  defaultGrowId?: string;
}

export function CreateTradePostDialog({ open, onOpenChange, onSubmit, defaultGrowId = '' }: Props) {
  const [postType, setPostType] = useState<'WTB' | 'WTS' | 'WTT'>('WTS');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [currencyUnit, setCurrencyUnit] = useState('WL');
  const [world, setWorld] = useState('');
  const [growId, setGrowId] = useState(defaultGrowId);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!itemName.trim() || !world.trim() || !growId.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        post_type: postType,
        item_name: itemName.trim(),
        quantity: quantity ? parseInt(quantity) : undefined,
        price_per_unit: pricePerUnit ? parseFloat(pricePerUnit) : undefined,
        currency_unit: currencyUnit,
        world: world.trim().toUpperCase(),
        grow_id: growId.trim(),
        description: description.trim() || undefined,
      });
      // Reset form
      setItemName('');
      setQuantity('');
      setPricePerUnit('');
      setDescription('');
      setWorld('');
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Trade Post</DialogTitle>
          <DialogDescription>Post a trade listing visible to all users.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Post Type</Label>
            <Select value={postType} onValueChange={(v) => setPostType(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="WTB">🔵 Want to Buy (WTB)</SelectItem>
                <SelectItem value="WTS">🟢 Want to Sell (WTS)</SelectItem>
                <SelectItem value="WTT">🟡 Want to Trade (WTT)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Item Name *</Label>
            <Input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g. Pepper Seed" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="200" />
            </div>
            <div className="space-y-2">
              <Label>Price/ea</Label>
              <div className="flex gap-2">
                <Input type="number" value={pricePerUnit} onChange={(e) => setPricePerUnit(e.target.value)} placeholder="15" className="flex-1" />
                <Select value={currencyUnit} onValueChange={setCurrencyUnit}>
                  <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WL">WL</SelectItem>
                    <SelectItem value="DL">DL</SelectItem>
                    <SelectItem value="BGL">BGL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>World *</Label>
              <Input value={world} onChange={(e) => setWorld(e.target.value)} placeholder="SEEDSHOP" className="uppercase" />
            </div>
            <div className="space-y-2">
              <Label>GrowID *</Label>
              <Input value={growId} onChange={(e) => setGrowId(e.target.value)} placeholder="YourGrowID" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Any extra details..." rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !itemName.trim() || !world.trim() || !growId.trim()}>
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
