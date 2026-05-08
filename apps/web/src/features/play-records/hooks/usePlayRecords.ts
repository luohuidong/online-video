import { useQuery, useMutation } from '@tanstack/react-query';
import { QueryClient } from '@tanstack/react-query';
import { getPlayRecords, deletePlayRecord, clearPlayRecords } from '../api/recordsApi';

const queryClient = new QueryClient();

export function usePlayRecords() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['play-records'],
    queryFn: getPlayRecords,
  });

  const deleteMutation = useMutation({
    mutationFn: ({ sourceId, sourceVideoId }: { sourceId: string; sourceVideoId: string }) =>
      deletePlayRecord(sourceId, sourceVideoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['play-records'] }),
  });

  const clearMutation = useMutation({
    mutationFn: clearPlayRecords,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['play-records'] }),
  });

  return {
    records: data,
    isLoading,
    isError,
    error,
    refetch,
    deleteMutation,
    clearMutation,
  };
}