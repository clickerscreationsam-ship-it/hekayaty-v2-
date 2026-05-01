import { useState, useMemo } from "react";

export type SortOption = "default" | "price-low-high" | "price-high-low" | "top-rated";

interface SortableItem {
    price?: number | null;
    rating?: number | null;
    [key: string]: any;
}

export function useSort<T extends SortableItem>(items: T[]) {
    const [sortBy, setSortBy] = useState<SortOption>("default");

    const sortedItems = useMemo(() => {
        if (!items) return [];
        const sorted = [...items];

        switch (sortBy) {
            case "price-low-high":
                return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
            case "price-high-low":
                return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
            case "top-rated":
                return sorted.sort((a, b) => {
                    const ratingA = a.rating || 0;
                    const ratingB = b.rating || 0;
                    if (ratingA === 0 && ratingB !== 0) return 1;
                    if (ratingB === 0 && ratingA !== 0) return -1;
                    return ratingB - ratingA;
                });
            default:
                return sorted;
        }
    }, [items, sortBy]);

    return {
        sortBy,
        setSortBy,
        sortedItems
    };
}
