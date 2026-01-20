import { useState } from 'react';
import { useBuyers, BuyerWithItems } from '@/hooks/useBuyers';
import { useApp } from '@/contexts/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { toast } from 'sonner';
import { Plus, Trash2, ChevronDown, ChevronRight, Package, Globe, User, Loader2, Phone, Mail, MessageCircle } from 'lucide-react';
import type { CurrencyUnit } from '@/types/inventory';

const SOCIAL_PLATFORMS = [
  { key: 'phone', label: 'Phone', icon: Phone, placeholder: '+1234567890' },
  { key: 'email', label: 'Email', icon: Mail, placeholder: 'contact@example.com' },
  { key: 'discord', label: 'Discord', icon: MessageCircle, placeholder: 'username#0000' },
  { key: 'instagram', label: 'Instagram', icon: MessageCircle, placeholder: '@username' },
  { key: 'facebook', label: 'Facebook', icon: MessageCircle, placeholder: 'Profile URL or username' },
  { key: 'twitter', label: 'Twitter/X', icon: MessageCircle, placeholder: '@username' },
  { key: 'youtube', label: 'YouTube', icon: MessageCircle, placeholder: 'Channel URL' },
  { key: 'tiktok', label: 'TikTok', icon: MessageCircle, placeholder: '@username' },
  { key: 'telegram', label: 'Telegram', icon: MessageCircle, placeholder: '@username' },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, placeholder: '+1234567890' },
] as const;

