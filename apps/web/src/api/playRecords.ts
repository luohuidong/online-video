import type { PlayRecord } from '@/types';
import { apiFetch } from './client';

export function getPlayRecords(): Promise<PlayRecord[]> {
  return apiFetch<PlayRecord[]>('/play-records');
}

export function upsertPlayRecord(
  record: Omit<PlayRecord, 'id' | 'updatedAt'>,
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>('/play-records', {
    method: 'PUT',
    body: JSON.stringify(record),
  });
}

export function deletePlayRecord(sourceId: string, sourceVideoId: string): Promise<void> {
  return apiFetch<void>(
    `/play-records/${encodeURIComponent(sourceId)}/${encodeURIComponent(sourceVideoId)}`,
    { method: 'DELETE' },
  );
}

export function clearPlayRecords(): Promise<void> {
  return apiFetch<void>('/play-records', { method: 'DELETE' });
}

export function getPlayRecord(sourceId: string, sourceVideoId: string): Promise<PlayRecord | null> {
  return apiFetch<PlayRecord | null>(
    `/play-records/${encodeURIComponent(sourceId)}/${encodeURIComponent(sourceVideoId)}`,
  );
}
