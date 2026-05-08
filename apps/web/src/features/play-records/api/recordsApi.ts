import type { PlayRecord } from '@/shared/types';
import { apiFetch } from '@/shared/api/client';

export function getPlayRecords(): Promise<PlayRecord[]> {
  return apiFetch<PlayRecord[]>('/play-records');
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