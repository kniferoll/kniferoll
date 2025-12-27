# Kniferoll Deployment Guide

## Overview

Kniferoll is now feature-complete with:

- ✅ Full authentication flows (signup, login, anonymous invite join)
- ✅ Kitchen CRUD with multi-kitchen navigation
- ✅ Prep item management with autocomplete suggestions
- ✅ Plan limit enforcement with upgrade modals
- ✅ Invite link generation with copy/revoke
- ✅ Member management (roles, permissions, removal)
- ✅ Real-time syncing (members, stations, prep items)
- ✅ Custom schedule configuration (shifts, days)
- ✅ Stripe integration (checkout, portal, webhooks)
- ✅ 169 modules, clean TypeScript build

## Stripe Integration Setup

Before deploying to production, configure Stripe:

### 1. Create Stripe Account & Products

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Create a **Product** named "Kniferoll Pro"
3. Create a **Price** for monthly billing ($9/month)
4. Note the **Price ID** (e.g., `price_1234567890`)

### 2. Set Environment Variables

Add to `.env.local` (development) and Vercel/deployment platform:

```env
# Stripe Keys (from Stripe Dashboard)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... or pk_live_...
STRIPE_SECRET_KEY=sk_test_... or sk_live_...
STRIPE_PRO_PRICE_ID=price_1234567890
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Deploy Supabase Edge Functions

The three edge functions handle Stripe integration:

```bash
supabase functions deploy create-checkout-session
supabase functions deploy create-portal-session
supabase functions deploy stripe-webhooks
```

Each function needs Stripe environment variables set:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_...
supabase secrets set STRIPE_PRO_PRICE_ID=price_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Configure Stripe Webhooks

In Stripe Dashboard:

1. Go to **Developers** → **Webhooks**
2. Add endpoint: `https://[your-supabase-project].supabase.co/functions/v1/stripe-webhooks`
3. Events to listen for:
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the **Signing Secret** → Set as `STRIPE_WEBHOOK_SECRET`

### 5. Set Redirect URLs

In Stripe Dashboard:

1. Go to **Settings** → **Checkout settings**
2. Set **Success redirect URL**: `https://yourdomain.com/dashboard?upgrade=success`
3. Set **Cancel redirect URL**: `https://yourdomain.com/dashboard`

## Database Migrations

All migrations are in `supabase/migrations/`:

1. `001_refactor_schema.sql` — Core schema (users, kitchens, prep items, etc.)
2. `002_rls_policies.sql` — Row-level security policies
3. `003_kitchen_shifts.sql` — Schedule configuration tables

To apply locally:

```bash
supabase db reset
```

To apply to production:

```bash
supabase db push
```

## Deployment to Production

### Option 1: Vercel (Recommended)

1. Connect GitHub repo to Vercel
2. Set environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_STRIPE_PUBLISHABLE_KEY`
   - `VITE_API_BASE_URL` (your Supabase project URL)
3. Push to main branch → auto-deploys

### Option 2: Docker / Manual

1. Build: `pnpm -C apps/web build`
2. Serve `apps/web/dist/` with your web server
3. Configure environment variables on your host

## Verifying Integration

After deployment:

1. **Test Signup** → Create account
2. **Test Kitchen Creation** → Free plan allows 1 kitchen
3. **Trigger Upgrade Modal** → Try creating 2nd kitchen → "Upgrade to Pro" appears
4. **Test Checkout** → Click upgrade → redirects to Stripe
5. **Test Webhook** → Complete payment → User's plan updates to "pro"
6. **Test Multi-Kitchen** → Create 5 kitchens (pro limit)
7. **Test Portal** → Click "Manage Subscription" → redirects to Stripe portal

## Troubleshooting

### "Checkout failed"

- Check `VITE_STRIPE_PUBLISHABLE_KEY` is set correctly
- Verify `VITE_API_BASE_URL` points to your Supabase project
- Check edge function logs: `supabase functions logs create-checkout-session`

### "Webhook not processing"

- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Check webhook logs in Stripe dashboard
- Check Supabase edge function logs

### "No subscription status update"

- Verify webhook is being delivered (Stripe dashboard)
- Check `STRIPE_SECRET_KEY` is correct
- Verify user profile has `stripe_customer_id` set

## Monitoring

Monitor subscription status in Supabase:

```sql
select id, plan, subscription_status, subscription_period_end
from user_profiles
where plan = 'pro';
```

## Support

For Stripe-specific issues:

- [Stripe API Docs](https://stripe.com/docs/api)
- [Stripe Dashboard](https://dashboard.stripe.com)

For Supabase edge functions:

- [Supabase Functions Docs](https://supabase.com/docs/guides/functions)
- Check logs: `supabase functions logs [function-name]`
