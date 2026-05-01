import { queryClient } from "./queryClient";

/**
 * High-performance prefetching utility for the "Beyond Rocket Mode" experience.
 */

const prefetchedUrls = new Set<string>();

export const prefetchImage = (url: string) => {
  if (!url || prefetchedUrls.has(url)) return;
  
  const img = new Image();
  img.src = url;
  img.decoding = 'async';
  prefetchedUrls.add(url);
};

export const prefetchData = async (key: any[], fn: () => Promise<any>) => {
  return queryClient.prefetchQuery({
    queryKey: key,
    queryFn: fn,
    staleTime: 1000 * 60 * 5, // Keep prefetched data fresh for 5 mins
  });
};

/**
 * Intelligent viewport prefetcher for heavy assets
 */
export const observeAndPrefetch = (element: HTMLElement, url: string) => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        prefetchImage(url);
        observer.unobserve(element);
      }
    });
  }, { rootMargin: '200px' });
  
  observer.observe(element);
};
