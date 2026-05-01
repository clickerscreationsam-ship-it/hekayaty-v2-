# 🔧 Restart Dev Server to Load Environment Variables

## The Issue:
The `.env` file was created AFTER the dev server started, so the environment variables weren't loaded.

## Quick Fix:

### **Option 1: Restart in Your Terminal** (Recommended)
1. In your terminal running `npm run dev`:
2. Press **Ctrl+C** to stop the server
3. Run `npm run dev` again
4. ✅ The `.env` file will now be loaded!

### **Option 2: Kill Port 5000 and Restart**

**Windows PowerShell:**
```powershell
# Find the process using port 5000
netstat -ano | findstr :5000

# Kill it (replace PID with the number you see)
taskkill /PID <PID> /F

# Restart
npm run dev
```

**Linux/Mac:**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Restart
npm run dev
```

### **Option 3: Use a Different Port**
Edit `.env` and change:
```env
PORT=5001
```
Then restart `npm run dev`

---

## ✅ After Restarting:

Your app should load without the "Missing Supabase environment variables" error!

Then you can:
1. Go to http://localhost:5000 (or 5001)
2. Navigate to `/auth`
3. Sign up and test Supabase connection!

---

## 🎯 Expected Result:

When you restart, you should see:
```
serving on port 5000
```

And your browser should load the app successfully! 🎉
