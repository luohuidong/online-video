import { apiFetch } from '@/shared/api/client';
import type { PlayRecord, UpsertPlayRecordInput } from '@/shared/types';

export function getPlayRecord(
  sourceId: string,
  sourceVideoId: string,
): Promise<PlayRecord | null> {
  return apiFetch<PlayRecord | null>(
    `/play-records/${encodeURIComponent(sourceId)}/${encodeURIComponent(sourceVideoId)}`,
  );
}

export function upsertPlayRecord(
  record: UpsertPlayRecordInput,
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>('/play-records', {
    init: {
      method: 'PUT',
      body: JSON.stringify(record),
    },
  });
}

export { getPlayRecords } from '@/features/play-records/api/recordsApi';
