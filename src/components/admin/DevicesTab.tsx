import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
  Check
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
  users: { user_id: string; display_name: string | null }[];
  onBlacklistDevice: (deviceId: string) => void;
}

export function DevicesTab({ users, onBlacklistDevice }: DevicesTabProps) {
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
        const user = users.find(u => u.user_id === device.user_id);
        return {
          ...device,
          user_name: user?.display_name || 'Unknown User',
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              User Devices
            </CardTitle>
            <CardDescription>
              Track user devices and their online status. Copy device IDs to add to blacklist.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchDevices}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
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
                      <div className="flex items-center justify-end gap-2">
                        {/* Device Details Dialog */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Info className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Device Details</DialogTitle>
                              <DialogDescription>
                                Full information about this device
                              </DialogDescription>
                            </DialogHeader>
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
                              {device.device_info && Object.keys(device.device_info).length > 0 && (
                                <div>
                                  <span className="text-muted-foreground text-sm">Additional Info</span>
                                  <pre className="mt-1 p-3 rounded-lg bg-muted text-xs overflow-auto max-h-48">
                                    {JSON.stringify(device.device_info, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>

                        {/* Blacklist Device Button */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onBlacklistDevice(device.device_id)}
                            >
                              <Ban className="w-4 h-4 text-destructive" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Add device to blacklist
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
