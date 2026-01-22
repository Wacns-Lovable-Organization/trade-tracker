import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Smartphone,
  Monitor,
  Tablet,
  Wifi,
  WifiOff,
  Search,
  RefreshCw,
  Ban,
  Info,
  Copy,
  Check,
  LogOut,
  MoreVertical,
  Users,
  User
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface UserDevice {
  id: string;
  user_id: string;
  device_id: string;
  device_info: unknown;
  ip_address: string | null;
  user_agent: string | null;
  browser: string | null;
  os: string | null;
  device_type: string | null;
  is_online: boolean;
  last_seen_at: string;
  first_seen_at: string;
  created_at: string;
  user_name?: string;
}

interface DevicesTabProps {
  users: { user_id: string; grow_id: string | null }[];
  onBlacklistDevice: (deviceId: string) => void;
}

export function DevicesTab({ users, onBlacklistDevice }: DevicesTabProps) {
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Confirmation dialog state
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [logoutConfirmType, setLogoutConfirmType] = useState<'device' | 'user' | null>(null);
  const [logoutConfirmData, setLogoutConfirmData] = useState<{
    deviceId?: string;
    deviceName?: string;
    userId?: string;
    userName?: string;
  } | null>(null);

  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_devices')
        .select('*')
        .order('last_seen_at', { ascending: false });

      if (error) throw error;

      // Map user names to devices
      const devicesWithNames = (data || []).map(device => {
        const deviceUser = users.find(u => u.user_id === device.user_id);
        return {
          ...device,
          user_name: deviceUser?.grow_id || 'Unknown User',
        };
      });

      setDevices(devicesWithNames);
    } catch (error) {
      console.error('Failed to fetch devices:', error);
      toast.error('Failed to load devices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [users]);

  const filteredDevices = devices.filter(device => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      device.device_id.toLowerCase().includes(query) ||
      device.user_name?.toLowerCase().includes(query) ||
      device.browser?.toLowerCase().includes(query) ||
      device.os?.toLowerCase().includes(query) ||
      device.ip_address?.includes(query)
    );
  });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getDeviceIcon = (type: string | null) => {
    switch (type?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  // Show confirmation dialog for logout actions
  const confirmLogoutDevice = (deviceId: string, deviceName: string) => {
    setLogoutConfirmData({ deviceId, deviceName });
    setLogoutConfirmType('device');
    setLogoutConfirmOpen(true);
  };
  
  const confirmLogoutUserDevices = (userId: string, userName: string) => {
    setLogoutConfirmData({ userId, userName });
    setLogoutConfirmType('user');
    setLogoutConfirmOpen(true);
  };
  
  const handleConfirmLogout = async () => {
    if (!logoutConfirmData || !logoutConfirmType) return;
    
    setIsLoggingOut(true);
    try {
      if (logoutConfirmType === 'device' && logoutConfirmData.deviceId) {
        const { error } = await supabase
          .from('user_devices')
          .update({ is_online: false })
          .eq('device_id', logoutConfirmData.deviceId);
        if (error) throw error;
        toast.success(`Logged out device: ${logoutConfirmData.deviceName}`);
      } else if (logoutConfirmType === 'user' && logoutConfirmData.userId) {
        const { error } = await supabase
          .from('user_devices')
          .update({ is_online: false })
          .eq('user_id', logoutConfirmData.userId);
        if (error) throw error;
        toast.success(`Logged out all devices for: ${logoutConfirmData.userName}`);
      }
      await fetchDevices();
    } catch (error) {
      console.error('Failed to logout:', error);
      toast.error('Failed to logout');
    } finally {
      setIsLoggingOut(false);
      setLogoutConfirmOpen(false);
      setLogoutConfirmData(null);
      setLogoutConfirmType(null);
    }
  };

  // Logout all devices for all users
  const logoutAllDevices = async () => {
    setIsLoggingOut(true);
    try {
      const { error } = await supabase
        .from('user_devices')
        .update({ is_online: false })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all rows

      if (error) throw error;
      
      toast.success('Logged out all devices for all users');
      await fetchDevices();
    } catch (error) {
      console.error('Failed to logout all devices:', error);
      toast.error('Failed to logout all devices');
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              User Devices
            </CardTitle>
            <CardDescription>
              Track user devices and their online status. Copy device IDs to add to blacklist.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchDevices}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            
            {/* Bulk Logout Actions */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isLoggingOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Logout All Devices?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will mark all {devices.filter(d => d.is_online).length} online devices as offline. 
                    Users will need to refresh or re-authenticate to be tracked as online again.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={logoutAllDevices}
                    className="bg-destructive text-destructive-foreground"
                  >
                    Logout All Devices
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by device ID, user, browser, OS, or IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>
            <Wifi className="inline w-4 h-4 mr-1 text-green-500" />
            {devices.filter(d => d.is_online).length} online
          </span>
          <span>
            <WifiOff className="inline w-4 h-4 mr-1 text-muted-foreground" />
            {devices.filter(d => !d.is_online).length} offline
          </span>
          <span>Total: {devices.length} devices</span>
        </div>

        {/* Devices Table */}
        {filteredDevices.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {searchQuery ? 'No devices match your search' : 'No devices tracked yet'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          {getDeviceIcon(device.device_type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{device.browser || 'Unknown'}</span>
                            <span className="text-muted-foreground">on</span>
                            <span className="font-medium">{device.os || 'Unknown'}</span>
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {device.device_id.slice(0, 8)}...
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 ml-1"
                              onClick={() => copyToClipboard(device.device_id, device.id)}
                            >
                              {copiedId === device.id ? (
                                <Check className="w-3 h-3 text-green-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{device.user_name}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={device.is_online ? 'default' : 'secondary'}>
                        {device.is_online ? (
                          <>
                            <Wifi className="w-3 h-3 mr-1" />
                            Online
                          </>
                        ) : (
                          <>
                            <WifiOff className="w-3 h-3 mr-1" />
                            Offline
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      <Tooltip>
                        <TooltipTrigger>
                          {formatDistanceToNow(new Date(device.last_seen_at), { addSuffix: true })}
                        </TooltipTrigger>
                        <TooltipContent>
                          {format(new Date(device.last_seen_at), 'PPpp')}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Device Details Dialog */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Info className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
                            <DialogHeader>
                              <DialogTitle>Device Details</DialogTitle>
                              <DialogDescription>
                                Full information about this device
                              </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="flex-1 pr-4">
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Device ID</span>
                                    <p className="font-mono text-xs break-all">{device.device_id}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">IP Address</span>
                                    <p className="font-mono">{device.ip_address || 'Not available'}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Browser</span>
                                    <p>{device.browser || 'Unknown'}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Operating System</span>
                                    <p>{device.os || 'Unknown'}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Device Type</span>
                                    <p className="capitalize">{device.device_type || 'Unknown'}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">First Seen</span>
                                    <p>{format(new Date(device.first_seen_at), 'PPp')}</p>
                                  </div>
                                </div>
                                {device.device_info && typeof device.device_info === 'object' && Object.keys(device.device_info as object).length > 0 && (
                                  <div>
                                    <span className="text-muted-foreground text-sm">Additional Info</span>
                                    <div className="mt-1 p-3 rounded-lg bg-muted overflow-hidden">
                                      <pre className="text-xs whitespace-pre-wrap break-all overflow-x-auto max-h-48">
                                        {JSON.stringify(device.device_info, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>

                        {/* Actions Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-popover z-50">
                            {device.is_online && (
                              <DropdownMenuItem 
                                onClick={() => confirmLogoutDevice(device.device_id, `${device.browser} on ${device.os}`)}
                                disabled={isLoggingOut}
                              >
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout Device
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => confirmLogoutUserDevices(device.user_id, device.user_name || 'Unknown')}
                              disabled={isLoggingOut}
                            >
                              <User className="w-4 h-4 mr-2" />
                              Logout User's Devices
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => onBlacklistDevice(device.device_id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              Blacklist Device
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Logout Confirmation Dialog */}
        <AlertDialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {logoutConfirmType === 'device' 
                  ? 'Logout This Device?' 
                  : "Logout All User's Devices?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {logoutConfirmType === 'device' 
                  ? `This will mark "${logoutConfirmData?.deviceName}" as offline. The user will need to refresh or re-authenticate.`
                  : `This will log out all devices for "${logoutConfirmData?.userName}". They will need to re-authenticate on each device.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoggingOut}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmLogout}
                disabled={isLoggingOut}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isLoggingOut ? 'Logging out...' : 'Confirm Logout'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
