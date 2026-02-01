# 🔗 Supabase Connection Setup Guide

## ✅ Current Status

Your Supabase project is **partially connected**! Here's what's already configured:

### Already Set ✅
- **Supabase URL**: `https://stbwxgnjzmmnjgdrkwmf.supabase.co`
- **Anon Key**: ✅ Configured for frontend (VITE_SUPABASE_ANON_KEY)
- **Service Role Key**: ✅ Configured for backend (SUPABASE_SERVICE_ROLE_KEY)

### Missing ⚠️
- **DATABASE_URL**: Needed for Drizzle ORM (database migrations & schema management)

---

## 📝 Step-by-Step: Get Your DATABASE_URL

### Option 1: Connection Pooler (Recommended for Serverless)

1. **Go to your Supabase Dashboard**:
   - https://supabase.com/dashboard/project/stbwxgnjzmmnjgdrkwmf

2. **Navigate to**: `Settings` → `Database`

3. **Scroll to "Connection Pooling"** section

4. **Copy the "Connection string"** (Mode: Transaction)
   ```
   postgresql://postgres.stbwxgnjzmmnjgdrkwmf:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```

5. **Replace `[YOUR-PASSWORD]` with your actual database password**
   - If you forgot it, click "Reset Database Password"

6. **Update your `.env` file**:
   ```bash
   DATABASE_URL=postgresql://postgres.stbwxgnjzmmnjgdrkwmf:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

### Option 2: Direct Connection (For Local Development)

1. In Supabase Dashboard → `Settings` → `Database`

2. Scroll to **"Connection string"** section

3. Select **"URI"** tab

4. Copy the connection string:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.stbwxgnjzmmnjgdrkwmf.supabase.co:5432/postgres
   ```

5. Replace `[YOUR-PASSWORD]` and update `.env`:
   ```bash
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.stbwxgnjzmmnjgdrkwmf.supabase.co:5432/postgres
   ```

---

## 🔐 Security Note

⚠️ **NEVER commit your `.env` file to Git!**

The `.env` file is already in `.gitignore`, so it won't be committed. Always keep your credentials private.

---

## 🧪 Test Your Connection

After adding the `DATABASE_URL`, test the connection:

### 1. Test Drizzle Connection
```bash
npm run db:push
```

Expected output:
```
✓ Database connected successfully
✓ Schema pushed to database
```

### 2. Test Server Connection
```bash
npm run dev
```

Expected output:
```
✓ Supabase client initialized
✓ Server running on http://localhost:5000
```

### 3. Test Frontend Auth
1. Open http://localhost:5000/auth
2. Try to sign up with a test account
3. Check Supabase Dashboard → `Authentication` → `Users`
4. Your test user should appear!

---

## 📊 Verify Database Tables

Go to Supabase Dashboard → `Table Editor` and verify you see:

✅ users
✅ products
✅ cart_items
✅ orders
✅ order_items
✅ earnings
✅ payouts
✅ reviews
✅ follows
✅ likes
✅ saved_library
✅ coupons
✅ product_variants

---

## 🚀 Full Environment Variables Checklist

Your `.env` should have all of these:

```bash
# ✅ Frontend Supabase
VITE_SUPABASE_URL=https://stbwxgnjzmmnjgdrkwmf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# ✅ Backend Supabase
SUPABASE_URL=https://stbwxgnjzmmnjgdrkwmf.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# ⚠️ Database (YOU NEED TO ADD THIS)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@...

# ✅ App Config
PORT=5000
NODE_ENV=development

# ✅ Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=dl4kuowof
CLOUDINARY_API_KEY=155839618667289
CLOUDINARY_API_SECRET=Jvx-z2sxXsAoDWeikR1vEY20uqU
VITE_CLOUDINARY_UPLOAD_PRESET=hekayaty_preset
```

---

## 🔧 Common Issues & Solutions

### Issue 1: "Connection refused" or "ECONNREFUSED"
**Solution**: Check your DATABASE_URL is correct and your IP is allowed in Supabase.

**Fix**:
1. Go to Supabase Dashboard → `Settings` → `Database`
2. Scroll to "Connection Pooling"
3. Enable "Allow connections from anywhere" (or add your IP)

### Issue 2: "Authentication failed"
**Solution**: Your password is wrong.

**Fix**:
1. Go to Supabase Dashboard → `Settings` → `Database`
2. Click "Reset Database Password"
3. Copy the new password
4. Update `DATABASE_URL` in `.env`

### Issue 3: "relation 'users' does not exist"
**Solution**: You didn't run the SQL setup.

**Fix**:
1. Go to Supabase Dashboard → `SQL Editor`
2. Run the contents of `supabase/SETUP_DB.sql`

### Issue 4: "Missing environment variables"
**Solution**: Vite caching issue.

**Fix**:
```bash
# Stop the server (Ctrl+C)
# Delete Vite cache
rm -rf node_modules/.vite

# Restart
npm run dev
```

---

## 🎯 Quick Start (After Adding DATABASE_URL)

```bash
# 1. Install dependencies (if not done)
npm install

# 2. Verify environment variables
cat .env

# 3. Push database schema (optional, already done via SQL)
npm run db:push

# 4. Start development server
npm run dev

# 5. Open browser
# http://localhost:5000
```

---

## ✅ Connection Complete Checklist

- [x] VITE_SUPABASE_URL configured
- [x] VITE_SUPABASE_ANON_KEY configured
- [x] SUPABASE_URL configured
- [x] SUPABASE_SERVICE_ROLE_KEY configured
- [x] SQL tables created in Supabase
- [ ] **DATABASE_URL configured** ← YOU NEED THIS
- [ ] Server running successfully
- [ ] Can sign up/login
- [ ] Can create products

---

## 🆘 Need Help?

If you encounter any issues:

1. **Check Supabase Logs**:
   - Dashboard → `Logs` → `Postgres Logs`

2. **Check Browser Console**:
   - F12 → Console tab
   - Look for errors

3. **Check Server Logs**:
   - Terminal where `npm run dev` is running
   - Look for connection errors

4. **Verify credentials**:
   - Double-check all keys match Supabase Dashboard
   - No extra spaces or line breaks

---

**Your project is 95% connected!** Just add the `DATABASE_URL` and you're ready to go! 🚀
