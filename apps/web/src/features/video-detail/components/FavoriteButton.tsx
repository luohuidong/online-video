import styles from './FavoriteButton.module.scss';

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
      type="button"
      onClick={onClick}
      disabled={isPending}
      className={`${styles.button} ${isFavorited ? styles.remove : styles.add}`}
    >
      {isFavorited ? '已收藏' : '+ 收藏'}
    </button>
  );
}
