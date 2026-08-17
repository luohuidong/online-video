import { Link, useSearchParams } from 'react-router-dom';
import ErrorMessage from '@/shared/components/ErrorMessage';
import LoadingSpinner from '@/shared/components/LoadingSpinner';
import GroupSidebar from '../components/GroupSidebar';
import { SearchBar } from '../components/SearchBar';
import SearchResults from '../components/SearchResults';
import { useActiveGroupIndex } from '../hooks/useActiveGroupIndex';
import { useSearch } from '../hooks/useSearch';
import styles from './SearchPage.module.scss';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';

  const { data, isLoading, isError, error, refetch } = useSearch(query);
  const activeIndex = useActiveGroupIndex(data?.length ?? 0, query);

  const handleSelect = (index: number) => {
    const el = document.getElementById(`group-${index}`);
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  };

  if (!query) {
    return (
      <div className={styles.emptyWrapper}>
        <SearchBar />
        <div className={styles.emptyHint}>
          <p>请输入关键词进行搜索</p>
        </div>
      </div>
    );
  }

  const totalCount = data?.reduce((acc, g) => acc + g.items.length, 0) ?? 0;

  return (
    <div>
      <div className={styles.header}>
        <SearchBar defaultValue={query} />
      </div>

      <h1 className={styles.title}>
        搜索「{query}」
        {data && <span className={styles.count}>共 {totalCount} 条结果</span>}
      </h1>

      {isLoading && <LoadingSpinner className="py-16" />}

      {isError && (
        <ErrorMessage
          message={(error as Error).message}
          onRetry={() => refetch()}
        />
      )}

      {data && totalCount === 0 && (
        <div className={styles.noResults}>
          <p>未找到相关内容</p>
          <Link to="/" className={styles.backLink}>
            返回首页
          </Link>
        </div>
      )}

      {data && totalCount > 0 && (
        <div className={styles.resultsLayout}>
          <GroupSidebar
            groups={data}
            activeIndex={activeIndex}
            onSelect={handleSelect}
          />
          <div className={styles.resultsBody}>
            <SearchResults groups={data} />
          </div>
        </div>
      )}
    </div>
  );
}
