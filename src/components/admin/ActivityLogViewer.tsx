import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
  History, 
  Clock, 
  RefreshCw, 
  Search, 
  Filter,
  Eye,
  Shield,
  Edit,
  Trash2,
  Plus,
  Ban,
  UserX,
  AlertTriangle,
  FileSpreadsheet,
  CalendarIcon,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  User
} from 'lucide-react';
import { format, startOfDay, endOfDay, subDays, subMonths, isAfter, isBefore } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ActivityLog {
  id: string;
  admin_user_id: string;
  action_type: string;
  target_user_id: string | null;
  target_email: string | null;
  details: Record<string, unknown>;
  created_at: string;
  user_agent: string | null;
  ip_address: string | null;
}

interface UserProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

const ACTION_CONFIG: Record<string, { label: string; icon: typeof Eye; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  impersonation_start: { label: 'Started Impersonation', icon: Eye, variant: 'default' },
  impersonation_end: { label: 'Ended Impersonation', icon: Eye, variant: 'secondary' },
  impersonation_action: { label: 'Action During Impersonation', icon: AlertTriangle, variant: 'destructive' },
  role_change: { label: 'Changed Role', icon: Shield, variant: 'default' },
  role_assigned: { label: 'Assigned Role', icon: Shield, variant: 'default' },
  role_removed: { label: 'Removed Role', icon: Shield, variant: 'secondary' },
  user_blacklist: { label: 'Blacklisted User', icon: Ban, variant: 'destructive' },
  user_blacklisted: { label: 'Blacklisted User', icon: Ban, variant: 'destructive' },
  user_unblacklist: { label: 'Removed from Blacklist', icon: UserX, variant: 'secondary' },
  user_unblacklisted: { label: 'Removed from Blacklist', icon: UserX, variant: 'secondary' },
  data_modification: { label: 'Modified Data', icon: Edit, variant: 'default' },
  data_exported: { label: 'Exported Data', icon: Edit, variant: 'secondary' },
  view_as: { label: 'Viewed As User', icon: Eye, variant: 'default' },
  allowlist_added: { label: 'Added to Allowlist', icon: Plus, variant: 'default' },
  allowlist_removed: { label: 'Removed from Allowlist', icon: Trash2, variant: 'secondary' },
  category_created: { label: 'Created Category', icon: Plus, variant: 'default' },
  category_updated: { label: 'Updated Category', icon: Edit, variant: 'default' },
  category_deleted: { label: 'Deleted Category', icon: Trash2, variant: 'destructive' },
  item_created: { label: 'Created Item', icon: Plus, variant: 'default' },
  inventory_created: { label: 'Added Inventory', icon: Plus, variant: 'default' },
  inventory_updated: { label: 'Updated Inventory', icon: Edit, variant: 'default' },
  inventory_deleted: { label: 'Deleted Inventory', icon: Trash2, variant: 'destructive' },
  sale_created: { label: 'Recorded Sale', icon: Plus, variant: 'default' },
  sale_deleted: { label: 'Deleted Sale', icon: Trash2, variant: 'destructive' },
};

interface ActivityLogViewerProps {
  users: UserProfile[];
}

