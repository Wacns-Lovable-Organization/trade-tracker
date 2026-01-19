import type { AppData, Category, Item, InventoryEntry, Sale, CurrencyUnit } from '@/types/inventory';

const STORAGE_KEY = 'gt_inventory_app_v1';

const DEFAULT_CATEGORY: Category = {
  id: 'cat_other',
  name: 'Other',
  createdAt: new Date().toISOString(),
};

function createDefaultData(): AppData {
  const now = new Date().toISOString();
  return {
    meta: {
      version: 1,
      currencyUnit: null, // Not used anymore, kept for backward compat
      createdAt: now,
      updatedAt: now,
    },
    categories: [DEFAULT_CATEGORY],
    items: [],
    inventoryEntries: [],
    sales: [],
  };
}

export function generateId(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultData();
    
    const data = JSON.parse(raw) as AppData;
    
    // Ensure "Other" category always exists
    if (!data.categories.find(c => c.id === 'cat_other')) {
      data.categories.unshift(DEFAULT_CATEGORY);
    }
    
    return data;
  } catch {
    return createDefaultData();
  }
}

export function saveData(data: AppData): void {
  data.meta.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Export data as JSON file
export function exportData(): void {
  const data = loadData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inventory_data_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Import data from JSON file
export function importData(file: File): Promise<AppData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const imported = JSON.parse(content) as AppData;
        
        // Validate structure
        if (!imported.meta || !imported.categories || !imported.items || !imported.inventoryEntries || !imported.sales) {
          throw new Error('Invalid data structure');
        }
        
        // Ensure "Other" category exists
        if (!imported.categories.find(c => c.id === 'cat_other')) {
          imported.categories.unshift(DEFAULT_CATEGORY);
        }
        
        saveData(imported);
        resolve(imported);
      } catch (error) {
        reject(new Error('Invalid JSON file or data structure'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function resetData(): AppData {
  const data = createDefaultData();
  saveData(data);
  return data;
}

// Category helpers
export function addCategory(data: AppData, name: string): AppData {
  const normalized = name.trim();
  if (!normalized) throw new Error('Category name cannot be empty');
  
  const exists = data.categories.some(
    c => c.name.toLowerCase() === normalized.toLowerCase()
  );
  if (exists) throw new Error('Category already exists');
  
  const category: Category = {
    id: generateId('cat'),
    name: normalized,
    createdAt: new Date().toISOString(),
  };
  
  return {
    ...data,
    categories: [...data.categories, category],
  };
}

export function renameCategory(data: AppData, id: string, newName: string): AppData {
  if (id === 'cat_other') throw new Error('Cannot rename "Other" category');
  
  const normalized = newName.trim();
  if (!normalized) throw new Error('Category name cannot be empty');
  
  const exists = data.categories.some(
    c => c.id !== id && c.name.toLowerCase() === normalized.toLowerCase()
  );
  if (exists) throw new Error('Category name already exists');
  
  return {
    ...data,
    categories: data.categories.map(c =>
      c.id === id ? { ...c, name: normalized } : c
    ),
  };
}

export function deleteCategory(data: AppData, id: string): AppData {
  if (id === 'cat_other') throw new Error('Cannot delete "Other" category');
  
  // Reassign items to "Other"
  const updatedItems = data.items.map(item =>
    item.defaultCategoryId === id
      ? { ...item, defaultCategoryId: 'cat_other' }
      : item
  );
  
  // Update inventory snapshots
  const updatedEntries = data.inventoryEntries.map(entry =>
    entry.snapshotCategoryId === id
      ? { ...entry, snapshotCategoryId: 'cat_other' }
      : entry
  );
  
  return {
    ...data,
    categories: data.categories.filter(c => c.id !== id),
    items: updatedItems,
    inventoryEntries: updatedEntries,
  };
}

// Item helpers
export function addItem(data: AppData, name: string, categoryId: string): AppData {
  const normalized = name.trim();
  if (!normalized) throw new Error('Item name cannot be empty');
  
  const exists = data.items.some(
    i => i.name.toLowerCase() === normalized.toLowerCase()
  );
  if (exists) throw new Error('Item already exists');
  
  const item: Item = {
    id: generateId('item'),
    name: normalized,
    defaultCategoryId: categoryId,
    createdAt: new Date().toISOString(),
  };
  
  return {
    ...data,
    items: [...data.items, item],
  };
}

// Inventory helpers
export function addInventoryEntry(
  data: AppData,
  itemId: string,
  snapshotName: string,
  snapshotCategoryId: string,
  quantityBought: number,
  unitCost: number,
  currencyUnit: CurrencyUnit,
  notes: string = '',
  boughtAt?: string
): AppData {
  if (quantityBought <= 0 || !Number.isInteger(quantityBought)) {
    throw new Error('Quantity must be a positive integer');
  }
  
  if (unitCost <= 0) {
    throw new Error('Unit cost must be positive');
  }
  
  const entry: InventoryEntry = {
    id: generateId('inv'),
    itemId,
    snapshotName: snapshotName.trim(),
    snapshotCategoryId,
    quantityBought,
    unitCost,
    totalCost: quantityBought * unitCost,
    currencyUnit,
    boughtAt: boughtAt || new Date().toISOString(),
    remainingQty: quantityBought,
    status: 'OPEN',
    notes: notes.trim(),
  };
  
  return {
    ...data,
    inventoryEntries: [...data.inventoryEntries, entry],
  };
}

// Sale helpers
export function addSale(
  data: AppData,
  inventoryEntryId: string,
  quantitySold: number,
  amountGained: number,
  currencyUnit: CurrencyUnit,
  notes: string = '',
  soldAt?: string
): AppData {
  const entry = data.inventoryEntries.find(e => e.id === inventoryEntryId);
  if (!entry) throw new Error('Inventory entry not found');
  
  if (entry.status === 'CLOSED') {
    throw new Error('Cannot sell from closed inventory entry');
  }
  
  if (quantitySold <= 0 || !Number.isInteger(quantitySold)) {
    throw new Error('Quantity sold must be a positive integer');
  }
  
  if (quantitySold > entry.remainingQty) {
    throw new Error('Cannot sell more than remaining quantity');
  }
  
  if (amountGained <= 0) {
    throw new Error('Amount gained must be positive');
  }
  
  const sale: Sale = {
    id: generateId('sale'),
    inventoryEntryId,
    itemId: entry.itemId,
    quantitySold,
    amountGained,
    currencyUnit,
    soldAt: soldAt || new Date().toISOString(),
    notes: notes.trim(),
  };
  
  const newRemainingQty = entry.remainingQty - quantitySold;
  const updatedEntries = data.inventoryEntries.map(e =>
    e.id === inventoryEntryId
      ? {
          ...e,
          remainingQty: newRemainingQty,
          status: newRemainingQty === 0 ? 'CLOSED' as const : 'OPEN' as const,
        }
      : e
  );
  
  return {
    ...data,
    inventoryEntries: updatedEntries,
    sales: [...data.sales, sale],
  };
}

// Calculation helpers
export function calculateSaleProfit(data: AppData, sale: Sale): number {
  const entry = data.inventoryEntries.find(e => e.id === sale.inventoryEntryId);
  if (!entry) return 0;
  
  const costOfSold = sale.quantitySold * entry.unitCost;
  return sale.amountGained - costOfSold;
}

export function getAvailableInventoryByItem(data: AppData): Map<string, InventoryEntry[]> {
  const map = new Map<string, InventoryEntry[]>();
  
  data.inventoryEntries
    .filter(e => e.status === 'OPEN' && e.remainingQty > 0)
    .forEach(entry => {
      const existing = map.get(entry.itemId) || [];
      existing.push(entry);
      map.set(entry.itemId, existing);
    });
  
  return map;
}

export function getDistinctAvailableItems(data: AppData): Item[] {
  const availableItemIds = new Set(
    data.inventoryEntries
      .filter(e => e.status === 'OPEN' && e.remainingQty > 0)
      .map(e => e.itemId)
  );
  
  return data.items.filter(item => availableItemIds.has(item.id));
}

export function simulateProfit(
  data: AppData,
  itemId: string,
  simulateQty: number,
  sellUnitPrice: number
): {
  remainingQty: number;
  simulateQty: number;
  sellUnitPrice: number;
  projectedRevenue: number;
  simulatedCogs: number;
  projectedProfit: number;
  breakdown: {
    entryId: string;
    boughtAt: string;
    unitCost: number;
    qtyUsed: number;
    costContribution: number;
  }[];
} {
  // Get all OPEN entries for this item, sorted by boughtAt (FIFO)
  const entries = data.inventoryEntries
    .filter(e => e.itemId === itemId && e.status === 'OPEN' && e.remainingQty > 0)
    .sort((a, b) => new Date(a.boughtAt).getTime() - new Date(b.boughtAt).getTime());
  
  const totalRemaining = entries.reduce((sum, e) => sum + e.remainingQty, 0);
  
  if (simulateQty > totalRemaining) {
    throw new Error('Cannot simulate more than available quantity');
  }
  
  let remaining = simulateQty;
  let simulatedCogs = 0;
  const breakdown: {
    entryId: string;
    boughtAt: string;
    unitCost: number;
    qtyUsed: number;
    costContribution: number;
  }[] = [];
  
  for (const entry of entries) {
    if (remaining <= 0) break;
    
    const qtyUsed = Math.min(remaining, entry.remainingQty);
    const costContribution = qtyUsed * entry.unitCost;
    
    breakdown.push({
      entryId: entry.id,
      boughtAt: entry.boughtAt,
      unitCost: entry.unitCost,
      qtyUsed,
      costContribution,
    });
    
    simulatedCogs += costContribution;
    remaining -= qtyUsed;
  }
  
  const projectedRevenue = simulateQty * sellUnitPrice;
  const projectedProfit = projectedRevenue - simulatedCogs;
  
  return {
    remainingQty: totalRemaining,
    simulateQty,
    sellUnitPrice,
    projectedRevenue,
    simulatedCogs,
    projectedProfit,
    breakdown,
  };
}
