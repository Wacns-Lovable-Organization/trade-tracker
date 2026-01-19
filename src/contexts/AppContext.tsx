import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { CurrencyUnit } from '@/types/inventory';

// Types matching the database schema
export interface DbCategory {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface DbItem {
  id: string;
  user_id: string;
  name: string;
  category_id: string | null;
  created_at: string;
}

export interface DbInventoryEntry {
  id: string;
  user_id: string;
  item_id: string;
  snapshot_name: string;
  snapshot_category_id: string | null;
  quantity_bought: number;
  remaining_qty: number;
  unit_cost: number;
  currency_unit: string;
  notes: string | null;
  bought_at: string;
  status: string;
  created_at: string;
}

export interface CostBreakdownItem {
  entryId: string;
  unitCost: number;
  qtyUsed: number;
}

export interface DbSale {
  id: string;
  user_id: string;
  item_id: string;
  quantity_sold: number;
  sale_price: number;
  currency_unit: string;
  cost_breakdown: CostBreakdownItem[];
  total_cost: number;
  profit: number;
  sold_at: string;
  notes: string | null;
  created_at: string;
}

// Mapped types for UI compatibility
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
  status: 'OPEN' | 'CLOSED';
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

interface AppContextType {
  data: {
    categories: Category[];
    items: Item[];
    inventoryEntries: InventoryEntry[];
    sales: Sale[];
  };
  isLoading: boolean;
  
  // Categories
  addCategory: (name: string) => Promise<void>;
  renameCategory: (id: string, newName: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Items
  addItem: (name: string, categoryId: string) => Promise<Item>;
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
  ) => Promise<void>;
  
  updateInventoryEntry: (
    entryId: string,
    updates: {
      quantityBought?: number;
      unitCost?: number;
      notes?: string;
      boughtAt?: string;
    }
  ) => Promise<void>;
  
  deleteInventoryEntry: (entryId: string) => Promise<void>;
  
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
  ) => Promise<Item>;
  
  // Sales (item-level)
  addSaleByItem: (
    itemId: string,
    quantitySold: number,
    amountGained: number,
    currencyUnit: CurrencyUnit,
    notes?: string,
    soldAt?: string
  ) => Promise<void>;
  
  // Utilities
  getDistinctAvailableItems: () => Item[];
  getAvailableEntriesForItem: (itemId: string) => InventoryEntry[];
  getTotalAvailableForItem: (itemId: string) => { 
    remainingQty: number; 
    totalPurchasedQty: number; 
    lifetimeTotalCost: number; 
    currency: CurrencyUnit | null;
  };
  getItemProfitSummary: (itemId: string) => {
    totalRevenue: number;
    totalCost: number;
    cumulativeProfit: number;
    currency: CurrencyUnit | null;
  };
  simulateProfit: (itemId: string, simulateQty: number, sellUnitPrice: number) => SimulationResult;
  calculateSaleProfit: (sale: Sale) => number;
  
  // Data management
  refreshData: () => Promise<void>;
}

interface SimulationResult {
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
  error?: string;
}

const AppContext = createContext<AppContextType | null>(null);

// Mapper functions
function mapCategory(db: DbCategory): Category {
  return {
    id: db.id,
    name: db.name,
    createdAt: db.created_at,
  };
}

function mapItem(db: DbItem): Item {
  return {
    id: db.id,
    name: db.name,
    defaultCategoryId: db.category_id || '',
    createdAt: db.created_at,
  };
}

function mapInventoryEntry(db: DbInventoryEntry): InventoryEntry {
  return {
    id: db.id,
    itemId: db.item_id,
    snapshotName: db.snapshot_name,
    snapshotCategoryId: db.snapshot_category_id || '',
    quantityBought: db.quantity_bought,
    unitCost: Number(db.unit_cost),
    totalCost: db.quantity_bought * Number(db.unit_cost),
    currencyUnit: db.currency_unit as CurrencyUnit,
    boughtAt: db.bought_at,
    remainingQty: db.remaining_qty,
    status: db.status as 'OPEN' | 'CLOSED',
    notes: db.notes || '',
  };
}

