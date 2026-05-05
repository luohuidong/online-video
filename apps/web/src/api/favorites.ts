import type { Favorite } from '@/types';
import { apiFetch } from './client';

export function getFavorites(): Promise<Favorite[]> {
  return apiFetch<Favorite[]>('/favorites');
}

export function addFavorite(favorite: Omit<Favorite, 'id' | 'updatedAt'>): Promise<Favorite> {
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
