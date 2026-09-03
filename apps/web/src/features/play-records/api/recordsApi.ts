import { ApiError, apiFetch } from '@/shared/api/client';
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

/**
 * 后端不存在该播放记录时返回 404；按"用户首次进入视频"的正常情况处理，
 * 在 API 层把 404 翻译为 null，避免 React Query 触发重试和 error 状态。
 */
export async function getPlayRecord(
  sourceId: string,
  sourceVideoId: string,
): Promise<PlayRecord | null> {
  try {
    return await apiFetch<PlayRecord>(
      `/play-records/${encodeURIComponent(sourceId)}/${encodeURIComponent(sourceVideoId)}`,
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}
