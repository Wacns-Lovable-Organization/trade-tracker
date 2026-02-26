import { useState, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useExpenses } from '@/hooks/useExpenses';
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
  getCategoriesCSVTemplate,
  getExpensesCSVTemplate,
  type CsvInventoryEntry,
  type CsvSaleRecord,
  type CsvCategoryRecord,
  type CsvExpenseRecord
} from '@/lib/csv';
import { toast } from 'sonner';
import type { CurrencyUnit } from '@/types/inventory';

export function CsvImportExport() {
  const { data, addItemWithInventoryEntry, addSaleByItem, addCategory } = useApp();
  const { expenses, addExpense } = useExpenses();
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const inventoryInputRef = useRef<HTMLInputElement>(null);
  const salesInputRef = useRef<HTMLInputElement>(null);
  const categoriesInputRef = useRef<HTMLInputElement>(null);
  const expensesInputRef = useRef<HTMLInputElement>(null);

  // Export inventory to CSV
  const exportInventory = () => {
    const csvData = data.inventoryEntries.map(entry => {
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

  // Export categories
  const exportCategories = () => {
    const csvData = data.categories.map(c => ({ name: c.name }));
    if (csvData.length === 0) {
      toast.error('No categories to export');
      return;
    }
    const csv = toCSV(csvData, ['name']);
    downloadCSV(csv, `categories_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success(`Exported ${csvData.length} categories`);
  };

  // Export expenses
  const exportExpenses = () => {
    const csvData = expenses.map(e => ({
      description: e.description,
      category: e.category,
      amount: e.amount,
      currency: e.currency_unit,
      expense_date: e.expense_date,
      is_recurring: String(e.is_recurring),
      notes: e.notes || '',
    }));
    if (csvData.length === 0) {
      toast.error('No expenses to export');
      return;
    }
    const csv = toCSV(csvData, ['description', 'category', 'amount', 'currency', 'expense_date', 'is_recurring', 'notes']);
    downloadCSV(csv, `expenses_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success(`Exported ${csvData.length} expenses`);
  };

  // Download template
  const downloadTemplate = (type: 'inventory' | 'sales' | 'categories' | 'expenses') => {
    const templates: Record<string, () => string> = {
      inventory: getInventoryCSVTemplate,
      sales: getSalesCSVTemplate,
      categories: getCategoriesCSVTemplate,
      expenses: getExpensesCSVTemplate,
    };
    const csv = templates[type]();
    downloadCSV(csv, `${type}_template.csv`);
    toast.success(`Downloaded ${type} template`);
  };

  // Import inventory from CSV
  const handleInventoryImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportStatus('loading');
    setImportMessage('Processing inventory...');

    try {
      const text = await file.text();
      const records = parseCSV<CsvInventoryEntry>(text);
      
      if (records.length === 0) throw new Error('No valid records found in CSV');

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
        } catch {
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

    if (inventoryInputRef.current) inventoryInputRef.current.value = '';
  };

  // Import sales from CSV
  const handleSalesImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportStatus('loading');
    setImportMessage('Processing sales...');

    try {
      const text = await file.text();
      const records = parseCSV<CsvSaleRecord>(text);
      
      if (records.length === 0) throw new Error('No valid records found in CSV');

      let successCount = 0;
      let errorCount = 0;

      for (const record of records) {
        try {
          const currency = (['WL', 'DL', 'BGL'].includes(record.currency?.toUpperCase()) 
            ? record.currency.toUpperCase() 
            : 'WL') as CurrencyUnit;
          
          const item = data.items.find(
            i => i.name.toLowerCase() === record.item_name?.toLowerCase()
          );
          
          if (!item) { errorCount++; continue; }

          await addSaleByItem(
            item.id,
            Number(record.quantity_sold) || 1,
            Number(record.sale_price) || 0,
            currency,
            record.notes || '',
            record.sold_at ? new Date(record.sold_at).toISOString() : undefined
          );
          successCount++;
        } catch {
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

    if (salesInputRef.current) salesInputRef.current.value = '';
  };

  // Import categories from CSV
  const handleCategoriesImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportStatus('loading');
    setImportMessage('Processing categories...');

    try {
      const text = await file.text();
      const records = parseCSV<CsvCategoryRecord>(text);
      
      if (records.length === 0) throw new Error('No valid records found in CSV');

      let successCount = 0;
      let errorCount = 0;

      for (const record of records) {
        try {
          const name = record.name?.trim();
          if (!name) { errorCount++; continue; }
          
          // Skip if category already exists
          const exists = data.categories.find(c => c.name.toLowerCase() === name.toLowerCase());
          if (exists) { successCount++; continue; }

          await addCategory(name);
          successCount++;
        } catch {
          errorCount++;
        }
      }

      setImportStatus('success');
      setImportMessage(`Imported ${successCount} categories${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
      toast.success(`Imported ${successCount} categories`);
    } catch (error) {
      setImportStatus('error');
      setImportMessage(error instanceof Error ? error.message : 'Import failed');
      toast.error('Failed to import categories');
    }

    if (categoriesInputRef.current) categoriesInputRef.current.value = '';
  };

  // Import expenses from CSV
  const handleExpensesImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportStatus('loading');
    setImportMessage('Processing expenses...');

    try {
      const text = await file.text();
      const records = parseCSV<CsvExpenseRecord>(text);
      
      if (records.length === 0) throw new Error('No valid records found in CSV');

      let successCount = 0;
      let errorCount = 0;

      for (const record of records) {
        try {
          const currency = (['WL', 'DL', 'BGL'].includes(record.currency?.toUpperCase()) 
            ? record.currency.toUpperCase() 
            : 'WL');

          await addExpense({
            description: record.description || 'Imported expense',
            category: record.category || 'Other',
            amount: Number(record.amount) || 0,
            currency_unit: currency,
            expense_date: record.expense_date || new Date().toISOString().split('T')[0],
            is_recurring: record.is_recurring?.toLowerCase() === 'true',
            notes: record.notes || undefined,
          });
          successCount++;
        } catch {
          errorCount++;
        }
      }

      setImportStatus('success');
      setImportMessage(`Imported ${successCount} expenses${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
      toast.success(`Imported ${successCount} expenses`);
    } catch (error) {
      setImportStatus('error');
      setImportMessage(error instanceof Error ? error.message : 'Import failed');
      toast.error('Failed to import expenses');
    }

    if (expensesInputRef.current) expensesInputRef.current.value = '';
  };

  const renderSection = (
    title: string,
    onExport: () => void,
    onImportClick: () => void,
    templateType: 'inventory' | 'sales' | 'categories' | 'expenses',
    inputRef: React.RefObject<HTMLInputElement>,
    onImport: (e: React.ChangeEvent<HTMLInputElement>) => void,
    note?: string
  ) => (
    <div className="space-y-3">
      <h4 className="font-medium">{title}</h4>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onExport} className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
        <Button variant="outline" size="sm" onClick={onImportClick} className="gap-2">
          <Upload className="w-4 h-4" />
          Import CSV
        </Button>
        <Button variant="ghost" size="sm" onClick={() => downloadTemplate(templateType)} className="gap-2 text-muted-foreground">
          <FileSpreadsheet className="w-4 h-4" />
          Download Template
        </Button>
      </div>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
      <input ref={inputRef} type="file" accept=".csv" onChange={onImport} className="hidden" />
    </div>
  );

  return (
    <Card className="animate-fade-in" style={{ animationDelay: '150ms' }}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-primary" />
          <CardTitle>Import / Export Data</CardTitle>
        </div>
        <CardDescription>
          Bulk import or export your inventory, sales, categories, and expenses via CSV files
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

        {renderSection(
          'Categories',
          exportCategories,
          () => categoriesInputRef.current?.click(),
          'categories',
          categoriesInputRef as React.RefObject<HTMLInputElement>,
          handleCategoriesImport,
          'Import categories first before importing inventory or sales.'
        )}

        {renderSection(
          'Inventory',
          exportInventory,
          () => inventoryInputRef.current?.click(),
          'inventory',
          inventoryInputRef as React.RefObject<HTMLInputElement>,
          handleInventoryImport
        )}

        {renderSection(
          'Sales',
          exportSales,
          () => salesInputRef.current?.click(),
          'sales',
          salesInputRef as React.RefObject<HTMLInputElement>,
          handleSalesImport,
          'Items must already exist before importing sales.'
        )}

        {renderSection(
          'Expenses',
          exportExpenses,
          () => expensesInputRef.current?.click(),
          'expenses',
          expensesInputRef as React.RefObject<HTMLInputElement>,
          handleExpensesImport
        )}
      </CardContent>
    </Card>
  );
}
