/**
 * 🚀 Writers Dashboard Preloader (Beyond Rocket Mode)
 * Implements extreme-performance prefetching for the dashboard layer.
 */

import { queryClient } from './queryClient';
import { supabase } from '@/lib/supabase';
import { optimizeImage, prefetchImage } from './performance-core';
import { persistence } from './persistence';

// --- CONFIG ---
const DASHBOARD_ASSETS = [
  "https://res.cloudinary.com/hekayaty/image/upload/v1/assets/dashboard_bg" // Example placeholder
];

/**
 * Main preloader logic to be called at App initialization.
 */
export const preloadWritersDashboard = async () => {
  console.log("🔦 [Beyond Rocket] Initializing Dashboard Preloader...");

  try {
    // 1. Check for Session (restored from IndexedDB or Auth)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const userId = session.user.id;

    // 2. Prefetch Priority Dashboard Data
    const prefetchPromises = [
      // Products for the current writer
      queryClient.prefetchQuery({
        queryKey: ["/api/products", { writerId: userId }],
        queryFn: async () => {
          const { data } = await supabase.from('products').select('*').eq('writer_id', userId);
          return data;
        },
        staleTime: 60 * 1000
      }),

      // Earnings Overview (Instant state from local or revalidate)
      queryClient.prefetchQuery({
        queryKey: ['earnings-overview', userId],
        queryFn: async () => {
          const { data } = await supabase.functions.invoke('earnings-overview', { 
            method: 'GET',
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          });
          persistence.set(`query:earnings-overview:${userId}`, data).catch(console.error);
          return data;
        },
        staleTime: 30 * 1000
      }),

      // Seller Orders
      queryClient.prefetchQuery({
        queryKey: ['seller-orders'],
        queryFn: async () => {
          const { data } = await supabase.functions.invoke('seller-orders', { 
            method: 'GET',
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          });
          return data;
        }
      })
    ];

    // 3. Pre-optimize and Preload Dashboard Specific Images
    DASHBOARD_ASSETS.forEach(asset => prefetchImage(optimizeImage(asset, 1200)));

    // 4. Background asset decoding for top 3 products
    const products = queryClient.getQueryData<any[]>(["/api/products", { writerId: userId }]);
    if (products) {
      products.slice(0, 3).forEach(p => {
        if (p.coverUrl) prefetchImage(optimizeImage(p.coverUrl, 800));
      });
    }

    await Promise.allSettled(prefetchPromises);
    console.log("✅ [Beyond Rocket] Dashboard Data Preloaded.");
  } catch (err) {
    console.warn("⚠️ Dashboard preloading partially failed:", err);
  }
};