function mapSale(db: DbSale): Sale {
  // The cost_breakdown contains the entry info for profit calculation
  const breakdown = db.cost_breakdown || [];
  const firstEntry = breakdown[0];
  
  return {
    id: db.id,
    inventoryEntryId: firstEntry?.entryId || '',
    itemId: db.item_id,
    quantitySold: db.quantity_sold,
    amountGained: Number(db.sale_price),
    currencyUnit: db.currency_unit as CurrencyUnit,
    soldAt: db.sold_at,
    notes: db.notes || '',
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [items, setItems] = useState<DbItem[]>([]);
  const [inventoryEntries, setInventoryEntries] = useState<DbInventoryEntry[]>([]);
  const [sales, setSales] = useState<DbSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!user) {
      setCategories([]);
      setItems([]);
      setInventoryEntries([]);
      setSales([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const [categoriesRes, itemsRes, entriesRes, salesRes] = await Promise.all([
        supabase.from('categories').select('*').order('created_at', { ascending: true }),
        supabase.from('items').select('*').order('created_at', { ascending: true }),
        supabase.from('inventory_entries').select('*').order('bought_at', { ascending: true }),
        supabase.from('sales').select('*').order('sold_at', { ascending: false }),
      ]);

      setCategories((categoriesRes.data || []) as DbCategory[]);
      setItems((itemsRes.data || []) as DbItem[]);
      setInventoryEntries((entriesRes.data || []) as DbInventoryEntry[]);
      setSales((salesRes.data || []).map((sale: any) => ({
        ...sale,
        cost_breakdown: sale.cost_breakdown || [],
      })) as DbSale[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Mapped data for UI
  const data = useMemo(() => ({
    categories: categories.map(mapCategory),
    items: items.map(mapItem),
    inventoryEntries: inventoryEntries.map(mapInventoryEntry),
    sales: sales.map(mapSale),
  }), [categories, items, inventoryEntries, sales]);

  // Add category
  const addCategory = useCallback(async (name: string) => {
    if (!user) throw new Error('Not authenticated');
    
    const { error } = await supabase
      .from('categories')
      .insert({ user_id: user.id, name });
    
    if (error) throw error;
    await fetchData();
  }, [user, fetchData]);

  // Rename category
  const renameCategory = useCallback(async (id: string, newName: string) => {
    if (!user) throw new Error('Not authenticated');
    
    const { error } = await supabase
      .from('categories')
      .update({ name: newName })
      .eq('id', id);
    
    if (error) throw error;
    await fetchData();
  }, [user, fetchData]);

  // Delete category
  const deleteCategory = useCallback(async (id: string) => {
    if (!user) throw new Error('Not authenticated');
    
    // Find or create "Other" category
    let otherCategory = categories.find(c => c.name === 'Other');
    if (!otherCategory) {
      const { data: newOther } = await supabase
        .from('categories')
        .insert({ user_id: user.id, name: 'Other' })
        .select()
        .single();
      otherCategory = newOther as DbCategory;
    }
    
    // Reassign items to "Other" category
    if (otherCategory) {
      await supabase
        .from('items')
        .update({ category_id: otherCategory.id })
        .eq('category_id', id);
    }
    
    // Delete the category
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    await fetchData();
  }, [user, categories, fetchData]);

  // Add item
  const addItem = useCallback(async (name: string, categoryId: string): Promise<Item> => {
    if (!user) throw new Error('Not authenticated');
    
    const { data: newItem, error } = await supabase
      .from('items')
      .insert({ user_id: user.id, name, category_id: categoryId })
      .select()
      .single();
    
    if (error) throw error;
    await fetchData();
    return mapItem(newItem as DbItem);
  }, [user, fetchData]);

  // Get item by ID
  const getItemById = useCallback((id: string) => {
    return data.items.find(i => i.id === id);
  }, [data.items]);

  // Add inventory entry
  const addInventoryEntry = useCallback(async (
    itemId: string,
    snapshotName: string,
    snapshotCategoryId: string,
    quantityBought: number,
    unitCost: number,
    currencyUnit: CurrencyUnit,
    notes?: string,
    boughtAt?: string
  ) => {
    if (!user) throw new Error('Not authenticated');
    
    const { error } = await supabase
      .from('inventory_entries')
      .insert({
        user_id: user.id,
        item_id: itemId,
        snapshot_name: snapshotName,
        snapshot_category_id: snapshotCategoryId,
        quantity_bought: quantityBought,
        remaining_qty: quantityBought,
        unit_cost: unitCost,
        currency_unit: currencyUnit,
        notes: notes || null,
        bought_at: boughtAt || new Date().toISOString(),
        status: 'OPEN',
      });
    
    if (error) throw error;
    await fetchData();
  }, [user, fetchData]);

  // Update inventory entry
  const updateInventoryEntry = useCallback(async (
    entryId: string,
    updates: {
      quantityBought?: number;
      unitCost?: number;
      notes?: string;
      boughtAt?: string;
    }
  ) => {
    if (!user) throw new Error('Not authenticated');
    
    const updateData: Record<string, any> = {};
    if (updates.quantityBought !== undefined) {
      updateData.quantity_bought = updates.quantityBought;
      updateData.remaining_qty = updates.quantityBought; // Reset remaining to match bought
    }
    if (updates.unitCost !== undefined) updateData.unit_cost = updates.unitCost;
    if (updates.notes !== undefined) updateData.notes = updates.notes || null;
    if (updates.boughtAt !== undefined) updateData.bought_at = updates.boughtAt;
    
    const { error } = await supabase
      .from('inventory_entries')
      .update(updateData)
      .eq('id', entryId);
    
    if (error) throw error;
    await fetchData();
  }, [user, fetchData]);

  // Delete inventory entry
  const deleteInventoryEntry = useCallback(async (entryId: string) => {
    if (!user) throw new Error('Not authenticated');
    
    const { error } = await supabase
      .from('inventory_entries')
      .delete()
      .eq('id', entryId);
    
    if (error) throw error;
    await fetchData();
  }, [user, fetchData]);

  // Add item with inventory entry atomically
  const addItemWithInventoryEntry = useCallback(async (
    name: string,
    categoryId: string,
    snapshotName: string,
    snapshotCategoryId: string,
    quantityBought: number,
    unitCost: number,
    currencyUnit: CurrencyUnit,
    notes?: string,
    boughtAt?: string
  ): Promise<Item> => {
    if (!user) throw new Error('Not authenticated');
    
    // Check if item already exists
    let item = items.find(
      i => i.name.toLowerCase() === name.trim().toLowerCase()
    );
    
    if (!item) {
      const { data: newItem, error: itemError } = await supabase
        .from('items')
        .insert({ user_id: user.id, name: name.trim(), category_id: categoryId })
        .select()
        .single();
      
      if (itemError) throw itemError;
      item = newItem as DbItem;
    }
    
    // Add inventory entry
    const { error } = await supabase
      .from('inventory_entries')
      .insert({
        user_id: user.id,
        item_id: item.id,
        snapshot_name: snapshotName,
        snapshot_category_id: snapshotCategoryId,
        quantity_bought: quantityBought,
        remaining_qty: quantityBought,
        unit_cost: unitCost,
        currency_unit: currencyUnit,
        notes: notes || null,
        bought_at: boughtAt || new Date().toISOString(),
        status: 'OPEN',
      });
    
    if (error) throw error;
    await fetchData();
    return mapItem(item);
  }, [user, items, fetchData]);

  // Get available entries for an item
  const getAvailableEntriesForItem = useCallback((itemId: string) => {
    return data.inventoryEntries
      .filter(e => e.itemId === itemId && e.status === 'OPEN' && e.remainingQty > 0)
      .sort((a, b) => new Date(a.boughtAt).getTime() - new Date(b.boughtAt).getTime());
  }, [data.inventoryEntries]);

  // Get lifetime totals for an item (cost never decreases, tracks all-time quantities)
  const getTotalAvailableForItem = useCallback((itemId: string) => {
    // All entries for this item (for lifetime totals)
    const allEntries = inventoryEntries.filter(e => e.item_id === itemId);
    
    // Calculate lifetime total cost and total purchased qty (never changes after purchase)
    let lifetimeTotalCost = 0;
    let totalPurchasedQty = 0;
    let currency: CurrencyUnit | null = null;

    for (const entry of allEntries) {
      totalPurchasedQty += entry.quantity_bought;
      lifetimeTotalCost += entry.quantity_bought * Number(entry.unit_cost);
      if (!currency) currency = entry.currency_unit as CurrencyUnit;
    }

    // Calculate total sold from sales table
    const totalSold = sales
      .filter(s => s.item_id === itemId)
      .reduce((sum, s) => sum + s.quantity_sold, 0);

    const remainingQty = totalPurchasedQty - totalSold;

    return { remainingQty, totalPurchasedQty, lifetimeTotalCost, currency };
  }, [inventoryEntries, sales]);

  // Get profit summary for an item (total revenue, total cost, cumulative profit)
  const getItemProfitSummary = useCallback((itemId: string) => {
    const itemSales = sales.filter(s => s.item_id === itemId);
    const allEntries = inventoryEntries.filter(e => e.item_id === itemId);
    
    let totalRevenue = 0;
    let currency: CurrencyUnit | null = null;
    
    for (const sale of itemSales) {
      totalRevenue += Number(sale.sale_price);
      if (!currency) currency = sale.currency_unit as CurrencyUnit;
    }
    
    // Total cost is lifetime total cost of all purchases
    let totalCost = 0;
    for (const entry of allEntries) {
      totalCost += entry.quantity_bought * Number(entry.unit_cost);
      if (!currency) currency = entry.currency_unit as CurrencyUnit;
    }
    
    const cumulativeProfit = totalRevenue - totalCost;
    
    return { totalRevenue, totalCost, cumulativeProfit, currency };
  }, [sales, inventoryEntries]);

  // Record sale - simple logic: profit = revenue - (lifetime_total_cost / total_purchased_qty * qty_sold)
  const addSaleByItem = useCallback(async (
    itemId: string,
    quantitySold: number,
    amountGained: number,
    currencyUnit: CurrencyUnit,
    notes?: string,
    soldAt?: string
  ) => {
    if (!user) throw new Error('Not authenticated');
    
    // Get lifetime totals for this item
    const itemInfo = getTotalAvailableForItem(itemId);
    
    if (quantitySold > itemInfo.remainingQty) {
      throw new Error(`Cannot sell more than ${itemInfo.remainingQty} available`);
    }
    
    // Calculate cost using lifetime average: totalCost / totalPurchasedQty
    const avgCost = itemInfo.totalPurchasedQty > 0 
      ? itemInfo.lifetimeTotalCost / itemInfo.totalPurchasedQty 
      : 0;
    const costOfGoodsSold = avgCost * quantitySold;
    const profit = amountGained - costOfGoodsSold;
    
    // Simple cost breakdown for record keeping
    const costBreakdown: CostBreakdownItem[] = [{
      entryId: 'lifetime-avg',
      unitCost: avgCost,
      qtyUsed: quantitySold,
    }];
    
    // Create sale record (no need to update inventory entries anymore - we track via sales)
    const { error } = await supabase
      .from('sales')
      .insert({
        user_id: user.id,
        item_id: itemId,
        quantity_sold: quantitySold,
        sale_price: amountGained,
        currency_unit: currencyUnit,
        cost_breakdown: costBreakdown as any,
        total_cost: costOfGoodsSold,
        profit,
        sold_at: soldAt || new Date().toISOString(),
        notes: notes || null,
      });
    
    if (error) throw error;
    await fetchData();
  }, [user, getTotalAvailableForItem, fetchData]);

  // Get distinct available items (items with OPEN inventory)
  const getDistinctAvailableItems = useCallback(() => {
    const itemIdsWithInventory = new Set(
      data.inventoryEntries
        .filter(e => e.status === 'OPEN' && e.remainingQty > 0)
        .map(e => e.itemId)
    );
    
    return data.items.filter(item => itemIdsWithInventory.has(item.id));
  }, [data.items, data.inventoryEntries]);

  // Simulate profit
  const simulateProfit = useCallback((
    itemId: string,
    simulateQty: number,
    sellUnitPrice: number
  ): SimulationResult => {
    const availableEntries = getAvailableEntriesForItem(itemId);
    const totalAvailable = availableEntries.reduce((sum, e) => sum + e.remainingQty, 0);
    
    if (simulateQty > totalAvailable) {
      return {
        remainingQty: totalAvailable,
        simulateQty,
        sellUnitPrice,
        projectedRevenue: simulateQty * sellUnitPrice,
        simulatedCogs: 0,
        projectedProfit: 0,
        breakdown: [],
        error: `Not enough inventory. Only ${totalAvailable} available.`,
      };
    }
    
    let qtyRemaining = simulateQty;
    let totalCost = 0;
    const breakdown: SimulationResult['breakdown'] = [];
    
    for (const entry of availableEntries) {
      if (qtyRemaining <= 0) break;
      
      const qtyFromEntry = Math.min(qtyRemaining, entry.remainingQty);
      const costFromEntry = qtyFromEntry * entry.unitCost;
      
      breakdown.push({
        entryId: entry.id,
        boughtAt: entry.boughtAt,
        unitCost: entry.unitCost,
        qtyUsed: qtyFromEntry,
        costContribution: costFromEntry,
      });
      
      totalCost += costFromEntry;
      qtyRemaining -= qtyFromEntry;
    }
    
    const projectedRevenue = simulateQty * sellUnitPrice;
    
    return {
      remainingQty: totalAvailable,
      simulateQty,
      sellUnitPrice,
      projectedRevenue,
      simulatedCogs: totalCost,
      projectedProfit: projectedRevenue - totalCost,
      breakdown,
    };
  }, [getAvailableEntriesForItem]);

  // Calculate sale profit
  const calculateSaleProfit = useCallback((sale: Sale): number => {
    const dbSale = sales.find(s => s.id === sale.id);
    if (dbSale) {
      return Number(dbSale.profit);
    }
    
    // Fallback calculation
    const entry = data.inventoryEntries.find(e => e.id === sale.inventoryEntryId);
    if (!entry) return 0;
    
    const costOfSold = sale.quantitySold * entry.unitCost;
    return sale.amountGained - costOfSold;
  }, [sales, data.inventoryEntries]);

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
        updateInventoryEntry,
        deleteInventoryEntry,
        addItemWithInventoryEntry,
        addSaleByItem,
        getDistinctAvailableItems,
        getAvailableEntriesForItem,
        getTotalAvailableForItem,
        getItemProfitSummary,
        simulateProfit,
        calculateSaleProfit,
        refreshData: fetchData,
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
