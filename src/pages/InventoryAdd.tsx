import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { CurrencyDisplayWithPreference } from '@/components/ui/CurrencyDisplayWithPreference';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Package, Calculator, ArrowRight, ChevronsUpDown, Check, Plus, Upload, X, DollarSign, Loader2 } from 'lucide-react';
import type { CurrencyUnit } from '@/types/inventory';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const currencyOptions: { value: CurrencyUnit; label: string }[] = [
  { value: 'WL', label: 'World Lock (WL)' },
  { value: 'DL', label: 'Diamond Lock (DL)' },
  { value: 'BGL', label: 'Blue Gem Lock (BGL)' },
];

type PriceInputMode = 'unit' | 'total';

export default function InventoryAdd() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, addInventoryEntry, addItemWithInventoryEntry, updateItemImage } = useApp();

  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [itemName, setItemName] = useState('');
  const [categoryId, setCategoryId] = useState('cat_other');
  const [quantityBought, setQuantityBought] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [currencyUnit, setCurrencyUnit] = useState<CurrencyUnit>('WL');
  const [notes, setNotes] = useState('');
  const [itemSelectOpen, setItemSelectOpen] = useState(false);
  const [boughtAt, setBoughtAt] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  
  // New fields
  const [priceInputMode, setPriceInputMode] = useState<PriceInputMode>('unit');
  const [isCostOnly, setIsCostOnly] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered items for search
  const sortedItems = useMemo(() => {
    return [...data.items].sort((a, b) => a.name.localeCompare(b.name));
  }, [data.items]);

  // When selecting an existing item, auto-fill fields
  useEffect(() => {
    if (selectedItemId && selectedItemId !== '__new__') {
      const item = data.items.find(i => i.id === selectedItemId);
      if (item) {
        setItemName(item.name);
        setCategoryId(item.defaultCategoryId);
        if (item.imageUrl) {
          setImagePreview(item.imageUrl);
        } else {
          setImagePreview(null);
        }
      }
    }
  }, [selectedItemId, data.items]);

  const handleItemSelect = (value: string) => {
    if (value === '__new__') {
      setSelectedItemId('__new__');
      setItemName('');
      setCategoryId('cat_other');
      setImagePreview(null);
      setImageFile(null);
    } else {
      setSelectedItemId(value);
    }
  };

  // Handle image file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload image to Supabase storage
  const uploadImage = async (itemId: string): Promise<string | null> => {
    if (!imageFile || !user) return null;
    
    setIsUploading(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}/${itemId}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('item-images')
        .upload(fileName, imageFile, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: publicUrlData } = supabase.storage
        .from('item-images')
        .getPublicUrl(fileName);
      
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Calculate values based on price input mode
  const calculatedUnitCost = useMemo(() => {
    if (priceInputMode === 'unit') {
      return parseFloat(unitCost) || 0;
    }
    const qty = parseFloat(quantityBought) || 0;
    const total = parseFloat(totalPrice) || 0;
    return qty > 0 ? total / qty : 0;
  }, [priceInputMode, unitCost, quantityBought, totalPrice]);

  const totalCost = useMemo(() => {
    const qty = parseFloat(quantityBought) || 0;
    if (priceInputMode === 'unit') {
      return qty * (parseFloat(unitCost) || 0);
    }
    return parseFloat(totalPrice) || 0;
  }, [priceInputMode, quantityBought, unitCost, totalPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const qty = parseInt(quantityBought, 10);
    const cost = calculatedUnitCost;

    if (!itemName.trim()) {
      toast.error('Item name is required');
      return;
    }
    if (!qty || qty <= 0) {
      toast.error('Quantity must be a positive integer');
      return;
    }
    if (cost < 0) {
      toast.error('Unit cost cannot be negative');
      return;
    }

    try {
      let itemId = selectedItemId !== '__new__' ? selectedItemId : '';
      
      // If an existing item is selected, use addInventoryEntry
      // Otherwise, use the atomic addItemWithInventoryEntry
      if (selectedItemId && selectedItemId !== '__new__') {
        await addInventoryEntry(
          selectedItemId,
          itemName.trim(),
          categoryId,
          qty,
          cost,
          currencyUnit,
          notes,
          new Date(boughtAt).toISOString()
        );
        
        // Upload and update image if new image selected for existing item
        if (imageFile) {
          const imageUrl = await uploadImage(selectedItemId);
          if (imageUrl) {
            await updateItemImage(selectedItemId, imageUrl);
          }
        }
      } else {
        // This atomically creates the item (if needed) and inventory entry
        const newItem = await addItemWithInventoryEntry(
          itemName.trim(),
          categoryId,
          itemName.trim(),
          categoryId,
          qty,
          cost,
          currencyUnit,
          notes,
          new Date(boughtAt).toISOString()
        );
        itemId = newItem.id;
        
        // Upload image for new item
        if (imageFile && itemId) {
          const imageUrl = await uploadImage(itemId);
          if (imageUrl) {
            await updateItemImage(itemId, imageUrl);
          }
        }
        
        // Update cost_only flag if set
        if (isCostOnly && itemId) {
          await supabase
            .from('items')
            .update({ is_cost_only: true })
            .eq('id', itemId);
        }
      }

      toast.success('Inventory entry added');
      navigate('/inventory');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add inventory');
    }
  };

  return (
    <div>
      <PageHeader
        title="Add Inventory"
        description="Record a new purchase to your inventory"
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <Card className="lg:col-span-2 animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Purchase Details
              </CardTitle>
              <CardDescription>
                Each entry is logged separately and never merged.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Item Selection with Search */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Select Existing Item (Optional)</Label>
                  <Popover open={itemSelectOpen} onOpenChange={setItemSelectOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={itemSelectOpen}
                        className="w-full justify-between font-normal"
                      >
                        {selectedItemId === '__new__' 
                          ? '+ Create New Item' 
                          : selectedItemId 
                            ? data.items.find(i => i.id === selectedItemId)?.name 
                            : 'Select or create new...'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search items..." />
                        <CommandList>
                          <CommandEmpty>No item found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="__new__"
                              onSelect={() => {
                                handleItemSelect('__new__');
                                setItemSelectOpen(false);
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Create New Item
                            </CommandItem>
                            {sortedItems.map(item => (
                              <CommandItem
                                key={item.id}
                                value={item.name}
                                onSelect={() => {
                                  handleItemSelect(item.id);
                                  setItemSelectOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedItemId === item.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <Avatar className="h-5 w-5 mr-2">
                                  <AvatarImage src={item.imageUrl || undefined} />
                                  <AvatarFallback className="text-[8px]">
                                    {item.name.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                {item.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {data.categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="itemName">Item Name *</Label>
                  <Input
                    id="itemName"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g., Dirt, World Lock, Pepper Seeds"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    This name is saved as a snapshot for this entry.
                  </p>
                </div>

                {/* Item Image */}
                <div className="space-y-2">
                  <Label>Item Image (Optional)</Label>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-16 w-16 border-2 border-dashed border-border">
                      <AvatarImage src={imagePreview || undefined} />
                      <AvatarFallback className="bg-muted">
                        <Package className="w-6 h-6 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        {imagePreview ? 'Change' : 'Upload'}
                      </Button>
                      {imagePreview && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeImage}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost Only Flag - Only for new items */}
              {selectedItemId === '__new__' && (
                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                  <div className="space-y-0.5">
                    <Label htmlFor="costOnly" className="font-medium">Cost Without Revenue</Label>
                    <p className="text-sm text-muted-foreground">
                      Mark this item as non-resellable (e.g., supplies, advertising, utilities)
                    </p>
                  </div>
                  <Switch
                    id="costOnly"
                    checked={isCostOnly}
                    onCheckedChange={setIsCostOnly}
                  />
                </div>
              )}

              {/* Currency Selection */}
              <div className="space-y-2">
                <Label>Currency *</Label>
                <Select value={currencyUnit} onValueChange={(v) => setCurrencyUnit(v as CurrencyUnit)}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className={cn(
                          'px-1.5 py-0.5 text-xs font-mono rounded mr-2',
                          opt.value === 'WL' && 'currency-wl',
                          opt.value === 'DL' && 'currency-dl',
                          opt.value === 'BGL' && 'currency-bgl'
                        )}>
                          {opt.value}
                        </span>
                        {opt.label.split(' ')[0]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Input Mode Toggle */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label>Price Input</Label>
                  <div className="flex rounded-lg border border-border p-1 bg-muted/30">
                    <button
                      type="button"
                      onClick={() => setPriceInputMode('unit')}
                      className={cn(
                        'px-3 py-1 text-sm rounded-md transition-colors',
                        priceInputMode === 'unit'
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      )}
                    >
                      Per Unit
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriceInputMode('total')}
                      className={cn(
                        'px-3 py-1 text-sm rounded-md transition-colors',
                        priceInputMode === 'total'
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      )}
                    >
                      Total Price
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity Bought *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      step="1"
                      value={quantityBought}
                      onChange={(e) => setQuantityBought(e.target.value)}
                      placeholder="e.g., 200"
                      required
                    />
                  </div>

                  {priceInputMode === 'unit' ? (
                    <div className="space-y-2">
                      <Label htmlFor="unitCost">Unit Cost ({currencyUnit}) *</Label>
                      <Input
                        id="unitCost"
                        type="number"
                        min="0"
                        step="0.01"
                        value={unitCost}
                        onChange={(e) => setUnitCost(e.target.value)}
                        placeholder="e.g., 1.5"
                        required
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="totalPrice">Total Price ({currencyUnit}) *</Label>
                      <Input
                        id="totalPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={totalPrice}
                        onChange={(e) => setTotalPrice(e.target.value)}
                        placeholder="e.g., 300"
                        required
                      />
                      {calculatedUnitCost > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Unit cost: {calculatedUnitCost.toFixed(2)} {currencyUnit}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="boughtAt">Purchase Date</Label>
                <Input
                  id="boughtAt"
                  type="datetime-local"
                  value={boughtAt}
                  onChange={(e) => setBoughtAt(e.target.value)}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes about this purchase..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Summary Sidebar */}
          <div className="space-y-4">
            <Card className="animate-fade-in sticky top-4" style={{ animationDelay: '100ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-primary" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={imagePreview || undefined} />
                      <AvatarFallback className="bg-primary/10">
                        <Package className="w-5 h-5 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{itemName || '—'}</div>
                      {isCostOnly && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-warning/20 text-warning">
                          Cost Only
                        </span>
                      )}
                    </div>
                  </div>
                  <hr className="border-border" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Quantity</span>
                    <span className="font-mono">{quantityBought || '0'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Unit Cost</span>
                    <CurrencyDisplayWithPreference
                      amount={calculatedUnitCost}
                      currency={currencyUnit}
                      size="sm"
                    />
                  </div>
                  <hr className="border-border" />
                  <div className="flex justify-between">
                    <span className="font-medium">Total Cost</span>
                    <CurrencyDisplayWithPreference
                      amount={totalCost}
                      currency={currencyUnit}
                      size="lg"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full gap-2" size="lg" disabled={isUploading}>
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  Add to Inventory
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
