# Kniferoll

Simple, fast kitchen prep management PWA.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
pnpm dev

# Build for production
pnpm build
```

## 📁 Project Structure

```
kniferoll/
├── apps/
│   └── web/                    # Main PWA (React + Vite)
│       ├── src/
│       │   ├── components/     # UI components
│       │   ├── hooks/          # Custom React hooks
│       │   ├── lib/            # Supabase client, utils
│       │   ├── pages/          # Page components
│       │   ├── stores/         # Zustand stores
│       │   └── types/          # Local types
│       ├── public/             # Static assets
│       └── vite.config.ts      # Vite + PWA config
├── packages/
│   └── types/                  # Shared TypeScript types
│       └── src/
│           ├── database.ts     # Generated from Supabase
│           └── index.ts        # App types
└── supabase/
    └── migrations/             # Database migrations
```

## 🛠️ Technology Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Routing**: React Router v7
- **PWA**: vite-plugin-pwa + Workbox
- **Backend**: Supabase (Postgres + Auth + Realtime)
- **Hosting**: Vercel

## 🔑 Environment Variables

Create `.env.local` in `apps/web/`:

```bash
cd apps/web
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
EOF
```

## 🗄️ Database Setup

```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript --project-id your-project-id > packages/types/src/database.ts
```

## 📱 PWA Icons

Generate PWA icons (192x192, 512x512) and place them in:

- `apps/web/public/icons/icon-192.png`
- `apps/web/public/icons/icon-512.png`
- `apps/web/public/apple-touch-icon.png` (180x180)

You can use tools like:

- [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

## 🎯 Key Features

### For Cooks

- **Kahoot-style join**: Enter code, name, pick station - under 15 seconds
- **Touch-first UI**: Large tap targets (≥48px), readable in bright light
- **Offline support**: Work without wifi, syncs when connected
- **Real-time updates**: See changes instantly across devices

### For Chefs

- **Quick setup**: Create kitchen with stations in seconds
- **Dashboard**: See all stations and progress at a glance
- **Share join codes**: QR codes for easy team onboarding
- **Real-time visibility**: Monitor prep completion live

## 🧪 Development Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm lint             # Run ESLint
pnpm preview          # Preview production build

# Database
supabase db push      # Apply migrations
supabase db reset     # Reset database
supabase gen types typescript --project-id <id> > packages/types/src/database.ts

# Deployment
git push origin main  # Auto-deploys to Vercel
```

## 🚦 User Flows

### Cook Flow

1. Navigate to `/join` or scan QR code
2. Enter 6-character kitchen code
3. Enter display name
4. Select station from list
5. Add/check off prep items
6. Work offline if needed

### Chef Flow

1. Sign up at `/signup`
2. Create kitchen with station names
3. View dashboard with all stations
4. Share join code with team
5. Monitor real-time progress
6. Drill into specific stations

## 📊 Data Model

### Core Tables

- **kitchens**: Restaurant/kitchen entity
- **stations**: Work areas within kitchen
- **prep_items**: Individual prep tasks
- **session_users**: Ephemeral cooks (no account required)
- **user_kitchens**: User-kitchen membership

### RLS (Row Level Security)

All tables have RLS policies enabled for data security.

## 🔐 Authentication

- **Chefs**: Email/password via Supabase Auth
- **Cooks**: Device token stored in localStorage (no account needed)

## 📦 Deployment

### Vercel

1. Connect GitHub repo to Vercel
2. Set environment variables in Vercel project settings
3. Deploy automatically on `git push`

### Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Run migrations: `supabase db push`
3. Configure auth settings (enable email provider)
4. Update Site URL to production domain

## 🎨 Design Principles

1. **Speed**: Every interaction should feel instant
2. **Simplicity**: Minimal UI, maximum function
3. **Reliability**: Work offline, sync when online
4. **Accessibility**: Large touch targets, high contrast
5. **Mobile-first**: Designed for phones in kitchens

## 📄 License

MIT

## 🙋 Support

For issues or questions, open an issue on GitHub.
