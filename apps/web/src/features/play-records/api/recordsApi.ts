import { apiFetch } from '@/shared/api/client';
import type { PlayRecord } from '@/shared/types';

export function getPlayRecords(): Promise<PlayRecord[]> {
  return apiFetch<PlayRecord[]>('/play-records');
}

export function deletePlayRecord(
  sourceId: string,
  sourceVideoId: string,
): Promise<void> {
  return apiFetch<void>(
    `/play-records/${encodeURIComponent(sourceId)}/${encodeURIComponent(sourceVideoId)}`,
    { init: { method: 'DELETE' } },
  );
}

export function clearPlayRecords(): Promise<void> {
  return apiFetch<void>('/play-records', { init: { method: 'DELETE' } });
}

export function getPlayRecord(
  sourceId: string,
  sourceVideoId: string,
): Promise<PlayRecord | null> {
  return apiFetch<PlayRecord | null>(
    `/play-records/${encodeURIComponent(sourceId)}/${encodeURIComponent(sourceVideoId)}`,
  );
}
