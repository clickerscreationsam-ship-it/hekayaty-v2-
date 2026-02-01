# 🚨 DNS Resolution Error - Cannot Connect to Supabase

## ❌ Current Problem

Your computer **cannot resolve** the Supabase domain:
```
stbwxgnjzmmnjgdrkwmf.supabase.co
```

Error: `net::ERR_NAME_NOT_RESOLVED`

This means the domain name cannot be translated to an IP address.

---

## 🔍 Diagnosis Results

```bash
# Test 1: Ping
❌ FAILED: "Ping request could not find host"

# Test 2: DNS Lookup
❌ FAILED: "Non-existent domain"

# Test 3: DNS Cache
✅ CLEARED: Successfully flushed
```

---

## 🛠️ Solutions (Try Each One)

### Solution 1: Verify Supabase Project Status ⭐ (MOST IMPORTANT)

Your Supabase project might be **paused**, **deleted**, or the **URL might be wrong**.

1. **Go to Supabase Dashboard**:
   https://supabase.com/dashboard/projects

2. **Check if your project exists**:
   - Look for project: **stbwxgnjzmmnjgdrkwmf**
   - Status should be: **Active** (green)

3. **If project is PAUSED**:
   - Click on the project
   - Click **"Restore Project"**
   - Wait 2-3 minutes for it to activate

4. **If project doesn't exist**:
   - You need to create a new Supabase project
   - Or check if you're logged into the correct account

5. **Get the correct project URL**:
   - Click on your project
   - Go to `Settings` → `API`
   - Copy the **Project URL** (should look like: `https://xxx.supabase.co`)
   - Compare with your `.env` file

---

### Solution 2: Change DNS Server to Google DNS

Your current DNS server cannot resolve Supabase domains. Try using Google's public DNS:

**Steps**:

1. **Open Network Settings**:
   - Press `Win + R`
   - Type: `ncpa.cpl`
   - Press Enter

2. **Configure DNS**:
   - Right-click your active network adapter
   - Select **Properties**
   - Select **Internet Protocol Version 4 (TCP/IPv4)**
   - Click **Properties**

3. **Set DNS Servers**:
   - Select **"Use the following DNS server addresses"**
   - Preferred DNS: `8.8.8.8` (Google)
   - Alternate DNS: `8.8.4.4` (Google)
   - Click **OK**

4. **Flush DNS Again**:
   ```powershell
   ipconfig /flushdns
   ipconfig /registerdns
   ```

5. **Test Connection**:
   ```powershell
   ping stbwxgnjzmmnjgdrkwmf.supabase.co
   ```

**Alternative DNS Options**:
- **Cloudflare**: `1.1.1.1` and `1.0.0.1`
- **OpenDNS**: `208.67.222.222` and `208.67.220.220`

---

### Solution 3: Check Internet Connection & Firewall

1. **Test general internet**:
   ```powershell
   ping google.com
   ping 8.8.8.8
   ```

2. **Test if you can reach other Supabase domains**:
   ```powershell
   ping supabase.com
   ```

3. **Check Windows Firewall**:
   - Open Windows Security
   - Go to **Firewall & network protection**
   - Click **"Allow an app through firewall"**
   - Make sure your browser is allowed

4. **Disable antivirus temporarily** (for testing):
   - Some antivirus software blocks new domains
   - Try disabling it for 5 minutes
   - Test if Supabase loads
   - Re-enable immediately after

---

### Solution 4: Check VPN/Proxy

If you're using a VPN or proxy:

1. **Disable VPN** temporarily
2. **Clear browser cache**
3. **Try accessing Supabase again**

Some VPNs block cloud services or have DNS issues.

---

### Solution 5: Clear Browser DNS Cache

**For Chrome/Edge**:
1. Open: `chrome://net-internals/#dns`
2. Click **"Clear host cache"**
3. Restart browser

**For Firefox**:
1. Type in address bar: `about:networking#dns`
2. Click **"Clear DNS Cache"**
3. Restart browser

