import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BarChart3, Eye, Users, Clock, RefreshCw, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PageAnalyticsSummary {
  page_path: string;
  page_title: string;
  view_count: number;
  unique_users: number;
  avg_duration_ms: number | null;
}

export function PageAnalyticsTab() {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState<PageAnalyticsSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_page_analytics_summary', {
        _days: parseInt(dateRange)
      });

      if (error) throw error;
      setAnalytics(data || []);
    } catch (error) {
      console.error('Error fetching page analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const totalViews = analytics.reduce((sum, a) => sum + (Number(a.view_count) || 0), 0);
  const totalUniqueUsers = analytics.reduce((sum, a) => sum + (Number(a.unique_users) || 0), 0);
  const avgDuration = analytics.length > 0
    ? analytics.reduce((sum, a) => sum + (Number(a.avg_duration_ms) || 0), 0) / analytics.length
    : 0;

  // Chart data - top 10 pages
  const chartData = analytics.slice(0, 10).map(a => ({
    name: a.page_title || a.page_path,
    views: Number(a.view_count) || 0,
    users: Number(a.unique_users) || 0,
  }));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.totalPageViews', 'Total Page Views')}</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {t('admin.lastDays', 'Last {{days}} days', { days: dateRange })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.uniqueVisitors', 'Unique Visitors')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUniqueUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {t('admin.acrossAllPages', 'Across all pages')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.avgTimeOnPage', 'Avg. Time on Page')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(avgDuration)}</div>
            <p className="text-xs text-muted-foreground">
              {t('admin.averageAcrossPages', 'Average across all pages')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {t('admin.topPages', 'Top Pages')}
            </CardTitle>
            <CardDescription>
              {t('admin.mostVisitedPages', 'Most visited pages by view count')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs fill-muted-foreground" />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={120}
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 11 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    color: 'hsl(var(--popover-foreground))'
                  }}
                />
                <Bar dataKey="views" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Page Views" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Detailed Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {t('admin.pageAnalytics', 'Page Analytics')}
            </CardTitle>
            <CardDescription>
              {t('admin.pageAnalyticsDescription', 'Track page views and user engagement across your application')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">{t('admin.last7Days', 'Last 7 days')}</SelectItem>
                <SelectItem value="30">{t('admin.last30Days', 'Last 30 days')}</SelectItem>
                <SelectItem value="90">{t('admin.last90Days', 'Last 90 days')}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchAnalytics}
              aria-label={t('common.refresh', 'Refresh')}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {analytics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('admin.noAnalyticsData', 'No analytics data available yet')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.page', 'Page')}</TableHead>
                    <TableHead className="text-right">{t('admin.views', 'Views')}</TableHead>
                    <TableHead className="text-right">{t('admin.uniqueUsers', 'Unique Users')}</TableHead>
                    <TableHead className="text-right">{t('admin.avgDuration', 'Avg. Duration')}</TableHead>
                    <TableHead className="text-right">{t('admin.engagement', 'Engagement')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.map((page, index) => {
                    const engagementRate = page.unique_users && page.view_count
                      ? ((Number(page.unique_users) / Number(page.view_count)) * 100).toFixed(0)
                      : '0';
                    
                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{page.page_title || 'Unknown'}</div>
                            <code className="text-xs text-muted-foreground">{page.page_path}</code>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {Number(page.view_count).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {Number(page.unique_users).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatDuration(page.avg_duration_ms)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={Number(engagementRate) > 50 ? 'default' : 'secondary'}>
                            {engagementRate}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
