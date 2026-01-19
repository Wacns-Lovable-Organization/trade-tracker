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

// Currency conversion: 100 WL = 1 DL, 100 DL = 1 BGL
const convertToWL = (amount: number, currency: string): number => {
  switch (currency) {
    case 'BGL': return amount * 10000; // 1 BGL = 100 DL = 10000 WL
    case 'DL': return amount * 100;    // 1 DL = 100 WL
    case 'WL': return amount;
    default: return amount;
  }
};

// Convert total WL to BGL/DL/WL breakdown
const convertWLToBreakdown = (totalWL: number): { bgl: number; dl: number; wl: number } => {
  const bgl = Math.floor(totalWL / 10000);
  const remaining = totalWL % 10000;
  const dl = Math.floor(remaining / 100);
  const wl = Math.round(remaining % 100);
  return { bgl, dl, wl };
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

  // Calculate total profit by converting all currencies to WL and summing
  const totalProfitInWL = profitByCurrency.reduce((sum, item) => {
    return sum + convertToWL(Number(item.total_profit), item.currency_unit);
  }, 0);
  
  const totalRevenueInWL = profitByCurrency.reduce((sum, item) => {
    return sum + convertToWL(Number(item.total_revenue), item.currency_unit);
  }, 0);
  
  const totalSales = profitByCurrency.reduce((sum, item) => sum + item.sale_count, 0);
  
  const profitBreakdown = convertWLToBreakdown(totalProfitInWL);
  const revenueBreakdown = convertWLToBreakdown(totalRevenueInWL);

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

      {/* Total Profit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Total Profit
          </CardTitle>
          <CardDescription>
            Combined profit from all {totalSales} sales across all users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profitByCurrency.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No sales recorded yet</p>
          ) : (
            <div className="space-y-6">
              {/* Total Profit Display */}
              <div className="text-center p-6 rounded-xl bg-muted/50 border">
                <span className="text-sm text-muted-foreground block mb-2">Total Profit</span>
                <div className={`text-3xl font-bold ${totalProfitInWL >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {totalProfitInWL >= 0 ? '+' : ''}{totalProfitInWL.toLocaleString()} WL
                </div>
                <div className="flex items-center justify-center gap-3 mt-3 text-lg">
                  <span className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-600 border border-amber-500/30 font-semibold">
                    {profitBreakdown.bgl.toLocaleString()} BGL
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-600 border border-blue-500/30 font-semibold">
                    {profitBreakdown.dl} DL
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 font-semibold">
                    {profitBreakdown.wl} WL
                  </span>
                </div>
              </div>
              
              {/* Total Revenue Display */}
              <div className="text-center p-4 rounded-xl bg-muted/30 border">
                <span className="text-sm text-muted-foreground block mb-2">Total Revenue</span>
                <div className="text-xl font-bold">
                  {totalRevenueInWL.toLocaleString()} WL
                </div>
                <div className="flex items-center justify-center gap-2 mt-2 text-sm">
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600">
                    {revenueBreakdown.bgl.toLocaleString()} BGL
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600">
                    {revenueBreakdown.dl} DL
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600">
                    {revenueBreakdown.wl} WL
                  </span>
                </div>
              </div>
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
