

# Creative Features & Platform Integration Plan

## Overview

This plan introduces a set of creative features centered around **Discord integration** and other platform connections to enhance GrowStock with social/collaborative capabilities, automated alerts, and external sharing.

---

## Feature 1: Discord Webhook Notifications

**What it does:** Users can configure a Discord webhook URL in Settings to receive automated notifications in their Discord server for key events like low stock alerts, new sales, and daily summary reports.

### Implementation:
- Add a `discord_webhook_url` column to the `user_settings` table
- Create a new **"Integrations"** card on the Settings page with a Discord webhook URL input field and a "Test Webhook" button
- Create a `send-discord-webhook` edge function that posts formatted Discord embeds (with colors, item names, currency breakdowns) to the user's webhook URL
- Trigger Discord notifications from existing flows:
  - Low stock threshold reached
  - Sale recorded (with profit summary)
  - Daily/weekly inventory summary (optional scheduled)

### Discord Embed Format:
- Rich embeds with GrowStock branding colors
- Fields for item name, quantity, currency values (WL/DL/BGL)
- Timestamps and action links back to the app

---

## Feature 2: Shareable Inventory Snapshots

**What it does:** Users can generate a public read-only link or image card of their inventory/store listing that can be shared on Discord, social media, or messaging apps.

### Implementation:
- New `shared_snapshots` database table (id, user_id, snapshot_data jsonb, expires_at, is_active, created_at)
- A "Share Inventory" button on the Inventory List page that generates a snapshot
- A public route `/share/:id` that renders a branded, read-only view of selected items with prices
- Copy-to-clipboard for the share link
- Optional: Generate an Open Graph image preview so Discord/social platforms show a rich card

---

## Feature 3: Trade/Price Alert Bot Commands

**What it does:** A dedicated edge function endpoint that can respond to Discord bot interactions, allowing users to query their inventory data from Discord (e.g., "!stock Diamond" returns current stock of Diamond items).

### Implementation:
- Create a `discord-bot` edge function that handles simple text-based queries
- Support commands like:
  - `!stock <item>` - Check current stock
  - `!sales today` - Today's sales summary
  - `!profit` - Current period profit overview
- Authenticate via a user-specific API token stored in a new `api_tokens` table
- This is a more advanced feature that can be built incrementally

---

## Feature 4: Multi-Platform Export (Telegram, WhatsApp links)

**What it does:** Quick-share buttons on reports and dashboard that format data as text and open share dialogs for various platforms.

### Implementation:
- Add share buttons to the Dashboard and Reports pages
- Format summaries as plain text optimized for each platform:
  - **Telegram:** `tg://msg?text=...`
  - **WhatsApp:** `https://wa.me/?text=...`
  - **Discord:** Copy formatted markdown text
- Include daily summary, top items, profit breakdown

---

## Feature 5: Activity Feed / Social Timeline

**What it does:** A chronological feed on the Dashboard showing recent activity (sales, inventory additions, restocks) in a social-media-style timeline format, making the app feel more engaging.

### Implementation:
- New `ActivityFeed` component on the Dashboard
- Queries recent sales, inventory entries, and expenses (last 24-48 hours)
- Displays as cards with icons, timestamps, and currency displays
- Optional: Push these events to Discord via the webhook integration

---

## Technical Plan (Priority Order)

### Phase 1: Discord Webhook Integration (Core)
1. **Database migration:** Add `discord_webhook_url` (text, nullable) to `user_settings`
2. **Edge function:** Create `supabase/functions/send-discord-webhook/index.ts`
3. **Settings UI:** Add "Integrations" card with webhook URL input + test button
4. **Hook updates:** Trigger webhook calls from sale creation and low stock detection flows

### Phase 2: Share & Export
5. **Database migration:** Create `shared_snapshots` table with RLS policies
6. **Public share page:** New `/share/:id` route
7. **Share buttons:** Add to Dashboard and Reports with platform-specific formatting

### Phase 3: Activity Feed
8. **ActivityFeed component:** Timeline UI on Dashboard
9. **Connect to Discord:** Optionally forward activity to webhook

### Files to Create:
- `supabase/functions/send-discord-webhook/index.ts`
- `src/components/settings/IntegrationsCard.tsx`
- `src/components/dashboard/ActivityFeed.tsx`
- `src/components/sharing/ShareButtons.tsx`
- `src/pages/SharedSnapshot.tsx`

### Files to Modify:
- `src/pages/Settings.tsx` - Add Integrations card
- `src/pages/Dashboard.tsx` - Add Activity Feed and share buttons
- `src/hooks/useUserSettings.ts` - Handle discord_webhook_url
- `src/App.tsx` - Add /share/:id route
- `supabase/config.toml` - Register new edge function
- `src/contexts/AppContext.tsx` - Trigger webhook on key events

### Database Changes:
- `ALTER TABLE user_settings ADD COLUMN discord_webhook_url text;`
- New `shared_snapshots` table with user_id, snapshot_data, expires_at, RLS policies

