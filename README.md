# Research Terminal

A real-time financial research terminal that surfaces critical global news through tagged, live-updating panes. Monitor market-moving events across regions, asset classes, and themes—all in one interface.

🔗 **Live Demo**: [research-terminal.vercel.app](https://research-terminal-4ta7uk2em-harsh817s-projects.vercel.app)

## Features

### 📰 Real-Time News Feed
- **Live updates** without manual refresh
- **Six-pane layout**: Americas, Europe, Asia Pacific, Macro & Policy, Corporate, Risk Events
- **Smart tag-based routing**: Each news item appears in the most relevant pane
- **Priority-based deduplication**: No duplicate stories across panes
- **Date filtering**: Shows today's news only (with 6-hour buffer for timezone transitions)

### 🔖 Saved Items & Bookmarks
- **Star/unsave** articles for later reading
- **Real-time sync** across all panes
- **Saved count badges** on each pane
- **Persistent storage** per user

### 👁️ Read/Unread Tracking
- **Visual indicators** for unread articles (bold headlines)
- **Automatic marking** when opening articles
- **Per-user state** with real-time updates
- **Unread count badges** on each pane

### 🔊 Smart Sound Alerts
- **Tag-based notifications** for critical themes (earnings, risk events, etc.)
- **Cooldown protection** prevents alert fatigue
- **Master volume control** with per-tag overrides
- **Visual highlights** accompany all sound alerts

### 🔍 Source Monitor Dashboard
- **RSS feed health monitoring** 
- **24-hour ingestion statistics** per source
- **Active/inactive status** tracking
- **Last fetch timestamps** and error reporting

### 🔐 User Authentication
- **Secure login/signup** with Supabase Auth
- **Row-level security** for personal data
- **Session management** with automatic token refresh

### ⚙️ Settings & Customization
- **Sound preferences**: Master volume, per-tag alerts
- **Keyword management**: Custom search terms per pane
- **Source monitoring**: Track RSS feed performance

## Tech Stack

**Frontend**
- [Next.js 13.5](https://nextjs.org/) - React framework with App Router
- [TypeScript](https://www.typescriptlang.org/) - Type-safe development
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first styling
- [shadcn/ui](https://ui.shadcn.com/) - Accessible component library

**Backend**
- [Supabase](https://supabase.com/) - PostgreSQL database with real-time subscriptions
- [Supabase Auth](https://supabase.com/auth) - User authentication
- [Edge Functions](https://supabase.com/edge-functions) - Serverless RSS ingestion

**Infrastructure**
- [Vercel](https://vercel.com/) - Deployment and hosting
- [Cron-job.org](https://cron-job.org/) - Scheduled RSS ingestion triggers

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Vercel account (for deployment)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/harsh817/research-terminal.git
cd research-terminal
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create `.env.local` in the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these values from your [Supabase project settings](https://app.supabase.com/project/_/settings/api).

4. **Run database migrations**

The database schema is managed through Supabase migrations. Apply them via:
```bash
npx supabase db push
```

Or manually apply SQL files from `supabase/migrations/` in the Supabase SQL Editor.

5. **Start development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Database Setup

The project uses PostgreSQL with the following main tables:
- `news_items` - Stores news articles with tags (region, markets, themes)
- `rss_sources` - RSS feed configurations
- `ingestion_logs` - RSS fetch history and statistics
- `panes` - Pane configurations with tag-based rules
- `user_read_items` - Per-user read status
- `user_saved_items` - Per-user bookmarks
- `user_sound_settings` - Per-user sound preferences

**Realtime Enabled**: `news_items`, `user_read_items`, `user_saved_items`

### RSS Ingestion

News ingestion runs via a Supabase Edge Function (`supabase/functions/ingest-rss/`) triggered by an external cron job every 5 minutes.

**To set up:**
1. Deploy the Edge Function:
```bash
npx supabase functions deploy ingest-rss
```

2. Configure a cron job at [cron-job.org](https://cron-job.org/) to call:
```
https://[your-project].supabase.co/functions/v1/ingest-rss
```

## Deployment

### Deploy to Vercel

1. **Connect your GitHub repository** to Vercel
2. **Configure environment variables** in Vercel dashboard (same as `.env.local`)
3. **Deploy**: 
```bash
vercel --prod
```

The build will automatically run `npm run build` and deploy.

### Deploy Supabase Functions
```bash
npx supabase functions deploy ingest-rss
npx supabase functions deploy sound-settings
```

## Project Structure

```
research-terminal/
├── app/                    # Next.js App Router pages
│   ├── terminal/          # Main terminal interface
│   ├── auth/              # Login/signup pages
│   ├── settings/          # Settings page with tabs
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── pane.tsx          # News pane component
│   ├── news-item.tsx     # Individual news item
│   └── source-monitor-dashboard.tsx
├── hooks/                # Custom React hooks
│   ├── use-news-feed.ts  # Real-time news subscription
│   └── use-toast.ts      # Toast notifications
├── lib/                  # Utilities and contexts
│   ├── supabase-client.ts
│   ├── auth-context.tsx
│   └── sound-settings-context.tsx
├── supabase/
│   ├── functions/        # Edge Functions
│   └── migrations/       # Database migrations
└── public/               # Static assets
```

## Development Notes

### Real-time Subscriptions
Each pane creates **unique channels** to avoid conflicts:
- `news-updates-{pane}` - New news items
- `read-items-{pane}` - Read status changes
- `saved-items-{pane}` - Bookmark changes

### Date Filtering
News items are filtered to show today's articles with a 6-hour buffer to handle timezone transitions smoothly.

### Sound Alerts
Sound alerts respect browser autoplay policies. If blocked, visual highlights still appear.

## License

MIT

## Contributing

This is an internal research tool. For questions or issues, please contact the repository maintainer.

---

Built with ❤️ using Next.js, Supabase, and Vercel
