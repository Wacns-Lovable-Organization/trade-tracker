import { useState } from 'react';
import { useTradeRatings } from '@/hooks/useTradeRatings';
import { RatingBadge, RateDialog } from '@/components/ratings/RatingComponents';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';

interface SupplierRatingProps {
  growId: string;
  ratedType: 'supplier' | 'buyer';
}

export function SupplierRatingInline({ growId, ratedType }: SupplierRatingProps) {
  const { summary } = useTradeRatings(growId, ratedType);
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 gap-1"
        onClick={() => setShowDialog(true)}
      >
        {summary.count > 0 ? (
          <RatingBadge summary={summary} />
        ) : (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Star className="w-3 h-3" />
            Rate
          </span>
        )}
      </Button>
      <RateDialog
        growId={growId}
        ratedType={ratedType}
        open={showDialog}
        onOpenChange={setShowDialog}
      />
    </>
  );
}