---

### Solution 6: Restart Network Adapter

```powershell
# Run as Administrator
netsh winsock reset
netsh int ip reset

# Restart computer
```

---

## 🧪 Testing After Fixes

After applying any solution, test with these commands:

### Test 1: DNS Resolution
```powershell
nslookup stbwxgnjzmmnjgdrkwmf.supabase.co
```

**Expected**: Should show an IP address (not "Non-existent domain")

### Test 2: Ping
```powershell
ping stbwxgnjzmmnjgdrkwmf.supabase.co
```

**Expected**: Should get replies with IP address

### Test 3: Access in Browser
```
https://stbwxgnjzmmnjgdrkwmf.supabase.co
```

**Expected**: Should load (might show a Supabase error page, but NOT a DNS error)

---

## 🎯 Most Likely Causes (Ranked)

### 1. ⭐⭐⭐ Supabase Project is Paused/Deleted (90% probability)
   - **Fix**: Restore project in Supabase Dashboard
   - **How to check**: Visit https://supabase.com/dashboard/projects

### 2. ⭐⭐ WiFi/ISP DNS Server Issue (50% probability)
   - **Fix**: Change to Google DNS (8.8.8.8)
   - **How to check**: Try on phone hotspot or different WiFi

### 3. ⭐ Firewall/Antivirus Blocking (30% probability)
   - **Fix**: Temporarily disable and test
   - **How to check**: Try with firewall off

### 4. VPN/Proxy Issue (20% probability)
   - **Fix**: Disconnect VPN
   - **How to check**: Try without VPN

---

## 🔧 Quick Fix Guide (30 Seconds)

**Most common solution**:

1. **Go to**: https://supabase.com/dashboard/projects
2. **Find your project**: stbwxgnjzmmnjgdrkwmf
3. **Check status**: Is it PAUSED? 
4. **If paused**: Click "Restore Project"
5. **Wait 2-3 minutes**
6. **Refresh your app**: http://localhost:5000

---

## 📞 If Nothing Works

If you've tried everything above and it still doesn't work:

### Option A: Create a New Supabase Project

1. Go to: https://supabase.com/dashboard
2. Click **"New Project"**
3. Name: `Hekayaty Store v2`
4. Choose region: **Closest to you**
5. Set database password
6. Click **"Create new project"**
7. Wait 2-3 minutes for provisioning
8. Copy the new **Project URL** and **API Keys**
9. Update your `.env` file with new credentials
10. Run the `SETUP_DB.sql` script again in SQL Editor

### Option B: Use Local Development (Alternative)

If Supabase is completely inaccessible, you can temporarily use the in-memory storage:

1. Comment out Supabase in `.env`:
   ```bash
   # VITE_SUPABASE_URL=...
   # VITE_SUPABASE_ANON_KEY=...
   ```

2. The app will fall back to MemStorage (local data)
3. This is temporary - you won't have persistent data

---

## ✅ Success Indicators

You'll know it's fixed when:

- [ ] `nslookup` shows an IP address
- [ ] `ping` gets replies
- [ ] Browser can load `https://stbwxgnjzmmnjgdrkwmf.supabase.co`
- [ ] Your app loads without DNS errors
- [ ] Sign up works without "Failed to fetch" error

---

## 📊 Current Error Details

```
Error: net::ERR_NAME_NOT_RESOLVED
URL: https://stbwxgnjzmmnjgdrkwmf.supabase.co/auth/v1/signup
Meaning: DNS lookup failed - domain name cannot be resolved to IP
Location: Browser → DNS Server → No response
```

---

**Next Step**: Check your Supabase Dashboard to see if the project exists and is active!

**Dashboard URL**: https://supabase.com/dashboard/projects

Look for project with reference: `stbwxgnjzmmnjgdrkwmf`

---

**Last Updated**: January 21, 2026, 12:28 PM
**Status**: DNS Resolution Failure
**Action Required**: Verify Supabase project status
