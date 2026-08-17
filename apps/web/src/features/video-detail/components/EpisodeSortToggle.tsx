import styles from './EpisodeSortToggle.module.scss';

interface EpisodeSortToggleProps {
  sortDesc: boolean;
  onClick: () => void;
}

export function EpisodeSortToggle({
  sortDesc,
  onClick,
}: EpisodeSortToggleProps) {
  return (
    <button type="button" onClick={onClick} className={styles.button}>
      {sortDesc ? '倒序' : '正序'}
    </button>
  );
}
