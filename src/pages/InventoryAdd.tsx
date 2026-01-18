import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { toast } from 'sonner';
import { Package, AlertCircle, Calculator, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';

export default function InventoryAdd() {
  const navigate = useNavigate();
  const { data, addItem, addInventoryEntry } = useApp();

  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [itemName, setItemName] = useState('');
  const [categoryId, setCategoryId] = useState('cat_other');
  const [quantityBought, setQuantityBought] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [notes, setNotes] = useState('');
  const [boughtAt, setBoughtAt] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  // When selecting an existing item, auto-fill fields
  useEffect(() => {
    if (selectedItemId && selectedItemId !== '__new__') {
      const item = data.items.find(i => i.id === selectedItemId);
      if (item) {
        setItemName(item.name);
        setCategoryId(item.defaultCategoryId);
      }
    }
  }, [selectedItemId, data.items]);

  const handleItemSelect = (value: string) => {
    if (value === '__new__') {
      setSelectedItemId('__new__');
      setItemName('');
      setCategoryId('cat_other');
    } else {
      setSelectedItemId(value);
    }
  };

  const totalCost = (parseFloat(quantityBought) || 0) * (parseFloat(unitCost) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!data.meta.currencyUnit) {
      toast.error('Please set a currency in Settings first');
      return;
    }

    const qty = parseInt(quantityBought, 10);
    const cost = parseFloat(unitCost);

    if (!itemName.trim()) {
      toast.error('Item name is required');
      return;
    }
    if (!qty || qty <= 0) {
      toast.error('Quantity must be a positive integer');
      return;
    }
    if (!cost || cost <= 0) {
      toast.error('Unit cost must be positive');
      return;
    }

    try {
      let itemId = selectedItemId;

      // Create new item if needed
      if (!itemId || itemId === '__new__') {
        const existingItem = data.items.find(
          i => i.name.toLowerCase() === itemName.trim().toLowerCase()
        );
        if (existingItem) {
          itemId = existingItem.id;
        } else {
          const newItem = addItem(itemName.trim(), categoryId);
          itemId = newItem.id;
        }
      }

      // Add inventory entry
      addInventoryEntry(
        itemId,
        itemName.trim(),
        categoryId,
        qty,
        cost,
        notes,
        new Date(boughtAt).toISOString()
      );

      toast.success('Inventory entry added');
      navigate('/inventory');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add inventory');
    }
  };

  if (!data.meta.currencyUnit) {
    return (
      <div>
        <PageHeader title="Add Inventory" description="Record a new purchase" />
        <Alert className="animate-fade-in">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>You need to set a currency before adding inventory.</span>
            <Button asChild size="sm" className="ml-4">
              <Link to="/settings">Go to Settings</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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
              {/* Item Selection */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Select Existing Item (Optional)</Label>
                  <Select value={selectedItemId} onValueChange={handleItemSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select or create new..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__new__">+ Create New Item</SelectItem>
                      {data.items.map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
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

              {/* Quantity and Cost */}
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

                <div className="space-y-2">
                  <Label htmlFor="unitCost">Unit Cost ({data.meta.currencyUnit}) *</Label>
                  <Input
                    id="unitCost"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    placeholder="e.g., 1.5"
                    required
                  />
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
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Item</span>
                    <span className="font-medium">{itemName || '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Quantity</span>
                    <span className="font-mono">{quantityBought || '0'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Unit Cost</span>
                    <CurrencyDisplay
                      amount={parseFloat(unitCost) || 0}
                      currency={data.meta.currencyUnit}
                      size="sm"
                    />
                  </div>
                  <hr className="border-border" />
                  <div className="flex justify-between">
                    <span className="font-medium">Total Cost</span>
                    <CurrencyDisplay
                      amount={totalCost}
                      currency={data.meta.currencyUnit}
                      size="lg"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full gap-2" size="lg">
                  Add to Inventory
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
