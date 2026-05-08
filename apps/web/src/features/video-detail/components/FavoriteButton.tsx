interface FavoriteButtonProps {
  isFavorited: boolean;
  isPending: boolean;
  onClick: () => void;
}

export function FavoriteButton({
  isFavorited,
  isPending,
  onClick,
}: FavoriteButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isPending}
      className={`mt-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
        isFavorited
          ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          : 'bg-gray-600 text-white hover:bg-gray-700'
      }`}
    >
      {isFavorited ? '已收藏' : '+ 收藏'}
    </button>
  );
}