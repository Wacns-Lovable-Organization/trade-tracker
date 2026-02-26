import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useTradeRatings, RatingSummary } from '@/hooks/useTradeRatings';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// Star rating display component
export function StarRating({ rating, size = 'sm', interactive = false, onChange }: {
  rating: number;
  size?: 'sm' | 'md';
  interactive?: boolean;
  onChange?: (r: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const sizeClass = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={cn(
            sizeClass,
            'transition-colors',
            interactive && 'cursor-pointer',
            (hovered || rating) >= i
              ? 'fill-yellow-500 text-yellow-500'
              : 'text-muted-foreground/30'
          )}
          onMouseEnter={() => interactive && setHovered(i)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onChange?.(i)}
        />
      ))}
    </div>
  );
}

// Compact rating badge for supplier/buyer cards
export function RatingBadge({ summary }: { summary: RatingSummary }) {
  if (summary.count === 0) return null;

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
      <span className="font-medium text-foreground">{summary.average.toFixed(1)}</span>
      <span>({summary.count})</span>
    </div>
  );
}

// Full rating dialog for submitting reviews
export function RateDialog({ growId, ratedType, open, onOpenChange }: {
  growId: string;
  ratedType: 'supplier' | 'buyer';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { summary, userRating, submitRating, deleteRating, ratings } = useTradeRatings(growId, ratedType);
  const [selectedRating, setSelectedRating] = useState(userRating?.rating || 0);
  const [comment, setComment] = useState(userRating?.comment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (selectedRating === 0) return;
    setIsSubmitting(true);
    try {
      await submitRating(selectedRating, comment);
      toast.success(userRating ? 'Rating updated' : 'Rating submitted');
      onOpenChange(false);
    } catch {
      toast.error('Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await deleteRating();
      toast.success('Rating removed');
      setSelectedRating(0);
      setComment('');
      onOpenChange(false);
    } catch {
      toast.error('Failed to remove rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate {growId}</DialogTitle>
          <DialogDescription>
            Share your experience with this {ratedType}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          {summary.count > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <StarRating rating={Math.round(summary.average)} />
              <span className="text-sm font-medium">{summary.average.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({summary.count} review{summary.count !== 1 ? 's' : ''})</span>
            </div>
          )}

          {/* Your rating */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Your Rating</p>
            <StarRating rating={selectedRating} size="md" interactive onChange={setSelectedRating} />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Comment (optional)</p>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was your experience?"
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Recent reviews */}
          {ratings.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Recent Reviews</p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {ratings.slice(0, 5).map(r => (
                  <div key={r.id} className="flex items-start gap-2 text-sm p-2 rounded bg-muted/50">
                    <StarRating rating={r.rating} />
                    {r.comment && <p className="text-muted-foreground flex-1">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {userRating && (
            <Button variant="outline" onClick={handleDelete} disabled={isSubmitting} className="text-destructive">
              Remove
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={isSubmitting || selectedRating === 0}>
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {userRating ? 'Update' : 'Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
