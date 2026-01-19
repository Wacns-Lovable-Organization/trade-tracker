import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useUserSettings } from '@/hooks/useUserSettings';

export interface LowStockItem {
  itemId: string;
  itemName: string;
  categoryId: string;
  categoryName: string;
  remainingQty: number;
  threshold: number;
}

export function useLowStockAlerts() {
  const { data } = useApp();
  const { settings } = useUserSettings();
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [hasNewAlerts, setHasNewAlerts] = useState(false);

  const checkLowStock = useCallback(() => {
    if (!settings?.low_stock_alerts_enabled) {
      setLowStockItems([]);
      return;
    }

    const globalThreshold = settings.low_stock_threshold_global || 5;
    const alerts: LowStockItem[] = [];

    // Group inventory by item to get remaining quantities
    const itemRemainingMap = new Map<string, number>();
    
    data.inventoryEntries.forEach(entry => {
      if (entry.status === 'OPEN') {
        const current = itemRemainingMap.get(entry.itemId) || 0;
        itemRemainingMap.set(entry.itemId, current + entry.remainingQty);
      }
    });

    // Check each item against thresholds
    data.items.forEach(item => {
      const remainingQty = itemRemainingMap.get(item.id) || 0;
      const category = data.categories.find(c => c.id === item.defaultCategoryId);
      
      // Use item-specific threshold if set, otherwise global
      const threshold = (item as any).low_stock_threshold || globalThreshold;
      
      if (remainingQty > 0 && remainingQty <= threshold) {
        alerts.push({
          itemId: item.id,
          itemName: item.name,
          categoryId: item.defaultCategoryId,
          categoryName: category?.name || 'Uncategorized',
          remainingQty,
          threshold,
        });
      }
    });

    // Sort by urgency (lowest remaining first)
    alerts.sort((a, b) => a.remainingQty - b.remainingQty);
    
    // Check if there are new alerts
    if (alerts.length > lowStockItems.length) {
      setHasNewAlerts(true);
    }
    
    setLowStockItems(alerts);
  }, [data, settings]);

  useEffect(() => {
    checkLowStock();
  }, [checkLowStock]);

  const dismissNewAlerts = useCallback(() => {
    setHasNewAlerts(false);
  }, []);

  // Request push notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return { granted: false, error: 'Notifications not supported' };
    }

    const permission = await Notification.requestPermission();
    return { granted: permission === 'granted', error: null };
  }, []);

  // Send a push notification
  const sendNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: 'low-stock-alert',
      });
    }
  }, []);

  return {
    lowStockItems,
    hasNewAlerts,
    dismissNewAlerts,
    checkLowStock,
    requestNotificationPermission,
    sendNotification,
    alertCount: lowStockItems.length,
  };
}
