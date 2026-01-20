import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';

export interface ForecastItem {
  itemName: string;
  predictedQuantity: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  reasoning: string;
}

export interface ForecastResult {
  forecasts: ForecastItem[];
  overallInsight: string;
  recommendations: string[];
}

export function useSalesForecast() {
  const { data } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateForecast = useCallback(async (daysToForecast: number = 30) => {
    setIsLoading(true);
    setError(null);

    try {
      // Prepare sales data for the AI
      const salesData = data.sales.map(sale => {
        const item = data.items.find(i => i.id === sale.itemId);
        return {
          itemName: item?.name || 'Unknown',
          soldAt: sale.soldAt,
          quantitySold: sale.quantitySold,
        };
      });

      if (salesData.length === 0) {
        setError('No sales data available for forecasting');
        setIsLoading(false);
        return;
      }

      const response = await supabase.functions.invoke('sales-forecast', {
        body: { salesData, daysToForecast },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setForecast(response.data);
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error('Forecast error:', err);
      setError(error.message || 'Failed to generate forecast');
    } finally {
      setIsLoading(false);
    }
  }, [data]);

  return {
    forecast,
    isLoading,
    error,
    generateForecast,
  };
}
