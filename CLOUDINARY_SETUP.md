# ☁️ Cloudinary Upload Setup

To enable image uploads for your Store Logo and Banner, you need to add your Cloudinary credentials.

## 1. Get Your Cloudinary Keys
1.  Log in to your [Cloudinary Console](https://console.cloudinary.com/).
2.  Go to **Settings** (gear icon) -> **Access Keys**.
3.  Copy your **Cloud Name**.
4.  Copy your **Upload Preset** (Instructions below if you don't have one).

## 2. Create an Upload Preset (If you don't have one)
1.  Go to **Settings** -> **Upload**.
2.  Scroll down to **Upload presets**.
3.  Click **Add upload preset**.
4.  **Name**: `hekayaty_preset` (or whatever you like, just remember it).
5.  **Signing Mode**: `Unsigned` (This is important for direct browser uploads!).
6.  Click **Save**.

## 3. Add to Environment Variables
Open your `.env` file in the project root and add these lines:

```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
VITE_CLOUDINARY_UPLOAD_PRESET=hekayaty_preset
```

*(Replace `your_cloud_name_here` with your actual cloud name)*

## 4. Restart Server
After saving `.env`, restart your development server to load the new variables:

```bash
Ctrl+C
npm run dev
```

## ✅ Test It
1.  Go to **Dashboard** -> **Store Branding**.
2.  You should now see upload areas for **Store Logo** and **Store Banner**.
3.  Try uploading an image!
