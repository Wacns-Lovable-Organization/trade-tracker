import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { AppData, CurrencyUnit, Item, InventoryEntry } from '@/types/inventory';
import * as storage from '@/lib/storage';

interface AppContextType {
  data: AppData;
  isLoading: boolean;
  
  // Categories
  addCategory: (name: string) => void;
  renameCategory: (id: string, newName: string) => void;
  deleteCategory: (id: string) => void;
  
  // Items
  addItem: (name: string, categoryId: string) => Item;
  getItemById: (id: string) => Item | undefined;
  
  // Inventory
  addInventoryEntry: (
    itemId: string,
    snapshotName: string,
    snapshotCategoryId: string,
    quantityBought: number,
    unitCost: number,
    currencyUnit: CurrencyUnit,
    notes?: string,
    boughtAt?: string
  ) => void;
  
  // Combined: add item + inventory entry atomically
  addItemWithInventoryEntry: (
    name: string,
    categoryId: string,
    snapshotName: string,
    snapshotCategoryId: string,
    quantityBought: number,
    unitCost: number,
    currencyUnit: CurrencyUnit,
    notes?: string,
    boughtAt?: string
  ) => Item;
  
  // Sales
  addSale: (
    inventoryEntryId: string,
    quantitySold: number,
    amountGained: number,
    currencyUnit: CurrencyUnit,
    notes?: string,
    soldAt?: string
  ) => void;
  
  // Utilities
  getDistinctAvailableItems: () => Item[];
  getAvailableEntriesForItem: (itemId: string) => InventoryEntry[];
  simulateProfit: (itemId: string, simulateQty: number, sellUnitPrice: number) => ReturnType<typeof storage.simulateProfit>;
  calculateSaleProfit: (sale: Parameters<typeof storage.calculateSaleProfit>[1]) => number;
  
  // Data management
  resetData: () => void;
  refreshData: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(() => storage.loadData());
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    setData(storage.loadData());
    setIsLoading(false);
  }, []);
  
  const updateData = useCallback((newData: AppData) => {
    storage.saveData(newData);
    setData(newData);
  }, []);
  
  const addCategory = useCallback((name: string) => {
    updateData(storage.addCategory(data, name));
  }, [data, updateData]);
  
  const renameCategory = useCallback((id: string, newName: string) => {
    updateData(storage.renameCategory(data, id, newName));
  }, [data, updateData]);
  
  const deleteCategory = useCallback((id: string) => {
    updateData(storage.deleteCategory(data, id));
  }, [data, updateData]);
  
  const addItem = useCallback((name: string, categoryId: string): Item => {
    const newData = storage.addItem(data, name, categoryId);
    updateData(newData);
    return newData.items[newData.items.length - 1];
  }, [data, updateData]);
  
  const getItemById = useCallback((id: string) => {
    return data.items.find(i => i.id === id);
  }, [data]);
  
  // Combined function to add item and inventory entry atomically
  const addItemWithInventoryEntry = useCallback((
    name: string,
    categoryId: string,
    snapshotName: string,
    snapshotCategoryId: string,
    quantityBought: number,
    unitCost: number,
    currencyUnit: CurrencyUnit,
    notes?: string,
    boughtAt?: string
  ): Item => {
    // First check if item already exists
    const existingItem = data.items.find(
      i => i.name.toLowerCase() === name.trim().toLowerCase()
    );
    
    let workingData = data;
    let item: Item;
    
    if (existingItem) {
      item = existingItem;
    } else {
      // Add the item first
      workingData = storage.addItem(data, name, categoryId);
      item = workingData.items[workingData.items.length - 1];
    }
    
    // Then add inventory entry using the updated data
    const finalData = storage.addInventoryEntry(
      workingData,
      item.id,
      snapshotName,
      snapshotCategoryId,
      quantityBought,
      unitCost,
      currencyUnit,
      notes,
      boughtAt
    );
    
    updateData(finalData);
    return item;
  }, [data, updateData]);
  
  const addInventoryEntry = useCallback((
    itemId: string,
    snapshotName: string,
    snapshotCategoryId: string,
    quantityBought: number,
    unitCost: number,
    currencyUnit: CurrencyUnit,
    notes?: string,
    boughtAt?: string
  ) => {
    updateData(storage.addInventoryEntry(
      data,
      itemId,
      snapshotName,
      snapshotCategoryId,
      quantityBought,
      unitCost,
      currencyUnit,
      notes,
      boughtAt
    ));
  }, [data, updateData]);
  
  const addSale = useCallback((
    inventoryEntryId: string,
    quantitySold: number,
    amountGained: number,
    currencyUnit: CurrencyUnit,
    notes?: string,
    soldAt?: string
  ) => {
    updateData(storage.addSale(data, inventoryEntryId, quantitySold, amountGained, currencyUnit, notes, soldAt));
  }, [data, updateData]);
  
  const getDistinctAvailableItems = useCallback(() => {
    return storage.getDistinctAvailableItems(data);
  }, [data]);
  
  const getAvailableEntriesForItem = useCallback((itemId: string) => {
    return data.inventoryEntries
      .filter(e => e.itemId === itemId && e.status === 'OPEN' && e.remainingQty > 0)
      .sort((a, b) => new Date(a.boughtAt).getTime() - new Date(b.boughtAt).getTime());
  }, [data]);
  
  const simulateProfitFn = useCallback((
    itemId: string,
    simulateQty: number,
    sellUnitPrice: number
  ) => {
    return storage.simulateProfit(data, itemId, simulateQty, sellUnitPrice);
  }, [data]);
  
  const calculateSaleProfitFn = useCallback((sale: Parameters<typeof storage.calculateSaleProfit>[1]) => {
    return storage.calculateSaleProfit(data, sale);
  }, [data]);
  
  const resetData = useCallback(() => {
    setData(storage.resetData());
  }, []);
  
  const refreshData = useCallback(() => {
    setData(storage.loadData());
  }, []);
  
  return (
    <AppContext.Provider
      value={{
        data,
        isLoading,
        addCategory,
        renameCategory,
        deleteCategory,
        addItem,
        getItemById,
        addInventoryEntry,
        addItemWithInventoryEntry,
        addSale,
        getDistinctAvailableItems,
        getAvailableEntriesForItem,
        simulateProfit: simulateProfitFn,
        calculateSaleProfit: calculateSaleProfitFn,
        resetData,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
