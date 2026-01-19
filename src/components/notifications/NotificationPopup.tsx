import { useEffect } from 'react';
import { format } from 'date-fns';
import { X, Bell } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';

export function NotificationPopup() {
  const { latestPopup, markPopupAsShown, markAsRead } = useNotifications();

  const handleClose = async () => {
    if (latestPopup) {
      await markPopupAsShown(latestPopup.id);
      await markAsRead(latestPopup.id);
    }
  };

  const getSenderLabel = () => {
    if (!latestPopup) return '';
    if (latestPopup.is_anonymous) return 'System';
    return latestPopup.sender_display_name || 'Admin';
  };

  if (!latestPopup) return null;

  return (
    <Dialog open={!!latestPopup} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle>{latestPopup.title}</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                From: {getSenderLabel()} • {format(new Date(latestPopup.created_at), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          </div>
        </DialogHeader>
        <div className="mt-2">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {latestPopup.content}
          </p>
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={handleClose}>
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
