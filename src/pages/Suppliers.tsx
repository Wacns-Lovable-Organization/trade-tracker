import { useState } from 'react';
import { useSuppliers, SupplierWithItems, Supplier } from '@/hooks/useSuppliers';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Plus, Trash2, Edit, ChevronDown, ChevronRight, Package, Globe, User, Loader2,
  Phone, Mail, MessageCircle, Instagram, Facebook, Twitter, Youtube
} from 'lucide-react';
import type { CurrencyUnit } from '@/types/inventory';

// Social media icons for display
const SocialIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'phone': return <Phone className="h-3 w-3" />;
    case 'email': return <Mail className="h-3 w-3" />;
    case 'discord': return <MessageCircle className="h-3 w-3" />;
    case 'instagram': return <Instagram className="h-3 w-3" />;
    case 'facebook': return <Facebook className="h-3 w-3" />;
    case 'twitter': return <Twitter className="h-3 w-3" />;
    case 'youtube': return <Youtube className="h-3 w-3" />;
    case 'telegram': return <MessageCircle className="h-3 w-3" />;
    case 'whatsapp': return <Phone className="h-3 w-3" />;
    case 'tiktok': return <MessageCircle className="h-3 w-3" />;
    default: return null;
  }
};

interface SupplierFormData {
  grow_id: string;
  world: string;
  notes: string;
  phone: string;
  email: string;
  discord: string;
  instagram: string;
  facebook: string;
  twitter: string;
  youtube: string;
  tiktok: string;
  telegram: string;
  whatsapp: string;
}

const emptyFormData: SupplierFormData = {
  grow_id: '',
  world: '',
  notes: '',
  phone: '',
  email: '',
  discord: '',
  instagram: '',
  facebook: '',
  twitter: '',
  youtube: '',
  tiktok: '',
  telegram: '',
  whatsapp: '',
};

