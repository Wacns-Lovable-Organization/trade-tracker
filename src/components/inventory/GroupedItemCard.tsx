import { Card, CardContent } from '@/components/ui/card';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { ChevronRight, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CurrencyUnit } from '@/types/inventory';

export interface GroupedItem {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  remainingQty: number;
  totalPurchasedQty: number;
  lifetimeTotalCost: number;
  currency: CurrencyUnit | null;
}

interface GroupedItemCardProps {
  item: GroupedItem;
  onClick: () => void;
  selected?: boolean;
  showArrow?: boolean;
  className?: string;
}

export function GroupedItemCard({ item, onClick, selected, showArrow = false, className }: GroupedItemCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-default hover-lift',
        selected && 'border-primary bg-primary/5',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Package className="w-5 h-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{item.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
              <span>{item.categoryName}</span>
            </div>
          </div>

          <div className="text-right">
            <div className="font-mono font-semibold text-lg">
              {item.remainingQty} <span className="text-muted-foreground text-sm font-normal">of {item.totalPurchasedQty}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              <CurrencyDisplay 
                amount={item.lifetimeTotalCost} 
                currency={item.currency} 
                size="sm"
              />
              {' total cost'}
            </div>
          </div>

          {showArrow && (
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
