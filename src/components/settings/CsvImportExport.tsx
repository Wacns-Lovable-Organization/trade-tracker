import { useState, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Upload, 
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { 
  toCSV, 
  parseCSV, 
  downloadCSV, 
  getInventoryCSVTemplate, 
  getSalesCSVTemplate,
  type CsvInventoryEntry,
  type CsvSaleRecord
} from '@/lib/csv';
import { toast } from 'sonner';
import type { CurrencyUnit } from '@/types/inventory';

export function CsvImportExport() {
  const { data, addItemWithInventoryEntry, addSaleByItem } = useApp();
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const inventoryInputRef = useRef<HTMLInputElement>(null);
  const salesInputRef = useRef<HTMLInputElement>(null);

  // Export inventory to CSV
  const exportInventory = () => {
    const csvData = data.inventoryEntries.map(entry => {
      const item = data.items.find(i => i.id === entry.itemId);
      const category = data.categories.find(c => c.id === entry.snapshotCategoryId);
      return {
        item_name: entry.snapshotName,
        category: category?.name || 'Other',
        quantity: entry.quantityBought,
        unit_cost: entry.unitCost,
        currency: entry.currencyUnit,
        notes: entry.notes || '',
        bought_at: new Date(entry.boughtAt).toISOString().split('T')[0],
      };
    });
    
    if (csvData.length === 0) {
      toast.error('No inventory entries to export');
      return;
    }
    
    const csv = toCSV(csvData, ['item_name', 'category', 'quantity', 'unit_cost', 'currency', 'notes', 'bought_at']);
    downloadCSV(csv, `inventory_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success(`Exported ${csvData.length} inventory entries`);
  };

  // Export sales to CSV
  const exportSales = () => {
    const csvData = data.sales.map(sale => {
      const entry = data.inventoryEntries.find(e => e.id === sale.inventoryEntryId);
      const item = data.items.find(i => i.id === sale.itemId);
      return {
        item_name: entry?.snapshotName || item?.name || 'Unknown',
        quantity_sold: sale.quantitySold,
        sale_price: sale.amountGained,
        currency: sale.currencyUnit,
        notes: sale.notes || '',
        sold_at: new Date(sale.soldAt).toISOString().split('T')[0],
      };
    });
    
    if (csvData.length === 0) {
      toast.error('No sales to export');
      return;
    }
    
    const csv = toCSV(csvData, ['item_name', 'quantity_sold', 'sale_price', 'currency', 'notes', 'sold_at']);
    downloadCSV(csv, `sales_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success(`Exported ${csvData.length} sales records`);
  };

  // Download template
  const downloadTemplate = (type: 'inventory' | 'sales') => {
    const csv = type === 'inventory' ? getInventoryCSVTemplate() : getSalesCSVTemplate();
    downloadCSV(csv, `${type}_template.csv`);
    toast.success(`Downloaded ${type} template`);
  };

  // Import inventory from CSV
  const handleInventoryImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportStatus('loading');
    setImportMessage('Processing...');

    try {
      const text = await file.text();
      const records = parseCSV<CsvInventoryEntry>(text);
      
      if (records.length === 0) {
        throw new Error('No valid records found in CSV');
      }

      let successCount = 0;
      let errorCount = 0;

      for (const record of records) {
        try {
          const currency = (['WL', 'DL', 'BGL'].includes(record.currency?.toUpperCase()) 
            ? record.currency.toUpperCase() 
            : 'WL') as CurrencyUnit;
          
          const category = data.categories.find(
            c => c.name.toLowerCase() === (record.category || 'other').toLowerCase()
          ) || data.categories[0];

          await addItemWithInventoryEntry(
            record.item_name,
            category?.id || '',
            record.item_name,
            category?.id || '',
            Number(record.quantity) || 1,
            Number(record.unit_cost) || 0,
            currency,
            record.notes || '',
            record.bought_at ? new Date(record.bought_at).toISOString() : undefined
          );
          successCount++;
        } catch (err) {
          errorCount++;
        }
      }

      setImportStatus('success');
      setImportMessage(`Imported ${successCount} entries${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
      toast.success(`Imported ${successCount} inventory entries`);
    } catch (error) {
      setImportStatus('error');
      setImportMessage(error instanceof Error ? error.message : 'Import failed');
      toast.error('Failed to import inventory');
    }

    // Reset input
    if (inventoryInputRef.current) {
      inventoryInputRef.current.value = '';
    }
  };

  // Import sales from CSV
  const handleSalesImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportStatus('loading');
    setImportMessage('Processing...');

    try {
      const text = await file.text();
      const records = parseCSV<CsvSaleRecord>(text);
      
      if (records.length === 0) {
        throw new Error('No valid records found in CSV');
      }

      let successCount = 0;
      let errorCount = 0;

      for (const record of records) {
        try {
          const currency = (['WL', 'DL', 'BGL'].includes(record.currency?.toUpperCase()) 
            ? record.currency.toUpperCase() 
            : 'WL') as CurrencyUnit;
          
          // Find matching item
          const item = data.items.find(
            i => i.name.toLowerCase() === record.item_name?.toLowerCase()
          );
          
          if (!item) {
            errorCount++;
            continue;
          }

          await addSaleByItem(
            item.id,
            Number(record.quantity_sold) || 1,
            Number(record.sale_price) || 0,
            currency,
            record.notes || '',
            record.sold_at ? new Date(record.sold_at).toISOString() : undefined
          );
          successCount++;
        } catch (err) {
          errorCount++;
        }
      }

      setImportStatus('success');
      setImportMessage(`Imported ${successCount} sales${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
      toast.success(`Imported ${successCount} sales records`);
    } catch (error) {
      setImportStatus('error');
      setImportMessage(error instanceof Error ? error.message : 'Import failed');
      toast.error('Failed to import sales');
    }

    // Reset input
    if (salesInputRef.current) {
      salesInputRef.current.value = '';
    }
  };

  return (
    <Card className="animate-fade-in" style={{ animationDelay: '150ms' }}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-primary" />
          <CardTitle>Import / Export Data</CardTitle>
        </div>
        <CardDescription>
          Bulk import or export your inventory and sales data via CSV files
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Import Status */}
        {importStatus !== 'idle' && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            importStatus === 'loading' ? 'bg-muted' :
            importStatus === 'success' ? 'bg-green-500/10 text-green-600' :
            'bg-destructive/10 text-destructive'
          }`}>
            {importStatus === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : importStatus === 'error' ? (
              <AlertCircle className="w-4 h-4" />
            ) : null}
            <span className="text-sm">{importMessage}</span>
          </div>
        )}

        {/* Inventory Section */}
        <div className="space-y-3">
          <h4 className="font-medium">Inventory</h4>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={exportInventory} className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => inventoryInputRef.current?.click()}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Import CSV
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => downloadTemplate('inventory')}
              className="gap-2 text-muted-foreground"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Download Template
            </Button>
          </div>
          <input
            ref={inventoryInputRef}
            type="file"
            accept=".csv"
            onChange={handleInventoryImport}
            className="hidden"
          />
        </div>

        {/* Sales Section */}
        <div className="space-y-3">
          <h4 className="font-medium">Sales</h4>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={exportSales} className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => salesInputRef.current?.click()}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Import CSV
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => downloadTemplate('sales')}
              className="gap-2 text-muted-foreground"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Download Template
            </Button>
          </div>
          <input
            ref={salesInputRef}
            type="file"
            accept=".csv"
            onChange={handleSalesImport}
            className="hidden"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Note: When importing sales, items must already exist. Use the templates to see the required format.
        </p>
      </CardContent>
    </Card>
  );
}