export function ActivityLogViewer({ users }: ActivityLogViewerProps) {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [adminFilter, setAdminFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [datePreset, setDatePreset] = useState<string>('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const fetchActivityLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      // First get total count
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const countQuery = (supabase.from('admin_activity_logs') as any)
        .select('*', { count: 'exact', head: true });
      
      const { count } = await countQuery;
      setTotalCount(count || 0);
      
      // Then fetch paginated data
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('admin_activity_logs') as any)
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setActivityLogs((data || []) as ActivityLog[]);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    fetchActivityLogs();
  }, [fetchActivityLogs]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, actionFilter, adminFilter, startDate, endDate]);

  // Apply date preset
  const applyDatePreset = useCallback((preset: string) => {
    setDatePreset(preset);
    const now = new Date();
    
    switch (preset) {
      case 'today':
        setStartDate(startOfDay(now));
        setEndDate(endOfDay(now));
        break;
      case 'yesterday': {
        const yesterday = subDays(now, 1);
        setStartDate(startOfDay(yesterday));
        setEndDate(endOfDay(yesterday));
        break;
      }
      case 'last7days':
        setStartDate(startOfDay(subDays(now, 7)));
        setEndDate(endOfDay(now));
        break;
      case 'last30days':
        setStartDate(startOfDay(subDays(now, 30)));
        setEndDate(endOfDay(now));
        break;
      case 'last3months':
        setStartDate(startOfDay(subMonths(now, 3)));
        setEndDate(endOfDay(now));
        break;
      case 'all':
      default:
        setStartDate(undefined);
        setEndDate(undefined);
        break;
    }
  }, []);

  const clearDateFilter = useCallback(() => {
    setStartDate(undefined);
    setEndDate(undefined);
    setDatePreset('all');
  }, []);

  // Get unique admin users who have performed actions
  const adminUsers = [...new Set(activityLogs.map(log => log.admin_user_id))]
    .map(id => users.find(u => u.user_id === id))
    .filter((u): u is UserProfile => u !== undefined);

  const filteredLogs = activityLogs.filter(log => {
    const matchesSearch = searchQuery === '' ||
      log.action_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(log.details).toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = actionFilter === 'all' ||
      log.action_type === actionFilter ||
      (actionFilter === 'impersonation' && log.action_type.startsWith('impersonation'));

    const matchesAdmin = adminFilter === 'all' || log.admin_user_id === adminFilter;

    const logDate = new Date(log.created_at);
    const matchesDateRange = 
      (!startDate || !isBefore(logDate, startDate)) &&
      (!endDate || !isAfter(logDate, endDate));

    return matchesSearch && matchesAction && matchesAdmin && matchesDateRange;
  });

  // Pagination calculations
  const totalPages = Math.ceil(totalCount / pageSize);
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getActionConfig = (actionType: string) => {
    return ACTION_CONFIG[actionType] || { label: actionType, icon: Edit, variant: 'outline' as const };
  };

  const formatDetails = (details: Record<string, unknown>) => {
    if (!details || Object.keys(details).length === 0) return null;
    
    const entries = Object.entries(details).filter(([key]) => !key.startsWith('_'));
    if (entries.length === 0) return null;

    return (
      <div className="text-xs text-muted-foreground mt-2 space-y-1 bg-muted/50 rounded p-2">
        {entries.map(([key, value]) => (
          <div key={key} className="flex gap-2">
            <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
            <span className="truncate">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
          </div>
        ))}
      </div>
    );
  };

  const uniqueActionTypes = [...new Set(activityLogs.map(log => log.action_type))];

  // Export logs as CSV
  const exportAsCSV = useCallback(() => {
    if (filteredLogs.length === 0) {
      toast.error('No logs to export');
      return;
    }

    const headers = [
      'Date',
      'Time',
      'Admin',
      'Admin ID',
      'Action',
      'Target User',
      'Target Email',
      'Target ID',
      'Details',
      'User Agent',
      'IP Address'
    ];

    const rows = filteredLogs.map(log => {
      const adminUser = users.find(u => u.user_id === log.admin_user_id);
      const config = getActionConfig(log.action_type);
      
      return [
        format(new Date(log.created_at), 'yyyy-MM-dd'),
        format(new Date(log.created_at), 'HH:mm:ss'),
        adminUser?.display_name || 'Unknown',
        log.admin_user_id,
        config.label,
        log.target_email || '',
        log.target_email || '',
        log.target_user_id || '',
        JSON.stringify(log.details || {}).replace(/"/g, '""'),
        (log.user_agent || '').replace(/"/g, '""'),
        log.ip_address || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-activity-logs-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${filteredLogs.length} logs to CSV`);
  }, [filteredLogs, users]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Activity Logs
            </CardTitle>
            <CardDescription>
              Track all admin actions including impersonation and data modifications
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportAsCSV} disabled={filteredLogs.length === 0}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={fetchActivityLogs} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by action, user, or details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="impersonation">All Impersonation</SelectItem>
                  <SelectItem value="impersonation_start">Impersonation Start</SelectItem>
                  <SelectItem value="impersonation_end">Impersonation End</SelectItem>
                  <SelectItem value="impersonation_action">Impersonation Actions</SelectItem>
                  <SelectItem value="role_assigned">Role Changes</SelectItem>
                  {uniqueActionTypes.filter(t => !['impersonation_start', 'impersonation_end', 'impersonation_action', 'role_assigned'].includes(t)).map(type => (
                    <SelectItem key={type} value={type}>
                      {getActionConfig(type).label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Admin User Filter */}
              <Select value={adminFilter} onValueChange={setAdminFilter}>
                <SelectTrigger className="w-48">
                  <User className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by admin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Admins</SelectItem>
                  {adminUsers.map(admin => (
                    <SelectItem key={admin.user_id} value={admin.user_id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={admin.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {(admin.display_name || 'A')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{admin.display_name || 'Unknown'}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Page Size */}
              <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active admin filter indicator */}
          {adminFilter !== 'all' && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <User className="w-3 h-3 mr-1" />
                Admin: {users.find(u => u.user_id === adminFilter)?.display_name || 'Unknown'}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAdminFilter('all')}
                  className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            </div>
          )}

          {/* Date Range Filter */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Date Range:</span>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Select value={datePreset} onValueChange={applyDatePreset}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last7days">Last 7 Days</SelectItem>
                  <SelectItem value="last30days">Last 30 Days</SelectItem>
                  <SelectItem value="last3months">Last 3 Months</SelectItem>
                </SelectContent>
              </Select>
              
              <span className="text-sm text-muted-foreground">or</span>
              
              {/* Start Date Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-[130px] justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "MMM d, yyyy") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date ? startOfDay(date) : undefined);
                      setDatePreset('custom');
                    }}
                    disabled={(date) => endDate ? isAfter(date, endDate) : false}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>

              <span className="text-sm text-muted-foreground">to</span>

              {/* End Date Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-[130px] justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "MMM d, yyyy") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date ? endOfDay(date) : undefined);
                      setDatePreset('custom');
                    }}
                    disabled={(date) => startDate ? isBefore(date, startDate) : false}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>

              {(startDate || endDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearDateFilter}
                  className="h-8 px-2"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Clear date filter</span>
                </Button>
              )}
            </div>
          </div>

          {/* Active date filter indicator */}
          {(startDate || endDate) && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <CalendarIcon className="w-3 h-3 mr-1" />
                {startDate && endDate 
                  ? `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`
                  : startDate 
                    ? `From ${format(startDate, "MMM d, yyyy")}`
                    : `Until ${format(endDate!, "MMM d, yyyy")}`
                }
              </Badge>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{activityLogs.length}</div>
            <div className="text-xs text-muted-foreground">Total Logs</div>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10">
            <div className="text-2xl font-bold text-amber-600">
              {activityLogs.filter(l => l.action_type.startsWith('impersonation')).length}
            </div>
            <div className="text-xs text-muted-foreground">Impersonation Events</div>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10">
            <div className="text-2xl font-bold text-blue-600">
              {activityLogs.filter(l => l.action_type.includes('role')).length}
            </div>
            <div className="text-xs text-muted-foreground">Role Changes</div>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10">
            <div className="text-2xl font-bold text-red-600">
              {activityLogs.filter(l => l.action_type === 'impersonation_action').length}
            </div>
            <div className="text-xs text-muted-foreground">Impersonation Actions</div>
          </div>
        </div>

        {/* Logs List */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {searchQuery || actionFilter !== 'all' ? 'No logs match your filters' : 'No activity logs yet'}
          </p>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredLogs.map((log) => {
              const adminUser = users.find(u => u.user_id === log.admin_user_id);
              const targetUser = log.target_user_id ? users.find(u => u.user_id === log.target_user_id) : null;
              const config = getActionConfig(log.action_type);
              const IconComponent = config.icon;

              return (
                <div key={log.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex-shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={adminUser?.avatar_url || undefined} />
                      <AvatarFallback>
                        {(adminUser?.display_name || 'A')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{adminUser?.display_name || 'Unknown Admin'}</span>
                      <Badge variant={config.variant} className="gap-1 text-xs">
                        <IconComponent className="w-3 h-3" />
                        {config.label}
                      </Badge>
                    </div>
                    {(targetUser || log.target_email) && (
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <span>→</span>
                        <span className="font-medium">{targetUser?.display_name || log.target_email || 'Unknown'}</span>
                      </p>
                    )}
                    {formatDetails(log.details as Record<string, unknown>)}
                  </div>
                  <div className="text-xs text-muted-foreground flex-shrink-0 text-right">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(log.created_at), 'MMM d, yyyy')}
                    </div>
                    <div className="text-muted-foreground/70">
                      {format(new Date(log.created_at), 'HH:mm:ss')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {filteredLogs.length > 0 ? ((currentPage - 1) * pageSize) + 1 : 0} - {Math.min(currentPage * pageSize, totalCount)} of {totalCount} logs
            {(searchQuery || actionFilter !== 'all' || adminFilter !== 'all' || startDate || endDate) && 
              ` (${filteredLogs.length} matching filters)`
            }
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(1)}
              disabled={!canGoPrevious || isLoading}
              className="hidden sm:flex"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={!canGoPrevious || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Previous</span>
            </Button>
            
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">Page</span>
              <Input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (!isNaN(page)) goToPage(page);
                }}
                className="w-16 h-8 text-center"
              />
              <span className="text-sm text-muted-foreground">of {totalPages || 1}</span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={!canGoNext || isLoading}
            >
              <span className="hidden sm:inline mr-1">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(totalPages)}
              disabled={!canGoNext || isLoading}
              className="hidden sm:flex"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
