import { Link } from 'react-router-dom';

interface VideoCardProps {
  id: string;
  sourceId: string;
  title: string;
  poster?: string;
  year?: string;
  badge?: string;
  totalEpisodes?: number;
  watchProgress?: string;
  sourceName?: string;
  onRemove?: () => void;
  removeTitle?: string;
}

export default function VideoCard({ id, sourceId, title, poster, year: _year, badge, totalEpisodes, watchProgress, sourceName, onRemove, removeTitle = '删除' }: VideoCardProps) {
  const card = (
    <Link
      to={`/detail/${encodeURIComponent(sourceId)}/${encodeURIComponent(id)}`}
      className="group flex flex-col transition-transform duration-200 hover:-translate-y-0.5"
    >
      <div className="relative aspect-[2/3] bg-gray-100 dark:bg-gray-800 overflow-hidden">
        {poster ? (
          <img
            src={poster}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600 text-xs">
            无封面
          </div>
        )}
        {badge && (
          <span className="absolute top-1 right-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs px-1.5 py-0.5">
            {badge}
          </span>
        )}
        {watchProgress ? (
          <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5">
            {watchProgress}
          </span>
        ) : !badge && totalEpisodes != null && totalEpisodes > 0 ? (
          <span className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1.5 py-0.5">
            {totalEpisodes === 1 ? '电影' : `${totalEpisodes}集`}
          </span>
        ) : null}
        {sourceName && (
          <span className="absolute top-1 left-1 bg-black/40 text-white text-xs px-1.5 py-0.5">
            {sourceName}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 truncate group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
        {title}
      </p>
    </Link>
  );

  if (!onRemove) return card;

  return (
    <div className="group relative">
      {card}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (confirm(`确认${removeTitle}？`)) onRemove?.();
        }}
        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 hover:cursor-pointer"
        title={removeTitle}
      >
        ×
      </button>
    </div>
  );
}