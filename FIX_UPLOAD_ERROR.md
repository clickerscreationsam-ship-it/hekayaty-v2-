# 🚨 Fix: Create Missing Upload Preset

Your code is trying to use an upload preset named `hekayaty_preset`, but it doesn't exist in your Cloudinary account yet.

## Step-by-Step Instructions

1.  **Log in to Cloudinary:**
    Go to [https://console.cloudinary.com/](https://console.cloudinary.com/) and log in.

2.  **Go to Upload Settings:**
    *   Click the **Settings icon** (⚙️) at the top right (or bottom left depending on your layout).
    *   Click on the **"Upload"** tab in the side menu.

3.  **Add New Preset:**
    *   Scroll down to the **"Upload presets"** section.
    *   Click the link/button that says **"Add upload preset"**.

4.  **Configure Exactly Like This:**
    *   **Upload preset name:** `hekayaty_preset`
        *(Copy and paste this exactly!)*
    *   **Signing Mode:** Select **"Unsigned"**
        *(This is crucial - otherwise uploads will fail!)*

5.  **Save:**
    *   Click the **"Save"** button at the top (or bottom).

## ✅ Try Again
Once saved, go back to your Hekayaty Dashboard and try uploading the image again. It should work immediately without restarting!
