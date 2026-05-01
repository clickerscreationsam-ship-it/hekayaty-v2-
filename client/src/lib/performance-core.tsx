import React, { useRef, useCallback, useState, useEffect } from 'react';
import { queryClient } from './queryClient';

// --- CONFIGURATION ---
const MAX_CACHE_ITEMS = 100;
const PREFETCH_DEBOUNCE_MS = 150;
const MAX_CONCURRENT_PREFETCH = 3;
const STALE_TIME = 5 * 60 * 1000; // 5 Minutes

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

// --- 2. SMART IMAGE OPTIMIZATION (BEYOND CLOUDINARY) ---
export const optimizeImage = (url: string | null | undefined, width: number = 800): string => {
  if (!url) return '';
  
  // Cloudinary Optimization
  if (url.includes('cloudinary.com')) {
    const separator = '/upload/';
    const parts = url.split(separator);
    if (parts.length === 2) {
      return `${parts[0]}${separator}f_auto,q_auto:best,w_${width},c_limit,g_auto/${parts[1]}`;
    }
  }

  // Supabase Storage Optimization
  // Note: Appending width/quality requires Supabase Pro plan with Image Transformations enabled.
  // We disable it by default to prevent 400 errors on standard projects.
  if (url.includes('storage.supabase.co')) {
    // return `${url}?width=${width}&quality=75&format=webp`;
    return url;
  }
  
  return url;
};

// --- 3. PREFETCH MANAGER ---
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

const prefetchedUrls = new Set<string>();

export const prefetchImage = (url: string) => {
  if (!url || prefetchedUrls.has(url)) return;
  
  const img = new Image();
  img.src = url;
  img.decoding = 'async';
  prefetchedUrls.add(url);
};

// --- 4. LAZY SECTION (VIEWPORT RENDERING) ---
export const LazySection: React.FC<{ children: React.ReactNode; offset?: string; fallback?: React.ReactNode }> = ({ 
  children, 
  offset = "300px", 
  fallback = <div className="min-h-[200px] animate-pulse bg-white/5 rounded-3xl" /> 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: offset }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [offset]);

  return <div ref={ref}>{isVisible ? children : fallback}</div>;
};

// --- 5. PREFETCH HOVER HOOK ---
export function usePrefetchHover(queryKey: any[], fetcher: () => Promise<any>) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const onMouseEnter = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      manager.run(async () => {
        const keyString = JSON.stringify(queryKey);
        lruTracker.use(keyString);

        if (!queryClient.getQueryData(queryKey)) {
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

// --- 6. ADAPTIVE IMAGE COMPONENT ---
export const AdaptiveImage: React.FC<React.ImgHTMLAttributes<HTMLImageElement> & { width?: number }> = ({ 
  src, 
  width = 800, 
  className, 
  alt, 
  ...props 
}) => {
  const [loaded, setLoaded] = useState(false);
  const optimizedSrc = optimizeImage(src, width);

  return (
    <div className={cn("relative overflow-hidden bg-white/5", className)}>
      <img
        src={optimizedSrc}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={cn(
          "w-full h-full object-cover transition-all duration-700",
          loaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-105 blur-lg"
        )}
        {...props}
      />
    </div>
  );
};

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

