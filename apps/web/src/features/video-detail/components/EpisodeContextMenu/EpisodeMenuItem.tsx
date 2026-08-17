import styles from './EpisodeMenuItem.module.scss';

interface EpisodeMenuItemProps {
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
}

export function EpisodeMenuItem({
  onClick,
  ariaLabel,
  children,
}: EpisodeMenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      aria-label={ariaLabel}
      className={styles.item}
    >
      {children}
    </button>
  );
}
