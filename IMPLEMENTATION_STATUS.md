# Kniferoll User Flows Spec - Implementation Status

This document tracks the implementation of the comprehensive user flows specification for Kniferoll.

## ✅ Completed Components

### Pages (6/8)

- **Signup.tsx** ✅

  - Email/password signup with display name
  - OAuth integration ready (placeholder)
  - Automatic user_profiles creation with free plan
  - Anonymous session linking support

- **Login.tsx** ✅ (Already existed, refactored)
  - Email/password authentication
  - Redirect to dashboard on success
- **InviteJoin.tsx** ✅

  - Invite link validation (expiry, revocation, max uses)
  - Kitchen name display
  - Anonymous join flow with display name
  - Registered user auto-join
  - Invite link use_count increment

- **CreateKitchen.tsx** ✅

  - 5-step multi-step form:
    1. Kitchen name
    2. Operating days (Mon-Sun selector)
    3. Shifts (Breakfast, Lunch, Dinner + custom)
    4. Per-day shift customization (optional)
    5. Station setup (pre-filled suggestions + custom)
  - Kitchen, membership, and station creation
  - Redirect to kitchen prep view

- **Dashboard.tsx** ✅

  - Kitchen list for current user
  - Kitchen switcher UI
  - Last accessed kitchen remembering
  - Create new kitchen button (with plan limit check)
  - Plan upgrade prompt for free users

- **StationView.tsx** ✅

  - Date picker (past dates for history, current date max)
  - Shift tabs (Breakfast, Lunch, Dinner)
  - Station selector dropdown
  - Progress bar with stats (done, working, todo)
  - Prep items list with status indicators
  - Item status cycling (pending → partial → complete)
  - Add prep item form with description, quantity, unit
  - Delete items with trash icon
  - Realtime subscription setup (hook exists)

- **KitchenSettings.tsx** ✅

  - Tabbed interface: General, Schedule, Stations, Members, Billing
  - General: Edit kitchen name, delete kitchen
  - Stations: List, add, delete stations
  - Members: Member list with roles
  - Billing: Plan display and upgrade button
  - Owner-only restrictions

- **Landing.tsx** ✅ (Already existed, kept as-is)

### Stores & Hooks

- **useKitchenStore** ✅

  - createKitchen() - Full kitchen + membership + stations setup
  - loadKitchen() - Load kitchen with stations and membership
  - joinKitchenViaInvite() - Join via invite token
  - Station and shift selection
  - Date selection persistence

- **usePrepItemActions** ✅ (New)

  - addPrepItem() - Create prep item with autocomplete suggestion
  - updateItemStatus() - Cycle through pending/partial/complete
  - deleteItem() - Remove prep item
  - Proper created_by_user/anon tracking
  - Kitchen item suggestions upserting

- **useKitchens** ✅ (Existing, expanded)

  - useKitchens() - Fetch all user kitchens
  - useKitchen() - Fetch single kitchen with members

- **usePrepItems** ✅ (Existing)

  - Fetch prep items by station/date

- **useStations** ✅ (Existing)
  - Fetch stations by kitchen

### Components

- **Button.tsx** ✅ (Updated)

  - Added "outline" variant
  - Supports primary, secondary, danger, outline

- **ErrorAlert.tsx** ✅ (Updated)

  - Now accepts optional title parameter
  - Better styled for dark mode

- **FormInput.tsx** ✅ (Updated)

  - Made id optional (auto-generates from label)
  - Added placeholder and disabled props
  - Better disabled state styling

- **CenteredPage.tsx** ✅ (Existing)

### Routing (App.tsx) ✅

- Public routes: /, /login, /signup, /join/:token
- Protected routes (require auth):
  - /dashboard - Kitchen list
  - /create-kitchen - Kitchen creation flow
  - /kitchen/:kitchenId - Main prep view (StationView)
  - /kitchen/:kitchenId/settings - Kitchen settings

## 🚧 In Progress / Todo

### Autocomplete Suggestions

