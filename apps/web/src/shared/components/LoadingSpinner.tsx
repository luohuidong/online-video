import styles from './LoadingSpinner.module.scss';

export default function LoadingSpinner({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div className={`${styles.wrapper} ${className}`}>
      <div className={styles.spinner} />
    </div>
  );
}
