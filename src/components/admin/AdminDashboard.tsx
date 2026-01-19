import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  Activity, 
  Wifi,
  RefreshCw,
  TrendingUp,
  Coins
} from 'lucide-react';
import { AdminSalesChart } from './AdminSalesChart';
import { AdminUserActivityChart } from './AdminUserActivityChart';

interface DashboardStats {
  total_users: number;
  active_users: number;
  total_inventory: number;
  total_sales: number;
  online_users: number;
}

interface ProfitByCurrency {
  currency_unit: string;
  total_revenue: number;
  total_profit: number;
  sale_count: number;
}

interface SalesTrend {
  sale_date: string;
  sale_count: number;
  total_revenue: number;
  total_profit: number;
}

interface UserActivity {
  activity_date: string;
  new_users: number;
  active_devices: number;
}

// Currency display order and styling
const CURRENCY_CONFIG: Record<string, { label: string; color: string; priority: number }> = {
  BGL: { label: 'BGL', color: 'bg-amber-500/20 text-amber-600 border-amber-500/30', priority: 1 },
  DL: { label: 'DL', color: 'bg-blue-500/20 text-blue-600 border-blue-500/30', priority: 2 },
  WL: { label: 'WL', color: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30', priority: 3 },
};

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [profitByCurrency, setProfitByCurrency] = useState<ProfitByCurrency[]>([]);
  const [salesTrends, setSalesTrends] = useState<SalesTrend[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch all dashboard data in parallel
      const [statsRes, profitRes, salesRes, activityRes] = await Promise.all([
        supabase.rpc('get_admin_dashboard_stats'),
        supabase.rpc('get_admin_profit_by_currency'),
        supabase.rpc('get_admin_sales_trends'),
        supabase.rpc('get_admin_user_activity'),
      ]);

      if (statsRes.data && statsRes.data[0]) {
        setStats(statsRes.data[0] as DashboardStats);
      }
      
      if (profitRes.data) {
        setProfitByCurrency(profitRes.data as ProfitByCurrency[]);
      }
      
      if (salesRes.data) {
        setSalesTrends(salesRes.data as SalesTrend[]);
      }
      
      if (activityRes.data) {
        setUserActivity(activityRes.data as UserActivity[]);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Calculate total profit across all currencies (for display purposes, grouped by currency)
  const sortedProfits = [...profitByCurrency].sort((a, b) => {
    const priorityA = CURRENCY_CONFIG[a.currency_unit]?.priority || 99;
    const priorityB = CURRENCY_CONFIG[b.currency_unit]?.priority || 99;
    return priorityA - priorityB;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={fetchDashboardData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Users"
          value={stats?.total_users || 0}
          icon={Users}
          subtitle="Registered accounts"
        />
        <StatCard
          title="Online Now"
          value={stats?.online_users || 0}
          icon={Wifi}
          subtitle="Currently active users"
          className="border-green-500/30"
        />
        <StatCard
          title="Active Users (7d)"
          value={stats?.active_users || 0}
          icon={Activity}
          subtitle="Users active in last 7 days"
        />
        <StatCard
          title="Total Inventory"
          value={stats?.total_inventory || 0}
          icon={Package}
          subtitle="Inventory entries across all users"
        />
        <StatCard
          title="Total Sales"
          value={stats?.total_sales || 0}
          icon={ShoppingCart}
          subtitle="Sales recorded across all users"
        />
      </div>

      {/* Profit by Currency */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Total Profit by Currency
          </CardTitle>
          <CardDescription>
            Combined profit from all sales, grouped by currency
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedProfits.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No sales recorded yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sortedProfits.map((item) => {
                const config = CURRENCY_CONFIG[item.currency_unit] || { 
                  label: item.currency_unit, 
                  color: 'bg-muted text-muted-foreground',
                  priority: 99 
                };
                
                return (
                  <div
                    key={item.currency_unit}
                    className={`p-4 rounded-xl border ${config.color}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className={config.color}>
                        {config.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {item.sale_count} sales
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div>
                        <span className="text-xs text-muted-foreground">Revenue</span>
                        <p className="text-lg font-bold">
                          {Number(item.total_revenue).toLocaleString()} {config.label}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Profit</span>
                        <p className={`text-lg font-bold ${Number(item.total_profit) >= 0 ? 'text-profit' : 'text-loss'}`}>
                          {Number(item.total_profit) >= 0 ? '+' : ''}{Number(item.total_profit).toLocaleString()} {config.label}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Sales Trends (Last 30 Days)
            </CardTitle>
            <CardDescription>
              Daily revenue and profit across all users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminSalesChart data={salesTrends} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Activity (Last 30 Days)
            </CardTitle>
            <CardDescription>
              New signups and active devices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminUserActivityChart data={userActivity} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
