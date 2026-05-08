import type { Favorite } from '@/shared/types';
import { apiFetch } from '@/shared/api/client';

export function getFavorites(): Promise<Favorite[]> {
  return apiFetch<Favorite[]>('/favorites');
}

export function addFavorite(favorite: { video: Omit<Favorite['video'], 'id'> }): Promise<Favorite> {
  return apiFetch<Favorite>('/favorites', {
    method: 'POST',
    body: JSON.stringify(favorite),
  });
}

export function removeFavorite(id: number): Promise<void> {
  return apiFetch<void>(`/favorites/${id}`, { method: 'DELETE' });
}

export function clearFavorites(): Promise<void> {
  return apiFetch<void>('/favorites', { method: 'DELETE' });
}
