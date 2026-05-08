import { Trash2 } from 'lucide-react';
import { useFavorites } from '../hooks/useFavorites';
import { usePlayRecordMap } from '../hooks/usePlayRecordMap';
import FavoriteList from '../components/FavoriteList';
import LoadingSpinner from '@/shared/components/LoadingSpinner';
import ErrorMessage from '@/shared/components/ErrorMessage';

export default function HomePage() {
  const { favorites, isLoading, isError, error, refetch, removeMutation, clearMutation } = useFavorites();
  const playRecordMap = usePlayRecordMap();

  if (isLoading) return <LoadingSpinner className="py-20" />;
  if (isError) return <ErrorMessage message={error?.message ?? '加载失败'} onRetry={refetch} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          收藏夹
          {favorites && favorites.length > 0 && (
            <span className="text-sm font-normal text-gray-400 dark:text-gray-500 ml-2">
              {favorites.length} 部
            </span>
          )}
        </h1>
        {favorites && favorites.length > 0 && (
          <button
            onClick={() => {
              if (confirm('确认清空所有收藏？')) clearMutation.mutate();
            }}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:cursor-pointer transition-colors"
            title="清空收藏"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {favorites && favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500 gap-3">
          <p>还没有收藏任何内容</p>
        </div>
      ) : (
        favorites && <FavoriteList favorites={favorites} playRecordMap={playRecordMap} onRemove={(id) => removeMutation.mutate(id)} />
      )}
    </div>
  );
}