import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole, type AppRole } from '@/hooks/useUserRole';
import { useViewAs } from '@/contexts/ViewAsContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

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

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role: currentUserRole, hasAdminAccess, isLoading: roleLoading, canManageRole } = useUserRole();
  const { setViewAsUser } = useViewAs();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [allowlist, setAllowlist] = useState<AllowlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newAllowlistEmail, setNewAllowlistEmail] = useState('');
  const [newAllowlistRole, setNewAllowlistRole] = useState<AppRole>('admin');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<AppRole | ''>('');

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

      // Fetch inventory counts
      const { data: inventoryCounts, error: invError } = await supabase
        .from('inventory_entries')
        .select('user_id');

      // Fetch sales counts
      const { data: salesCounts, error: salesError } = await supabase
        .from('sales')
        .select('user_id');

      // Map profiles with roles and counts
      const usersWithRoles: UserProfile[] = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        const invCount = inventoryCounts?.filter(i => i.user_id === profile.user_id).length || 0;
        const saleCount = salesCounts?.filter(s => s.user_id === profile.user_id).length || 0;

        return {
          ...profile,
          role: userRole?.role as AppRole | undefined,
          inventoryCount: invCount,
          salesCount: saleCount,
        };
      });

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

  useEffect(() => {
    if (!roleLoading && hasAdminAccess) {
      fetchUsers();
      fetchAllowlist();
    }
  }, [roleLoading, hasAdminAccess, currentUserRole]);

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
      
      toast.success('Email added to allowlist');
      setNewAllowlistEmail('');
      fetchAllowlist();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Email already in allowlist');
      } else {
        toast.error('Failed to add email');
      }
    }
  };

  // Remove from allowlist
  const removeFromAllowlist = async (id: string) => {
    try {
      const { error } = await supabase
        .from('admin_email_allowlist')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
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

      toast.success(`Role updated to ${ROLE_LABELS[newRole]}`);
      setSelectedUser(null);
      setNewRole('');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  // Remove role from user
  const removeRole = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Role removed');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to remove role');
    }
  };

  // View as user
  const handleViewAs = (profile: UserProfile) => {
    setViewAsUser({
      id: profile.user_id,
      email: profile.display_name || 'User',
      displayName: profile.display_name,
    });
    toast.success(`Viewing as ${profile.display_name || 'User'}`);
    navigate('/');
  };

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

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          {currentUserRole === 'owner' && (
            <TabsTrigger value="allowlist" className="gap-2">
              <Mail className="w-4 h-4" />
              Email Allowlist
            </TabsTrigger>
          )}
        </TabsList>

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
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : users.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No users found</p>
              ) : (
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
                    {users.map((profile) => (
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
                          <div className="flex items-center justify-end gap-2">
                            {/* View As Button */}
                            {profile.user_id !== user?.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewAs(profile)}
                                className="gap-1"
                              >
                                <Eye className="w-4 h-4" />
                                View As
                              </Button>
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
                                                removeRole(profile.user_id);
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
                            {new Date(entry.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromAllowlist(entry.id)}
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
      </Tabs>
    </div>
  );
}
