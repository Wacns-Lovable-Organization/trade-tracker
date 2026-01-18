import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Lock, AlertTriangle, Trash2, Coins } from 'lucide-react';
import type { CurrencyUnit } from '@/types/inventory';
import { cn } from '@/lib/utils';

const currencyOptions: { value: CurrencyUnit; label: string; description: string; conversion: string }[] = [
  { value: 'WL', label: 'World Lock', description: 'Base currency unit', conversion: '1 WL' },
  { value: 'DL', label: 'Diamond Lock', description: '= 100 WL', conversion: '100 WL' },
  { value: 'BGL', label: 'Blue Gem Lock', description: '= 100 DL = 10,000 WL', conversion: '10,000 WL' },
];

export default function Settings() {
  const { data, setCurrency, isCurrencyLocked, resetData } = useApp();
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyUnit | null>(
    data.meta.currencyUnit
  );
  const locked = isCurrencyLocked();

  const handleSaveCurrency = () => {
    if (!selectedCurrency) {
      toast.error('Please select a currency');
      return;
    }
    try {
      setCurrency(selectedCurrency);
      toast.success(`Currency set to ${selectedCurrency}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to set currency');
    }
  };

  const handleReset = () => {
    resetData();
    setSelectedCurrency(null);
    toast.success('All data has been reset');
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure your inventory app preferences"
      />

      <div className="space-y-6">
        {/* Currency Selection */}
        <Card className="animate-fade-in">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-primary" />
              <CardTitle>Currency Unit</CardTitle>
              {locked && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-warning/15 text-warning border border-warning/30">
                  <Lock className="w-3 h-3" />
                  Locked
                </span>
              )}
            </div>
            <CardDescription>
              {locked
                ? 'Currency is locked after your first inventory entry. Reset data to change.'
                : 'Select the currency unit for all transactions. This will be locked after your first inventory entry.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={selectedCurrency || ''}
              onValueChange={(value) => setSelectedCurrency(value as CurrencyUnit)}
              disabled={locked}
              className="grid gap-3"
            >
              {currencyOptions.map((option) => (
                <Label
                  key={option.value}
                  htmlFor={option.value}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-default',
                    selectedCurrency === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50',
                    locked && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  <RadioGroupItem value={option.value} id={option.value} />
                  <div className="flex-1">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {option.description}
                    </div>
                  </div>
                  <span
                    className={cn(
                      'px-2.5 py-1 text-sm font-mono rounded-md border',
                      option.value === 'WL' && 'currency-wl',
                      option.value === 'DL' && 'currency-dl',
                      option.value === 'BGL' && 'currency-bgl'
                    )}
                  >
                    {option.value}
                  </span>
                </Label>
              ))}
            </RadioGroup>

            {!locked && (
              <Button
                onClick={handleSaveCurrency}
                className="mt-4"
                disabled={!selectedCurrency || selectedCurrency === data.meta.currencyUnit}
              >
                Save Currency
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="animate-fade-in border-destructive/30" style={{ animationDelay: '100ms' }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </div>
            <CardDescription>
              Irreversible actions that will permanently delete your data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  Reset All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all your
                    inventory entries, sales records, categories, and items from local storage.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleReset}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, delete everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* Data Info */}
        <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <CardTitle>Data Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-muted">
                <div className="text-muted-foreground">Categories</div>
                <div className="text-xl font-bold number-display">{data.categories.length}</div>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <div className="text-muted-foreground">Items</div>
                <div className="text-xl font-bold number-display">{data.items.length}</div>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <div className="text-muted-foreground">Inventory Entries</div>
                <div className="text-xl font-bold number-display">{data.inventoryEntries.length}</div>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <div className="text-muted-foreground">Sales</div>
                <div className="text-xl font-bold number-display">{data.sales.length}</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Last updated: {new Date(data.meta.updatedAt).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
