

# New Key Features Plan

This plan adds 5 high-impact features to make GrowStock a comprehensive platform that stands out from competitors.

---

## Feature 1: Goals and Milestones Tracker

A personal goal-setting system where users set profit/sales targets and track progress visually.

**What users see:**
- New `/goals` page with a list of active goals
- "Create Goal" dialog: pick a type (profit target, sales count, inventory value), set a target amount, currency, and deadline
- Each goal shows a progress bar, percentage complete, and days remaining
- Completed goals get a celebratory badge
- Dashboard widget showing top active goal progress

**Database:** `goals` table (id, user_id, goal_type, target_value, current_value, currency_unit, title, deadline, is_completed, completed_at, created_at)

**Files:**
- New: `src/pages/Goals.tsx`, `src/hooks/useGoals.ts`, `src/components/goals/CreateGoalDialog.tsx`, `src/components/goals/GoalCard.tsx`
- Modified: `src/App.tsx` (route), `src/components/layout/AppLayout.tsx` (nav), `src/pages/Dashboard.tsx` (widget)

---

## Feature 2: Notes and Journal

A simple notes system for users to log observations, market tips, or trade strategies.

**What users see:**
- New `/notes` page with a list of notes in a card grid
- Create/edit notes with title, content (textarea), optional tags, and pin functionality
- Pinned notes appear at the top
- Search and filter by tags
- Color-coded note cards

**Database:** `notes` table (id, user_id, title, content, tags, color, is_pinned, created_at, updated_at)

**Files:**
- New: `src/pages/Notes.tsx`, `src/hooks/useNotes.ts`, `src/components/notes/NoteCard.tsx`, `src/components/notes/CreateNoteDialog.tsx`
- Modified: `src/App.tsx` (route), `src/components/layout/AppLayout.tsx` (nav)

---

## Feature 3: Price History Chart per Item

Track how buy/sell prices change over time for each item, displayed as a line chart.

**What users see:**
- On the Inventory item detail (transaction history dialog), a new "Price Trends" tab
- Line chart showing unit cost over time (from inventory entries) and sale price over time (from sales)
- Average cost and average sale price indicators
- Helps users decide when to buy/sell

**Implementation:** No new database table needed -- data comes from existing `inventory_entries` and `sales` tables, aggregated by item and date.

**Files:**
- New: `src/components/inventory/PriceHistoryChart.tsx`
- Modified: `src/components/inventory/ItemTransactionHistory.tsx` (add tab)

---

## Feature 4: Recurring Inventory Templates (Quick Restock)

Let users save frequently purchased item configurations as templates for one-click restocking.

**What users see:**
- On Inventory Add page, a "Save as Template" checkbox
- New "Templates" section at the top of the Add Inventory page showing saved templates
- Click a template to auto-fill item, quantity, cost, currency, and category
- Manage templates (delete) from Settings or inline

**Database:** `inventory_templates` table (id, user_id, template_name, item_id, item_name, category_id, default_quantity, default_unit_cost, default_currency_unit, created_at)

**Files:**
- New: `src/hooks/useInventoryTemplates.ts`, `src/components/inventory/TemplateList.tsx`
- Modified: `src/pages/InventoryAdd.tsx` (template save/load UI)

---

## Feature 5: World Directory / Favorites

A personal directory of game worlds users frequently visit, with notes and quick access.

**What users see:**
- New `/worlds` page with a grid of saved worlds
- Each world card shows: world name, owner GrowID, category tag (Farm, Shop, Storage, etc.), personal notes, last visited date
- Quick "Add World" dialog
- Searchable and filterable by category
- Links to supplier/buyer records that reference the same world

**Database:** `saved_worlds` table (id, user_id, world_name, owner_grow_id, category, notes, last_visited_at, is_favorite, created_at, updated_at)

**Files:**
- New: `src/pages/Worlds.tsx`, `src/hooks/useSavedWorlds.ts`, `src/components/worlds/WorldCard.tsx`, `src/components/worlds/AddWorldDialog.tsx`
- Modified: `src/App.tsx` (route), `src/components/layout/AppLayout.tsx` (nav)

---

## Technical Summary

### Database migrations needed:
1. `goals` table with RLS (user owns their goals)
2. `notes` table with RLS (user owns their notes)
3. `inventory_templates` table with RLS (user owns their templates)
4. `saved_worlds` table with RLS (user owns their worlds)
5. Feature flags: `goals_tracker`, `notes_journal`, `world_directory` (Price History and Templates don't need gates as they're enhancements to existing pages)

### New routes:
- `/goals` -- Goals and Milestones
- `/notes` -- Notes and Journal
- `/worlds` -- World Directory

### Navigation additions:
Three new nav items in AppLayout with feature flag gating:
- Goals (Target icon)
- Notes (StickyNote icon)
- Worlds (Globe icon)

### Total new files: ~14
### Total modified files: ~5 (App.tsx, AppLayout.tsx, InventoryAdd.tsx, ItemTransactionHistory.tsx, Dashboard.tsx)

