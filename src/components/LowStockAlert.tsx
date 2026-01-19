import { useState } from 'react';
import { useLowStockAlerts } from '@/hooks/useLowStockAlerts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, AlertTriangle, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export function LowStockAlert() {
  const { lowStockItems, hasNewAlerts, dismissNewAlerts, alertCount } = useLowStockAlerts();
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (open && hasNewAlerts) {
      dismissNewAlerts();
    }
  };

  if (alertCount === 0) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'relative h-9 w-9',
            hasNewAlerts && 'animate-pulse'
          )}
        >
          <Bell className="h-4 w-4" />
          {alertCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {alertCount > 9 ? '9+' : alertCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center gap-2 p-4 border-b">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <h4 className="font-semibold">Low Stock Alerts</h4>
        </div>
        <ScrollArea className="h-[300px]">
          <div className="p-2 space-y-1">
            {lowStockItems.map((item) => (
              <Link
                key={item.itemId}
                to="/inventory"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-md bg-destructive/10 flex items-center justify-center">
                  <Package className="h-4 w-4 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.itemName}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.categoryName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-destructive font-semibold">
                    {item.remainingQty}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    / {item.threshold}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </ScrollArea>
        <div className="p-2 border-t">
          <Link to="/settings" onClick={() => setIsOpen(false)}>
            <Button variant="ghost" size="sm" className="w-full">
              Configure Alerts
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
