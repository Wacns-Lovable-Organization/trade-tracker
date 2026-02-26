import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { Database, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function SeedDataButton() {
  const { user } = useAuth();
  const { refreshData } = useApp();
  const [isSeeding, setIsSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);

  const seedDemoData = async () => {
    if (!user) return;
    setIsSeeding(true);

    try {
      const userId = user.id;

      // 1. Create categories
      const { data: cats, error: catErr } = await supabase
        .from('categories')
        .insert([
          { user_id: userId, name: 'Blocks' },
          { user_id: userId, name: 'Seeds' },
          { user_id: userId, name: 'Tools' },
        ])
        .select();
      if (catErr) throw catErr;

      const blocksCat = cats!.find(c => c.name === 'Blocks')!;
      const seedsCat = cats!.find(c => c.name === 'Seeds')!;
      const toolsCat = cats!.find(c => c.name === 'Tools')!;

      // 2. Create items
      const { data: itemsData, error: itemErr } = await supabase
        .from('items')
        .insert([
          { user_id: userId, name: 'Dirt', category_id: blocksCat.id },
          { user_id: userId, name: 'Lava', category_id: blocksCat.id },
          { user_id: userId, name: 'Pepper Seed', category_id: seedsCat.id },
          { user_id: userId, name: 'Pinball Seed', category_id: seedsCat.id },
          { user_id: userId, name: 'Wrench', category_id: toolsCat.id },
          { user_id: userId, name: 'Pickaxe', category_id: toolsCat.id },
        ])
        .select();
      if (itemErr) throw itemErr;

      const items = itemsData!;
      const dirt = items.find(i => i.name === 'Dirt')!;
      const lava = items.find(i => i.name === 'Lava')!;
      const pepper = items.find(i => i.name === 'Pepper Seed')!;
      const pinball = items.find(i => i.name === 'Pinball Seed')!;
      const wrench = items.find(i => i.name === 'Wrench')!;
      const pickaxe = items.find(i => i.name === 'Pickaxe')!;

      // 3. Create inventory entries (12 entries)
      const inventoryEntries = [
        { user_id: userId, item_id: dirt.id, snapshot_name: 'Dirt', quantity_bought: 200, remaining_qty: 120, unit_cost: 2, currency_unit: 'WL', bought_at: new Date(Date.now() - 7 * 86400000).toISOString() },
        { user_id: userId, item_id: dirt.id, snapshot_name: 'Dirt', quantity_bought: 100, remaining_qty: 100, unit_cost: 3, currency_unit: 'WL', bought_at: new Date(Date.now() - 3 * 86400000).toISOString() },
        { user_id: userId, item_id: lava.id, snapshot_name: 'Lava', quantity_bought: 50, remaining_qty: 30, unit_cost: 10, currency_unit: 'WL', bought_at: new Date(Date.now() - 10 * 86400000).toISOString() },
        { user_id: userId, item_id: lava.id, snapshot_name: 'Lava', quantity_bought: 30, remaining_qty: 30, unit_cost: 8, currency_unit: 'WL', bought_at: new Date(Date.now() - 2 * 86400000).toISOString() },
        { user_id: userId, item_id: pepper.id, snapshot_name: 'Pepper Seed', quantity_bought: 500, remaining_qty: 350, unit_cost: 12, currency_unit: 'WL', bought_at: new Date(Date.now() - 14 * 86400000).toISOString() },
        { user_id: userId, item_id: pepper.id, snapshot_name: 'Pepper Seed', quantity_bought: 200, remaining_qty: 200, unit_cost: 14, currency_unit: 'WL', bought_at: new Date(Date.now() - 5 * 86400000).toISOString() },
        { user_id: userId, item_id: pinball.id, snapshot_name: 'Pinball Seed', quantity_bought: 100, remaining_qty: 60, unit_cost: 25, currency_unit: 'WL', bought_at: new Date(Date.now() - 8 * 86400000).toISOString() },
        { user_id: userId, item_id: pinball.id, snapshot_name: 'Pinball Seed', quantity_bought: 80, remaining_qty: 80, unit_cost: 22, currency_unit: 'WL', bought_at: new Date(Date.now() - 1 * 86400000).toISOString() },
        { user_id: userId, item_id: wrench.id, snapshot_name: 'Wrench', quantity_bought: 10, remaining_qty: 5, unit_cost: 2, currency_unit: 'DL', bought_at: new Date(Date.now() - 12 * 86400000).toISOString() },
        { user_id: userId, item_id: wrench.id, snapshot_name: 'Wrench', quantity_bought: 5, remaining_qty: 5, unit_cost: 1.5, currency_unit: 'DL', bought_at: new Date(Date.now() - 4 * 86400000).toISOString() },
        { user_id: userId, item_id: pickaxe.id, snapshot_name: 'Pickaxe', quantity_bought: 20, remaining_qty: 12, unit_cost: 50, currency_unit: 'WL', bought_at: new Date(Date.now() - 6 * 86400000).toISOString() },
        { user_id: userId, item_id: pickaxe.id, snapshot_name: 'Pickaxe', quantity_bought: 15, remaining_qty: 15, unit_cost: 45, currency_unit: 'WL', bought_at: new Date(Date.now() - 1 * 86400000).toISOString() },
      ];

      const { error: invErr } = await supabase.from('inventory_entries').insert(inventoryEntries);
      if (invErr) throw invErr;

      // 4. Create sales (8 sales)
      const salesData = [
        { user_id: userId, item_id: dirt.id, quantity_sold: 80, sale_price: 4, currency_unit: 'WL', total_cost: 160, profit: 160, cost_breakdown: [{ entryId: 'seed', unitCost: 2, qtyUsed: 80 }], sold_at: new Date(Date.now() - 5 * 86400000).toISOString() },
        { user_id: userId, item_id: lava.id, quantity_sold: 20, sale_price: 15, currency_unit: 'WL', total_cost: 200, profit: 100, cost_breakdown: [{ entryId: 'seed', unitCost: 10, qtyUsed: 20 }], sold_at: new Date(Date.now() - 4 * 86400000).toISOString() },
        { user_id: userId, item_id: pepper.id, quantity_sold: 150, sale_price: 18, currency_unit: 'WL', total_cost: 1800, profit: 900, cost_breakdown: [{ entryId: 'seed', unitCost: 12, qtyUsed: 150 }], sold_at: new Date(Date.now() - 3 * 86400000).toISOString() },
        { user_id: userId, item_id: pinball.id, quantity_sold: 40, sale_price: 35, currency_unit: 'WL', total_cost: 1000, profit: 400, cost_breakdown: [{ entryId: 'seed', unitCost: 25, qtyUsed: 40 }], sold_at: new Date(Date.now() - 3 * 86400000).toISOString() },
        { user_id: userId, item_id: wrench.id, quantity_sold: 5, sale_price: 3, currency_unit: 'DL', total_cost: 10, profit: 5, cost_breakdown: [{ entryId: 'seed', unitCost: 2, qtyUsed: 5 }], sold_at: new Date(Date.now() - 2 * 86400000).toISOString() },
        { user_id: userId, item_id: pickaxe.id, quantity_sold: 8, sale_price: 75, currency_unit: 'WL', total_cost: 400, profit: 200, cost_breakdown: [{ entryId: 'seed', unitCost: 50, qtyUsed: 8 }], sold_at: new Date(Date.now() - 1 * 86400000).toISOString() },
        { user_id: userId, item_id: pepper.id, quantity_sold: 100, sale_price: 20, currency_unit: 'WL', total_cost: 1200, profit: 800, cost_breakdown: [{ entryId: 'seed', unitCost: 12, qtyUsed: 100 }], sold_at: new Date(Date.now() - 1 * 86400000).toISOString() },
        { user_id: userId, item_id: dirt.id, quantity_sold: 50, sale_price: 5, currency_unit: 'WL', total_cost: 150, profit: 100, cost_breakdown: [{ entryId: 'seed', unitCost: 3, qtyUsed: 50 }], sold_at: new Date().toISOString() },
      ];

      const { error: saleErr } = await supabase.from('sales').insert(salesData);
      if (saleErr) throw saleErr;

      // 5. Create suppliers
      const { data: suppliersData, error: suppErr } = await supabase
        .from('suppliers')
        .insert([
          { user_id: userId, grow_id: 'SEEDKING', world: 'SEEDSHOP', discord: 'SeedKing#1234', notes: 'Reliable seed supplier, always in stock' },
          { user_id: userId, grow_id: 'BLOCKMASTER', world: 'BLOCKSALE', telegram: '@blockmaster', notes: 'Bulk block seller, good prices' },
          { user_id: userId, grow_id: 'TOOLSMITH', world: 'TOOLWORLD', whatsapp: '+1234567890', notes: 'Best tools, fast delivery' },
        ])
        .select();
      if (suppErr) throw suppErr;

      // 6. Create supplier items
      const suppliers = suppliersData!;
      await supabase.from('supplier_items').insert([
        { supplier_id: suppliers[0].id, item_id: pepper.id, unit_price: 11, currency_unit: 'WL', quantity_per_unit: 1, notes: 'Bulk discount available 500+' },
        { supplier_id: suppliers[0].id, item_id: pinball.id, unit_price: 20, currency_unit: 'WL', quantity_per_unit: 1 },
        { supplier_id: suppliers[1].id, item_id: dirt.id, unit_price: 1.5, currency_unit: 'WL', quantity_per_unit: 1, notes: 'Can supply 1000+/day' },
        { supplier_id: suppliers[1].id, item_id: lava.id, unit_price: 7, currency_unit: 'WL', quantity_per_unit: 1 },
        { supplier_id: suppliers[2].id, item_id: wrench.id, unit_price: 1.2, currency_unit: 'DL', quantity_per_unit: 1 },
        { supplier_id: suppliers[2].id, item_id: pickaxe.id, unit_price: 40, currency_unit: 'WL', quantity_per_unit: 1 },
      ]);

      // 7. Create buyers
      const { data: buyersData, error: buyErr } = await supabase
        .from('buyers')
        .insert([
          { user_id: userId, grow_id: 'BIGBUYER', world: 'BUYNOW', discord: 'BigBuyer#5678', notes: 'Buys in bulk, always pays upfront' },
          { user_id: userId, grow_id: 'SEEDLOVER', world: 'FARMLAND', instagram: '@seedlover_gt', notes: 'Regular seed buyer' },
          { user_id: userId, grow_id: 'BUILDER99', world: 'MEGABUILD', telegram: '@builder99', notes: 'Needs blocks for building projects' },
        ])
        .select();
      if (buyErr) throw buyErr;

      // 8. Create buyer items
      const buyers = buyersData!;
      await supabase.from('buyer_items').insert([
        { buyer_id: buyers[0].id, item_id: pepper.id, unit_price: 18, currency_unit: 'WL', quantity_per_unit: 1, notes: 'Buys 200+ weekly' },
        { buyer_id: buyers[0].id, item_id: wrench.id, unit_price: 3, currency_unit: 'DL', quantity_per_unit: 1 },
        { buyer_id: buyers[1].id, item_id: pepper.id, unit_price: 17, currency_unit: 'WL', quantity_per_unit: 1 },
        { buyer_id: buyers[1].id, item_id: pinball.id, unit_price: 33, currency_unit: 'WL', quantity_per_unit: 1 },
        { buyer_id: buyers[2].id, item_id: dirt.id, unit_price: 4, currency_unit: 'WL', quantity_per_unit: 1, notes: 'Needs 500+ per order' },
        { buyer_id: buyers[2].id, item_id: lava.id, unit_price: 14, currency_unit: 'WL', quantity_per_unit: 1 },
      ]);

      // 9. Create expenses
      await supabase.from('expenses').insert([
        { user_id: userId, category: 'World Maintenance', description: 'World lock renewal for SEEDSHOP', amount: 5, currency_unit: 'DL', expense_date: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0] },
        { user_id: userId, category: 'Tools', description: 'Purchased harvesting tools', amount: 200, currency_unit: 'WL', expense_date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0] },
      ]);

      // 10. Create some trade posts
      await supabase.from('trade_posts').insert([
        { user_id: userId, post_type: 'WTS', item_name: 'Pepper Seed', quantity: 200, price_per_unit: 18, currency_unit: 'WL', world: 'SEEDSHOP', grow_id: user.user_metadata?.grow_id || 'TESTUSER', description: 'Selling Pepper Seeds, bulk discount for 500+' },
        { user_id: userId, post_type: 'WTB', item_name: 'Lava', quantity: 100, price_per_unit: 8, currency_unit: 'WL', world: 'SEEDSHOP', grow_id: user.user_metadata?.grow_id || 'TESTUSER', description: 'Looking for cheap Lava blocks' },
        { user_id: userId, post_type: 'WTT', item_name: 'Pinball Seed', quantity: 50, price_per_unit: 30, currency_unit: 'WL', world: 'SEEDSHOP', grow_id: user.user_metadata?.grow_id || 'TESTUSER', description: 'Trading Pinball Seeds for Pepper Seeds, 1:2 ratio' },
      ]);

      await refreshData();
      setSeeded(true);
      toast.success('Demo data seeded successfully! 🎉');
    } catch (error: any) {
      console.error('Seed error:', error);
      toast.error('Failed to seed data: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Card className="animate-fade-in border-primary/30">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          <CardTitle>Demo Data</CardTitle>
        </div>
        <CardDescription>
          Populate your account with sample data to test all features — categories, items, inventory, sales, suppliers, buyers, expenses, and trade posts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {seeded ? (
          <div className="flex items-center gap-2 text-sm text-green-500">
            <CheckCircle className="w-4 h-4" />
            Demo data seeded successfully!
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4 shrink-0" />
              This will add sample data to your account. It won't delete existing data.
            </div>
            <Button onClick={seedDemoData} disabled={isSeeding}>
              {isSeeding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Seeding...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Seed Demo Data
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
