import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole, type AppRole } from '@/hooks/useUserRole';
import { useViewAs } from '@/contexts/ViewAsContext';
import { useRoleHierarchy } from '@/hooks/useRoleHierarchy';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Users, 
  Eye, 
  UserPlus, 
  Trash2, 
  Mail,
  Package,
  ShoppingCart,
  AlertCircle,
  Search,
  Download,
  History,
  Ban,
  Clock,
  Filter,
  RefreshCw,
  LayoutDashboard,
  Smartphone,
  ShieldOff,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { DevicesTab } from '@/components/admin/DevicesTab';
import { ActivityLogViewer } from '@/components/admin/ActivityLogViewer';
import { ImpersonationConfirmDialog } from '@/components/admin/ImpersonationConfirmDialog';
import { FeatureFlagsTab } from '@/components/admin/FeatureFlagsTab';
import { PageAnalyticsTab } from '@/components/admin/PageAnalyticsTab';
import { UserFeatureOverridesDialog } from '@/components/admin/UserFeatureOverridesDialog';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  email?: string;
  role?: AppRole | null;
  inventoryCount?: number;
  salesCount?: number;
}

interface AllowlistEntry {
  id: string;
  email: string;
  role: AppRole;
  created_at: string;
}

interface ActivityLog {
  id: string;
  admin_user_id: string;
  action_type: string;
  target_user_id: string | null;
  target_email: string | null;
  details: unknown;
  created_at: string;
}

interface BlacklistEntry {
  id: string;
  type: 'email' | 'ip' | 'device_id';
  value: string;
  reason: string | null;
  blocked_by: string;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
}

const ROLE_COLORS: Record<AppRole, string> = {
  owner: 'bg-amber-500/20 text-amber-600 border-amber-500/30',
  admin: 'bg-red-500/20 text-red-600 border-red-500/30',
  manager: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
  supervisor: 'bg-green-500/20 text-green-600 border-green-500/30',
};

const ROLE_LABELS: Record<AppRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  supervisor: 'Supervisor',
};

const ACTION_LABELS: Record<string, string> = {
  role_assigned: 'Assigned Role',
  role_removed: 'Removed Role',
  user_blacklisted: 'Blacklisted User',
  user_unblacklisted: 'Removed from Blacklist',
  view_as: 'Viewed As User',
  data_exported: 'Exported User Data',
  allowlist_added: 'Added to Allowlist',
  allowlist_removed: 'Removed from Allowlist',
};

