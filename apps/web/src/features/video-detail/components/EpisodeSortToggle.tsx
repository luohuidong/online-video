interface EpisodeSortToggleProps {
  sortDesc: boolean;
  onClick: () => void;
}

export function EpisodeSortToggle({ sortDesc, onClick }: EpisodeSortToggleProps) {
  return (
    <button
      onClick={onClick}
      className="text-xs px-2 py-0.5 rounded border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer"
    >
      {sortDesc ? '倒序' : '正序'}
    </button>
  );
}