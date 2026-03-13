/**
 * 🚀 PERFORMANCE CORE: BEYOND ROCKET MODE
 * High-performance caching, predictive prefetching, and asset optimization.
 */

import { QueryClient, useQuery, UseQueryOptions, queryOptions } from '@tanstack/react-query';
import { useRef, useCallback } from 'react';
import { queryClient } from './queryClient';

// --- CONFIGURATION ---
const MAX_CACHE_ITEMS = 50;
const PREFETCH_DEBOUNCE_MS = 120;
const MAX_CONCURRENT_PREFETCH = 3;
const STALE_TIME = 60 * 1000; // 1 Minute

// --- 1. LRU CACHE TRACKER ---
class LRUCache<K> {
  private cache = new Set<K>();
  private max: number;

  constructor(maxSize: number = MAX_CACHE_ITEMS) {
    this.max = maxSize;
  }

  use(key: K) {
    this.cache.delete(key);
    this.cache.add(key);
    if (this.cache.size > this.max) {
      const oldest = this.cache.values().next().value;
      if (oldest !== undefined) this.cache.delete(oldest);
    }
  }
}

export const lruTracker = new LRUCache<string>();

// --- 2. CLOUDINARY OPTIMIZATION ---
export const optimizeImage = (url: string | null | undefined, width: number = 800): string => {
  if (!url) return '';
  if (!url.includes('cloudinary.com')) return url;
  
  // Clean existing transforms and add performance defaults
  const separator = '/upload/';
  const parts = url.split(separator);
  if (parts.length === 2) {
    return `${parts[0]}${separator}f_auto,q_auto,w_${width},c_limit/${parts[1]}`;
  }
  return url;
};

// --- 3. PREFETCH MANAGER (CONCURRENCY CONTROL) ---
class PrefetchManager {
  private activeRequests = 0;

  async run(fn: () => Promise<any>) {
    if (this.activeRequests >= MAX_CONCURRENT_PREFETCH) return;
    
    this.activeRequests++;
    try {
      await fn();
    } finally {
      this.activeRequests--;
    }
  }
}

const manager = new PrefetchManager();

// --- 4. INTELLIGENT HOVER HOOK ---
export function usePrefetchHover(queryKey: any[], fetcher: () => Promise<any>) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const onMouseEnter = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      manager.run(async () => {
        const keyString = JSON.stringify(queryKey);
        lruTracker.use(keyString);

        if (!queryClient.getQueryData(queryKey)) {
          console.debug(`📡 [Beyond Rocket] Prefetching: ${queryKey.join('/')}`);
          await queryClient.prefetchQuery({
            queryKey,
            queryFn: fetcher,
            staleTime: STALE_TIME,
          });
        }
      });
    }, PREFETCH_DEBOUNCE_MS);
  }, [queryKey, fetcher]);

  const onMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { onMouseEnter, onMouseLeave };
}

// --- 5. ENHANCED QUERY HOOK ---
export function usePerformanceQuery<T>(
  queryKey: any[],
  queryFn: () => Promise<T>,
  options?: Partial<UseQueryOptions<T>>
) {
  // Track usage for LRU
  lruTracker.use(JSON.stringify(queryKey));

  return useQuery({
    queryKey,
    queryFn,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: true,
    ...options,
  } as any);
}
// --- 6. CORE PREFETCH PRIMITIVES ---
export const prefetchImage = (url: string) => {
  if (!url) return;
  const img = new Image();
  img.src = url;
};

export const prefetchData = (queryKey: any[], fetcher: () => Promise<any>) => {
  manager.run(async () => {
    await queryClient.prefetchQuery({
      queryKey,
      queryFn: fetcher,
      staleTime: STALE_TIME
    });
  });
};
