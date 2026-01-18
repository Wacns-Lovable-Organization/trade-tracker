// Core types for the inventory app

export type CurrencyUnit = 'WL' | 'DL' | 'BGL';

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export interface Item {
  id: string;
  name: string;
  defaultCategoryId: string;
  createdAt: string;
}

export type InventoryStatus = 'OPEN' | 'CLOSED';

export interface InventoryEntry {
  id: string;
  itemId: string;
  snapshotName: string;
  snapshotCategoryId: string;
  quantityBought: number;
  unitCost: number;
  totalCost: number;
  currencyUnit: CurrencyUnit;
  boughtAt: string;
  remainingQty: number;
  status: InventoryStatus;
  notes: string;
}

export interface Sale {
  id: string;
  inventoryEntryId: string;
  itemId: string;
  quantitySold: number;
  amountGained: number;
  currencyUnit: CurrencyUnit;
  soldAt: string;
  notes: string;
}

export interface AppMeta {
  version: number;
  currencyUnit: CurrencyUnit | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  meta: AppMeta;
  categories: Category[];
  items: Item[];
  inventoryEntries: InventoryEntry[];
  sales: Sale[];
}

// Utility types
export interface ItemStats {
  itemId: string;
  itemName: string;
  categoryId: string;
  totalRevenue: number;
  totalCogs: number;
  totalProfit: number;
  profitMargin: number;
  totalSold: number;
  remainingQty: number;
  remainingValue: number;
}

export interface CategoryStats {
  categoryId: string;
  categoryName: string;
  totalRevenue: number;
  totalCogs: number;
  totalProfit: number;
  profitMargin: number;
  itemCount: number;
}

export interface SimulationResult {
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
}
