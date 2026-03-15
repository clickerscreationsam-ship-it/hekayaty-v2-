import React, { useMemo } from 'react';
import { List } from 'react-window';
import { useWindowSize } from '@/hooks/use-window-size';

interface VirtualizedGridProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  itemHeight: number;
  gap?: number;
}

export function VirtualizedGrid<T>({ items, renderItem, itemHeight, gap = 32 }: VirtualizedGridProps<T>) {
  const { width } = useWindowSize();

  const columns = useMemo(() => {
    if (width < 640) return 1; // sm
    if (width < 1024) return 2; // lg
    return 4;
  }, [width]);

  const rows = Math.ceil(items.length / columns);

  function Row({ index, style }: { index: number; style: React.CSSProperties }) {
    const startIndex = index * columns;
    const rowItems = items.slice(startIndex, startIndex + columns);

    return (
      <div 
        style={{ 
          ...style, 
          display: 'grid', 
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: `${gap}px`,
          paddingBottom: `${gap}px`
        }}
      >
        {rowItems.map((item, i) => (
          <div key={startIndex + i}>
            {renderItem(item)}
          </div>
        ))}
      </div>
    );
  }

  const VirtualizedList = List as any;

  return (
    <VirtualizedList
      height={800} 
      itemCount={rows}
      itemSize={itemHeight + gap}
      width="100%"
      style={{ overflowX: 'hidden' }}
    >
      {Row as any}
    </VirtualizedList>
  );
}
