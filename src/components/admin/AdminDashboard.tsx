import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  Activity, 
  Wifi,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { AdminSalesChart } from './AdminSalesChart';
import { AdminUserActivityChart } from './AdminUserActivityChart';

interface DashboardStats {
  total_users: number;
  active_users: number;
  total_inventory: number;
  total_sales: number;
  total_revenue: number;
  online_users: number;
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

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [salesTrends, setSalesTrends] = useState<SalesTrend[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch all dashboard data in parallel
      const [statsRes, salesRes, activityRes] = await Promise.all([
        supabase.rpc('get_admin_dashboard_stats'),
        supabase.rpc('get_admin_sales_trends'),
        supabase.rpc('get_admin_user_activity'),
      ]);

      if (statsRes.data && statsRes.data[0]) {
        setStats(statsRes.data[0] as DashboardStats);
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
        <StatCard
          title="Total Revenue"
          value={`₱${(stats?.total_revenue || 0).toLocaleString()}`}
          icon={DollarSign}
          subtitle="Combined revenue from all sales"
          className="border-amber-500/30"
        />
      </div>

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
