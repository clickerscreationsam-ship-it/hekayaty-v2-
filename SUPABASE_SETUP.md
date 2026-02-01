# 🚀 Supabase Backend Setup Guide

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new organization (if you don't have one)
4. Click "New Project"
5. Fill in:
   - **Project name**: `hekayaty-store` (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is perfect to start
6. Click "Create new project" (takes ~2 minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...` (long string)
   - **service_role key**: `eyJhbGc...` (keep this secret!)

## Step 3: Configure Environment Variables

1. Create a `.env` file in your project root:

```bash
cp .env.example .env
```

2. Edit `.env` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

PORT=5000
NODE_ENV=development
```

## Step 4: Run Database Migrations

1. In Supabase Dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL editor
5. Click **RUN** or press `Ctrl+Enter`
6. Wait for success message ✅

**Alternative CLI method:**
```bash
# Install Supabase CLI (if you haven't)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Step 5: Enable Email Auth

1. Go to **Authentication** → **Providers**
2. Make sure **Email** is enabled
3. Configure email templates (optional) under **Email Templates**
4. For development, you can use **"Confirm email" disabled** to speed up testing

## Step 6: Set Up Row Level Security (Already Done!)

The migration script already created RLS policies. Verify:

1. Go to **Authentication** → **Policies**
2. You should see policies for:
   - `users`
   - `products`
   - `cart_items`
   - `orders`
   - `order_items`

## Step 7: Install Dependencies

```bash
npm install @supabase/supabase-js
```

## Step 8: Verify Connection

Restart your dev server:

```bash
npm run dev
```

The app will now connect to Supabase instead of in-memory storage!

## Step 9: Create Your First User

1. Go to `http://localhost:5000/auth`
2. Sign up with:
   - Email: `test@example.com`
   - Username: `testwriter`
   - Display Name: `Test Writer`
   - Password: `Test1234!`
   - Role: `Writer`
3. Check Supabase Dashboard → **Authentication** → **Users** to see your new user!

## 🎉 You're Done!

Your app now has:
- ✅ Real PostgreSQL database
- ✅ Supabase Authentication
- ✅ Row Level Security
- ✅ Real-time capabilities (ready to use)
- ✅ Automatic backups
- ✅ Production-ready infrastructure

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env` file exists in project root
- Restart your dev server after creating `.env`
- Check that variable names match exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### "relation 'users' does not exist"
- Run the migration SQL script in Supabase SQL Editor
- Check **Database** → **Tables** to verify tables were created

### Auth not working
- Go to **Authentication** → **Providers** and enable **Email**
- Check **Authentication** → **URL Configuration** and add your app URL (`http://localhost:5000`)

### RLS errors
- The migration creates policies automatically
- If you see "policy" errors, re-run the RLS section of the migration

## Next Steps

1. **Storage**: Set up Supabase Storage for file uploads (covers, avatars, products)
2. **Real-time**: Enable real-time subscriptions for live updates
3. **Edge Functions**: Deploy serverless functions for complex logic
4. **Production**: Deploy to Vercel/Netlify with environment variables set

## Useful Links

- [Supabase Docs](https://supabase.com/docs)
- [Auth Guide](https://supabase.com/docs/guides/auth)
- [Database Guide](https://supabase.com/docs/guides/database)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
