# 🚀 Quick Setup Checklist for YOUR Project

## ✅ Step 1: Environment Variables (DONE!)
Your `.env` file has been created with:
- Supabase URL: `https://stjrmckunewmncbakeoa.supabase.co`
- Anon Key: Configured ✅
- Service Role Key: Configured ✅

## 🎯 Step 2: Run Database Migration (DO THIS NOW!)

### Option A: Supabase Dashboard (Recommended)
1. Go to https://supabase.com/dashboard/project/stjrmckunewmncbakeoa
2. Click **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy the ENTIRE contents of `supabase/migrations/001_initial_schema.sql`
5. Paste into the editor
6. Click **RUN** (or press Ctrl+Enter)
7. Wait for "Success" message ✅

### Option B: Using File Upload
1. In SQL Editor, click the "⋮" menu
2. Select "Upload SQL file"
3. Choose `supabase/migrations/001_initial_schema.sql`
4. Click **Run**

## ✅ Step 3: Verify Tables Created
After running migration:
1. Go to **Database** → **Tables** in Supabase Dashboard
2. You should see:
   - ✅ users
   - ✅ products
   - ✅ cart_items
   - ✅ orders
   - ✅ order_items
   - ✅ reviews
   - ✅ follows
   - ✅ likes
   - ✅ saved_library
   - ✅ coupons
   - ✅ earnings

## ✅ Step 4: Enable Email Auth
1. Go to **Authentication** → **Providers**
2. Make sure **Email** is enabled (toggle ON)
3. For faster testing, you can disable email confirmation:
   - Go to **Authentication** → **Email Templates**
   - Disable "Confirm signup" (optional for development)

## 🚀 Step 5: Start Your App!

```bash
# Install dependencies if needed
npm install

# Start development server
npm run dev
```

Your app will now be connected to Supabase! 🎉

## 🧪 Test Your Setup

1. Navigate to http://localhost:5000/auth
2. Click "Sign Up"
3. Create an account:
   - Email: `test@example.com`
   - Username: `testwriter`
   - Display Name: `Test Writer`
   - Password: `Test1234!`
   - Role: `Writer`
4. Click **Sign Up**

### Verify in Supabase Dashboard:
1. Go to **Authentication** → **Users**
   - You should see your new user! ✅
2. Go to **Database** → **users** table
   - You should see the user profile with username, display_name, role! ✅

## 🎯 What's Connected:

✅ Frontend → Supabase (via `client/src/lib/supabase.ts`)
✅ Authentication → Supabase Auth (email/password)
✅ Database → PostgreSQL (your tables)
✅ Security → Row Level Security (RLS policies)

## ⚠️ Important Notes:

1. **Never commit `.env` to git!** (Already in `.gitignore`)
2. **Service Role Key** is sensitive - only use server-side
3. **Anon Key** is safe to use in frontend (already configured)

## 🆘 Troubleshooting:

### "Missing Supabase environment variables"
→ Restart your dev server: `npm run dev`

### Migration errors
→ Make sure you copied the ENTIRE SQL file
→ Check Supabase Dashboard → **Database** → **Logs** for details

### Auth not working
→ Verify Email provider is enabled in **Authentication** → **Providers**

## 🎉 You're Ready!

Once you:
1. ✅ Run the migration SQL
2. ✅ Enable Email auth
3. ✅ Restart dev server

Your Hekayaty Store will be **FULLY OPERATIONAL** with:
- Real database
- User authentication
- Shopping cart
- Orders
- Creator earnings (80/20 split)
- RLS security

**GO RUN THAT MIGRATION NOW!** 🚀
