/**
 * 🚀 BEYOND ROCKET: SPECIAL FEATURES HOOKS
 * Integrated with LRU Cache, IndexedDB Persistence, and Performance Core.
 */

import { supabase } from "@/lib/supabase";
import { usePerformanceQuery } from "@/lib/performance-core";
import { persistence } from "@/lib/persistence";
import { StoreEvent, SuccessPartner } from "@shared/special-features-schema";

/**
 * FETCH ACTIVE EVENTS
 * Returns events where startDate <= now <= endDate
 */
export function useActiveEvents() {
  const now = new Date().toISOString();

  return usePerformanceQuery<StoreEvent[]>(
    ["/api/events", "active"],
    async () => {
      // 1. Fetch from Supabase with date filtering
      const { data, error } = await supabase
        .from("store_events")
        .select("*")
        .lte("startDate", now)
        .gte("endDate", now)
        .eq("isActive", true);

      if (error) throw error;

      // 2. Persist to IndexedDB for instant load next time
      persistence.set("/api/events/active", data).catch(console.error);

      return data || [];
    },
    {
      // Restoration strategy: React Query will use the data we push manually to cache in App.tsx
      // or we can use initialData from persistence if available.
    }
  );
}

/**
 * FETCH SUCCESS PARTNERS (DAR ALNASHR)
 */
export function useSuccessPartners() {
  return usePerformanceQuery<SuccessPartner[]>(
    ["/api/partners"],
    async () => {
      const { data, error } = await supabase
        .from("success_partners")
        .select("*")
        .order("name");

      if (error) throw error;

      // Persist to IndexedDB
      persistence.set("/api/partners", data).catch(console.error);

      return data || [];
    }
  );
}

/**
 * FETCH EVENT BOOKS (Used for prefetching details)
 */
export async function fetchEventBooks(bookIds: string[]) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .in("id", bookIds);

  if (error) throw error;
  return data || [];
}
