import { RefreshCw, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import ErrorMessage from '@/shared/components/ErrorMessage';
import LoadingSpinner from '@/shared/components/LoadingSpinner';
import FavoriteList from '../components/FavoriteList';
import { useFavorites } from '../hooks/useFavorites';
import { usePlayRecordMap } from '../hooks/usePlayRecordMap';
import styles from './HomePage.module.scss';

export default function HomePage() {
  const {
    favorites,
    isLoading,
    isError,
    error,
    refetch,
    removeMutation,
    clearMutation,
    batchUpdateMutation,
    touchMutation,
  } = useFavorites();
  const playRecordMap = usePlayRecordMap();

  useEffect(() => {
    document.title = '视频-首页';
  }, []);

  if (isLoading) return <LoadingSpinner className="py-20" />;
  if (isError)
    return (
      <ErrorMessage message={error?.message ?? '加载失败'} onRetry={refetch} />
    );

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>
          收藏夹
          {favorites && favorites.length > 0 && (
            <span className={styles.count}>{favorites.length} 部</span>
          )}
        </h1>
        {favorites && favorites.length > 0 && (
          <div className={styles.actions}>
            <button
              type="button"
              onClick={() => batchUpdateMutation.mutate()}
              disabled={batchUpdateMutation.isPending}
              className={styles.actionButton}
              title="更新最新集数"
            >
              <RefreshCw
                size={18}
                className={batchUpdateMutation.isPending ? 'animate-spin' : ''}
              />
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('确认清空所有收藏？')) clearMutation.mutate();
              }}
              className={styles.actionButton}
              title="清空收藏"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {favorites && favorites.length === 0 ? (
        <div className={styles.empty}>
          <p>还没有收藏任何内容</p>
        </div>
      ) : (
        favorites && (
          <FavoriteList
            favorites={favorites}
            playRecordMap={playRecordMap}
            onRemove={(id) => removeMutation.mutate(id)}
            onClick={(id) => touchMutation.mutate(id)}
          />
        )
      )}
    </div>
  );
}
