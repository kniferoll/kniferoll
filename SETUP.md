# Kniferoll Setup Guide

## ✅ Completed

All core features have been implemented:

### Infrastructure

- [x] Monorepo structure (Turborepo + pnpm)
- [x] TypeScript configuration with path aliases
- [x] Tailwind v4 styling
- [x] PWA configuration with offline support

### State Management

- [x] Auth Store (Zustand) - user authentication
- [x] Kitchen Store (Zustand) - kitchen/station management
- [x] Prep Store (Zustand) - prep item CRUD
- [x] Offline Store (Zustand) - offline sync queue

### Pages & Routes

- [x] Landing page (/)
- [x] Login (/login)
- [x] Signup (/signup)
- [x] Join Kitchen (/join/:code?) - Kahoot-style join flow
- [x] Create Kitchen (/kitchen/new)
- [x] Chef Dashboard (/dashboard) - all stations view
- [x] Station View (/station/:id) - cook prep list

### Real-time Features

- [x] Supabase Realtime subscriptions
- [x] Live prep item updates
- [x] Live station progress tracking

## 🚀 Next Steps

### 1. Set Environment Variables

Create `.env.local` in the `apps/web/` directory with your Supabase credentials:

```bash
cd apps/web
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=https://lhdpnnzzdvwcjsizobi.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-key-here
EOF
```

**Important:** The `.env.local` file must be in `apps/web/` (where `vite.config.ts` is located), not in the project root.

### 2. Generate PWA Icons

Create proper PWA icons (or use placeholders for now):

```bash
# Quick placeholder icons with ImageMagick
cd apps/web/public
mkdir -p icons

# Generate simple placeholder icons
convert -size 192x192 -background "#2563eb" -fill white -gravity center -pointsize 100 label:"K" icons/icon-192.png
convert -size 512x512 -background "#2563eb" -fill white -gravity center -pointsize 280 label:"K" icons/icon-512.png
convert -size 180x180 -background "#2563eb" -fill white -gravity center -pointsize 90 label:"K" apple-touch-icon.png

# Or use a proper icon generator like:
# https://realfavicongenerator.net/
```

### 3. Start Development Server

```bash
pnpm dev
```

The app will be available at http://localhost:5173

### 4. Test the Flows

**Cook Flow:**

1. Go to http://localhost:5173/join
2. Enter a kitchen code (will need to create a kitchen first as chef)
3. Enter your name
4. Pick a station
5. Add prep items and check them off

**Chef Flow:**

1. Go to http://localhost:5173/signup
2. Create an account
3. Create a kitchen with station names
4. View the dashboard
5. Share the join code with cooks
6. Monitor real-time progress

### 5. Deploy to Vercel

```bash
# Push to GitHub (assuming repo is already connected to Vercel)
git add .
git commit -m "Complete Kniferoll implementation"
git push origin main

# Vercel will auto-deploy
# Don't forget to set environment variables in Vercel project settings
```

## 📱 PWA Installation

On mobile devices:

- Chrome/Edge: Tap the menu → "Add to Home screen"
- Safari: Tap Share → "Add to Home Screen"

## 🔧 Troubleshooting

### Build Issues

- Run `pnpm install` to ensure all dependencies are installed
- Check that `@kniferoll/types` package has generated database types

### Database Connection

- Verify Supabase URL and key in `.env.local`
- Check that all migrations have been run
- Verify RLS policies are enabled

### Type Errors

- Run `supabase gen types typescript --project-id <id> > packages/types/src/database.ts`
- Restart TypeScript server in VS Code

## 📊 Tech Stack Summary

| Layer         | Technology                            |
| ------------- | ------------------------------------- |
| Framework     | React 18 + TypeScript                 |
| Build Tool    | Vite 7                                |
| Routing       | React Router v7                       |
| State         | Zustand (with persist)                |
| Data Fetching | TanStack Query                        |
| Styling       | Tailwind v4                           |
| Backend       | Supabase (Postgres + Auth + Realtime) |
| PWA           | vite-plugin-pwa + Workbox             |
| Monorepo      | Turborepo + pnpm                      |

## 🎯 Key Features

✨ **Lightning Fast Join** - Kahoot-style, <15 second onboarding
📱 **Touch-First UI** - Large targets, mobile-optimized
🔄 **Real-time Sync** - Live updates across all devices
📴 **Offline Support** - Work without wifi, syncs when back
🎨 **Clean Design** - Minimal UI, maximum function
🔐 **Secure** - RLS policies, device tokens, session management

## 📝 Notes

- Cook accounts are ephemeral (device token only, no password)
- Chef accounts use Supabase Auth (email/password)
- All data syncs in real-time via Supabase Realtime
- Offline support handles network interruptions gracefully
- PWA manifest enables home screen installation
