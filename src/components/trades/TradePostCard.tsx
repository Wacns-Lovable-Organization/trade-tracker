import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { TradePost } from '@/hooks/useTradePosts';
import { CheckCircle, MapPin, Trash2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TradePostCardProps {
  post: TradePost;
  onMarkFulfilled: (id: string) => void;
  onDelete: (id: string) => void;
}

const postTypeConfig = {
  WTB: { label: 'Want to Buy', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  WTS: { label: 'Want to Sell', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  WTT: { label: 'Want to Trade', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
};

export function TradePostCard({ post, onMarkFulfilled, onDelete }: TradePostCardProps) {
  const { user } = useAuth();
  const isOwner = user?.id === post.user_id;
  const config = postTypeConfig[post.post_type];
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={config.className}>
                {config.label}
              </Badge>
              <span className="font-semibold text-foreground">{post.item_name}</span>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              {post.quantity && (
                <span>Qty: <span className="text-foreground font-medium">{post.quantity}</span></span>
              )}
              {post.price_per_unit && (
                <span>
                  Price: <span className="text-foreground font-medium">{post.price_per_unit}</span>
                  <span className={`ml-1 px-1 py-0.5 text-xs font-mono rounded currency-${post.currency_unit.toLowerCase()}`}>
                    {post.currency_unit}
                  </span>
                  /ea
                </span>
              )}
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {post.world}
              </span>
            </div>

            {post.description && (
              <p className="text-sm text-muted-foreground">{post.description}</p>
            )}

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">{post.grow_id}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeAgo}
              </span>
            </div>
          </div>

          {isOwner && (
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:text-green-400" onClick={() => onMarkFulfilled(post.id)}>
                <CheckCircle className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(post.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
