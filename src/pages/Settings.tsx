import { useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { AlertTriangle, Trash2, Info, Download, Upload } from 'lucide-react';
import { exportData, importData } from '@/lib/storage';

export default function Settings() {
  const { data, resetData, refreshData } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    resetData();
    toast.success('All data has been reset');
  };

  const handleExport = () => {
    try {
      exportData();
      toast.success('Data exported successfully');
    } catch {
      toast.error('Failed to export data');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await importData(file);
      refreshData();
      toast.success('Data imported successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to import data');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure your inventory app preferences"
      />

      <div className="space-y-6">
        {/* Import/Export */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>
              Export your data as JSON file for backup or import from a previous export.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button onClick={handleExport} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export to JSON
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              id="import-file"
            />
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4" />
              Import from JSON
            </Button>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="animate-fade-in" style={{ animationDelay: '50ms' }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              <CardTitle>Currency Info</CardTitle>
            </div>
            <CardDescription>
              Each inventory entry and sale can use its own currency (WL, DL, or BGL).
              Select the currency when adding entries or recording sales.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="p-4 rounded-lg border border-border">
                <span className="px-2 py-1 text-sm font-mono rounded currency-wl">WL</span>
                <div className="mt-2 font-medium">World Lock</div>
                <div className="text-sm text-muted-foreground">Base currency unit</div>
              </div>
              <div className="p-4 rounded-lg border border-border">
                <span className="px-2 py-1 text-sm font-mono rounded currency-dl">DL</span>
                <div className="mt-2 font-medium">Diamond Lock</div>
                <div className="text-sm text-muted-foreground">= 100 WL</div>
              </div>
              <div className="p-4 rounded-lg border border-border">
                <span className="px-2 py-1 text-sm font-mono rounded currency-bgl">BGL</span>
                <div className="mt-2 font-medium">Blue Gem Lock</div>
                <div className="text-sm text-muted-foreground">= 100 DL = 10,000 WL</div>
              </div>
            </div>
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
