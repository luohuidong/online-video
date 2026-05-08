import { useQuery } from '@tanstack/react-query';
import { getPlayRecords } from '@/features/play-records/api/recordsApi';

export function usePlayRecordMap(): Map<string, number> {
  const { data: playRecords } = useQuery({
    queryKey: ['play-records'],
    queryFn: getPlayRecords,
  });

  const playRecordMap = new Map<string, number>();
  playRecords?.forEach((r) => {
    if (r.episodeIndex != null) {
      playRecordMap.set(`${r.video.sourceId}:${r.video.sourceVideoId}`, r.episodeIndex);
    }
  });

  return playRecordMap;
}