import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTradePosts } from '@/hooks/useTradePosts';
import { usePriceAlerts } from '@/hooks/usePriceAlerts';
import { useDiscordWebhook } from '@/hooks/useDiscordWebhook';
import { TradePostCard } from '@/components/trades/TradePostCard';
import { CreateTradePostDialog } from '@/components/trades/CreateTradePostDialog';
import { PriceAlertPanel } from '@/components/trades/PriceAlertPanel';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, Loader2, Megaphone } from 'lucide-react';
import { toast } from 'sonner';

export default function TradeBoard() {
  const { user } = useAuth();
  const { posts, isLoading, createPost, markFulfilled, deletePost } = useTradePosts();
  const { checkAlerts } = usePriceAlerts();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Check price alerts when posts change
  useEffect(() => {
    if (posts.length === 0) return;
    const latestPost = posts[0];
    if (!latestPost.price_per_unit) return;
    
    const triggered = checkAlerts(latestPost.item_name, latestPost.price_per_unit, latestPost.currency_unit);
    triggered.forEach(alert => {
      toast.info(`🔔 Price Alert: ${alert.item_name} posted at ${latestPost.price_per_unit} ${latestPost.currency_unit} (your target: ${alert.alert_type === 'below' ? '≤' : '≥'} ${alert.target_price} ${alert.currency_unit})`);
    });
  }, [posts.length]); // Only check on new posts

  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      if (typeFilter !== 'all' && p.post_type !== typeFilter) return false;
      if (search && !p.item_name.toLowerCase().includes(search.toLowerCase()) && !p.grow_id.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [posts, typeFilter, search]);

  const handleMarkFulfilled = async (id: string) => {
    try {
      await markFulfilled(id);
      toast.success('Post marked as fulfilled');
    } catch {
      toast.error('Failed to update post');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePost(id);
      toast.success('Post deleted');
    } catch {
      toast.error('Failed to delete post');
    }
  };

  const handleCreate = async (input: any) => {
    try {
      await createPost(input);
      toast.success('Trade post created! 📢');
    } catch {
      toast.error('Failed to create post');
    }
  };

  const growId = user?.user_metadata?.grow_id || '';

  return (
    <div>
      <PageHeader
        title="Trade Board"
        description="Community trade listings — find buyers, sellers, and trade partners"
      />

      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search items or GrowID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </div>

        {/* Type filter */}
        <Tabs value={typeFilter} onValueChange={setTypeFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="WTB">🔵 WTB</TabsTrigger>
            <TabsTrigger value="WTS">🟢 WTS</TabsTrigger>
            <TabsTrigger value="WTT">🟡 WTT</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Posts */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Megaphone className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No trade posts found</p>
            <p className="text-sm text-muted-foreground/70">Be the first to post a trade!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPosts.map(post => (
              <TradePostCard
                key={post.id}
                post={post}
                onMarkFulfilled={handleMarkFulfilled}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Price Alerts */}
        <PriceAlertPanel />
      </div>

      <CreateTradePostDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onSubmit={handleCreate}
        defaultGrowId={growId}
      />
    </div>
  );
}