export default function Suppliers() {
  const { suppliers, isLoading, addSupplier, updateSupplier, deleteSupplier, addSupplierItem, deleteSupplierItem } = useSuppliers();
  const { data } = useApp();
  
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isEditSupplierOpen, setIsEditSupplierOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierWithItems | null>(null);
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set());
  
  // Supplier form
  const [formData, setFormData] = useState<SupplierFormData>(emptyFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New item form
  const [newItemId, setNewItemId] = useState('');
  const [newUnitPrice, setNewUnitPrice] = useState('');
  const [newCurrency, setNewCurrency] = useState<CurrencyUnit>('WL');
  const [newQuantityPerUnit, setNewQuantityPerUnit] = useState('1');
  const [newLeadTime, setNewLeadTime] = useState('');
  const [newItemNotes, setNewItemNotes] = useState('');

  const updateFormField = (field: keyof SupplierFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSupplierExpanded = (id: string) => {
    const next = new Set(expandedSuppliers);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedSuppliers(next);
  };

  const handleAddSupplier = async () => {
    if (!formData.grow_id.trim() || !formData.world.trim()) {
      toast.error('GrowID and World are required');
      return;
    }

    setIsSubmitting(true);
    const { error } = await addSupplier({
      grow_id: formData.grow_id.trim(),
      world: formData.world.trim(),
      notes: formData.notes.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      email: formData.email.trim() || undefined,
      discord: formData.discord.trim() || undefined,
      instagram: formData.instagram.trim() || undefined,
      facebook: formData.facebook.trim() || undefined,
      twitter: formData.twitter.trim() || undefined,
      youtube: formData.youtube.trim() || undefined,
      tiktok: formData.tiktok.trim() || undefined,
      telegram: formData.telegram.trim() || undefined,
      whatsapp: formData.whatsapp.trim() || undefined,
    });

    if (error) {
      toast.error('Failed to add supplier');
    } else {
      toast.success('Supplier added successfully');
      setIsAddSupplierOpen(false);
      setFormData(emptyFormData);
    }
    setIsSubmitting(false);
  };

  const handleEditSupplier = async () => {
    if (!selectedSupplier) return;
    if (!formData.grow_id.trim() || !formData.world.trim()) {
      toast.error('GrowID and World are required');
      return;
    }

    setIsSubmitting(true);
    const { error } = await updateSupplier(selectedSupplier.id, {
      grow_id: formData.grow_id.trim(),
      world: formData.world.trim().toUpperCase(),
      notes: formData.notes.trim() || null,
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
      discord: formData.discord.trim() || null,
      instagram: formData.instagram.trim() || null,
      facebook: formData.facebook.trim() || null,
      twitter: formData.twitter.trim() || null,
      youtube: formData.youtube.trim() || null,
      tiktok: formData.tiktok.trim() || null,
      telegram: formData.telegram.trim() || null,
      whatsapp: formData.whatsapp.trim() || null,
    });

    if (error) {
      toast.error('Failed to update supplier');
    } else {
      toast.success('Supplier updated successfully');
      setIsEditSupplierOpen(false);
      setSelectedSupplier(null);
      setFormData(emptyFormData);
    }
    setIsSubmitting(false);
  };

  const openEditDialog = (supplier: SupplierWithItems) => {
    setSelectedSupplier(supplier);
    setFormData({
      grow_id: supplier.grow_id,
      world: supplier.world,
      notes: supplier.notes || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      discord: supplier.discord || '',
      instagram: supplier.instagram || '',
      facebook: supplier.facebook || '',
      twitter: supplier.twitter || '',
      youtube: supplier.youtube || '',
      tiktok: supplier.tiktok || '',
      telegram: supplier.telegram || '',
      whatsapp: supplier.whatsapp || '',
    });
    setIsEditSupplierOpen(true);
  };

  const handleDeleteSupplier = async (id: string) => {
    const { error } = await deleteSupplier(id);
    if (error) {
      toast.error('Failed to delete supplier');
    } else {
      toast.success('Supplier deleted');
    }
  };

  const handleAddItem = async () => {
    if (!selectedSupplier || !newItemId || !newUnitPrice) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSubmitting(true);
    const { error } = await addSupplierItem({
      supplier_id: selectedSupplier.id,
      item_id: newItemId,
      unit_price: parseFloat(newUnitPrice),
      currency_unit: newCurrency,
      quantity_per_unit: parseInt(newQuantityPerUnit) || 1,
      lead_time_days: newLeadTime ? parseInt(newLeadTime) : undefined,
      notes: newItemNotes.trim() || undefined,
    });

    if (error) {
      toast.error('Failed to add item to supplier');
    } else {
      toast.success('Item added to supplier');
      setIsAddItemOpen(false);
      resetItemForm();
    }
    setIsSubmitting(false);
  };

  const handleDeleteItem = async (itemId: string) => {
    const { error } = await deleteSupplierItem(itemId);
    if (error) {
      toast.error('Failed to remove item');
    } else {
      toast.success('Item removed from supplier');
    }
  };

  const resetItemForm = () => {
    setNewItemId('');
    setNewUnitPrice('');
    setNewCurrency('WL');
    setNewQuantityPerUnit('1');
    setNewLeadTime('');
    setNewItemNotes('');
  };

  const getItemName = (itemId: string) => {
    return data.items.find(i => i.id === itemId)?.name || 'Unknown Item';
  };

  const getContactInfo = (supplier: Supplier) => {
    const contacts: { type: string; value: string }[] = [];
    if (supplier.phone) contacts.push({ type: 'phone', value: supplier.phone });
    if (supplier.email) contacts.push({ type: 'email', value: supplier.email });
    if (supplier.discord) contacts.push({ type: 'discord', value: supplier.discord });
    if (supplier.whatsapp) contacts.push({ type: 'whatsapp', value: supplier.whatsapp });
    if (supplier.telegram) contacts.push({ type: 'telegram', value: supplier.telegram });
    if (supplier.instagram) contacts.push({ type: 'instagram', value: supplier.instagram });
    if (supplier.facebook) contacts.push({ type: 'facebook', value: supplier.facebook });
    if (supplier.twitter) contacts.push({ type: 'twitter', value: supplier.twitter });
    if (supplier.youtube) contacts.push({ type: 'youtube', value: supplier.youtube });
    if (supplier.tiktok) contacts.push({ type: 'tiktok', value: supplier.tiktok });
    return contacts;
  };

  const SupplierFormFields = () => (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="basic">Basic Info</TabsTrigger>
        <TabsTrigger value="contact">Contact & Social</TabsTrigger>
      </TabsList>
      <TabsContent value="basic" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="growId">GrowID *</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="growId"
              placeholder="e.g. RAGN4ROK"
              value={formData.grow_id}
              onChange={(e) => updateFormField('grow_id', e.target.value.toUpperCase())}
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
              value={formData.world}
              onChange={(e) => updateFormField('world', e.target.value.toUpperCase())}
              className="pl-10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Optional notes about this supplier..."
            value={formData.notes}
            onChange={(e) => updateFormField('notes', e.target.value)}
          />
        </div>
      </TabsContent>
      <TabsContent value="contact" className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                placeholder="+1234567890"
                value={formData.phone}
                onChange={(e) => updateFormField('phone', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="supplier@email.com"
                value={formData.email}
                onChange={(e) => updateFormField('email', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="discord">Discord</Label>
            <Input
              id="discord"
              placeholder="username#1234"
              value={formData.discord}
              onChange={(e) => updateFormField('discord', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              placeholder="+1234567890"
              value={formData.whatsapp}
              onChange={(e) => updateFormField('whatsapp', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="telegram">Telegram</Label>
            <Input
              id="telegram"
              placeholder="@username"
              value={formData.telegram}
              onChange={(e) => updateFormField('telegram', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <Input
              id="instagram"
              placeholder="@username"
              value={formData.instagram}
              onChange={(e) => updateFormField('instagram', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="facebook">Facebook</Label>
            <Input
              id="facebook"
              placeholder="Profile URL or username"
              value={formData.facebook}
              onChange={(e) => updateFormField('facebook', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="twitter">Twitter/X</Label>
            <Input
              id="twitter"
              placeholder="@username"
              value={formData.twitter}
              onChange={(e) => updateFormField('twitter', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="youtube">YouTube</Label>
            <Input
              id="youtube"
              placeholder="Channel URL"
              value={formData.youtube}
              onChange={(e) => updateFormField('youtube', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tiktok">TikTok</Label>
            <Input
              id="tiktok"
              placeholder="@username"
              value={formData.tiktok}
              onChange={(e) => updateFormField('tiktok', e.target.value)}
            />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );

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
        title="Suppliers"
        description="Manage your item suppliers and their pricing"
      >
        <Dialog open={isAddSupplierOpen} onOpenChange={(open) => {
          setIsAddSupplierOpen(open);
          if (!open) setFormData(emptyFormData);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Supplier</DialogTitle>
              <DialogDescription>
                Add a supplier with their in-game identity and contact info
              </DialogDescription>
            </DialogHeader>
            <SupplierFormFields />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddSupplierOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSupplier} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Add Supplier
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Edit Supplier Dialog */}
      <Dialog open={isEditSupplierOpen} onOpenChange={(open) => {
        setIsEditSupplierOpen(open);
        if (!open) {
          setSelectedSupplier(null);
          setFormData(emptyFormData);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
            <DialogDescription>
              Update supplier information and contact details
            </DialogDescription>
          </DialogHeader>
          <SupplierFormFields />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditSupplierOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSupplier} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {suppliers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Suppliers Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add suppliers to track where you purchase items from
            </p>
            <Button onClick={() => setIsAddSupplierOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Supplier
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {suppliers.map((supplier) => {
            const contacts = getContactInfo(supplier);
            return (
              <Card key={supplier.id}>
                <Collapsible
                  open={expandedSuppliers.has(supplier.id)}
                  onOpenChange={() => toggleSupplierExpanded(supplier.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CollapsibleTrigger className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        {expandedSuppliers.has(supplier.id) ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {supplier.grow_id}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Globe className="h-3 w-3" />
                            World: {supplier.world}
                          </CardDescription>
                        </div>
                      </CollapsibleTrigger>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {supplier.items.length} item{supplier.items.length !== 1 ? 's' : ''}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => openEditDialog(supplier)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Supplier?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete {supplier.grow_id} and all their item listings.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteSupplier(supplier.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    {/* Contact badges */}
                    {contacts.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2 ml-8">
                        {contacts.slice(0, 4).map((contact, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs flex items-center gap-1">
                            <SocialIcon type={contact.type} />
                            {contact.value}
                          </Badge>
                        ))}
                        {contacts.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{contacts.length - 4} more
                          </Badge>
                        )}
                      </div>
                    )}
                    {supplier.notes && (
                      <p className="text-sm text-muted-foreground mt-2 ml-8">{supplier.notes}</p>
                    )}
                  </CardHeader>

                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="ml-8">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-sm">Items Supplied</h4>
                          <Dialog open={isAddItemOpen && selectedSupplier?.id === supplier.id} onOpenChange={(open) => {
                            setIsAddItemOpen(open);
                            if (open) setSelectedSupplier(supplier);
                            else resetItemForm();
                          }}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setSelectedSupplier(supplier)}>
                                <Plus className="mr-1 h-3 w-3" />
                                Add Item
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add Item to {supplier.grow_id}</DialogTitle>
                                <DialogDescription>
                                  Specify what this supplier provides and at what price
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
                                    <Label>Price *</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="45"
                                      value={newUnitPrice}
                                      onChange={(e) => setNewUnitPrice(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
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
                                    <Label>Lead Time (days)</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      placeholder="Optional"
                                      value={newLeadTime}
                                      onChange={(e) => setNewLeadTime(e.target.value)}
                                    />
                                  </div>
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

                        {supplier.items.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-4">
                            No items listed yet. Add items this supplier provides.
                          </p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Lead Time</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {supplier.items.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell className="font-medium">
                                    {getItemName(item.item_id)}
                                    {item.quantity_per_unit > 1 && (
                                      <span className="text-muted-foreground ml-1">
                                        (×{item.quantity_per_unit})
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <CurrencyDisplay
                                      amount={item.unit_price}
                                      currency={item.currency_unit as CurrencyUnit}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    {item.lead_time_days ? `${item.lead_time_days} days` : '-'}
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive"
                                      onClick={() => handleDeleteItem(item.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
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
            );
          })}
        </div>
      )}
    </div>
  );
}
