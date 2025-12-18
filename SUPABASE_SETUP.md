# Supabase Setup Instructions

## Issue
The application is currently unable to connect to Supabase because the credentials in `.env` point to a non-existent project.

## Solution

### Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/log in
2. Click "New Project"
3. Fill in project details:
   - Name: Research Terminal (or your preferred name)
   - Database Password: Choose a strong password
   - Region: Select closest to your location
4. Wait for the project to be created (takes ~2 minutes)

### Step 2: Get Your API Credentials

1. In your Supabase project dashboard, click on "Project Settings" (gear icon in sidebar)
2. Navigate to "API" section
3. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long JWT token starting with `eyJ...`)

### Step 3: Update Environment Variables

1. Open the `.env` file in your project root
2. Replace the placeholder values with your actual credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...your-actual-key-here
```

### Step 4: Run Database Migrations

The database migrations have already been created in `supabase/migrations/`. You need to apply them to your new Supabase project:

**Option A: Using Supabase Dashboard (Recommended)**
1. Go to your Supabase project dashboard
2. Navigate to "SQL Editor"
3. Run each migration file in order:
   - `20251217144333_create_news_system.sql`
   - `20251217144400_seed_initial_tags.sql`
   - `20251217144429_seed_sample_news.sql`

**Option B: Using Supabase CLI**
```bash
npm install -g supabase
supabase link --project-ref your-project-ref
supabase db push
```

### Step 5: Restart the Application

After updating the `.env` file, rebuild the application:

```bash
npm run build
```

Your application should now connect successfully to Supabase!

## Troubleshooting

### Still seeing "Configuration Error"?

1. **Double-check credentials**: Make sure there are no extra spaces or quotes in your `.env` file
2. **Restart dev server**: After changing `.env`, you must restart the development server
3. **Check project status**: Ensure your Supabase project is active (not paused)
4. **Verify migrations**: Confirm all three migration files have been run in your Supabase project

### Need Help?

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
