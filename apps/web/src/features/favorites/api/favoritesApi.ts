import { apiFetch } from '@/shared/api/client';
import type { AddFavoriteInput, Favorite } from '@/shared/types';

export function getFavorites(): Promise<Favorite[]> {
  return apiFetch<Favorite[]>('/favorites');
}

export function addFavorite(favorite: AddFavoriteInput): Promise<Favorite> {
  return apiFetch<Favorite>('/favorites', {
    init: {
      method: 'POST',
      body: JSON.stringify(favorite),
    },
  });
}

export function removeFavorite(id: number): Promise<void> {
  return apiFetch<void>(`/favorites/${id}`, { init: { method: 'DELETE' } });
}

export function touchFavorite(
  id: number,
): Promise<{ ok: true; updatedAt: number }> {
  return apiFetch<{ ok: true; updatedAt: number }>(`/favorites/${id}`, {
    init: { method: 'PATCH' },
  });
}

export function clearFavorites(): Promise<void> {
  return apiFetch<void>('/favorites', { init: { method: 'DELETE' } });
}

export function batchUpdateVideos(
  sourceGroups: Array<{ sourceId: string; sourceVideoIds: string[] }>,
): Promise<void> {
  return apiFetch<void>('/videos/batch-update', {
    init: {
      method: 'POST',
      body: JSON.stringify({ sourceGroups }),
    },
    timeoutMs: 90000,
  });
}