const BLACKLIST_TYPE_LABELS: Record<string, string> = {
  email: 'Email',
  ip: 'IP Address',
  device_id: 'Device ID',
};

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role: currentUserRole, hasAdminAccess, isLoading: roleLoading, canManageRole } = useUserRole();
  const { setViewAsUser } = useViewAs();
  const { canImpersonate, getImpersonationBlockReason } = useRoleHierarchy();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [allowlist, setAllowlist] = useState<AllowlistEntry[]>([]);
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // Impersonation confirmation dialog state
  const [impersonationTarget, setImpersonationTarget] = useState<UserProfile | null>(null);
  const [showImpersonationConfirm, setShowImpersonationConfirm] = useState(false);
  
  // Form states
  const [newAllowlistEmail, setNewAllowlistEmail] = useState('');
  const [newAllowlistRole, setNewAllowlistRole] = useState<AppRole>('admin');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<AppRole | ''>('');
  
  // Blacklist form states
  const [blacklistType, setBlacklistType] = useState<'email' | 'ip' | 'device_id'>('email');
  const [blacklistValue, setBlacklistValue] = useState('');
  const [blacklistReason, setBlacklistReason] = useState('');
  const [blacklistExpiry, setBlacklistExpiry] = useState('');

  // Log an admin action
  const logAction = async (actionType: string, targetUserId?: string, targetEmail?: string, details?: Record<string, unknown>) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('admin_activity_logs') as any).insert({
        admin_user_id: user?.id,
        action_type: actionType,
        target_user_id: targetUserId || null,
        target_email: targetEmail || null,
        details: details || {},
      });
    } catch (error) {
      console.error('Failed to log action:', error);
    }
  };

  // Fetch all users with their profiles and roles
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Fetch roles for all users
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Fetch counts using the security definer function for each user
      const usersWithRoles: UserProfile[] = await Promise.all(
        (profiles || []).map(async (profile) => {
          const userRole = roles?.find(r => r.user_id === profile.user_id);
          
          // Use RPC to get counts bypassing RLS
          const { data: stats } = await supabase.rpc('get_admin_user_stats', {
            _user_id: profile.user_id
          });

          return {
            ...profile,
            role: userRole?.role as AppRole | undefined,
            inventoryCount: stats?.[0]?.inventory_count || 0,
            salesCount: stats?.[0]?.sales_count || 0,
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch email allowlist (owner only)
  const fetchAllowlist = async () => {
    if (currentUserRole !== 'owner') return;
    
    try {
      const { data, error } = await supabase
        .from('admin_email_allowlist')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllowlist(data || []);
    } catch (error) {
      console.error('Error fetching allowlist:', error);
    }
  };

  // Fetch blacklist
  const fetchBlacklist = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('blacklist') as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBlacklist((data || []) as BlacklistEntry[]);
    } catch (error) {
      console.error('Error fetching blacklist:', error);
    }
  };

  useEffect(() => {
    if (!roleLoading && hasAdminAccess) {
      fetchUsers();
      fetchAllowlist();
      fetchBlacklist();
    }
  }, [roleLoading, hasAdminAccess, currentUserRole]);

  // Filtered users based on search and role filter
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = searchQuery === '' || 
        user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.user_id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || 
        (roleFilter === 'none' && !user.role) ||
        user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  // Add email to allowlist
  const addToAllowlist = async () => {
    if (!newAllowlistEmail.trim()) return;

    try {
      const { error } = await supabase
        .from('admin_email_allowlist')
        .insert({
          email: newAllowlistEmail.trim().toLowerCase(),
          role: newAllowlistRole,
        });

      if (error) throw error;
      
      await logAction('allowlist_added', undefined, newAllowlistEmail.trim().toLowerCase(), { role: newAllowlistRole });
      toast.success('Email added to allowlist');
      setNewAllowlistEmail('');
      fetchAllowlist();
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err.code === '23505') {
        toast.error('Email already in allowlist');
      } else {
        toast.error('Failed to add email');
      }
    }
  };

  // Remove from allowlist
  const removeFromAllowlist = async (id: string, email: string) => {
    try {
      const { error } = await supabase
        .from('admin_email_allowlist')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await logAction('allowlist_removed', undefined, email);
      toast.success('Email removed from allowlist');
      fetchAllowlist();
    } catch (error) {
      toast.error('Failed to remove email');
    }
  };

  // Assign role to user
  const assignRole = async () => {
    if (!selectedUser || !newRole) return;

    try {
      // First remove existing role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.user_id);

      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUser.user_id,
          role: newRole,
          assigned_by: user?.id,
        });

      if (error) throw error;

      await logAction('role_assigned', selectedUser.user_id, selectedUser.display_name || undefined, { 
        new_role: newRole,
        previous_role: selectedUser.role || 'none'
      });

      toast.success(`Role updated to ${ROLE_LABELS[newRole]}`);
      setSelectedUser(null);
      setNewRole('');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  // Remove role from user
  const removeRole = async (userId: string, userName?: string) => {
    try {
      const targetUser = users.find(u => u.user_id === userId);
      
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      await logAction('role_removed', userId, userName, { previous_role: targetUser?.role });
      toast.success('Role removed');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to remove role');
    }
  };

  // View as user - opens confirmation dialog
  const handleViewAsClick = (profile: UserProfile) => {
    // Check if impersonation is allowed based on role hierarchy
    const blockReason = getImpersonationBlockReason(currentUserRole, profile.role);
    if (blockReason) {
      toast.error(blockReason);
      return;
    }
    
    setImpersonationTarget(profile);
    setShowImpersonationConfirm(true);
  };

  // Confirm impersonation and start
  const confirmImpersonation = () => {
    if (!impersonationTarget) return;
    
    logAction('view_as', impersonationTarget.user_id, impersonationTarget.display_name || undefined);
    setViewAsUser({
      id: impersonationTarget.user_id,
      email: impersonationTarget.email || impersonationTarget.display_name || 'User',
      displayName: impersonationTarget.display_name,
    });
    toast.success(`Now impersonating ${impersonationTarget.display_name || impersonationTarget.email || 'User'} - you can browse and edit their data`);
    setShowImpersonationConfirm(false);
    setImpersonationTarget(null);
    navigate('/');
  };

  // Export user data
  const exportUserData = async (profile: UserProfile) => {
    try {
      toast.loading('Exporting user data...');
      
      // Fetch all user data
      const [inventoryRes, salesRes, categoriesRes, itemsRes] = await Promise.all([
        supabase.from('inventory_entries').select('*').eq('user_id', profile.user_id),
        supabase.from('sales').select('*').eq('user_id', profile.user_id),
        supabase.from('categories').select('*').eq('user_id', profile.user_id),
        supabase.from('items').select('*').eq('user_id', profile.user_id),
      ]);

      const exportData = {
        user: {
          id: profile.user_id,
          display_name: profile.display_name,
          email: profile.email,
          role: profile.role,
        },
        categories: categoriesRes.data || [],
        items: itemsRes.data || [],
        inventory_entries: inventoryRes.data || [],
        sales: salesRes.data || [],
        exported_at: new Date().toISOString(),
        exported_by: user?.id,
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-${profile.display_name || profile.user_id}-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      await logAction('data_exported', profile.user_id, profile.display_name || undefined);
      toast.dismiss();
      toast.success('User data exported successfully');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to export user data');
    }
  };

  // Add to blacklist
  const addToBlacklist = async () => {
    if (!blacklistValue.trim()) {
      toast.error('Please enter a value to blacklist');
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('blacklist') as any).insert({
        type: blacklistType,
        value: blacklistValue.trim().toLowerCase(),
        reason: blacklistReason.trim() || null,
        blocked_by: user?.id,
        expires_at: blacklistExpiry ? new Date(blacklistExpiry).toISOString() : null,
      });

      if (error) throw error;

      await logAction('user_blacklisted', undefined, blacklistValue.trim().toLowerCase(), {
        type: blacklistType,
        reason: blacklistReason,
        expires_at: blacklistExpiry || 'never',
      });

      toast.success(`${BLACKLIST_TYPE_LABELS[blacklistType]} added to blacklist`);
      setBlacklistValue('');
      setBlacklistReason('');
      setBlacklistExpiry('');
      fetchBlacklist();
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err.code === '23505') {
        toast.error('This value is already blacklisted');
      } else {
        toast.error('Failed to add to blacklist');
      }
    }
  };

  // Remove from blacklist
  const removeFromBlacklist = async (entry: BlacklistEntry) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('blacklist') as any)
        .delete()
        .eq('id', entry.id);

      if (error) throw error;

      await logAction('user_unblacklisted', undefined, entry.value, { type: entry.type });
      toast.success('Removed from blacklist');
      fetchBlacklist();
    } catch (error) {
      toast.error('Failed to remove from blacklist');
    }
  };

  // Toggle blacklist active status
  const toggleBlacklistActive = async (entry: BlacklistEntry) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('blacklist') as any)
        .update({ is_active: !entry.is_active })
        .eq('id', entry.id);

      if (error) throw error;

      toast.success(entry.is_active ? 'Blacklist entry deactivated' : 'Blacklist entry activated');
      fetchBlacklist();
    } catch (error) {
      toast.error('Failed to update blacklist entry');
    }
  };

  // Check if current user can manage users (owner or admin)
  const canManageUsers = currentUserRole === 'owner' || currentUserRole === 'admin';

  // Show loading or access denied
  if (roleLoading) {
    return (
      <div>
        <PageHeader title="Admin Panel" description="Manage users and permissions" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return (
      <div>
        <PageHeader title="Admin Panel" description="Manage users and permissions" />
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 text-destructive">
              <AlertCircle className="w-8 h-8" />
              <div>
                <h3 className="font-semibold">Access Denied</h3>
                <p className="text-sm text-muted-foreground">
                  You don't have permission to access the admin panel.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Admin Panel"
        description="Manage users, roles, and permissions"
      >
        <Badge variant="outline" className={ROLE_COLORS[currentUserRole!]}>
          <Shield className="w-3 h-3 mr-1" />
          {ROLE_LABELS[currentUserRole!]}
        </Badge>
      </PageHeader>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="dashboard" className="gap-2">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="devices" className="gap-2">
            <Smartphone className="w-4 h-4" />
            Devices
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <History className="w-4 h-4" />
            Activity Logs
          </TabsTrigger>
          {canManageUsers && (
            <TabsTrigger value="blacklist" className="gap-2">
              <Ban className="w-4 h-4" />
              Blacklist
            </TabsTrigger>
          )}
          {canManageUsers && (
            <TabsTrigger value="features" className="gap-2">
              <Settings className="w-4 h-4" />
              Features
            </TabsTrigger>
          )}
          {currentUserRole === 'owner' && (
            <TabsTrigger value="allowlist" className="gap-2">
              <Mail className="w-4 h-4" />
              Email Allowlist
            </TabsTrigger>
          )}
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard">
          <AdminDashboard />
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                All Users
              </CardTitle>
              <CardDescription>
                View and manage user accounts and their data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-36">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="none">No Role</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={fetchUsers}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Users Table */}
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {searchQuery || roleFilter !== 'all' ? 'No users match your filters' : 'No users found'}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-center">Inventory</TableHead>
                        <TableHead className="text-center">Sales</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((profile) => (
                        <TableRow key={profile.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={profile.avatar_url || undefined} />
                                <AvatarFallback>
                                  {(profile.display_name || 'U')[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {profile.display_name || 'Unnamed User'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {profile.user_id === user?.id && '(You)'}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {profile.role ? (
                              <Badge variant="outline" className={ROLE_COLORS[profile.role]}>
                                {ROLE_LABELS[profile.role]}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">User</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Package className="w-4 h-4 text-muted-foreground" />
                              {profile.inventoryCount}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                              {profile.salesCount}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2 flex-wrap">
                              {/* Export Data Button */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => exportUserData(profile)}
                                className="gap-1"
                              >
                                <Download className="w-4 h-4" />
                                Export
                              </Button>

                              {/* View As Button */}
                              {profile.user_id !== user?.id && (
                                (() => {
                                  const blockReason = getImpersonationBlockReason(currentUserRole, profile.role);
                                  return blockReason ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="gap-1 opacity-50 cursor-not-allowed"
                                          disabled
                                        >
                                          <ShieldOff className="w-4 h-4" />
                                          View As
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>{blockReason}</TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleViewAsClick(profile)}
                                      className="gap-1"
                                    >
                                      <Eye className="w-4 h-4" />
                                      View As
                                    </Button>
                                  );
                                })()
                              )}

                              {/* Role Management */}
                              {profile.user_id !== user?.id && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedUser(profile);
                                        setNewRole(profile.role || '');
                                      }}
                                      className="gap-1"
                                    >
                                      <Shield className="w-4 h-4" />
                                      Role
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Manage Role</DialogTitle>
                                      <DialogDescription>
                                        Assign or change role for {profile.display_name || 'this user'}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                      <div className="space-y-2">
                                        <Label>Role</Label>
                                        <Select
                                          value={newRole}
                                          onValueChange={(v) => setNewRole(v as AppRole)}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select role" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {currentUserRole === 'owner' && (
                                              <>
                                                <SelectItem value="admin">Admin</SelectItem>
                                                <SelectItem value="manager">Manager</SelectItem>
                                                <SelectItem value="supervisor">Supervisor</SelectItem>
                                              </>
                                            )}
                                            {currentUserRole === 'admin' && (
                                              <>
                                                <SelectItem value="manager">Manager</SelectItem>
                                                <SelectItem value="supervisor">Supervisor</SelectItem>
                                              </>
                                            )}
                                            {currentUserRole === 'manager' && (
                                              <SelectItem value="supervisor">Supervisor</SelectItem>
                                            )}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                    <DialogFooter className="gap-2">
                                      {profile.role && (
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm">
                                              Remove Role
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Remove Role</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                This will remove admin access for this user. They will become a regular user.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction
                                                onClick={() => {
                                                  removeRole(profile.user_id, profile.display_name || undefined);
                                                  setSelectedUser(null);
                                                }}
                                              >
                                                Remove
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      )}
                                      <Button onClick={assignRole} disabled={!newRole}>
                                        Save Role
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              <div className="text-sm text-muted-foreground">
                Showing {filteredUsers.length} of {users.length} users
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices">
          <DevicesTab 
            users={users.map(u => ({ user_id: u.user_id, display_name: u.display_name }))}
            onBlacklistDevice={(deviceId) => {
              setBlacklistType('device_id');
              setBlacklistValue(deviceId);
              // Switch to blacklist tab
              const tabsElement = document.querySelector('[value="blacklist"]');
              if (tabsElement instanceof HTMLElement) tabsElement.click();
            }}
          />
        </TabsContent>

        {/* Activity Logs Tab */}
        <TabsContent value="activity">
          <ActivityLogViewer users={users.map(u => ({ user_id: u.user_id, display_name: u.display_name, avatar_url: u.avatar_url }))} />
        </TabsContent>

        {/* Blacklist Tab */}
        {canManageUsers && (
          <TabsContent value="blacklist">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ban className="w-5 h-5" />
                  Blacklist Management
                </CardTitle>
                <CardDescription>
                  Block users by email, IP address, or device ID
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add to blacklist form */}
                <div className="space-y-4 p-4 rounded-lg border bg-muted/50">
                  <h4 className="font-medium">Add to Blacklist</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={blacklistType} onValueChange={(v) => setBlacklistType(v as typeof blacklistType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email Address</SelectItem>
                          <SelectItem value="ip">IP Address</SelectItem>
                          <SelectItem value="device_id">Device ID</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Value</Label>
                      <Input
                        placeholder={blacklistType === 'email' ? 'user@example.com' : blacklistType === 'ip' ? '192.168.1.1' : 'device-uuid'}
                        value={blacklistValue}
                        onChange={(e) => setBlacklistValue(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Reason (optional)</Label>
                      <Textarea
                        placeholder="Reason for blacklisting..."
                        value={blacklistReason}
                        onChange={(e) => setBlacklistReason(e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Expires (optional)</Label>
                      <Input
                        type="datetime-local"
                        value={blacklistExpiry}
                        onChange={(e) => setBlacklistExpiry(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button onClick={addToBlacklist} className="gap-2">
                    <Ban className="w-4 h-4" />
                    Add to Blacklist
                  </Button>
                </div>

                {/* Blacklist table */}
                {blacklist.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No blacklist entries yet
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {blacklist.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <Badge variant="outline">{BLACKLIST_TYPE_LABELS[entry.type]}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{entry.value}</TableCell>
                          <TableCell className="max-w-xs truncate">{entry.reason || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={entry.is_active ? 'destructive' : 'secondary'}>
                              {entry.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {entry.expires_at ? format(new Date(entry.expires_at), 'MMM d, yyyy') : 'Never'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleBlacklistActive(entry)}
                              >
                                {entry.is_active ? 'Deactivate' : 'Activate'}
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove from Blacklist</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently remove this entry from the blacklist.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => removeFromBlacklist(entry)}>
                                      Remove
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Email Allowlist Tab (Owner only) */}
        {currentUserRole === 'owner' && (
          <TabsContent value="allowlist">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Allowlist
                </CardTitle>
                <CardDescription>
                  Emails in this list will automatically be assigned a role when they sign up
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add new email */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={newAllowlistEmail}
                      onChange={(e) => setNewAllowlistEmail(e.target.value)}
                    />
                  </div>
                  <Select
                    value={newAllowlistRole}
                    onValueChange={(v) => setNewAllowlistRole(v as AppRole)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={addToAllowlist} className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    Add
                  </Button>
                </div>

                {/* Allowlist table */}
                {allowlist.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No emails in allowlist. Add an email to automatically assign roles on signup.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Added</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allowlist.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{entry.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={ROLE_COLORS[entry.role]}>
                              {ROLE_LABELS[entry.role]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(entry.created_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromAllowlist(entry.id, entry.email)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Feature Flags Tab */}
        {canManageUsers && (
          <TabsContent value="features">
            <FeatureFlagsTab />
          </TabsContent>
        )}
      </Tabs>

      {/* Impersonation Confirmation Dialog */}
      <ImpersonationConfirmDialog
        open={showImpersonationConfirm}
        onOpenChange={setShowImpersonationConfirm}
        user={impersonationTarget}
        onConfirm={confirmImpersonation}
      />
    </div>
  );
}
