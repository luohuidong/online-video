import type { PlayRecord } from '@/shared/types';
import { apiFetch } from '@/shared/api/client';

export function getPlayRecord(
  sourceId: string,
  sourceVideoId: string,
): Promise<PlayRecord | null> {
  return apiFetch<PlayRecord | null>(
    `/play-records/${encodeURIComponent(sourceId)}/${encodeURIComponent(sourceVideoId)}`,
  );
}

export function upsertPlayRecord(
  record: Omit<PlayRecord, 'id' | 'updatedAt'>,
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>('/play-records', {
    method: 'PUT',
    body: JSON.stringify(record),
  });
}

export { getPlayRecords } from '@/features/play-records/api/recordsApi';