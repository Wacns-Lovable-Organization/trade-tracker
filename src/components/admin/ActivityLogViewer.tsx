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
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [limitCount, setLimitCount] = useState(50);

  const fetchActivityLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('admin_activity_logs') as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limitCount);

      if (error) throw error;
      setActivityLogs((data || []) as ActivityLog[]);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [limitCount]);

  useEffect(() => {
    fetchActivityLogs();
  }, [fetchActivityLogs]);

  const filteredLogs = activityLogs.filter(log => {
    const matchesSearch = searchQuery === '' ||
      log.action_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(log.details).toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = actionFilter === 'all' ||
      log.action_type === actionFilter ||
      (actionFilter === 'impersonation' && log.action_type.startsWith('impersonation'));

    return matchesSearch && matchesAction;
  });

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
          <Button variant="outline" size="sm" onClick={fetchActivityLogs} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
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
          <div className="flex gap-2">
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
            <Select value={String(limitCount)} onValueChange={(v) => setLimitCount(Number(v))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="250">250</SelectItem>
              </SelectContent>
            </Select>
          </div>
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

        <div className="text-sm text-muted-foreground text-center">
          Showing {filteredLogs.length} of {activityLogs.length} logs
        </div>
      </CardContent>
    </Card>
  );
}
