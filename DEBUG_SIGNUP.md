# 🔍 Signup Redirect Debugging Guide

## Current Status
Added comprehensive logging to track the signup and redirect flow.

## How to Debug

### Step 1: Open Browser Console
1. Open your browser's Developer Tools (F12)
2. Go to the **Console** tab
3. Clear the console

### Step 2: Attempt Signup
1. Fill in the signup form with:
   - Email: test@example.com
   - Username: testuser
   - Display Name: Test User  
   - Password: password123
   - Role: **Writer**
2. Click "Sign Up"

### Step 3: Check Console Logs

You should see logs in this order:

```
📝 Starting registration for: test@example.com
🔐 Auth signup result: { authData: {...}, authError: null }
👤 Profile creation result: { profileError: null }
✅ Registration successful! Data: {...}
📧 Session: {...} or null
👤 User: {...}
🔍 AuthPage useEffect - user: {...} or null
🔍 User role: "writer" or undefined
🔍 User username: "testuser" or undefined
```

## Common Issues & Solutions

### Issue 1: Session is NULL
**Symptoms:** 
- `📧 Session: null` in console
- `❌ No user object available yet` appears

**Cause:** Supabase email confirmation is enabled

**Solution:** Disable email confirmation in Supabase:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** > **Settings**
4. Scroll to **Email Auth**
5. **Disable** "Enable email confirmations"
6. Click Save

### Issue 2: User Object is NULL
**Symptoms:**
- `🔍 AuthPage useEffect - user: null`
- No redirect happens

**Cause:** Session query not refetching after registration

**Solution:** Check RLS policies (see below)

### Issue 3: Profile Creation Fails
**Symptoms:**
- `👤 Profile creation result: { profileError: {...} }`

**Cause:** RLS policy blocking INSERT

**Solution:** Run the RLS fix migration (`002_fix_rls_policies.sql`)

## Required Supabase Settings

### 1. Disable Email Confirmation
- Authentication > Settings > Email Auth
- **Disable** "Enable email confirmations"

### 2. Run Both Migrations
Execute in Supabase SQL Editor:
1. `001_initial_schema.sql` - Creates tables
2. `002_fix_rls_policies.sql` - Fixes INSERT permissions

### 3. Verify RLS Policies
Run this query in SQL Editor:
```sql
SELECT * FROM users WHERE id = auth.uid();
```
Should return your user row.

## What the Logs Tell You

| Log Message | Meaning | Action if Missing |
|-------------|---------|-------------------|
| `📝 Starting registration` | Form submitted | Check form validation |
| `🔐 Auth signup result` | Supabase auth created user | Check Supabase dashboard |
| `👤 Profile creation` | Database profile created | Check RLS policies |
| `✅ Registration successful` | All mutations completed | - |
| `📧 Session: {...}` | User logged in | **Must not be null** |
| `🔍 User role: "writer"` | Profile fetched correctly | Check user query |
| `✅ Redirecting to: /writer/...` | Navigation triggered | - |

## Next Steps

1. Try signing up again
2. Watch the console carefully
3. **Screenshot the console output** and share it
4. This will tell us exactly where the process is breaking

## Expected Working Flow

```mermaid
Registration → Auth Created → Profile Created → Session Created → User Fetched → Redirect
     ✅              ✅              ✅               ✅              ✅           ✅
```

If any step shows ❌, that's where we need to fix!
