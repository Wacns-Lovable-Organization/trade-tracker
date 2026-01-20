import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
} from '@/components/ui/alert-dialog';
import { RotateCcw, Search, Users, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  user_id: string;
  grow_id: string | null;
  avatar_url: string | null;
  inventoryCount?: number;
  salesCount?: number;
}

interface ResetProgressDialogProps {
  users: UserProfile[];
  onResetComplete: () => void;
  logAction: (actionType: string, targetUserId?: string, targetEmail?: string, details?: Record<string, unknown>) => Promise<void>;
}

interface ResetResult {
  sales: number;
  inventory_entries: number;
  items: number;
  categories: number;
  expenses: number;
  users_affected: number;
}

export function ResetProgressDialog({ users, onResetComplete, logAction }: ResetProgressDialogProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetMode, setResetMode] = useState<'selected' | 'all'>('selected');

  // Filter out current user and filter by search
  const selectableUsers = users.filter(u => 
    u.user_id !== user?.id &&
    (searchQuery === '' || 
      u.grow_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.user_id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleUser = (userId: string) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const selectAll = () => {
    const allIds = new Set(selectableUsers.map(u => u.user_id));
    setSelectedUserIds(allIds);
  };

  const deselectAll = () => {
    setSelectedUserIds(new Set());
  };

  const handleResetClick = (mode: 'selected' | 'all') => {
    setResetMode(mode);
    setShowConfirm(true);
  };

  const executeReset = async () => {
    setIsResetting(true);
    setShowConfirm(false);

    try {
      let userIdsToReset: string[];
      
      if (resetMode === 'all') {
        // Reset all users except current admin
        userIdsToReset = users
          .filter(u => u.user_id !== user?.id)
          .map(u => u.user_id);
      } else {
        userIdsToReset = Array.from(selectedUserIds);
      }

      if (userIdsToReset.length === 0) {
        toast.error('No users selected');
        setIsResetting(false);
        return;
      }

      const { data, error } = await supabase.rpc('reset_user_progress', {
        _user_ids: userIdsToReset
      });

      if (error) throw error;

      const result = data as unknown as ResetResult;

      // Log the action
      await logAction('progress_reset', undefined, undefined, {
        users_affected: result.users_affected,
        sales_deleted: result.sales,
        inventory_deleted: result.inventory_entries,
        items_deleted: result.items,
        categories_deleted: result.categories,
        expenses_deleted: result.expenses,
        reset_mode: resetMode,
        target_user_ids: userIdsToReset,
      });

      toast.success(
        `Reset complete: ${result.users_affected} user(s) affected. ` +
        `Deleted ${result.sales} sales, ${result.inventory_entries} inventory entries, ` +
        `${result.items} items, ${result.categories} categories, ${result.expenses} expenses.`
      );

      setSelectedUserIds(new Set());
      setIsOpen(false);
      onResetComplete();
    } catch (error) {
      console.error('Reset failed:', error);
      toast.error('Failed to reset user progress');
    } finally {
      setIsResetting(false);
    }
  };

  const selectedCount = selectedUserIds.size;
  const allUsersCount = users.filter(u => u.user_id !== user?.id).length;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset Progress
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              Reset User Progress
            </DialogTitle>
            <DialogDescription>
              This will permanently delete all inventory, sales, items, categories, and expenses for the selected users. User accounts and profiles will remain intact.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Selection controls */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {selectedCount} of {allUsersCount} users selected
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  Deselect All
                </Button>
              </div>
            </div>

            {/* User list */}
            <ScrollArea className="h-[300px] border rounded-lg">
              <div className="p-2 space-y-1">
                {selectableUsers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {searchQuery ? 'No users match your search' : 'No other users available'}
                  </p>
                ) : (
                  selectableUsers.map((profile) => (
                    <div
                      key={profile.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedUserIds.has(profile.user_id) 
                          ? 'bg-destructive/10 border border-destructive/30' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => toggleUser(profile.user_id)}
                    >
                      <Checkbox
                        checked={selectedUserIds.has(profile.user_id)}
                        onCheckedChange={() => toggleUser(profile.user_id)}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback>
                          {(profile.grow_id || 'U')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {profile.grow_id || 'Unknown User'}
                        </div>
                        <div className="text-xs text-muted-foreground flex gap-3">
                          <span>{profile.inventoryCount || 0} inventory</span>
                          <span>{profile.salesCount || 0} sales</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleResetClick('selected')}
              disabled={selectedCount === 0 || isResetting}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Selected ({selectedCount})
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleResetClick('all')}
              disabled={allUsersCount === 0 || isResetting}
              className="gap-2"
            >
              <Users className="w-4 h-4" />
              Reset All Users ({allUsersCount})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Confirm Reset
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to <strong>permanently delete all progress data</strong> for{' '}
                <strong>
                  {resetMode === 'all' 
                    ? `${allUsersCount} users` 
                    : `${selectedCount} selected user(s)`}
                </strong>.
              </p>
              <p>This includes:</p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                <li>All sales records</li>
                <li>All inventory entries</li>
                <li>All items</li>
                <li>All categories</li>
                <li>All expenses</li>
              </ul>
              <p className="font-semibold text-destructive mt-4">
                This action cannot be undone!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeReset}
              disabled={isResetting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isResetting ? 'Resetting...' : 'Yes, Reset Progress'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
