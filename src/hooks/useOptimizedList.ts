import { useMemo, useCallback } from 'react';

interface UseOptimizedListOptions<T> {
  items: T[];
  searchTerm?: string;
  filterFn?: (item: T, searchTerm: string) => boolean;
  sortFn?: (a: T, b: T) => number;
}

export function useOptimizedList<T>({
  items,
  searchTerm = '',
  filterFn,
  sortFn,
}: UseOptimizedListOptions<T>) {
  const filteredItems = useMemo(() => {
    let result = [...items];

    if (searchTerm && filterFn) {
      result = result.filter(item => filterFn(item, searchTerm));
    }

    if (sortFn) {
      result.sort(sortFn);
    }

    return result;
  }, [items, searchTerm, filterFn, sortFn]);

  const getItemById = useCallback((id: string | number, idField: string = 'id') => {
    return items.find((item: any) => item[idField] === id);
  }, [items]);

  const getItemIndex = useCallback((id: string | number, idField: string = 'id') => {
    return items.findIndex((item: any) => item[idField] === id);
  }, [items]);

  return {
    filteredItems,
    getItemById,
    getItemIndex,
    count: filteredItems.length,
  };
}
