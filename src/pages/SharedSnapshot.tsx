import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, ExternalLink } from 'lucide-react';

interface SnapshotItem {
  name: string;
  quantity: number;
  unitCost: number;
  currency: string;
  category?: string;
}

interface SnapshotData {
  id: string;
  title: string | null;
  snapshot_data: SnapshotItem[];
  created_at: string;
}

export default function SharedSnapshot() {
  const { id } = useParams<{ id: string }>();
  const [snapshot, setSnapshot] = useState<SnapshotData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSnapshot() {
      if (!id) {
        setError('Invalid snapshot link');
        setIsLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('shared_snapshots')
        .select('id, title, snapshot_data, created_at')
        .eq('id', id)
        .eq('is_active', true)
        .maybeSingle();

      if (fetchError) {
        setError('Failed to load snapshot');
      } else if (!data) {
        setError('Snapshot not found or has expired');
      } else {
        setSnapshot({
          ...data,
          snapshot_data: (data.snapshot_data as any) || [],
        });
      }
      setIsLoading(false);
    }

    fetchSnapshot();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">Snapshot Unavailable</h2>
            <p className="text-muted-foreground">{error || 'This snapshot is no longer available.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const items = snapshot.snapshot_data;
  const createdDate = new Date(snapshot.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Package className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">GrowStock</h1>
          </div>
          <h2 className="text-lg font-semibold">{snapshot.title || 'Inventory Snapshot'}</h2>
          <p className="text-sm text-muted-foreground">Shared on {createdDate}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {items.length} Item{items.length !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No items in this snapshot</p>
            ) : (
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <div className="font-medium">{item.name}</div>
                      {item.category && (
                        <span className="text-xs text-muted-foreground">{item.category}</span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {item.quantity} × {item.unitCost}{' '}
                        <Badge variant="outline" className="text-xs ml-1">
                          {item.currency}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <a
            href="/"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            Powered by GrowStock
          </a>
        </div>
      </div>
    </div>
  );
}
