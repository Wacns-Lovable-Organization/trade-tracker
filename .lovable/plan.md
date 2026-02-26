

# Test User Setup + Social Trade Features Plan

## Part 1: Seed Test User with Dummy Data

Since we can't create auth users via SQL, we'll build a **seed data script** that runs after login, plus provide test credentials for the user to create manually.

**Test User**: The user will sign up a test account (e.g., `test@growstock.app` / GrowID: `TESTUSER`). Then a "Seed Demo Data" button in Settings will populate:

- **3 Categories**: Blocks, Seeds, Tools
- **6 Items**: Dirt, Lava, Pepper Seed, Pinball Seed, Wrench, Pickaxe
- **12 Inventory Entries**: Multiple batches per item with varied costs/quantities
- **8 Sales**: Spread across items with different profit margins
- **3 Suppliers**: With contact info and linked items
- **3 Buyers**: With contact info and linked items
- **2 Expenses**: World maintenance, tool purchases

## Part 2: Social Trade Board (New Feature)

A new **Trade Board** page where users can post trade listings visible to all users of the platform -- like a bulletin board.

### Trade Post Types:
- **WTB (Want to Buy)**: "Looking for Pepper Seed, paying 15 WL each"
- **WTS (Want to Sell)**: "Selling 200 Dirt Seed at 3 WL each"
- **WTT (Want to Trade)**: "Trading 50 Lava for Pepper Seeds"

### Database: `trade_posts` table
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK to auth |
| post_type | text | 'WTB', 'WTS', 'WTT' |
| item_name | text | Free-text item name |
| quantity | integer | nullable |
| price_per_unit | numeric | nullable |
| currency_unit | text | WL/DL/BGL |
| description | text | nullable |
| world | text | Where to trade |
| grow_id | text | Poster's GrowID |
| is_active | boolean | default true |
| expires_at | timestamptz | nullable, auto-expire |
| created_at | timestamptz | default now() |

**RLS**: Anyone authenticated can read all active posts. Users can only insert/update/delete their own.

### UI: `/trades` route
- Filterable list of trade posts (by type WTB/WTS/WTT, item search, currency)
- "Create Post" dialog with post type selector, item name, qty, price, world
- Each post shows: GrowID, post type badge, item, price, world, time ago
- Users can mark their own posts as fulfilled/expired
- Optional: link to Discord share

## Part 3: Additional Creative Feature Ideas

### 3a. Price Watch / Market Alerts
- Users set alerts: "Notify me when someone posts Pepper Seed below 12 WL"
- Stores as `price_alerts` table, checked when new trade posts are created
- Sends in-app notification + optional Discord webhook

### 3b. Supplier/Buyer Rating System
- After a trade, rate the other party (1-5 stars + comment)
- `trade_ratings` table linked to GrowID
- Shows average rating on trade posts and supplier/buyer profiles

### 3c. Trade History Timeline
- Public profile page showing a user's completed trades
- Builds reputation and trust within the community

## Technical Implementation Details

### Database Migrations:
1. Create `trade_posts` table with RLS policies
2. Enable realtime on `trade_posts` for live updates

### New Files:
- `src/pages/TradeBoard.tsx` -- main trade board page
- `src/hooks/useTradePosts.ts` -- CRUD hook for trade posts
- `src/components/trades/TradePostCard.tsx` -- individual post card
- `src/components/trades/CreateTradePostDialog.tsx` -- creation dialog
- `src/components/settings/SeedDataButton.tsx` -- demo data seeder

### Modified Files:
- `src/App.tsx` -- add `/trades` route
- `src/components/layout/AppLayout.tsx` -- add Trade Board nav link
- `src/pages/Settings.tsx` -- add seed data button
- Feature flag: `trade_board` to gate the feature

### Seed Data Implementation:
- A button in Settings that inserts predefined categories, items, inventory entries, sales, suppliers, buyers, and expenses for the logged-in user
- Checks if data already exists to avoid duplicates
- Uses the existing `AppContext` methods where possible, direct Supabase calls for suppliers/buyers

