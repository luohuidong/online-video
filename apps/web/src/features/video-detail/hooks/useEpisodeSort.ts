import { useState, useCallback } from 'react';

interface UseEpisodeSortResult {
  sortDesc: boolean;
  toggleSort: () => void;
}

export function useEpisodeSort(source: string, id: string): UseEpisodeSortResult {
  const sortKey = `episode-sort:${source}:${id}`;
  const [sortDesc, setSortDesc] = useState(() => localStorage.getItem(sortKey) !== 'asc');

  const toggleSort = useCallback(() => {
    setSortDesc((prev) => {
      const next = !prev;
      localStorage.setItem(sortKey, next ? 'desc' : 'asc');
      return next;
    });
  }, [sortKey]);

  return { sortDesc, toggleSort };
}
