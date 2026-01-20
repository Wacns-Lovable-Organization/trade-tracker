import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertTriangle, Eye, Shield, Package, ShoppingCart } from 'lucide-react';
import type { AppRole } from '@/hooks/useUserRole';

const ROLE_LABELS: Record<AppRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  supervisor: 'Supervisor',
};

const ROLE_COLORS: Record<AppRole, string> = {
  owner: 'bg-amber-500/20 text-amber-600 border-amber-500/30',
  admin: 'bg-red-500/20 text-red-600 border-red-500/30',
  manager: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
  supervisor: 'bg-green-500/20 text-green-600 border-green-500/30',
};

interface UserProfile {
  user_id: string;
  grow_id: string | null;
  avatar_url: string | null;
  email?: string;
  role?: AppRole | null;
  inventoryCount?: number;
  salesCount?: number;
}

interface ImpersonationConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
  onConfirm: () => void;
}

export function ImpersonationConfirmDialog({
  open,
  onOpenChange,
  user,
  onConfirm,
}: ImpersonationConfirmDialogProps) {
  if (!user) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-amber-500" />
            Confirm Impersonation
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                You are about to impersonate this user. While impersonating, you will:
              </p>
              
              {/* User info */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback>
                    {(user.grow_id || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-foreground">
                    {user.grow_id || 'Unknown User'}
                  </div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {user.role ? (
                      <Badge variant="outline" className={`text-xs ${ROLE_COLORS[user.role]}`}>
                        <Shield className="w-3 h-3 mr-1" />
                        {ROLE_LABELS[user.role]}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">User</Badge>
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Package className="w-3 h-3" /> {user.inventoryCount || 0}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <ShoppingCart className="w-3 h-3" /> {user.salesCount || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Warnings */}
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2 text-amber-600">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>See all their data (inventory, sales, categories)</span>
                </div>
                <div className="flex items-start gap-2 text-red-600">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span><strong>Can modify</strong> their data - changes are permanent</span>
                </div>
                <div className="flex items-start gap-2 text-muted-foreground">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>All actions will be logged for audit purposes</span>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Eye className="w-4 h-4 mr-2" />
            Start Impersonation
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
