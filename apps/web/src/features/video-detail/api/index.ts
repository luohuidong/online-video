import { apiFetch } from '@/shared/api/client';
import type { PlayRecord, UpsertPlayRecordInput } from '@/shared/types';

export function upsertPlayRecord(
  record: UpsertPlayRecordInput,
): Promise<PlayRecord> {
  return apiFetch<PlayRecord>('/play-records', {
    init: {
      method: 'PUT',
      body: JSON.stringify(record),
    },
  });
}

export {
  getPlayRecord,
  getPlayRecords,
} from '@/features/play-records/api/recordsApi';