- [ ] Implement autocomplete component for prep item descriptions
- [ ] Ranking algorithm: station_shift_match (10x) + station_match (5x) + use_count (0.5x) + recency (-0.1x)
- [ ] Last quantity used hint display
- [ ] Suggestion caching and search

### Invite Link Generation

- [ ] Generate invite link modal/UI
- [ ] QR code display (needs qr library integration)
- [ ] Copy to clipboard functionality
- [ ] "Create another" button
- [ ] Share via system share sheet
- [ ] Link format: https://app.kniferoll.com/join/{token}

### Realtime Syncing

- [ ] Expand useRealtimePrepItems to full realtime
- [ ] Real-time member presence
- [ ] Real-time station updates
- [ ] Conflict resolution (last-write-wins)
- [ ] Offline queue for PWA

### Paywall & Plan Limits

- [ ] Free user limits (1 kitchen, 1 station per kitchen)
- [ ] Pro user limits (5 kitchens, unlimited stations per kitchen)
- [ ] Kitchen creation limit check
- [ ] Station creation limit check
- [ ] Invite generation limit (free = none unless granted, pro = yes as owner)
- [ ] Paywall modals for upgrade prompts

### Billing Integration

- [ ] Stripe integration setup
- [ ] Checkout flow
- [ ] Webhook handlers for subscription events
- [ ] Subscription status in user_profiles
- [ ] Read-only mode for expired subscriptions
- [ ] Stripe Customer Portal link in settings

### Member Management

- [ ] View member list with roles
- [ ] Change member roles (Admin/Member)
- [ ] Toggle can_invite permission
- [ ] Remove member from kitchen
- [ ] Member removal realtime notification
- [ ] Redirect on removal while active

### Schedule Configuration

- [ ] Save schedule to kitchens table (JSON config)
- [ ] Load and display saved schedule
- [ ] Per-day shift customization persistence
- [ ] Update schedule in settings

### Edge Cases

- [ ] Anonymous user cleanup (30 days inactive)
- [ ] Expired invite link cleanup
- [ ] Kitchen cascade delete
- [ ] Graceful offline behavior
- [ ] Error recovery and retries

## Data Model Notes

The following database schema is already implemented (per instructions):

- **user_profiles** - Extended auth.users, holds plan/subscription
- **anonymous_users** - Device-token based users
- **kitchens** - Kitchen records with owner_id
- **kitchen_members** - Unified membership (user_id XOR anonymous_user_id)
- **stations** - Belong to kitchen
- **prep_items** - Belong to station, track created_by_user/anon
- **invite_links** - Magic links with expiry, use_count, revoked
- **kitchen_item_suggestions** - Autocomplete knowledge base
- **kitchen_units** - Custom units per kitchen

All tables have RLS policies derived from kitchen_members membership checks.

## Testing Checklist

When testing the implementation:

1. **Anonymous Flow**

   - [ ] Open invite link → join as anonymous
   - [ ] Add/edit prep items
   - [ ] Switch stations and shifts
   - [ ] View prep list

2. **Registered Flow**

   - [ ] Sign up with email/password
   - [ ] Create first kitchen
   - [ ] Create additional stations (free = 1, pro = unlimited)
   - [ ] Add prep items
   - [ ] Change item status and delete

3. **Multi-Kitchen**

   - [ ] Create multiple kitchens (limited by plan)
   - [ ] Switch between kitchens
   - [ ] Each kitchen has separate prep lists

4. **Settings**

   - [ ] Rename kitchen
   - [ ] Add/remove stations
   - [ ] View members
   - [ ] Delete kitchen

5. **Plan Limits**
   - [ ] Free user can only create 1 kitchen
   - [ ] Free user can only create 1 station per kitchen
   - [ ] Pro upgrade button appears when hitting limits

## Build Status

✅ TypeScript compilation successful
✅ Vite build successful
✅ All routes configured
✅ All pages created and properly typed

## Next Steps

1. Implement autocomplete component
2. Build invite link generation UI with QR code
3. Add realtime syncing
4. Implement plan limit checks and paywall
5. Setup Stripe integration
6. Add remaining edge case handling