export default function Buyers() {
  const { buyers, isLoading, addBuyer, deleteBuyer, addBuyerItem, deleteBuyerItem } = useBuyers();
  const { data } = useApp();
  
  const [isAddBuyerOpen, setIsAddBuyerOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerWithItems | null>(null);
  const [expandedBuyers, setExpandedBuyers] = useState<Set<string>>(new Set());
  const [showContactFields, setShowContactFields] = useState(false);
  
  // New buyer form
  const [newGrowId, setNewGrowId] = useState('');
  const [newWorld, setNewWorld] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [contactInfo, setContactInfo] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New item form
  const [newItemId, setNewItemId] = useState('');
  const [newUnitPrice, setNewUnitPrice] = useState('');
  const [newCurrency, setNewCurrency] = useState<CurrencyUnit>('WL');
  const [newQuantityPerUnit, setNewQuantityPerUnit] = useState('1');
  const [newItemNotes, setNewItemNotes] = useState('');

  const toggleBuyerExpanded = (id: string) => {
    const next = new Set(expandedBuyers);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedBuyers(next);
  };

  const resetBuyerForm = () => {
    setNewGrowId('');
    setNewWorld('');
    setNewNotes('');
    setContactInfo({});
    setShowContactFields(false);
  };

  const handleAddBuyer = async () => {
    if (!newGrowId.trim() || !newWorld.trim()) {
      toast.error('GrowID and World are required');
      return;
    }

    setIsSubmitting(true);
    const { error } = await addBuyer({
      grow_id: newGrowId.trim(),
      world: newWorld.trim(),
      notes: newNotes.trim() || undefined,
      ...contactInfo,
    });

    if (error) {
      toast.error('Failed to add buyer');
    } else {
      toast.success('Buyer added successfully');
      setIsAddBuyerOpen(false);
      resetBuyerForm();
    }
    setIsSubmitting(false);
  };

  const handleDeleteBuyer = async (id: string) => {
    const { error } = await deleteBuyer(id);
    if (error) {
      toast.error('Failed to delete buyer');
    } else {
      toast.success('Buyer deleted');
    }
  };

  const handleAddItem = async () => {
    if (!selectedBuyer || !newItemId || !newUnitPrice) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSubmitting(true);
    const { error } = await addBuyerItem({
      buyer_id: selectedBuyer.id,
      item_id: newItemId,
      unit_price: parseFloat(newUnitPrice),
      currency_unit: newCurrency,
      quantity_per_unit: parseInt(newQuantityPerUnit) || 1,
      notes: newItemNotes.trim() || undefined,
    });

    if (error) {
      toast.error('Failed to add item to buyer');
    } else {
      toast.success('Item added to buyer');
      setIsAddItemOpen(false);
      resetItemForm();
    }
    setIsSubmitting(false);
  };

  const handleDeleteItem = async (itemId: string) => {
    const { error } = await deleteBuyerItem(itemId);
    if (error) {
      toast.error('Failed to remove item');
    } else {
      toast.success('Item removed from buyer');
    }
  };

  const resetItemForm = () => {
    setNewItemId('');
    setNewUnitPrice('');
    setNewCurrency('WL');
    setNewQuantityPerUnit('1');
    setNewItemNotes('');
  };

  const getItemName = (itemId: string) => {
    return data.items.find(i => i.id === itemId)?.name || 'Unknown Item';
  };

  const getContactDisplay = (buyer: BuyerWithItems) => {
    const contacts = SOCIAL_PLATFORMS.filter(p => buyer[p.key as keyof BuyerWithItems]);
    return contacts.length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buyers"
        description="Manage your customers and what items you supply to them"
      >
        <Dialog open={isAddBuyerOpen} onOpenChange={(open) => {
          setIsAddBuyerOpen(open);
          if (!open) resetBuyerForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Buyer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Buyer</DialogTitle>
              <DialogDescription>
                Add a buyer with their in-game identity and contact info
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="growId">GrowID *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="growId"
                    placeholder="e.g. RAGN4ROK"
                    value={newGrowId}
                    onChange={(e) => setNewGrowId(e.target.value.toUpperCase())}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="world">World *</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="world"
                    placeholder="e.g. RGU"
                    value={newWorld}
                    onChange={(e) => setNewWorld(e.target.value.toUpperCase())}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Contact Information Toggle */}
              <Collapsible open={showContactFields} onOpenChange={setShowContactFields}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    Contact Information (Optional)
                    {showContactFields ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-3">
                  {SOCIAL_PLATFORMS.map(platform => (
                    <div key={platform.key} className="space-y-1">
                      <Label htmlFor={platform.key} className="text-sm">{platform.label}</Label>
                      <Input
                        id={platform.key}
                        placeholder={platform.placeholder}
                        value={contactInfo[platform.key] || ''}
                        onChange={(e) => setContactInfo(prev => ({ ...prev, [platform.key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Optional notes about this buyer..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddBuyerOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddBuyer} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Add Buyer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {buyers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Buyers Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add buyers to track who you sell items to
            </p>
            <Button onClick={() => setIsAddBuyerOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Buyer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {buyers.map((buyer) => (
            <Card key={buyer.id}>
              <Collapsible
                open={expandedBuyers.has(buyer.id)}
                onOpenChange={() => toggleBuyerExpanded(buyer.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CollapsibleTrigger className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      {expandedBuyers.has(buyer.id) ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {buyer.grow_id}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Globe className="h-3 w-3" />
                          World: {buyer.world}
                          {getContactDisplay(buyer) > 0 && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {getContactDisplay(buyer)} contact(s)
                            </Badge>
                          )}
                        </CardDescription>
                      </div>
                    </CollapsibleTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {buyer.items.length} item{buyer.items.length !== 1 ? 's' : ''}
                      </Badge>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Buyer?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete {buyer.grow_id} and all their item listings.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteBuyer(buyer.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  {buyer.notes && (
                    <p className="text-sm text-muted-foreground mt-2 ml-8">{buyer.notes}</p>
                  )}
                </CardHeader>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="ml-8">
                      {/* Contact info display */}
                      {getContactDisplay(buyer) > 0 && (
                        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                          <h5 className="text-sm font-medium mb-2">Contact Information</h5>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                            {SOCIAL_PLATFORMS.map(platform => {
                              const value = buyer[platform.key as keyof BuyerWithItems] as string | null;
                              if (!value) return null;
                              return (
                                <div key={platform.key} className="flex items-center gap-2">
                                  <span className="text-muted-foreground">{platform.label}:</span>
                                  <span className="truncate">{value}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-sm">Items Supplied</h4>
                        <Dialog open={isAddItemOpen && selectedBuyer?.id === buyer.id} onOpenChange={(open) => {
                          setIsAddItemOpen(open);
                          if (open) setSelectedBuyer(buyer);
                          else resetItemForm();
                        }}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => setSelectedBuyer(buyer)}>
                              <Plus className="mr-1 h-3 w-3" />
                              Add Item
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Item to {buyer.grow_id}</DialogTitle>
                              <DialogDescription>
                                Specify what you supply to this buyer and at what price
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Item *</Label>
                                <Select value={newItemId} onValueChange={setNewItemId}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select an item" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {data.items.map((item) => (
                                      <SelectItem key={item.id} value={item.id}>
                                        {item.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Quantity per Unit</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={newQuantityPerUnit}
                                    onChange={(e) => setNewQuantityPerUnit(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Sale Price *</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="50"
                                    value={newUnitPrice}
                                    onChange={(e) => setNewUnitPrice(e.target.value)}
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>Currency</Label>
                                <Select value={newCurrency} onValueChange={(v) => setNewCurrency(v as CurrencyUnit)}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="WL">WL</SelectItem>
                                    <SelectItem value="DL">DL</SelectItem>
                                    <SelectItem value="BGL">BGL</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Notes</Label>
                                <Input
                                  placeholder="Optional notes"
                                  value={newItemNotes}
                                  onChange={(e) => setNewItemNotes(e.target.value)}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsAddItemOpen(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleAddItem} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Add Item
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>

                      {buyer.items.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4">
                          No items listed yet. Add items you supply to this buyer.
                        </p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Item</TableHead>
                              <TableHead>Qty/Unit</TableHead>
                              <TableHead>Sale Price</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {buyer.items.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">
                                  {getItemName(item.item_id)}
                                </TableCell>
                                <TableCell>{item.quantity_per_unit}</TableCell>
                                <TableCell>
                                  <CurrencyDisplay
                                    amount={item.unit_price}
                                    currency={item.currency_unit as CurrencyUnit}
                                    size="sm"
                                  />
                                </TableCell>
                                <TableCell>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Remove Item?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Remove {getItemName(item.item_id)} from this buyer's list?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteItem(item.id)}
                                          className="bg-destructive text-destructive-foreground"
                                        >
                                          Remove
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
